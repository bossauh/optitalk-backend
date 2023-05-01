from typing import Literal, Union

AccountType = Literal["default", "google", "github", "discord", "rapid-api"]
AuthenticationMethods = Literal["session", "api", "rapid-api"]
JsonType = Union[None, int, str, bool, list["JsonType"], dict, tuple]
ResponseType = Literal["response", "error"]
StatusCodeType = tuple[str, int]
