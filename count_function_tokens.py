import tiktoken
from dotenv import load_dotenv

load_dotenv()

from library import utils
from library.types import OpenAIFunctionSpec, ParameterSpec

encoding = tiktoken.encoding_for_model("gpt-3.5-turbo-0301")

functions = [
    OpenAIFunctionSpec(
        "create_character",
        description="Used to create characters.",
        parameters={
            "name": ParameterSpec(
                "name",
                "string",
                "The character's name. Must be a maximum of 80 characters.",
                required=True,
            ),
            "public_description": ParameterSpec(
                "public_description",
                "string",
                "The description that is shown to the public.",
                required=True,
            ),
            "description": ParameterSpec(
                "description",
                "string",
                "The description that is fed to the AI. When referring to a character, it is best to use the word 'You'. Additionally, slangs and other important notes about a character's behavior can be provided at the end of the description.",
                required=True,
            ),
            "personalities": ParameterSpec(
                "personalities",
                "string",
                "The personalities the character should have. Separated by a ','",
            ),
            "response_styles": ParameterSpec(
                "response_styles",
                "string",
                "The response styles of the character. Separated by a ','",
            ),
            "favorite_words": ParameterSpec(
                "favorite_words",
                "string",
                "Favorite words or phrases of the character. Separated by a ','",
            ),
            "private": ParameterSpec(
                "private",
                "boolean",
                "Whether the character is private and should only be accessible to the owner.",
            ),
            "nsfw": ParameterSpec(
                "nsfw", "boolean", "Whether the character is a NSFW character."
            ),
            "definition_visibility": ParameterSpec(
                "definition_visibility",
                "boolean",
                "Whether to make the character's parameters (like description, personalities, etc) public.",
            ),
        },
    )
]

for func in functions:
    print(
        f"1.Token count for {func.name}: {len(encoding.encode(utils.format_function_specs_as_typescript_ns([func])))}"
    )

typescript_namespace = utils.format_function_specs_as_typescript_ns(functions)

print("\n\n---------\n\n")
print(f"Total tokens: {len(encoding.encode(typescript_namespace))}")
print(f"Namespace:\n{typescript_namespace}")
