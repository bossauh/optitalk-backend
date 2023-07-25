import dataclasses
import datetime as dt
import uuid
from typing import TYPE_CHECKING, Generator, Optional

from database import mongoclass

from models.message import Message
from models.tweaks import Tweaks

if TYPE_CHECKING:
    from models.summary import ConversationSummary


@mongoclass.mongoclass(nested=True)
@dataclasses.dataclass
class ChatSession:
    created_by: str
    name: str
    character_id: str
    tweaks: Optional[Tweaks] = None
    story_mode: bool = False
    story: Optional[str] = None
    name_changed: bool = False
    shared_memory: bool = False
    public_memory: bool = False
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

    @property
    def memories_count(self) -> int:
        from models.summary import ConversationSummary

        return ConversationSummary.count_documents(
            {
                "session_id": self.id,
                "character_id": self.character_id,
                "created_by": self.created_by,
            }
        )

    def memories(self) -> Generator["ConversationSummary", None, None]:
        from models.summary import ConversationSummary

        query = {
            "character_id": self.character_id,
            "session_id": self.id,
            "created_by": self.created_by,
        }

        if self.shared_memory:
            query.pop("session_id", None)

        if self.public_memory:
            query.pop("session_id", None)
            query.pop("created_by", None)

        return ConversationSummary.find_classes(query)

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
