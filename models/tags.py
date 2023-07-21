import dataclasses
import datetime
import logging
import time
import traceback
import uuid
from typing import Optional

import backoff
import tiktoken
from database import mongoclass
from library import tasks, utils
from library.security import route_security
from openai.embeddings_utils import get_embedding

logger = logging.getLogger(__name__)


@mongoclass.mongoclass()
@dataclasses.dataclass
class Tag:
    tag: str
    description: Optional[str] = None
    embeddings: Optional[list[float]] = None
    embeddings_price: Optional[float] = None
    embeddings_tokens: Optional[int] = None
    created_at: datetime.datetime = dataclasses.field(
        default_factory=datetime.datetime.now
    )
    created_by: Optional[str] = None
    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid4()))

    def __str__(self) -> str:
        return f"{self.tag} ({self.id})"

    def to_json(self) -> dict:
        data = dataclasses.asdict(self)
        data.pop("embeddings", None)
        data.pop("embeddings_price", None)
        data.pop("embeddings_tokens", None)

        return data

    @property
    def embeddings_content(self) -> str:
        content = f"Tag: {self.tag}"
        if self.description:
            content += f"\nDescription: {self.description}"

        return content

    @backoff.on_exception(backoff.expo, Exception, max_time=60)
    def update_embeddings(self) -> list[float]:
        try:
            user_id = utils.get_user_id_from_request()
            ip_address = route_security.get_client_ip()
        except Exception:
            user_id = None
            ip_address = None

        try:
            st = time.perf_counter()
            self.embeddings = get_embedding(
                self.embeddings_content, engine="text-embedding-ada-002"
            )
            et = time.perf_counter() - st

            encoder = tiktoken.get_encoding("cl100k_base")
            tokens = len(encoder.encode(self.embeddings_content))
            self.embeddings_tokens = tokens
            self.embeddings_price = (tokens / 1000) * 0.0001

            logger.info(
                f"Updated embeddings of tag '{self}'. (${self.embeddings_price})"
            )

            tasks.log_time_took_metric.delay(
                name="update-embeddings-of-tag",
                duration=et,
                user_id=self.created_by or user_id,
                metadata={"data": self.to_json()},
                ip_address=ip_address,
            )

            return self.embeddings
        except Exception as e:
            description = f"A unknown error has occurred while trying to generate the embeddings for the tag '{self}'."
            logger.exception(description)

            tasks.error_alert.delay(
                title="Update embeddings of tag",
                description=description,
                metadata={"data": self.to_json()},
                trace=traceback.format_exc(),
            )

            raise e
