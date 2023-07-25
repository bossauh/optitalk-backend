import ast
import datetime
import json
import logging
import random
import time
from typing import Optional

import openai
import tiktoken
from flask import has_request_context
from models.open_ai import ChatCompletion, Completion
from models.user import User
from openai.util import convert_to_dict

from library import actions, tasks, utils
from library.security import route_security
from library.socketio import socketio
from library.types import OpenAIFunctionSpec

from .configlib import config

# Set OpenAI API Credentials
openai.api_key = config.credentials["openai_api_key"]


logger = logging.getLogger(__name__)


class GPT:
    def __init__(self) -> None:
        pass

    def calculate_completion_cost(self, model: str, tokens: int) -> float:
        costs: dict[str, float] = config.openai_model_costs
        cost = costs.get(model)
        if cost is None:
            raise ValueError(
                f"Model '{model}' does not have a pre-configured cost per 1k tokens."
            )

        return (tokens / 1000) * cost

    def create_completion(
        self,
        prompt: str,
        model: str = "text-davinci-003",
        temperature: float = 0.7,
        max_tokens: float = 256,
        top_p: int = 1,
        frequency_penalty: int = 0,
        presence_penalty: float = 0.78,
        **kwargs,
    ) -> list[Completion]:
        """
        Create a OpenAI text completion. Unlike the chat completion, this is more focused
        on general text completions. It can still be used for chat completions and is
        actually a perfect use case for it. Using this for chat will yield a better result
        compared to using the default chat completion.

        Notes
        -----
        - This method does not take into account the amount of tokens in the provided
        `prompt`.
        """

        # TODO: Handle cut off responses due to token limit just like the chat completion does

        logger.info("Creating OpenAI text completion...")

        st = time.perf_counter()
        response = openai.Completion.create(
            model=model,
            prompt=prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            **kwargs,
        )
        et = round((time.perf_counter() - st) * 1000, 2)

        completion_data = dict(
            id=response["id"],
            choices=convert_to_dict(response["choices"]),
            created=datetime.datetime.fromtimestamp(response["created"]),
            model=model,
            object=response["object"],
            tt=et,
            completion_tokens=response["usage"]["completion_tokens"],
            prompt_tokens=response["usage"]["prompt_tokens"],
            total_tokens=response["usage"]["total_tokens"],
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            prompt=prompt,
        )
        completion_object = Completion(**completion_data)

        cost = self.calculate_completion_cost(
            model=model, tokens=completion_object.total_tokens
        )

        logger.info(
            f"Created OpenAI chat completion '{response['id']}' for ${cost} ({et}ms)."
        )
        logger.debug(
            f"Total Tokens: {completion_object.total_tokens} | Prompt Tokens: {completion_object.prompt_tokens} | Completion Tokens: {completion_object.completion_tokens}"
        )

        # Save the completion object in the database
        tasks.log_text_completion.delay(**completion_data)

        return [completion_object]

    def create_chat_completion(
        self,
        system: str,
        messages: list[dict[str, str]],
        model: str = "gpt-3.5-turbo",
        temperature: float = 0.7,
        max_tokens: float = 256,
        top_p: int = 1,
        frequency_penalty: int = 0,
        presence_penalty: float = 0.78,
        allow_incomplete: bool = True,
        functions: Optional[list[OpenAIFunctionSpec]] = None,
        character_id: Optional[str] = None,
        _previous_completions: Optional[list[ChatCompletion]] = None,
        api_key: Optional[str] = None,  # TODO Remove
        **kwargs,
    ) -> list[ChatCompletion]:
        """
        Create a OpenAI Chat completion. While this may be called "chat", this can also
        be used for general purpose text completion and is just as effective as the
        regular text completions.

        This returns a list because if the completion is cut off due to the token limit,
        it will automatically create a new completion that completes

        Notes
        -----
        - This method does not take into account the amount of tokens in the provided
        `messages`.
        """

        logger.info("Creating OpenAI chat completion...")
        messages_combined = [{"role": "system", "content": system}] + messages

        functions = functions or []

        # TODO Uncomment this to get base actions back
        # functions.extend(actions.get_base_actions())

        limit_chat_st = time.perf_counter()
        old_max_tokens = max_tokens
        messages_combined, max_tokens = utils.limit_chat_completion_tokens(
            messages=messages_combined,
            model=model,
            max_tokens=max_tokens,
            functions=functions,
        )
        limit_chat_et = time.perf_counter() - limit_chat_st

        is_request = has_request_context()
        user_id = None
        ip_address = None
        user: Optional[User] = None
        if is_request:
            ip_address = route_security.get_client_ip()
            user_id = utils.get_user_id_from_request(anonymous=True)
            user = User.find_class({"id": user_id})

        tasks.log_time_took_metric.delay(
            name="limit_chat_completion_tokens",
            user_id=user_id,
            duration=limit_chat_et,
            character_id=character_id,
            ip_address=ip_address,
            metadata={"old_max_tokens": old_max_tokens, "new_max_tokens": max_tokens},
        )

        # Make the request and time it
        st = time.perf_counter()
        response = openai.ChatCompletion.create(
            model=model,
            messages=messages_combined,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            stream=True,
            # functions=[x.schema for x in functions],
            api_key=api_key,  # TODO Remove
            **kwargs,
        )

        chunks = []
        completion_id = ""
        finish_reason = None
        created = time.time()

        function_call = {"name": None, "arguments": ""}

        fast_response = False
        if user:
            if user.plan.id == "basic":
                fast_response = True

        for chunk in response:
            completion_id = chunk["id"]
            finish_reason = chunk["choices"][0]["finish_reason"]
            created = chunk["created"]
            delta = chunk["choices"][0]["delta"]

            if "function_call" in delta:
                if "name" in delta["function_call"]:
                    function_call["name"] = delta["function_call"]["name"]

                if "arguments" in delta["function_call"]:
                    function_call["arguments"] += delta["function_call"]["arguments"]

            if finish_reason == "function_call":
                try:
                    function_call["arguments"] = ast.literal_eval(
                        function_call["arguments"]
                    )
                except Exception:
                    function_call["arguments"] = {"_ERROR_PARSING": True}
                break

            if delta.get("content") is None:
                continue

            content = delta.get("content", "")
            chunks.append(content)

            if user_id is None:
                continue

            # Constantly emit the full output to the frontend
            comments, contradictions, response = utils.parse_character_response(
                "".join(chunks), use_backups=False
            )
            socketio.emit(
                "realtime-response",
                {
                    "response": response,
                    "comments": comments,
                    "contradictions": contradictions,
                },
                room=user_id,
            )
            # if not fast_response:
            #     time.sleep(random.uniform(0.05, 0.2))

        result = "".join(chunks)
        et = round((time.perf_counter() - st) * 1000, 2)

        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")

        # Calculate tokens
        completion_tokens = utils.get_total_tokens_from_messages(
            [{"role": "assistant", "content": result}]
        )
        prompt_tokens = utils.get_total_tokens_from_messages(
            messages_combined, functions=functions
        )
        function_tokens = len(
            encoding.encode(utils.format_function_specs_as_typescript_ns(functions))
        )
        total_tokens = completion_tokens + prompt_tokens + function_tokens

        completion_data = dict(
            id=completion_id,
            result=result,
            finish_reason=finish_reason,
            created=datetime.datetime.fromtimestamp(created),
            model=model,
            object="chat.completion",
            tt=et,
            completion_tokens=completion_tokens,
            prompt_tokens=prompt_tokens,
            total_tokens=total_tokens,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            messages=messages_combined,
            function_tokens=function_tokens,
            function_call=function_call if function_call["name"] else None,
        )
        completion_object = ChatCompletion(**completion_data)

        cost = self.calculate_completion_cost(
            model=model, tokens=completion_object.total_tokens
        )

        logger.info(
            f"Created OpenAI chat completion '{completion_object.id}' for ${cost} ({et}ms)."
        )
        logger.debug(
            f"Total Tokens: {completion_object.total_tokens} | Prompt Tokens:{completion_object.prompt_tokens} | Function Tokens: {completion_object.function_tokens} | Completion Tokens: {completion_object.completion_tokens}"
        )

        # Save the completion object in the database
        tasks.log_chat_completion.delay(**completion_data)

        return_value = (_previous_completions or []) + [completion_object]

        # Check if incomplete
        if completion_object.finish_reason == "length" and not allow_incomplete:
            logger.info(
                f"Creating another OpenAI chat completion for '{completion_object.id}' because the response was cut off due to the token limit."
            )

            new_messages = [*messages]
            new_messages.append(
                {"role": "assistant", "content": completion_object.result}
            )

            return self.create_chat_completion(
                system=system,
                messages=new_messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                _previous_completions=return_value,
                **kwargs,
            )

        return return_value


gpt = GPT()
