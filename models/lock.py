import dataclasses
import logging
from contextlib import contextmanager

from database import mongoclass

logger = logging.getLogger(__name__)


@mongoclass.mongoclass()
@dataclasses.dataclass
class CeleryLock:
    name: str
    open: bool = True


class CeleryLockContext:
    def __init__(self, lock: str):
        self.lock: CeleryLock = CeleryLock.find_class({"name": lock})

    def __enter__(self):
        if not self.lock.open:
            return None

        self.lock.open = False
        self.lock.save()

        return self

    def __exit__(self, exc_type, exc_value, traceback):
        pass
