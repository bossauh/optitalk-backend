import logging
from typing import TYPE_CHECKING, Optional

import tiktoken
from flask import request, session
from models.user import Application
from mongoclass.cursor import Cursor

from library.system_messages import system_message_handler

if TYPE_CHECKING:
    from models.character import Character


logger = logging.getLogger(__name__)


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

    if character.personalities:
        context_message["content"] += f"\nPersonalities and Traits: " + ", ".join(
            character.personalities
        )

    if character.favorite_words:
        context_message["content"] += f"\nFavorite Words: " + ", ".join(
            character.favorite_words
        )

    context_message["content"] += "\n\nConversation Continues"

    messages.append(context_message)

    if character.example_exchanges:
        messages.extend(character.example_exchanges)

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


def get_user_id_from_request() -> Optional[str]:
    """
    Attempt to retrieve the User ID from the current request context.
    """

    user_id = session.get("user_id")
    if user_id:
        return user_id

    authorization = request.authorization
    if authorization is None:
        return

    application: Optional[Application] = Application.find_class(
        {"id": authorization.username}
    )
    if application is None:
        return

    return application.user_id


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
