import dataclasses
import logging
from typing import TYPE_CHECKING, Optional

import openai
from flask import Blueprint, request
from library import responses, schemas, tasks, utils
from library.exceptions import *
from library.security import route_security
from models.character import Character
from models.message import Message
from models.session import ChatSession

if TYPE_CHECKING:
    from ..app import App


logger = logging.getLogger(__name__)


# pylint: disable=unused-argument
def setup(server: "App") -> Blueprint:
    app = Blueprint("chat", __name__, url_prefix="/api/chat")
    route_security.patch(app, authentication_methods=["session", "api", "rapid-api"])

    @app.post("/")
    @route_security.request_json_schema(schema=schemas.POST_CHAT)
    @route_security.exclude
    def post_chat():
        """
        Chat with a character. Either chat as the "user" role itself or as the "assistant" role.
        """

        data: dict = request.json
        user_id = utils.get_user_id_from_request(anonymous=True)
        if user_id is None:
            return responses.create_response(
                status_code=responses.CODE_400,
                message="User ID or Client IP not found from the request.",
            )

        character: Optional[Character] = Character.find_class(
            {"id": data["character_id"]}
        )
        if character is not None:
            if not character.private or character.created_by == user_id:
                try:
                    response = character.chat(
                        user_id=user_id,
                        role=data.get("role", "user"),
                        content=data["content"],
                        user_name=data.get("user_name"),
                        session_id=data.get("session_id", "0"),
                    )
                except ModelRequestsLimitExceeded as e:
                    return responses.create_response(
                        exception=e, status_code=responses.CODE_403
                    )
                except openai.APIError:
                    logger.exception("A OpenAI error has occurred.")
                    return responses.create_response(
                        status_code=responses.CODED_500,
                        payload={
                            "message": "A unknown model error has occurred, please try again."
                        },
                    )

                return responses.create_response(payload=response.to_json())

        return responses.create_response(
            status_code=responses.CODE_404,
            payload={
                "message": f"Cannot find a character with the ID of '{data['character_id']}'."
            },
        )

    @app.get("/")
    @route_security.request_args_schema(schema=schemas.GET_CHAT)
    @route_security.exclude
    def get_chat():
        """
        Retrieve the entire conversation of a character on a specific session.
        """

        user_id = utils.get_user_id_from_request(anonymous=True)
        if user_id is None:
            return responses.create_response(
                status_code=responses.CODE_400,
                message="User ID or Client IP not found from the request.",
            )

        session_id = request.args.get("session_id", "0")

        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("page_size", 25))
        sort = int(request.args.get("sort", "1"))

        messages = [
            x.to_json()
            for x in utils.paginate_mongoclass_cursor(
                Message.find_classes(
                    {
                        "character_id": request.args["character_id"],
                        "session_id": session_id,
                        "created_by": user_id,
                    }
                ).sort("_id", sort),
                page=page,
                page_size=page_size,
            )
        ]

        return responses.create_paginated_response(
            objects=messages, page=page, page_size=page_size
        )

    @app.get("/count")
    @route_security.request_args_schema(schema=schemas.GET_CHAT_COUNT)
    @route_security.exclude
    def get_chat_count():
        """
        Retrieve how many messages there are in a specific session of a character.
        """

        user_id = utils.get_user_id_from_request(anonymous=True)
        if user_id is None:
            return responses.create_response(
                status_code=responses.CODE_400,
                message="User ID or Client IP not found from the request.",
            )

        session_id = request.args.get("session_id", "0")
        count = Message.count_documents(
            {
                "character_id": request.args["character_id"],
                "session_id": session_id,
                "created_by": user_id,
            }
        )

        return responses.create_response(payload=count)

    @app.get("/sessions")
    @route_security.request_args_schema(schema=schemas.GET_CHAT_SESSIONS)
    @route_security.exclude
    def get_sessions():
        """
        Retrieve all of your sessions for a specific character.
        """

        user_id = utils.get_user_id_from_request(anonymous=True)
        if user_id is None:
            return responses.create_response(
                status_code=responses.CODE_400,
                message="User ID or Client IP not found from the request.",
            )

        character_id = request.args["character_id"]

        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("page_size", 25))

        sessions = list(
            utils.paginate_mongoclass_cursor(
                ChatSession.find_classes(
                    {"created_by": user_id, "character_id": character_id}
                ).sort("_id", -1),
                page=page,
                page_size=page_size,
            )
        )

        return responses.create_paginated_response(
            objects=sessions, page=page, page_size=page_size
        )

    @app.get("/session")
    @route_security.request_args_schema(schema=schemas.GET_CHAT_SESSION)
    @route_security.exclude
    def get_session():
        """
        Get information about a specific session.
        """

        user_id = utils.get_user_id_from_request(anonymous=True)
        if user_id is None:
            return responses.create_response(
                status_code=responses.CODE_400,
                message="User ID or Client IP not found from the request.",
            )

        character_id = request.args["character_id"]
        session_id = request.args.get("session_id", "0")
        session: Optional[ChatSession] = ChatSession.find_class(
            {"character_id": character_id, "created_by": user_id, "id": session_id}
        )
        if session is None:
            return responses.create_response(
                status_code=responses.CODE_404,
                payload={
                    "message": f"Cannot find a chat session with the id of '{session_id}' and character id of '{character_id}'."
                },
            )

        return responses.create_response(payload=dataclasses.asdict(session))

    @app.get("/sessions/count")
    @route_security.request_args_schema(schema=schemas.GET_CHAT_SESSIONS_COUNT)
    @route_security.exclude
    def get_sessions_count():
        """
        Retrieve how many sessions do you have with a specific character.
        """

        user_id = utils.get_user_id_from_request(anonymous=True)
        if user_id is None:
            return responses.create_response(
                status_code=responses.CODE_400,
                message="User ID or Client IP not found from the request.",
            )

        character_id = request.args["character_id"]
        count = ChatSession.count_documents(
            {"created_by": user_id, "character_id": character_id}
        )

        return responses.create_response(payload=count)

    @app.patch("/sessions")
    @route_security.request_args_schema(
        schema=schemas.PATCH_CHAT_SESSIONS_QUERY_PARAMETERS
    )
    @route_security.request_json_schema(schema=schemas.PATCH_CHAT_SESSIONS)
    def patch_sessions():
        """
        Edit a chat session.
        """

        user_id = utils.get_user_id_from_request()
        session_id = request.args["session_id"]
        character_id = request.args["character_id"]

        session = ChatSession.find_class(
            {"id": session_id, "character_id": character_id, "created_by": user_id}
        )
        if session is None:
            return responses.create_response(
                status_code=responses.CODE_404,
                payload={
                    "message": f"Cannot find a chat session with the id of '{session_id}' and character id of '{character_id}'."
                },
            )

        for k, v in request.json.items():
            if k == "name":
                setattr(session, "name_changed", True)
            setattr(session, k, v)

        session.save()
        return responses.create_response()

    @app.delete("/sessions")
    @route_security.request_args_schema(schema=schemas.DELETE_CHAT_SESSIONS)
    @route_security.exclude
    def delete_sessions():
        """
        Delete a chat session.
        """

        user_id = utils.get_user_id_from_request(anonymous=True)
        if user_id is None:
            return responses.create_response(
                status_code=responses.CODE_400,
                message="User ID or Client IP not found from the request.",
            )

        session_id = request.args["session_id"]
        character_id = request.args["character_id"]

        query = {"id": session_id, "character_id": character_id, "created_by": user_id}

        session = ChatSession.count_documents(query)
        if not session:
            return responses.create_response(
                status_code=responses.CODE_404,
                payload={
                    "message": f"Cannot find a chat session with the id of '{session_id}' and character id of '{character_id}'."
                },
            )

        tasks.delete_chat_session.delay(query)

        return responses.create_response(
            payload={
                "message": "Session and its messages are now scheduled for deletion."
            }
        )

    @app.delete("/")
    @route_security.request_args_schema(schema=schemas.DELETE_CHAT)
    def delete_chat():
        """
        Delete a specific message.
        """

        user_id = utils.get_user_id_from_request()
        message_id = request.args["id"]

        message = Message.find_class({"created_by": user_id, "id": message_id})
        if message is None:
            return responses.create_response(
                status_code=responses.CODE_404,
                payload={
                    "message": f"Cannot find a message with the id of '{message_id}'."
                },
            )

        message.delete()
        return responses.create_response()

    return app
