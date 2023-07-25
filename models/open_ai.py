import dataclasses
import datetime
from typing import Optional

from database import mongoclass


@mongoclass.mongoclass()
@dataclasses.dataclass
class Completion:
    id: str
    choices: list[dict]
    created: datetime.datetime
    model: str
    object: str
    tt: float

    # Tokens
    completion_tokens: int
    prompt_tokens: int
    total_tokens: int

    # Parameters
    temperature: float
    max_tokens: int
    top_p: int
    frequency_penalty: int
    presence_penalty: float
    prompt: str

    @property
    def result(self) -> Optional[str]:
        """
        Retrieve the completion's result if it exists.
        """

        if not self.choices:
            return

        return self.choices[0]["text"]


@mongoclass.mongoclass()
@dataclasses.dataclass
class ChatCompletion:
    id: str
    result: Optional[str]
    finish_reason: Optional[str]
    created: datetime.datetime
    model: str
    object: str
    tt: float

    # Tokens
    completion_tokens: int
    prompt_tokens: int
    total_tokens: int

    # Parameters
    temperature: float
    max_tokens: int
    top_p: int
    frequency_penalty: int
    presence_penalty: float
    messages: list[dict[str, str]]

    function_call: Optional[dict] = None
    function_tokens: int = 0
