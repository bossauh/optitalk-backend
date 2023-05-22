import logging
import re
from typing import TYPE_CHECKING, Optional

from flask import Blueprint, request
from library import responses, schemas, utils
from library.configlib import config
from library.security import route_security
from models.character import Character, CharacterParameters
from models.user import User

if TYPE_CHECKING:
    from ..app import App


logger = logging.getLogger(__name__)


# pylint: disable=unused-argument
def setup(server: "App") -> Blueprint:
    app = Blueprint("characters", __name__, url_prefix="/api/characters")

    route_security.patch(app, authentication_methods=["session", "api", "rapid-api"])

    @app.get("/details")
    @route_security.request_args_schema(schema=schemas.GET_CHARACTER_DETAILS)
    @route_security.exclude
    def get_character_details():
        """
        Get details about a specific character.
        """

        character_id = request.args["character_id"]
        character = Character.find_class({"id": character_id, "private": False})
        if character is None:
            user_id = utils.get_user_id_from_request(anonymous=True)
            character = Character.find_class(
                {"id": character_id, "created_by": user_id}
            )
            if character is None:
                return responses.create_response(
                    status_code=responses.CODE_404,
                    payload={
                        "message": f"Cannot find a character with the ID of '{character_id}'."
                    },
                )

        return responses.create_response(payload=character.to_json())

    @app.get("/")
    @route_security.request_args_schema(schema=schemas.GET_CHARACTERS)
    @route_security.exclude
    def get_characters():
        """
        Get all of your characters or all publicly available characters.
        """

        page_size = int(request.args.get("page_size", 25))
        page = int(request.args.get("page", 1))

        my_characters = request.args.get("my_characters", "False").lower() == "true" or request.args.get("private", "False").lower() == "true"
        featured = request.args.get("featured", "False").lower() == "true"
        sort = request.args.get("sort", "latest")
        q = request.args.get("q")

        query = {"private": False}

        if my_characters:
            user_id = utils.get_user_id_from_request()
            query = {"created_by": user_id}

        if featured:
            query["featured"] = True

        if q:
            query["$or"] = [
                {"name": {"$regex": re.compile(q, re.IGNORECASE)}},
                {"description": {"$regex": re.compile(q, re.IGNORECASE)}},
            ]

        sort_direction = -1
        sort_key = "_id"

        if sort == "uses":
            sort_key = "uses"

        logger.info(f"Querying characters with the query '{query}'")

        characters = [
            x.to_json()
            for x in utils.paginate_mongoclass_cursor(
                Character.find_classes(query), page_size=page_size, page=page
            ).sort(sort_key, sort_direction)
        ]

        return responses.create_paginated_response(
            objects=characters, page=page, page_size=page_size
        )

    @app.post("/")
    @route_security.request_json_schema(schema=schemas.POST_CHARACTERS)
    def post_characters():
        """
        Create a new character.
        """

        user_id = utils.get_user_id_from_request()
        user: Optional[User] = User.find_class({"id": user_id})
        if user is None:
            return responses.create_response(status_code=responses.CODE_500)

        data: dict = request.json
        is_from_rapid_api = utils.is_from_rapid_api()

        user_characters = Character.count_documents({"created_by": user_id})
        if user_characters >= user.plan.max_characters and not is_from_rapid_api:
            return responses.create_response(
                status_code=responses.CODE_409,
                payload={
                    "message": "You have reached your maximum amount of characters. Either upgrade to a higher plan or delete some of your old characters."
                },
            )

        # Get the real model name
        model = data.get("model", "basic")
        model = config.model_mappings[model]

        character = Character(
            created_by=user_id,
            name=data["name"],
            description=data["description"],
            parameters=CharacterParameters(model=model),
            personalities=data.get("personalities", []),
            favorite_words=data.get("favorite_words", []),
            example_exchanges=data.get("example_exchanges", []),
            private=data.get("private", False),
            image=data.get("image"),
            knowledge=data.get("knowledge", []),
            response_styles=data.get("response_styles", []),
        )
        character.save()

        return responses.create_response(payload=character.to_json())

    @app.patch("/")
    @route_security.request_json_schema(schema=schemas.PATCH_CHARACTERS)
    def patch_characters():
        """
        Edit one of your existing characters.
        """

        user_id = utils.get_user_id_from_request()
        character_id = request.args.get("character_id")

        if character_id is None:
            return responses.create_response(
                status_code=responses.CODE_400_MISSING_REQUIRED_PARAMETERS,
                payload={"character_id": "str"},
            )

        query = {"created_by": user_id, "id": character_id}
        character: Optional[Character] = Character.find_class(query)

        if character is None:
            return responses.create_response(
                status_code=responses.CODE_404,
                payload={
                    "message": f"Cannot find a character with the ID of '{character_id}'."
                },
            )

        data: dict = request.json
        if "model" in data:
            data["parameters"] = CharacterParameters(
                model=config.model_mappings[data["model"]]
            )
            data.pop("model")

        for k, v in data.items():
            setattr(character, k, v)

        character.save()
        return responses.create_response(status_code=responses.CODE_200)

    @app.delete("/")
    def delete_characters():
        """
        Delete a character by using its id.
        """

        user_id = utils.get_user_id_from_request()
        character_id = request.args.get("character_id")

        if character_id is None:
            return responses.create_response(
                status_code=responses.CODE_400_MISSING_REQUIRED_PARAMETERS,
                payload={"character_id": "str"},
            )

        query = {"created_by": user_id, "id": character_id}
        character: Optional[Character] = Character.find_class(query)

        if character is None:
            return responses.create_response(
                status_code=responses.CODE_404,
                payload={
                    "message": f"Cannot find a character with the ID of '{character_id}'."
                },
            )

        character.delete()
        return responses.create_response(status_code=responses.CODE_200)

    return app
