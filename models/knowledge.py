import dataclasses
import logging
import time
import uuid
from typing import Optional

import tiktoken
from database import mongoclass
from openai.embeddings_utils import get_embedding

logger = logging.getLogger(__name__)


@mongoclass.mongoclass()
@dataclasses.dataclass
class Knowledge:
    character_id: str
    created_by: str
    content: str
    embeddings: Optional[list[float]] = None
    price: Optional[float] = None
    tokens: Optional[int] = None
    et: Optional[float] = None
    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid4()))

    def to_json(self) -> dict:
        return {
            "character_id": self.character_id,
            "created_by": self.created_by,
            "content": self.content,
            "id": self.id,
        }

    def update_embeddings(self) -> list[float]:
        """
        Update the embeddings based on the current content.
        """

        encoder = tiktoken.get_encoding("cl100k_base")
        tokens = len(encoder.encode(self.content))
        self.tokens = tokens

        # Calculate pricing based on OpenAI's pricing page
        # It's hardcoded since it's unlikely to change (I hope)
        self.price = (tokens / 1000) * 0.0004

        logger.info(
            f"Updating embedding content of knowledge '{self.id}'. ({tokens} tokens, ${self.price})"
        )

        st = time.perf_counter()
        self.embeddings = get_embedding(self.content, engine="text-embedding-ada-002")
        self.et = time.perf_counter() - st

        logger.info(
            f"Updated embeddings with length of {len(self.embeddings)}. ({round(self.et, 3)}s)"
        )

        return self.embeddings
