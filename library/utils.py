import logging
import re
from typing import TYPE_CHECKING, Optional

import tiktoken
from flask import request, session
from models.user import Application, User
from mongoclass.cursor import Cursor

from library import users
from library.configlib import config
from library.system_messages import system_message_handler

if TYPE_CHECKING:
    from models.character import Character


logger = logging.getLogger(__name__)


def parse_character_response(
    response: str,
) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Parses a character response string into its component fields: "Comments", "Contradictions", and "Response".

    Parameters
    --------------
    `response` : str
        The character response string, which should include the fields "Comments",
        "Contradictions", and "Response".

    Returns
    ---------
    `tuple[Optional[str], Optional[str], Optional[str]]` :
        A tuple containing the values of the "Comments", "Contradictions", and "Response" fields, in that order.
        If a field was not found in the response string, its value in the tuple will be None.
    """

    fields = {"Comment": None, "Contradiction": None, "Response": None}

    current_field = None
    found_fields = []
    for line in re.split("(\n+)", response):
        for field in fields.keys():
            if (
                line.startswith((field + ":", field + "s" + ":"))
                and field not in found_fields
            ):
                current_field = field
                replaced_line = line.replace(field + ": ", "", 1)
                if replaced_line == line:
                    line = line.replace(field + "s" + ": ", "", 1)
                else:
                    line = replaced_line

                found_fields.append(field)

        if current_field is not None:
            if fields[current_field] is None:
                fields[current_field] = ""
            fields[current_field] += line

    fields = {k: v.strip("\n") if v is not None else None for k, v in fields.items()}

    return (fields["Comment"], fields["Contradiction"], fields["Response"])


def get_total_tokens_from_messages(
    messages: list[dict[str, str]], model: str = "gpt-3.5-turbo"
):
    """Returns the number of tokens used by a list of messages."""
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")

    num_tokens = 0
    for message in messages:
        num_tokens += 8
        for key, value in message.items():
            num_tokens += len(encoding.encode(value))
            if key == "name":  # if there's a name, the role is omitted
                num_tokens += -1  # role is always required and always 1 token
    num_tokens += 4  # every reply is primed with <im_start>assistant
    return num_tokens


def limit_chat_completion_tokens(
    messages: list[dict[str, str]], model: str, max_tokens: int
) -> list[dict[str, str]]:
    """
    Limit the amount of messages so that it respects the token limit of OpenAI's GPT
    models.
    """

    token_cap = 4090
    if model == "gpt-4":
        token_cap = 8100

    messages_tokens = get_total_tokens_from_messages(messages=messages)
    total_tokens = messages_tokens + max_tokens
    if (total_tokens) <= token_cap:
        return messages

    logger.warning(
        f"There are {total_tokens} in the message list which exceeded the {token_cap} tokens limit. Removing older messages..."
    )
    copied_messages = [*messages]
    copied_messages.pop(1)

    return limit_chat_completion_tokens(
        messages=copied_messages, model=model, max_tokens=max_tokens
    )


def create_chat_completion_context(
    character: "Character",
    user_name: Optional[str] = None,
) -> tuple[str, list[dict[str, str]]]:
    """
    Create the context for a chat completion request.

    Returns
    -------
    `tuple[str, list[dict[str, str]]]` :
        The first value is the system message while the second value is a list of
        messages. This can be a simple user message instructing the GPT model how
        to act, or a list of messages that teaches the model how to talk.
    """

    system = system_message_handler.get_system_message("default")
    messages = []
    context_message = {
        "role": "user",
        "content": f"Here is the character you're playing\n\nYour Name: {character.name}\nAbout You: {character.description}",
    }
    if user_name:
        context_message["name"] = user_name

    if character.knowledge:
        context_message["content"] += (
            "\n\nKnowledge:\n"
            + "\n".join([f"- {x}" for x in character.knowledge])
            + "\n\n"
        )

    if character.personalities:
        context_message["content"] += "\nPersonalities and Traits: " + ", ".join(
            character.personalities
        )

    if character.favorite_words:
        context_message["content"] += "\nFavorite Words: " + ", ".join(
            character.favorite_words
        )

    if character.response_styles:
        context_message["content"] += "\nResponse Style: " + ", ".join(
            character.response_styles
        )

    if character.example_exchanges:
        context_message["content"] += "\n\nExample Messages:"
        for exchange in character.example_exchanges:
            context_message["content"] += f"\n{exchange['role']}: {exchange['content']}"

    context_message["content"] += "\n\nConversation Starts/Continues"
    messages.append(context_message)

    return system, messages


def create_text_completion_context(
    character: "Character",
    user_name: Optional[str] = None,
) -> str:
    """
    Create the context for a text completion request.

    Returns
    -------
    `str` :
        The entire context, including the system message, character info, etc.
    """

    system, messages = create_chat_completion_context(character=character)
    message = (
        system
        + "\n\n"
        + messages.pop(0)["content"]
        + "\n\n"
        + "Conversation Starts Now:\n"
    )

    for m in messages:
        name = user_name or "User"
        if m["role"] == "assistant":
            name = "You"

        message += f"{name}: {m['content']}\n"

    return message


def is_from_rapid_api() -> bool:
    """
    Detect if the current request context is coming from a authenticated rapid api user.
    """

    rapid_api_proxy = request.headers.get("X-RapidAPI-Proxy-Secret")
    rapid_api_user = request.headers.get("X-Rapidapi-User")
    value = (
        rapid_api_proxy == config.credentials["rapid_api_proxy"]
        and rapid_api_user is not None
    )

    if value:
        logger.info("Request is from Rapid API")

    return value


def get_user_id_from_request(anonymous: bool = False) -> Optional[str]:
    """
    Attempt to retrieve the User ID from the current request context.

    If `anonymous` is True, it will also attempt to find the IP address of the request
    and consider it as a User ID.
    """

    user_id = session.get("user_id")
    if user_id:
        return user_id

    if is_from_rapid_api():
        rapid_api_user = request.headers.get("X-Rapidapi-User")
        user_obj: Optional[User] = User.find_class(
            {"email": users.format_rapid_api_user(rapid_api_user)}
        )
        if user_obj is None:
            return

        return user_obj.id

    authorization = request.authorization
    if authorization:
        application: Optional[Application] = Application.find_class(
            {"id": authorization.username}
        )
        if application:
            return application.user_id

    if anonymous:
        from library.security import route_security

        return route_security.get_client_ip()


def paginate_mongoclass_cursor(
    cursor: Cursor, page_size: int = 25, page: int = 1
) -> Cursor:
    """
    Paginate a mongoclass `Cursor` instance.
    """

    if page_size > 100:
        page_size = 100

    skips = page_size * (page - 1)
    cursor = cursor.skip(skips).limit(page_size)
    return cursor
