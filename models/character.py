import dataclasses
import datetime
import logging
import pprint
import uuid
from typing import Literal, Optional

from database import mongoclass
from library import utils
from library.configlib import config
from library.exceptions import *
from library.gpt import gpt
from library.tasks import increase_model_requests_state, insert_message

from models.message import Message
from models.session import ChatSession
from models.state import UserPlanState
from models.user import User

logger = logging.getLogger(__name__)


@mongoclass.mongoclass()
@dataclasses.dataclass
class CharacterParameters:
    model_parameters: dict = dataclasses.field(default_factory=lambda: {})
    model: str = "gpt-3.5-turbo"

    @property
    def temperature(self) -> float:
        return self.model_parameters.get(
            "temperature", config.model_parameters[self.model]["temperature"]
        )

    @property
    def max_tokens(self) -> int:
        return self.model_parameters.get(
            "max_tokens", config.model_parameters[self.model]["max_tokens"]
        )

    @property
    def top_p(self) -> float:
        return self.model_parameters.get(
            "top_p", config.model_parameters[self.model]["top_p"]
        )

    @property
    def frequency_penalty(self) -> float:
        return self.model_parameters.get(
            "frequency_penalty",
            config.model_parameters[self.model]["frequency_penalty"],
        )

    @property
    def presence_penalty(self) -> float:
        return self.model_parameters.get(
            "presence_penalty", config.model_parameters[self.model]["presence_penalty"]
        )


@mongoclass.mongoclass(nested=True)
@dataclasses.dataclass
class Character:
    created_by: str
    name: str
    description: str
    parameters: CharacterParameters = dataclasses.field(
        default_factory=lambda: CharacterParameters()
    )
    image: Optional[str] = None
    personalities: Optional[list[str]] = None
    favorite_words: Optional[list[str]] = None
    example_exchanges: Optional[list[dict[str, str]]] = None
    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid4()))
    private: bool = True
    created_at: datetime.datetime = dataclasses.field(
        default_factory=datetime.datetime.now
    )

    def to_json(self) -> dict:
        data = dataclasses.asdict(self)
        data.pop("parameters", None)

        return data

    def chat(
        self,
        user_id: str,
        role: Literal["user", "assistant"],
        content: str,
        user_name: Optional[str] = None,
        user_description: Optional[str] = None,
        session_id: Optional[str] = "0",
    ) -> Message:
        """
        Chat with the Character. Either chat as the "user" role itself or as the "assistant"
        role.

        Parameters
        ----------
        `user_id` : str
            The ID of the user initiating the chat. This is used to ensure that the user's restrictions are met.
        `role` : Literal["user", "assistant"]
            The role of the chat.
        `content` : str
            The content of the message.
        `user_name` : str
            The name of the person initiating the chat. The character can refer to this
            to know who it is speaking to. This is unrelated to an actual OptiTalk user.
            Defaults to None.
        `user_description` : str
            A description of the person initiating the chat. The character can refer to
            this to know more about the person it is speaking to. This is unrelated to
            an actual OptiTalk user. Defaults to None.
        `session_id` : Optional[str]
            The ID of the chat session to use. Defaults to `"0"` which is the default chat
            session when no chat session is provided. If the provided `session_id` does
            not exist, it will be created automatically.

        Raises
        ------
        `UserNotFound` :
            Raised if a user cannot be found with the provided `user_id`.

        Returns
        -------
        `Message` :
            This is the response if the role is `user`, else, this is just the `Message`
            object of the assistant.
        """

        logger.info(f"Chat as '{role}' with the message '{content}' from '{user_id}'.")

        new_message = Message(
            content=content,
            role=role,
            session_id=session_id,
            character_id=self.id,
            created_by=user_id,
        )

        # Create session if it does not exist
        if not ChatSession.count_documents(
            {"id": session_id, "character_id": self.id, "created_by": user_id}
        ):
            ChatSession(
                id=session_id,
                name="Generated Session",
                character_id=self.id,
                created_by=user_id,
            ).save()
            logger.info(
                f"Automatically created session '{session_id}' because it does not exist."
            )

        if role == "assistant":
            insert_message.delay(**dataclasses.asdict(new_message))
            return new_message

        user: Optional[User] = User.find_class({"id": user_id})
        if user is None:
            raise UserNotFound(f"User with ID '{user_id}' does not exist.")

        # Check if the user has capped their requests limit.
        state: Optional[UserPlanState] = UserPlanState.find_class({"id": user_id})
        if state is None:
            UserPlanState(id=user_id).save()
        else:
            requests_count = state.advanced_model_requests
            cap = user.plan.max_advanced_model_requests_per_month
            model_type = "advanced"
            if self.parameters.model in ("gpt-3.5-turbo"):
                requests_count = state.basic_model_requests
                cap = user.plan.max_basic_model_requests_per_month
                model_type = "basic"

            logger.debug(f"{requests_count=} | {cap=} | {model_type=}")

            if requests_count >= cap:
                raise ModelRequestsLimitExceeded(model=model_type, limit=cap)

        messages = list(
            Message.find_classes({})
            .sort("_id", -1)
            .where(
                f"this.session_id === '{session_id}' && this.character_id === '{self.id}' && this.created_by === '{user_id}'"
            )
            .limit(user.plan.max_session_history)
        )
        messages.reverse()
        messages.append(new_message)

        if self.parameters.model in ("gpt-3.5-turbo"):
            system, context_messages = utils.create_chat_completion_context(
                self, user_name=user_name, user_description=user_description
            )
            prompt = context_messages

            for message in messages:
                prompt.append({"role": message.role, "content": message.content})

            logger.debug(f"Prompt: {pprint.pformat(prompt)}")

            completion = gpt.create_chat_completion(
                system=system,
                messages=prompt,
                model=self.parameters.model,
                temperature=self.parameters.temperature,
                max_tokens=self.parameters.max_tokens,
                top_p=self.parameters.top_p,
                frequency_penalty=self.parameters.frequency_penalty,
                presence_penalty=self.parameters.presence_penalty,
            )

        else:
            prompt = utils.create_text_completion_context(
                self, user_name=user_name, user_description=user_description
            )
            for message in messages:
                name = "User"
                if message.role == "assistant":
                    name = "You"
                prompt += f"{name}: {message.content}\n"

            prompt += "You:"

            logger.debug(f"Prompt: {pprint.pformat(prompt)}")

            completion = gpt.create_completion(
                prompt=prompt,
                model=self.parameters.model,
                temperature=self.parameters.temperature,
                max_tokens=self.parameters.max_tokens,
                top_p=self.parameters.top_p,
                frequency_penalty=self.parameters.frequency_penalty,
                presence_penalty=self.parameters.presence_penalty,
            )

        response_message = Message(
            content=completion.result.strip() if completion.result else None,
            role="assistant",
            session_id=session_id,
            character_id=self.id,
            created_by=user_id,
            completion_model=self.parameters.model,
            completion_id=completion.id,
        )

        insert_message.delay(**dataclasses.asdict(new_message))
        insert_message.delay(**dataclasses.asdict(response_message))
        increase_model_requests_state.delay(
            id=user_id, model=self.parameters.model, value=1
        )
        return response_message


@mongoclass.mongoclass()
@dataclasses.dataclass
class CharacterUser:
    user_id: str
    character_id: str
    latest_session: str
