from typing import TYPE_CHECKING, Optional

from flask import request, session
from models.user import Application
from mongoclass.cursor import Cursor

from library.system_messages import system_message_handler

if TYPE_CHECKING:
    from models.character import Character


def create_chat_completion_context(
    character: "Character",
    user_name: Optional[str] = None,
    user_description: Optional[str] = None,
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
        "content": f"Your Name: {character.name}\nAbout You: {character.description}",
    }

    if character.personalities:
        context_message["content"] += f"\nPersonalities and Traits: " + ", ".join(
            character.personalities
        )

    if character.favorite_words:
        context_message["content"] += f"\nFavorite Words: " + ", ".join(
            character.favorite_words
        )

    if user_name:
        context_message[
            "content"
        ] += f"\n\nThe user's name you're talking to: {user_name}."

        if user_description:
            context_message["content"] += f"\nAbout Them: {user_description}"

    messages.append(context_message)

    if character.example_exchanges:
        messages.extend(character.example_exchanges)

    return system, messages


def create_text_completion_context(
    character: "Character",
    user_name: Optional[str] = None,
    user_description: Optional[str] = None,
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
        name = "User"
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
