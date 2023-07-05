import dataclasses
import datetime as dt
import uuid
from typing import Literal, Optional

from database import mongoclass


@mongoclass.mongoclass()
@dataclasses.dataclass
class InlineFeedback:

    """
    This kind of feedback shows up on the chat page once.
    """

    rating: int
    created_by: str
    anonymous: bool
    source: Literal["chat", "characters"]

    is_resolved: bool = False
    is_visible: bool = False
    session_id: Optional[str] = None
    character_id: Optional[str] = None
    message_id: Optional[str] = None
    content: Optional[str] = None
    created_at: dt.datetime = dataclasses.field(default_factory=dt.datetime.now)
    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid4()))
