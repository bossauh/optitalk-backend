import dataclasses
import datetime
import logging
import pprint
import re
import time
import uuid
from typing import Literal, Optional, Union

from database import mongoclass
from IPy import IP
from library import users, utils
from library.configlib import config
from library.exceptions import *
from library.gpt import gpt
from library.security import route_security
from library.socketio import socketio
from library.tasks import (increase_model_requests_state, insert_message,
                           log_time_took_metric)
from openai.embeddings_utils import cosine_similarity, get_embedding

from models.knowledge import Knowledge
from models.message import Message
from models.session import ChatSession
from models.state import UserPlanState
from models.tweaks import Tweaks
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
    tweaks: Tweaks = dataclasses.field(default_factory=lambda: Tweaks())
    parameters: CharacterParameters = dataclasses.field(
        default_factory=lambda: CharacterParameters()
    )
    uses: int = 0
    featured: bool = False
    avatar_id: Optional[str] = None
    image: Optional[str] = None
    personalities: Optional[list[str]] = None
    favorite_words: Optional[list[str]] = None
    example_exchanges: Optional[list[dict[str, str]]] = None
    response_styles: list[str] = dataclasses.field(default_factory=list)
    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid4()))
    private: bool = True
    public_description: Optional[str] = None
    definition_visibility: bool = True
    nsfw: bool = False
    created_at: datetime.datetime = dataclasses.field(
        default_factory=datetime.datetime.now
    )

    # Meta fields
    _moderated: bool = False
    _auto_moderation_results: Optional[dict] = None

    # Unused old fields
    knowledge: Optional[list[str]] = dataclasses.field(default_factory=list)

    def __str__(self) -> str:
        return f"{self.name} ({self.id})"

    def to_json(self, bypass_definition_visibility: bool = False) -> dict:
        data = dataclasses.asdict(self)
        data.pop("parameters", None)
        data.pop("_moderated", None)
        data.pop("_auto_moderation_results", None)

        if not self.definition_visibility and not bypass_definition_visibility:
            data.pop("description", None)
            data.pop("response_styles", None)
            data.pop("example_exchanges", None)
            data.pop("favorite_words", None)
            data.pop("personalities", None)

        try:
            user_id = utils.get_user_id_from_request()
        except Exception:
            user_id = None

        if user_id is not None:
            if FavoriteCharacter.count_documents(
                {"user_id": user_id, "character_id": self.id}
            ):
                data["favorite"] = True
            else:
                data["favorite"] = False

        return data

    def _get_knowledge_ranking(
        self, content: str
    ) -> list[dict[str, Union[str, float]]]:
        """
        Return a ranking list of how similar the content is to the items in the
        knowledge base of this character. The return value is already sorted from
        highest to lowest.
        """

        st = time.perf_counter()

        if not Knowledge.count_documents({"character_id": self.id}):
            return []

        rankings = []
        content_embedding = get_embedding(content, engine="text-embedding-ada-002")
        for knowledge in Knowledge.find_classes({"character_id": self.id}):
            if not knowledge.embeddings:
                continue

            ranking = {
                "content": knowledge.content,
                "similarity": cosine_similarity(
                    content_embedding, knowledge.embeddings
                ),
            }
            rankings.append(ranking)
        rankings.sort(key=lambda x: x["similarity"], reverse=True)

        et = time.perf_counter() - st
        log_time_took_metric.delay(
            name="get-knowledge-base-ranking-against-user-input",
            user_id=utils.get_user_id_from_request(),
            duration=et,
            character_id=self.id,
            ip_address=route_security.get_client_ip(),
        )

        return rankings

    def _get_knowledge_hint(self, content: str) -> Optional[str]:
        """
        Try and get a knowledge hint based on the provided content.
        """

        rankings = self._get_knowledge_ranking(content)
        if not rankings:
            return

        if rankings[0]["similarity"] < 0.76:
            return

        hints = [rankings[0]["content"]]
        if len(rankings) > 1:
            if rankings[1]["similarity"] >= 0.74:
                hints.append(rankings[1]["content"])

        return "\n".join(hints)

    def chat(
        self,
        user_id: str,
        content: str,
        role: Literal["user", "assistant"] = "user",
        user_name: Optional[str] = None,
        session_id: Optional[str] = "0",
        regenerated: Optional[bool] = False,
        id: Optional[str] = None,
        story_mode: bool = False,
        story: Optional[str] = None,
        tweaks: Optional[Tweaks] = None,
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
        `regenerated` : Optional[bool]
            Makes it so that the message this generates (if it generates any) is marked as
            regenerated.
        `id` : Optional[str]
            The ID to give this message. Defaults to None which is to create one
            from scratch.

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
            user_name = utils.clean_user_name(user_name)

        if id:
            if Message.count_documents({"id": id}):
                raise MessageIDAlreadyExists(id)
            logger.info(f"Using pre-provided ID: {id}")

        new_message = Message(
            content=content,
            role=role,
            session_id=session_id,
            character_id=self.id,
            created_by=user_id,
            name=user_name,
            raw_input=content,
            id=id or str(uuid.uuid4()),
        )

        # Create session if it does not exist
        session = ChatSession.find_class(
            {"id": session_id, "character_id": self.id, "created_by": user_id}
        )
        if not session:
            session = ChatSession(
                id=session_id,
                name="New Session",
                character_id=self.id,
                created_by=user_id,
                story_mode=story_mode,
                story=story,
                tweaks=tweaks,
            )
            logger.info(
                f"Automatically created session '{session_id}' because it does not exist."
            )

        session.last_used = datetime.datetime.now()
        session.save()
        socketio.emit("session-used", {"id": session_id}, room=user_id)

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
            cap = user.plan.max_advanced_model_requests_per_hour
            model_type = "advanced"
            if self.parameters.model in ("gpt-3.5-turbo", "gpt-4"):
                requests_count = state.basic_model_requests
                cap = user.plan.max_basic_model_requests_per_hour
                model_type = "basic"

            logger.debug(f"{requests_count=} | {cap=} | {model_type=}")

            if requests_count >= cap and not is_rapid_api:
                raise ModelRequestsLimitExceeded(model=model_type, limit=cap)

        fetch_messages_st = time.perf_counter()
        messages = list(
            Message.find_classes(
                {
                    "session_id": session_id,
                    "character_id": self.id,
                    "created_by": user_id,
                }
            )
            .sort("_id", -1)
            .limit(user.plan.max_session_history)
        )
        messages.reverse()
        fetch_messages_et = time.perf_counter() - fetch_messages_st
        logger.debug(f"Fetching the messages took {fetch_messages_et}.")

        # Get the knowledge hint
        fetch_knowledge_st = time.perf_counter()
        knowledge_hint = self._get_knowledge_hint(content)
        if knowledge_hint:
            new_message.knowledge_hint = knowledge_hint
        fetch_knowledge_et = time.perf_counter() - fetch_knowledge_st
        logger.debug(f"Fetching the knowledge hint took {fetch_knowledge_et}.")

        messages.append(new_message)

        model_parameters = {
            "temperature": self.parameters.temperature,
            "max_tokens": self.parameters.max_tokens,
            "top_p": self.parameters.top_p,
            "frequency_penalty": self.parameters.frequency_penalty,
            "presence_penalty": self.parameters.presence_penalty,
        }

        # Get tweaks details
        model_notes = None
        used_tweaks = session.tweaks or self.tweaks
        if used_tweaks:
            model_notes = used_tweaks.model_notes
            model_parameters.update(used_tweaks.model_parameters)

        if session.story_mode and session.story:
            model_notes = model_notes if model_notes is not None else []
            model_notes.append("Follow the story provided to you, but don't rush it unless told.")

        logger.debug(f"Used tweaks {used_tweaks}")
        logger.debug(f"Model parameters {model_parameters}")
        logger.debug(f"Model notes {model_notes}")

        if self.parameters.model in ("gpt-3.5-turbo", "gpt-4"):
            system, context_messages = utils.create_chat_completion_context(
                self, user_name=user_name, user=user, session=session
            )
            prompt = context_messages

            for message in messages:
                content = message.content

                if message.role == "assistant":
                    content = f"Comments: {message.comments}\nContradictions: {message.contradictions}\nResponse: {message.content}"
                else:
                    content = f"Response: {message.content}"
                    if message.knowledge_hint:
                        content += f"\nKnowledge Hint (The user should not be able to see this, the user only knows its own Response): {message.knowledge_hint}"

                    if model_notes:
                        notes = "\n".join([f"- {x}" for x in model_notes])
                        content += f"\n\nLanguage model notes/settings:\n{notes}"

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
                **model_parameters,
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
                prompt=prompt, model=self.parameters.model, **model_parameters
            )

        processing_st = time.perf_counter()
        completion = completion_function(**completion_parameters)
        processing_time = time.perf_counter() - processing_st

        # Remove knowledge hint from the user's message
        new_message.knowledge_hint = None

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
            knowledge_hint=knowledge_hint,
            processing_time=processing_time,
            generated=True,
            regenerated=regenerated,
        )

        insert_message.delay(**dataclasses.asdict(new_message))
        time.sleep(1)
        insert_message.delay(**dataclasses.asdict(response_message))
        increase_model_requests_state.delay(
            id=user_id, model=self.parameters.model, value=1
        )
        self.uses += 1
        self.save()
        return response_message


@mongoclass.mongoclass()
@dataclasses.dataclass
class FavoriteCharacter:
    user_id: str
    character_id: str
