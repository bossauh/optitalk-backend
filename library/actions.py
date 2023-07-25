from models.summary import ConversationSummary

from .types import OpenAIFunctionSpec, ParameterSpec

BASE_ACTIONS = {
    "search_memory": OpenAIFunctionSpec(
        "search_memory",
        "Search your inner memory which contains conversation summaries of you and the user. Useful if you don't know what the user is talking about (meaning it has cut off from your conversation because of the context limit)",
        parameters={
            "query": ParameterSpec(
                "query",
                "string",
                description="Query string. The query string is compared to all your conversation summaries using text embeddings. The query must be detailed, it can be a question, description, etc.",
                required=True,
            )
        },
    ),
    "give_nickname": OpenAIFunctionSpec(
        "give_nickname",
        "Give the user you're talking to a nickname. You should use this once you've learned more about the user, feel free to give your user any name you want.",
        parameters={
            "nickname": ParameterSpec(
                "nickname", "string", description="The nickname", required=True
            )
        },
    ),
}

SPECIAL_ACTIONS = {
    "summarize_conversation": OpenAIFunctionSpec(
        "summarize_conversation",
        "Summarize the current conversation in your style.",
        parameters={
            "summary": ParameterSpec(
                "summary",
                "Your summary of the current conversation. Be detailed but don't make it way too long.",
                required=True,
            )
        },
    )
}


def search_memory(query: str) -> dict:
    return {
        "results": [],
        "msg": "No results, come up with a random response",
        "status": "ok",
        "query": query,
    }


def give_nickname(nickname: str) -> dict:
    return {"status": "ok", "nickname": nickname}


def summarize_conversation(
    summary: str, session_id: str, user_id: str, character_id: str
) -> dict:
    conversation_summary = ConversationSummary(
        summary=summary,
        session_id=session_id,
        created_by=user_id,
        character_id=character_id,
    )

    try:
        conversation_summary.update_embeddings()
        conversation_summary.save()
        return {"status": "ok"}
    except Exception:
        return {"status": "error"}


ACTION_MAPPINGS = {"search_memory": search_memory, "give_nickname": give_nickname}


def get_base_functions() -> list[dict]:
    functions = []
    for action in BASE_ACTIONS.values():
        functions.append(action.schema)

    return functions


def get_base_actions() -> list[OpenAIFunctionSpec]:
    return list(BASE_ACTIONS.values())
