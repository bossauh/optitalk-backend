import logging
from typing import TYPE_CHECKING

from flask import Blueprint, abort, request
from flask_socketio import join_room, leave_room
from library import responses, schemas
from library.security import route_security
from library.socketio import socketio

if TYPE_CHECKING:
    from ..app import App


logger = logging.getLogger(__name__)

SECRET_TOKEN = "387bf3c1-ec5a-4887-a05d-1d134b60f55c"


# pylint: disable=unused-argument
def setup(server: "App") -> Blueprint:
    app = Blueprint("tasks", __name__, url_prefix="/api/tasks")

    @app.before_request
    def restrict_to_localhost():
        token = request.headers.get("X-Secret-Token")
        if token != SECRET_TOKEN:
            abort(403)

    @app.post("/session-auto-labeled")
    @route_security.request_json_schema(schema=schemas.POST_TASKS_SESSION_AUTO_LABELED)
    def post_session_auto_labeled():
        data = request.get_json()

        socketio.emit(
            "session-auto-labeled",
            {"id": data["session_id"], "new_name": data["new_name"]},
            room=data["user_id"],
        )

        return responses.create_response()

    @app.post("/user-data-transferred")
    @route_security.request_json_schema(schema=schemas.POST_TASKS_USER_DATA_TRANSFERRED)
    def post_user_data_transferred():
        data = request.get_json()
        socketio.emit("user-data-transferred", room=data["user_id"])

        return responses.create_response()

    @socketio.on("join-room")
    def on_join_room(id):
        join_room(id)

    @socketio.on("leave-room")
    def on_leave_room(id):
        leave_room(id)

    return app
