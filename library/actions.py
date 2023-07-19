from .types import OpenAIFunctionSpec, ParameterSpec

BASE_ACTIONS = {
    "search_memory": OpenAIFunctionSpec(
        "search_memory",
        "Search your inner memory which contains conversation summaries of you and the user. Useful if you don't know what the user is talking about (meaning it has cut off from your conversation because of the context limit)",
        parameters={
            "query": ParameterSpec(
                "query",
                "string",
                "Query string. The query string is compared to all your conversation summaries using text embeddings.",
                required=True,
            )
        },
    )
}
