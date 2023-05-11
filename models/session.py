import dataclasses
import uuid
from typing import Generator

from database import mongoclass

from models.message import Message


@mongoclass.mongoclass()
@dataclasses.dataclass
class ChatSession:
    created_by: str
    name: str
    character_id: str
    name_changed: bool = False
    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid()))

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
