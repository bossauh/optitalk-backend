import dataclasses
from typing import TYPE_CHECKING

from flask import Blueprint, request, send_file
from library import responses, schemas, utils
from library.exceptions import *
from library.security import route_security
from models.file import File
from PIL import Image

if TYPE_CHECKING:
    from ..app import App


def upload_file(type: str):
    if "file" not in request.files:
        return responses.create_response(status_code=responses.CODE_400)

    file = request.files["file"]
    if file.filename == "":
        return responses.create_response(status_code=responses.CODE_400)

    # Verify file is a image
    try:
        Image.open(file.stream)
    except IOError:
        return responses.create_response(status_code=responses.CODE_400)

    user_id = utils.get_user_id_from_request()
    if user_id is None:
        return responses.create_response(status_code=responses.CODE_404)

    f = File.from_file_like_object(
        file.stream,
        type=type,
        filename=file.filename,
        mimetype=file.mimetype,
        created_by=user_id,
    )

    if not f.uploaded:
        return responses.create_response(status_code=responses.CODE_500)

    return responses.create_response(dataclasses.asdict(f))


# pylint: disable=unused-argument
def setup(server: "App") -> Blueprint:
    app = Blueprint("files", __name__, url_prefix="/api/files")

    route_security.patch(app, authentication_methods=["session", "api"])

    @app.post("/upload-avatar")
    @route_security.exclude
    def upload_avatar():
        return upload_file("avatar")

    @app.get("/render-avatar")
    @server.limiter.exempt
    @route_security.request_args_schema(schemas.GET_RENDER_AVATAR)
    @route_security.exclude
    def render_avatar():
        id = request.args["id"]

        avatar = File.find_class(
            {"id": id, "type": "avatar", "uploaded": True, "private": False}
        )
        if avatar is None:
            return responses.create_response(status_code=responses.CODE_404)

        avatar: File

        return send_file(avatar.get_file(), mimetype=avatar.mimetype)

    @app.delete("/")
    @route_security.request_args_schema(schemas.DELETE_FILE)
    def delete_file():
        id = request.args["id"]

        user_id = utils.get_user_id_from_request()
        file = File.find_class({"id": id, "created_by": user_id})

        if user_id is None or file is None:
            return responses.create_response(status_code=responses.CODE_404)

        file: File
        return responses.create_response(payload={"status": file.delete_file()})

    return app
