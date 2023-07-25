from voluptuous import All, Any, Email, Length, Optional, Range, Required, Schema, Url

_CHARACTER_EXCHANGE = {
    Required("role"): Any("user", "assistant"),
    Required("content"): All(str, Length(min=1, max=2048)),
    Optional("name"): All(str, Length(min=1, max=50)),
}
_PAGING_SCHEMA = {Optional("page"): str, Optional("page_size"): str}
_TWEAKS_LENGTH = ["very short", "short", "medium", "long", "very long"]
_TWEAKS_CREATIVITY = ["predictable", "consistent", "normal", "creative", "extreme"]
POST_USERS_LOGIN = Schema(
    {Required("email"): Email(), Required("password"): All(str, Length(min=8, max=60))}
)
POST_USERS = Schema(
    {
        Required("email"): Email(),
        Required("password"): All(str, Length(min=8, max=60)),
        Optional("account_type"): Any("default", "google", "github", "discord"),
        Optional("display_name"): All(str, Length(min=1, max=60)),
    }
)
POST_CHARACTERS = Schema(
    {
        Required("name"): All(str, Length(min=1, max=64)),
        Required("public_description"): All(str, Length(min=1, max=4096)),
        Required("description"): All(str, Length(min=1, max=2048)),
        Optional("tweaks"): Any(
            {
                Optional("length"): Any(*_TWEAKS_LENGTH),
                Optional("creativity"): Any(*_TWEAKS_CREATIVITY),
            },
            None,
        ),
        Optional("model"): Any("basic", "advanced"),
        Optional("knowledge"): All(
            [Schema(All(str, min=1, max=1024))], Length(min=0, max=1000)
        ),
        Optional("personalities"): All(
            [Schema(All(str, min=1, max=100))], Length(min=0, max=10)
        ),
        Optional("favorite_words"): All(
            [Schema(All(str, min=1, max=100))], Length(min=0, max=20)
        ),
        Optional("example_exchanges"): All(
            [_CHARACTER_EXCHANGE], Length(min=0, max=10)
        ),
        Optional("response_styles"): All(
            [Schema(All(str, min=1, max=100))], Length(min=0, max=10)
        ),
        Optional("private"): bool,
        Optional("image"): Url(),
        Optional("avatar_id"): Any(str, None),
        Optional("definition_visibility"): bool,
        Optional("nsfw"): bool,
        Optional("tags"): All([Schema(All(str, min=0, max=500))], Length(min=0, max=3)),
    }
)
PATCH_CHARACTERS = Schema(
    {
        Optional("name"): All(str, Length(min=1, max=64)),
        Optional("public_description"): All(str, Length(min=1, max=4096)),
        Optional("description"): All(str, Length(min=1, max=2048)),
        Optional("tweaks"): Any(
            {
                Optional("length"): Any(*_TWEAKS_LENGTH),
                Optional("creativity"): Any(*_TWEAKS_CREATIVITY),
            },
            None,
        ),
        Optional("model"): Any("basic", "advanced"),
        Optional("avatar_id"): Any(str, None),
        Optional("personalities"): All(
            [Schema(All(str, min=1, max=100))], Length(min=0, max=10)
        ),
        Optional("favorite_words"): All(
            [Schema(All(str, min=1, max=100))], Length(min=0, max=20)
        ),
        Optional("example_exchanges"): All(
            [_CHARACTER_EXCHANGE], Length(min=0, max=10)
        ),
        Optional("response_styles"): All(
            [Schema(All(str, min=1, max=100))], Length(min=0, max=10)
        ),
        Optional("private"): bool,
        Optional("image"): Url(),
        Optional("definition_visibility"): bool,
        Optional("nsfw"): bool,
        Optional("tags"): All([Schema(All(str, min=0, max=500))], Length(min=0, max=3)),
    }
)
GET_CHARACTERS = Schema(
    {
        Optional("my_characters"): str,
        Optional("private"): str,
        Optional("featured"): str,
        Optional("sort"): Any("uses", "latest"),
        Optional("q"): str,
        Optional("favorites"): str,
        Optional("nsfw"): Any("include", "only", "disabled"),
        Optional("tag"): str,
        **_PAGING_SCHEMA,
    }
)
GET_CHARACTERS_KNOWLEDGE = Schema({Required("character_id"): str, **_PAGING_SCHEMA})
DELETE_CHARACTERS_KNOWLEDGE = Schema({Required("id"): str})
PATCH_CHARACTERS_KNOWLEDGE = Schema(
    {
        Required("knowledge_base"): All(
            [
                {
                    Optional("id"): str,
                    Required("content"): All(str, Length(min=1, max=1024)),
                }
            ],
            Length(min=0, max=500),
        ),
        Required("character_id"): str,
    }
)
GET_CHARACTER_DETAILS = Schema({Required("character_id"): str})
POST_CHAT = Schema(
    {
        Required("character_id"): str,
        Required("content"): str,
        Required("api_key"): All(str, Length(min=10)),  # TODO Remove
        Optional("user_name"): All(str, Length(min=1, max=100)),
        Optional("role"): Any("user", "assistant"),
        Optional("session_id"): str,
        Optional("story_mode"): bool,
        Optional("story"): Any(All(str, Length(min=0, max=2048)), None),
        Optional("tweaks"): Any(
            {
                Optional("length"): Any(*_TWEAKS_LENGTH),
                Optional("creativity"): Any(*_TWEAKS_CREATIVITY),
            },
            None,
        ),
        Optional("id"): str,
    }
)
GET_CHAT_SESSIONS = Schema({Required("character_id"): str, **_PAGING_SCHEMA})
GET_CHAT_SESSIONS_COUNT = Schema({Required("character_id"): str})
GET_CHAT = Schema(
    {
        Required("character_id"): str,
        Optional("session_id"): str,
        Optional("sort"): Any("-1", "1"),
        **_PAGING_SCHEMA,
    }
)
GET_CHAT_SESSION = Schema({Required("character_id"): str, Optional("session_id"): str})
GET_CHAT_COUNT = Schema(
    {
        Required("character_id"): str,
        Optional("session_id"): str,
    }
)
PATCH_CHAT_SESSIONS = Schema(
    {
        Optional("name"): str,
        Optional("story_mode"): bool,
        Optional("story"): All(str, Length(min=0, max=2048)),
        Optional("tweaks"): Any(
            {
                Optional("length"): Any(*_TWEAKS_LENGTH),
                Optional("creativity"): Any(*_TWEAKS_CREATIVITY),
            },
            None,
        ),
    }
)
PATCH_CHAT_SESSIONS_QUERY_PARAMETERS = Schema(
    {Required("session_id"): str, Required("character_id"): str}
)
DELETE_CHAT_SESSIONS = Schema(
    {
        Required("session_id"): str,
        Required("character_id"): str,
    }
)
DELETE_CHAT = Schema({Required("id"): str})
POST_TASKS_SESSION_AUTO_LABELED = Schema(
    {Required("user_id"): str, Required("new_name"): str, Required("session_id"): str}
)
POST_TASKS_USER_DATA_TRANSFERRED = Schema({Required("user_id"): str})
POST_ADD_SUBSCRIPTION_ID = Schema({Required("id"): str})
POST_SUBSCRIPTION_CANCEL = Schema({Required("reason"): str})
POST_CHARACTERS_ADD_TO_FAVORITES = Schema({Required("id"): str})
DELETE_CHARACTERS_ADD_TO_FAVORITES = Schema({Required("id"): str})
PATCH_DISPLAY_NAME = Schema({Required("name"): All(str, Length(min=1, max=45))})
GET_RENDER_CHARACTER_AVATAR = Schema({Required("character_id"): str})
POST_CHAT_REGENERATE = Schema(
    {
        Required("session_id"): str,
        Required("character_id"): str,
        Required("api_key"): All(str, Length(min=10)),
    }
)
POST_INLINE_FEEDBACK = Schema(
    {
        Required("rating"): All(int, Range(min=1, max=5)),
        Required("source"): Any("chat", "characters"),
        Optional("content"): All(str, Length(min=0, max=2048)),
        Optional("session_id"): Any(str, None),
        Optional("character_id"): Any(str, None),
        Optional("message_id"): Any(str, None),
    }
)
GET_RENDER_AVATAR = Schema({Required("id"): str})
DELETE_FILE = Schema({Required("id"): str})
PATCH_USER_DESCRIPTION = Schema({Required("content"): All(str, Length(min=0, max=500))})
