import dataclasses
import logging
import time
import traceback
import uuid
from typing import Optional

import backoff
import tiktoken
from database import mongoclass
from library import tasks
from library.security import route_security
from openai.embeddings_utils import get_embedding

logger = logging.getLogger(__name__)


@mongoclass.mongoclass()
@dataclasses.dataclass
class ConversationSummary:
    summary: str
    session_id: str
    created_by: str
    character_id: str
    messages_summarized: int

    embeddings: Optional[list[float]] = None
    embeddings_tokens: Optional[int] = None
    embeddings_price: Optional[int] = None

    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid4()))

    def to_json(self) -> dict:
        data = dataclasses.asdict(self)
        data.pop("embeddings", None)
        data.pop("embeddings_tokens", None)
        data.pop("embeddings_price", None)

        return data

    def __str__(self) -> str:
        return f"{self.id} ({self.messages_summarized} messages) (Session {self.session_id})"

    @backoff.on_exception(backoff.expo, Exception, max_time=60)
    def update_embeddings(self) -> list[float]:
        try:
            ip_address = route_security.get_client_ip()
        except Exception:
            ip_address = None

        try:
            st = time.perf_counter()
            self.embeddings = get_embedding(
                self.summary, engine="text-embedding-ada-002"
            )
            et = time.perf_counter() - st

            encoder = tiktoken.get_encoding("cl100k_base")
            tokens = len(encoder.encode(self.summary))
            self.embeddings_tokens = tokens
            self.embeddings_price = (tokens / 1000) * 0.0001

            logger.info(
                f"Updated embeddings of conversation summary '{self}'. (${self.embeddings_price})"
            )

            tasks.log_time_took_metric.delay(
                name="update-embeddings-of-conversation-summary",
                duration=et,
                user_id=self.created_by,
                metadata={"data": self.to_json()},
                ip_address=ip_address,
            )

            return self.embeddings
        except Exception as e:
            description = f"A unknown error has occurred while trying to generate the embeddings for the conversation summary '{self}'."
            logger.exception(description)

            tasks.error_alert.delay(
                title="Update conversation summary embeddings",
                description=description,
                metadata={"data": self.to_json()},
                trace=traceback.format_exc(),
            )
            raise e
