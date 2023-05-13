import logging
from typing import TYPE_CHECKING

from flask import Blueprint, abort, request
from flask_socketio import join_room, leave_room
from library import responses, schemas
from library.security import route_security

if TYPE_CHECKING:
    from ..app import App


logger = logging.getLogger(__name__)


# pylint: disable=unused-argument
def setup(server: "App") -> Blueprint:
    app = Blueprint("tasks", __name__, url_prefix="/api/tasks")

    @app.before_request
    def restrict_to_localhost():
        if not request.remote_addr.startswith("127.0.0.1"):
            abort(403)

    @app.post("/session-auto-labeled")
    @route_security.request_json_schema(schema=schemas.POST_TASKS_SESSION_AUTO_LABELED)
    def post_session_auto_labeled():
        data = request.get_json()

        server.socket.emit(
            "session-auto-labeled",
            {"id": data["session_id"], "new_name": data["new_name"]},
            room=data["user_id"],
        )

        return responses.create_response()

    @app.post("/user-data-transferred")
    @route_security.request_json_schema(schema=schemas.POST_TASKS_USER_DATA_TRANSFERRED)
    def post_user_data_transferred():
        data = request.get_json()
        server.socket.emit("user-data-transferred", room=data["user_id"])

        return responses.create_response()

    @server.socket.on("join-room")
    def on_join_room(id):
        join_room(id)

    @server.socket.on("leave-room")
    def on_leave_room(id):
        leave_room(id)

    return app
