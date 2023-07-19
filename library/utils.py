import io
import logging
import re
from typing import TYPE_CHECKING, Optional

import tiktoken
from flask import request, session
from models.session import ChatSession
from models.user import Application, User
from mongoclass.cursor import Cursor
from PIL import Image

from library import users
from library.configlib import config
from library.system_messages import system_message_handler
from library.types import OpenAIFunctionSpec, ParameterSpec

if TYPE_CHECKING:
    from models.character import Character


logger = logging.getLogger(__name__)


def compress_image(image_stream, max_file_size):
    with Image.open(image_stream) as image:
        compressed_image_stream = io.BytesIO()

        # Compress the image
        image.save(compressed_image_stream, format="JPEG", optimize=True)
        compressed_size = compressed_image_stream.tell()

        # Check if the image meets the maximum file size
        if compressed_size > max_file_size:
            logger.info("Compressing image further...")

            compression_ratio = (max_file_size / compressed_size) ** 0.5
            further_compressed_image_stream = io.BytesIO()

            new_width = int(image.width * compression_ratio)
            new_height = int(image.height * compression_ratio)
            resized_image = image.resize((new_width, new_height), Image.ANTIALIAS)

            resized_image.save(
                further_compressed_image_stream, format="JPEG", optimize=True
            )

            further_compressed_size = further_compressed_image_stream.tell()

            if further_compressed_size <= max_file_size:
                further_compressed_image_stream.seek(0)
                return further_compressed_image_stream.read()

        compressed_image_stream.seek(0)
        return compressed_image_stream.read()


def parse_character_response(
    response: str, use_backups: bool = True
) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Parses a character response string into its component fields: "Comments", "Contradictions", and "Response".

    Parameters
    --------------
    `response` : str
        The character response string, which should include the fields "Comments",
        "Contradictions", and "Response".
    `use_backups` : bool
        If parsing fails, use the other fields (and the input) as the response field if
        the response field happens to be empty. Defaults to True.

    Returns
    ---------
    `tuple[Optional[str], Optional[str], Optional[str]]` :
        A tuple containing the values of the "Comments", "Contradictions", and "Response" fields, in that order.
        If a field was not found in the response string, its value in the tuple will be None.
    """

    fields = {"Comment": None, "Contradiction": None, "Response": None}

    # Pre-process
    lines = []
    for line in re.split("(\n+)", response):
        parts = line.split(" ")
        if parts:
            if ":" in parts[0] and parts[0].lower().startswith(
                tuple([x.lower() for x in fields.keys()])
            ):
                parts[0] = parts[0].title()

        line = " ".join(parts)
        lines.append(line)

    current_field = None
    found_fields = []
    for line in lines:
        for field in fields.keys():
            if (
                line.startswith((field + ":", field + "s" + ":"))
                and field not in found_fields
            ):
                current_field = field
                replaced_line = line.replace(field + ":", "", 1)
                if replaced_line == line:
                    line = line.replace(field + "s" + ":", "", 1)
                else:
                    line = replaced_line

                found_fields.append(field)

        if current_field is not None:
            if fields[current_field] is None:
                fields[current_field] = ""
            fields[current_field] += line

    fields = {
        k: v.strip("\n").strip() if v is not None else "None" for k, v in fields.items()
    }
    fields = {
        k: v if v.lower() not in ("none", "n/a", "null", "undefined") else None
        for k, v in fields.items()
    }

    if use_backups:
        if fields["Response"] is None:
            fields["Response"] = fields["Comment"] or fields["Contradiction"]
            if fields["Response"] is None:
                fields["Response"] = response

    return (fields["Comment"], fields["Contradiction"], fields["Response"])


def get_total_tokens_from_messages(
    messages: list[dict[str, str]], model: str = "gpt-3.5-turbo-0301"
):
    """Returns the number of tokens used by a list of messages."""

    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        print("Warning: model not found. Using cl100k_base encoding.")
        encoding = tiktoken.get_encoding("cl100k_base")
    if model == "gpt-3.5-turbo":
        print(
            "Warning: gpt-3.5-turbo may change over time. Returning num tokens assuming gpt-3.5-turbo-0301."
        )
        return get_total_tokens_from_messages(messages, model="gpt-3.5-turbo-0301")
    elif model == "gpt-4":
        print(
            "Warning: gpt-4 may change over time. Returning num tokens assuming gpt-4-0314."
        )
        return get_total_tokens_from_messages(messages, model="gpt-4-0314")
    elif model == "gpt-3.5-turbo-0301":
        tokens_per_message = (
            4  # every message follows <|start|>{role/name}\n{content}<|end|>\n
        )
        tokens_per_name = -1  # if there's a name, the role is omitted
    elif model == "gpt-4-0314":
        tokens_per_message = 3
        tokens_per_name = 1
    else:
        raise NotImplementedError(
            f"""num_tokens_from_messages() is not implemented for model {model}. See https://github.com/openai/openai-python/blob/main/chatml.md for information on how messages are converted to tokens."""
        )
    num_tokens = 0
    for message in messages:
        num_tokens += tokens_per_message
        for key, value in message.items():
            num_tokens += len(encoding.encode(value))
            if key == "name":
                num_tokens += tokens_per_name
    num_tokens += 3  # every reply is primed with <|start|>assistant<|message|>
    return num_tokens


def limit_chat_completion_tokens(
    messages: list[dict[str, str]], model: str, max_tokens: int
) -> tuple[list[dict[str, str]], int]:
    """
    Limit the amount of messages so that it respects the token limit of OpenAI's GPT
    models.
    """

    token_cap = 4070
    if model == "gpt-4":
        token_cap = 8100

    messages_tokens = get_total_tokens_from_messages(messages=messages)
    total_tokens = messages_tokens + max_tokens
    if (total_tokens) <= token_cap:
        return messages, max_tokens

    logger.warning(
        f"There are {total_tokens} tokens in the message list which exceeded the {token_cap} tokens limit."
    )

    copied_messages = [*messages]
    if max_tokens <= 512:
        copied_messages.pop(1)
        logger.warning(
            "Removed one old message because the max tokens parameter is already at the 512 minimum limit."
        )
    else:
        max_tokens = max_tokens - 50
        logger.warning(
            f"Reduced max tokens parameter to {max_tokens} and checking again."
        )

    return limit_chat_completion_tokens(
        messages=copied_messages, model=model, max_tokens=max_tokens
    )


def create_chat_completion_context(
    character: "Character",
    session: ChatSession,
    user: User,
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

    system = system_message_handler.get_system_message("v2")
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

    context_message[
        "content"
    ] += "\n\nConversation Starts/Continues, the user will now send you a message and you should act out your character.\n\nIMPORTANT:\n- Stay true to your character and roleplays."

    tweaks = session.tweaks or character.tweaks
    if tweaks:
        if tweaks.length not in ("long", "very long"):
            context_message["content"] += "\n- Make sure your responses are VERY SHORT."

    messages.append(context_message)

    if session.story_mode and session.story:
        if user.plan.id == "basic":
            context_message[
                "content"
            ] += f"\n\nHere's the story that you and the user should follow. Follow it in steps and progression as the conversation happens:\n{session.story}"

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


def clean_user_name(input_string):
    # Remove characters other than a-z, A-Z, 0-9, and underscores
    cleaned_string = re.sub(r"[^a-zA-Z0-9_]", "", input_string)

    # Ensure the length does not exceed 64 characters
    cleaned_string = cleaned_string[:64]

    return cleaned_string


# Thank you auto-gpt
# https://github.com/Significant-Gravitas/Auto-GPT/blob/3425b061b5e55b6b655d59d320c8c36895156830/autogpt/llm/providers/openai.py#L359C1-L408C6
def format_function_specs_as_typescript_ns(functions: list[OpenAIFunctionSpec]) -> str:
    """Returns a function signature block in the format used by OpenAI internally:
    https://community.openai.com/t/how-to-calculate-the-tokens-when-using-function-call/266573/6

    Accurate to within 5 tokens when used with count_string_tokens :)

    Example given by OpenAI engineer:
    ```ts
    namespace functions {
      type x = (_: {
        location: string,
        unit?: "celsius" | "fahrenheit",
      }) => any;
    } // namespace functions
    ```

    Format found by further experimentation: (seems accurate to within 5 tokens)
    ```ts
    namespace functions {

    // Get the current weather in a given location
    type get_current_weather = (_: {
      location: string, // The city and state, e.g. San Francisco, CA
      unit?: "celsius" | "fahrenheit",
    }) => any;

    } // namespace functions
    ```
    The `namespace` statement doesn't seem to count towards total token length.
    """

    def param_signature(p_spec: ParameterSpec) -> str:
        # TODO: enum type support
        return f'{p_spec.name}{"" if p_spec.required else ""}: {p_spec.type}, // {p_spec.description}'

    def function_signature(f_spec: OpenAIFunctionSpec) -> str:
        return "\n".join(
            [
                f"// {f_spec.description}",
                f"type {f_spec.name} = (_ :{{",
                *[f"  {param_signature(p)}" for p in f_spec.parameters.values()],
                "}) => any;",
            ]
        )

    return (
        "namespace functions {\n\n"
        + "\n\n".join(function_signature(f) for f in functions)
        + "\n\n} // namespace functions"
    )
