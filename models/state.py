import dataclasses
import time

from database import mongoclass


@mongoclass.mongoclass()
@dataclasses.dataclass
class UserPlanState:
    id: str
    basic_model_requests: int = 0
    advanced_model_requests: int = 0
    timestamp: float = dataclasses.field(default_factory=time.time)
