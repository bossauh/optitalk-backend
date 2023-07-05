import dataclasses
import datetime as dt
import uuid
from typing import Generator, Optional

from database import mongoclass

from models.message import Message


@mongoclass.mongoclass()
@dataclasses.dataclass
class ChatSession:
    created_by: str
    name: str
    character_id: str
    name_changed: bool = False
    last_used: Optional[dt.datetime] = None
    created_at: dt.datetime = dataclasses.field(default_factory=dt.datetime.now)
    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid()))

    @property
    def messages_count(self) -> int:
        return Message.count_documents(
            {
                "session_id": self.id,
                "character_id": self.character_id,
                "created_by": self.created_by,
            }
        )

    def messages(self) -> Generator[Message, None, None]:
        """
        Return a generator that retrieves all messages in this chat session.
        """

        return Message.find_classes(
            {
                "session_id": self.id,
                "character_id": self.character_id,
                "created_by": self.created_by,
            }
        )

    def to_json(self) -> dict:
        data = dataclasses.asdict(self)
        data["messages_count"] = self.messages_count

        return data
