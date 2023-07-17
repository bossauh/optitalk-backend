import dataclasses
import datetime as dt
import uuid
from typing import Optional

from database import mongoclass


@mongoclass.mongoclass()
@dataclasses.dataclass
class TimeTookMetric:
    name: str
    user_id: str
    duration: float
    metadata: Optional[dict] = None
    character_id: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: dt.datetime = dataclasses.field(default_factory=dt.datetime.now)
    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid4()))
