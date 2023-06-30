import dataclasses
import uuid
from typing import Generator, Optional, Union

import bcrypt
from database import mongoclass
from library import types
from library.configlib import config

from .state import UserPlanState


@mongoclass.mongoclass()
@dataclasses.dataclass
class Plan:
    id: str = "free"
    verified: bool = False
    subscription_id: Optional[str] = None
    restrictions: dict = dataclasses.field(default_factory=lambda: {})

    @property
    def max_basic_model_requests_per_hour(self) -> int:
        return self.restrictions.get(
            "max_basic_model_requests_per_hour",
            config.plans[self.id]["max_basic_model_requests_per_hour"],
        )

    @property
    def max_advanced_model_requests_per_hour(self) -> int:
        return self.restrictions.get(
            "max_advanced_model_requests_per_hour",
            config.plans[self.id]["max_advanced_model_requests_per_hour"],
        )

    @property
    def max_session_history(self) -> int:
        return self.restrictions.get(
            "max_session_history",
            config.plans[self.id]["max_session_history"],
        )

    @property
    def max_characters(self) -> int:
        return self.restrictions.get(
            "max_characters",
            config.plans[self.id]["max_characters"],
        )

    @property
    def name(self) -> str:
        return self.restrictions.get(
            "name",
            config.plans[self.id]["name"],
        )

    def to_json(self, user_id: Optional[str] = None) -> dict:
        from .character import Character

        state = None
        if user_id:
            state: Optional[UserPlanState] = UserPlanState.find_class({"id": user_id})

        data = {
            "id": self.id,
            "verified": self.verified,
            "name": self.name,
            "max_requests": self.max_basic_model_requests_per_hour,
            "max_characters": self.max_characters,
            "subscription_id": self.subscription_id,
        }
        if state is not None:
            data["requests"] = state.basic_model_requests
            data["characters"] = Character.count_documents({"created_by": user_id})

        return data


@mongoclass.mongoclass()
@dataclasses.dataclass
class Application:
    name: str
    user_id: str
    description: Optional[str] = None
    api_key: str = dataclasses.field(
        default_factory=lambda: uuid.uuid4().hex, repr=False
    )
    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid4()))


@mongoclass.mongoclass(nested=True)
@dataclasses.dataclass
class User:
    email: str
    display_name: Optional[str]
    password: Union[str, bytes] = dataclasses.field(repr=False)
    admin: bool = False
    account_type: types.AccountType = "default"
    plan: Plan = dataclasses.field(default_factory=lambda: Plan())
    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid4()))

    # New Fields
    display_name_changed: bool = False

    def __post_init__(self) -> None:
        if isinstance(self.password, str):
            self.password = bcrypt.hashpw(self.password.encode(), bcrypt.gensalt())

    @property
    def applications(self) -> Generator[Application, None, None]:
        return Application.find_classes({"user_id": self.id})

    def __str__(self) -> str:
        return f"{self.display_name} - {self.email} ({self.id})"

    def to_json(self) -> dict:
        """
        Convert this dataclass into a valid JSON response that excludes sensitive fields
        such as password.
        """

        data = dataclasses.asdict(self)
        data["plan"] = self.plan.to_json(self.id)
        data.pop("password")
        data.pop("admin")
        data.pop("account_type")

        return data
