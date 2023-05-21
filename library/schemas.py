from voluptuous import All, Any, Email, Length, Optional, Required, Schema, Url

_CHARACTER_EXCHANGE = {
    Required("role"): Any("user", "assistant"),
    Required("content"): All(str, Length(min=1, max=3000)),
    Optional("name"): All(str, Length(min=1, max=50)),
}
_PAGING_SCHEMA = {Optional("page"): str, Optional("page_size"): str}
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
        Required("name"): All(str, Length(min=1, max=24)),
        Required("description"): All(str, Length(min=1, max=1024)),
        Optional("model"): Any("basic", "advanced"),
        Optional("knowledge"): All(
            [Schema(All(str, min=1, max=250))], Length(min=0, max=10)
        ),
        Optional("personalities"): All(
            [Schema(All(str, min=1, max=24))], Length(min=0, max=5)
        ),
        Optional("favorite_words"): All(
            [Schema(All(str, min=1, max=24))], Length(min=0, max=20)
        ),
        Optional("example_exchanges"): All(
            [_CHARACTER_EXCHANGE], Length(min=0, max=10)
        ),
        Optional("response_styles"): All(
            [Schema(All(str, min=1, max=24))], Length(min=0, max=5)
        ),
        Optional("private"): bool,
        Optional("image"): Url(),
    }
)
PATCH_CHARACTERS = Schema(
    {
        Optional("name"): All(str, Length(min=1, max=24)),
        Optional("description"): All(str, Length(min=1, max=1024)),
        Optional("model"): Any("basic", "advanced"),
        Optional("knowledge"): All(
            [Schema(All(str, min=1, max=250))], Length(min=0, max=10)
        ),
        Optional("personalities"): All(
            [Schema(All(str, min=1, max=24))], Length(min=0, max=5)
        ),
        Optional("favorite_words"): All(
            [Schema(All(str, min=1, max=24))], Length(min=0, max=20)
        ),
        Optional("example_exchanges"): All(
            [_CHARACTER_EXCHANGE], Length(min=0, max=10)
        ),
        Optional("response_styles"): All(
            [Schema(All(str, min=1, max=24))], Length(min=0, max=5)
        ),
        Optional("private"): bool,
        Optional("image"): Url(),
    }
)
GET_CHARACTERS = Schema({Optional("my_characters"): str, **_PAGING_SCHEMA})
GET_CHARACTER_DETAILS = Schema({Required("character_id"): str})
POST_CHAT = Schema(
    {
        Required("character_id"): str,
        Required("content"): str,
        Optional("user_name"): Any(str, Length(min=1, max=100)),
        Optional("role"): Any("user", "assistant"),
        Optional("session_id"): str,
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
PATCH_CHAT_SESSIONS = Schema({Optional("name"): str})
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
