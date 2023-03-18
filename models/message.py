import dataclasses
import datetime
import uuid
from typing import Optional

from database import mongoclass


@mongoclass.mongoclass()
@dataclasses.dataclass
class Message:

    """
    Represents a Message inside a ChatSession.

    A `None` content usually occurs when there has been an error with the completion
    request.
    """

    content: Optional[str]
    role: str
    session_id: str
    character_id: str
    created_by: str
    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime.datetime = dataclasses.field(
        default_factory=datetime.datetime.now
    )
    completion_model: Optional[str] = None
    completion_id: Optional[str] = None
    intent: Optional[str] = None

    def to_json(self) -> dict:
        data = dataclasses.asdict(self)

        data.pop("completion_model", None)
        data.pop("completion_id", None)

        return data
