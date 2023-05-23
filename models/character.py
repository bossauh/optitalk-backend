import dataclasses
import datetime
import logging
import pprint
import re
import uuid
from typing import Literal, Optional

from database import mongoclass
from IPy import IP
from library import users, utils
from library.configlib import config
from library.exceptions import *
from library.gpt import gpt
from library.tasks import increase_model_requests_state, insert_message

from models.message import Message
from models.session import ChatSession
from models.state import UserPlanState
from models.user import Plan, User

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
    knowledge: Optional[list[str]] = dataclasses.field(default_factory=list)
    parameters: CharacterParameters = dataclasses.field(
        default_factory=lambda: CharacterParameters()
    )
    uses: int = 0
    featured: bool = False
    image: Optional[str] = None
    personalities: Optional[list[str]] = None
    favorite_words: Optional[list[str]] = None
    example_exchanges: Optional[list[dict[str, str]]] = None
    response_styles: list[str] = dataclasses.field(default_factory=list)
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
        content: str,
        role: Literal["user", "assistant"] = "user",
        user_name: Optional[str] = None,
        session_id: Optional[str] = "0",
    ) -> Message:
        """
        Chat with the Character. Either chat as the "user" role itself or as the "assistant"
        role.

        Parameters
        ----------
        `content` : str
            The content of the message.
        `user_id` : str
            The ID of the user initiating the chat. This is used to ensure that the
            user's restrictions are met.
        `role` : Literal["user", "assistant"]
            The role of the chat. Defaults to `user`.
        `user_name` : str
            The name of the person initiating the chat. The character can refer to this
            to know who it is speaking to. This is unrelated to an actual OptiTalk user.
            Defaults to None.
        `session_id` : Optional[str]
            The ID of the chat session to use. Defaults to `"0"` which is the default chat
            session when no chat session is provided. If the provided `session_id` does
            not exist, it will be created automatically.

        Raises
        ------
        `UserNotFound` :
            Raised if a user cannot be found with the provided `user_id`.
        `ModelRequestsLimitExceeded` :
            When the requests limit has been exceeded.

        Returns
        -------
        `Message` :
            This is the response if the role is `user`, else, this is just the `Message`
            object of the assistant.
        """

        logger.info(f"Chat as '{role}' with the message '{content}' from '{user_id}'.")

        # Clean user_name
        if user_name:
            user_name = re.sub(r"[^\w-]{1,64}", "", user_name)

        new_message = Message(
            content=content,
            role=role,
            session_id=session_id,
            character_id=self.id,
            created_by=user_id,
            name=user_name,
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

        anonymous = True
        try:
            IP(user_id)
        except ValueError:
            anonymous = False

        user: Optional[User] = User.find_class({"id": user_id})
        if user is None:
            if not anonymous:
                raise UserNotFound(f"User with ID '{user_id}' does not exist.")

            user = users.register_user(
                email=user_id,
                password=user_id,
                account_type="anonymous",
                skip_application=True,
            )
            user.id = user_id
            user.plan = Plan(id="anonymous")
            user.save()

        is_rapid_api = utils.is_from_rapid_api()

        # Check if the user has capped their requests limit.
        state: Optional[UserPlanState] = UserPlanState.find_class({"id": user_id})
        if state is None:
            UserPlanState(id=user_id).save()
        else:
            requests_count = state.advanced_model_requests
            cap = user.plan.max_advanced_model_requests_per_month
            model_type = "advanced"
            if self.parameters.model in ("gpt-3.5-turbo", "gpt-4"):
                requests_count = state.basic_model_requests
                cap = user.plan.max_basic_model_requests_per_month
                model_type = "basic"

            logger.debug(f"{requests_count=} | {cap=} | {model_type=}")

            if requests_count >= cap and not is_rapid_api:
                raise ModelRequestsLimitExceeded(model=model_type, limit=cap)

        messages = list(
            Message.find_classes({})
            .sort("_id", -1)
            .where(
                f"this.session_id === '{session_id}' && this.character_id === '{self.id}' && this.created_by === '{user_id}'"
            )
            .limit(user.plan.max_session_history if not is_rapid_api else 100)
        )
        messages.reverse()
        messages.append(new_message)

        if self.parameters.model in ("gpt-3.5-turbo", "gpt-4"):
            system, context_messages = utils.create_chat_completion_context(
                self, user_name=user_name
            )
            prompt = context_messages

            for message in messages:
                content = message.content
                if message.role == "assistant":
                    content = f"Comments: {message.comments}\nContradictions: {message.contradictions}\nResponse: {message.content}"

                message_data = {
                    "role": message.role,
                    "content": content,
                }
                if message.name:
                    message_data["name"] = message.name
                prompt.append(message_data)

            logger.debug(f"Prompt: {pprint.pformat(prompt)}")

            completion_function = gpt.create_chat_completion
            completion_parameters = dict(
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
            prompt = utils.create_text_completion_context(self, user_name=user_name)
            for message in messages:
                name = message.name or "User"
                if message.role == "assistant":
                    name = "You"
                prompt += f"{name}: {message.content}\n"

            prompt += "You:"
            logger.debug(f"Prompt: {pprint.pformat(prompt)}")

            completion_function = gpt.create_completion
            completion_parameters = dict(
                prompt=prompt,
                model=self.parameters.model,
                temperature=self.parameters.temperature,
                max_tokens=self.parameters.max_tokens,
                top_p=self.parameters.top_p,
                frequency_penalty=self.parameters.frequency_penalty,
                presence_penalty=self.parameters.presence_penalty,
            )

        completion = completion_function(**completion_parameters)

        # Join the multiple completions together
        content = "" if completion[0].result else None
        if content is not None:
            for completion in completion:
                content += " " + completion.result

            content = content.strip()

        # TODO: Remove this, the intent system will get a rework
        message_intent = None
        if content:
            intents = config.intents
            for intent in intents:
                if content.endswith(intent):
                    content = content.replace(intent, "")
                    message_intent = intent

        comments, contradictions, response = utils.parse_character_response(content)

        response_message = Message(
            content=response,
            comments=comments,
            contradictions=contradictions,
            role="assistant",
            session_id=session_id,
            character_id=self.id,
            created_by=user_id,
            completion_model=self.parameters.model,
            completion_id=completion.id,
            intent=message_intent,
        )

        insert_message.delay(**dataclasses.asdict(new_message))
        insert_message.delay(**dataclasses.asdict(response_message))
        increase_model_requests_state.delay(
            id=user_id, model=self.parameters.model, value=1
        )
        self.uses += 1
        self.save()
        return response_message


@mongoclass.mongoclass()
@dataclasses.dataclass
class CharacterUser:
    user_id: str
    character_id: str
    latest_session: str
