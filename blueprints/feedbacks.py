from typing import TYPE_CHECKING, Optional

from flask import Blueprint, request, session
from library import responses, schemas, utils
from library.exceptions import *
from library.security import route_security
from models.feedback import InlineFeedback
from models.message import Message

if TYPE_CHECKING:
    from ..app import App


# pylint: disable=unused-argument
def setup(server: "App") -> Blueprint:
    app = Blueprint("feedbacks", __name__, url_prefix="/api/feedbacks")

    route_security.patch(app, authentication_methods=["session"])

    @app.post("/inline")
    @server.limiter.limit("5/minute")
    @route_security.request_json_schema(schemas.POST_INLINE_FEEDBACK)
    @route_security.exclude
    def post_inline_feedback():
        data = request.get_json()
        user_id = utils.get_user_id_from_request(anonymous=True)

        if user_id is None:
            return responses.create_response(status_code=responses.CODE_403)

        message_id = data.pop("message_id", None)
        completion_id = None

        # Attempt to get the completion id
        if message_id:
            message: Optional[Message] = Message.find_class({"id": message_id})
            if message:
                completion_id = message.completion_id

        feedback = InlineFeedback(
            created_by=user_id,
            anonymous=not bool(session.get("user_id")),
            message_id=message_id,
            completion_id=completion_id,
            **data
        )
        feedback.save()

        return responses.create_response()

    return app
