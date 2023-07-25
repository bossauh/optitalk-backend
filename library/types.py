from dataclasses import dataclass
from typing import Literal, Optional, Union

AccountType = Literal[
    "default", "google", "github", "discord", "rapid-api", "anonymous"
]
AuthenticationMethods = Literal["session", "api", "rapid-api"]
PlanStatusType = Literal["active", "inactive", "pending"]
JsonType = Union[None, int, str, bool, list["JsonType"], dict, tuple]
ResponseType = Literal["response", "error"]
StatusCodeType = tuple[str, int]


@dataclass
class ParameterSpec:
    name: str
    type: str
    description: Optional[str] = None
    required: bool = False


@dataclass
class OpenAIFunctionSpec:
    name: str
    description: str
    parameters: dict[str, ParameterSpec]

    @property
    def schema(self):
        """Returns an OpenAI-consumable function specification"""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                "type": "object",
                "properties": {
                    param.name: {
                        "type": param.type,
                        "description": param.description,
                    }
                    for param in self.parameters.values()
                },
                "required": [
                    param.name for param in self.parameters.values() if param.required
                ],
            },
        }
