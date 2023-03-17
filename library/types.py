from typing import Literal, Union

AccountType = Literal["default", "google", "github", "discord"]
AuthenticationMethods = Literal["session", "api"]
JsonType = Union[None, int, str, bool, list["JsonType"], dict, tuple]
ResponseType = Literal["response", "error"]
StatusCodeType = tuple[str, int]
