import logging
import re
import time
from typing import TYPE_CHECKING, Generator, Optional

from flask import Blueprint, redirect, request
from library import responses, schemas, tasks, utils
from library.configlib import config
from library.security import route_security
from models.character import Character, CharacterParameters, FavoriteCharacter
from models.knowledge import Knowledge
from models.tags import Tag
from models.tweaks import Tweaks
from models.user import User

if TYPE_CHECKING:
    from ..app import App


logger = logging.getLogger(__name__)


# pylint: disable=unused-argument
def setup(server: "App") -> Blueprint:
    app = Blueprint("characters", __name__, url_prefix="/api/characters")

    route_security.patch(app, authentication_methods=["session", "api", "rapid-api"])

    @app.get("/tags")
    @server.limiter.exempt
    @route_security.exclude
    def get_tags():
        data = []
        tags: Generator[Tag, None, None] = Tag.find_classes({})

        for tag in tags:
            data.append(
                {
                    "name": tag.tag,
                    "characters": Character.count_documents(
                        {
                            "tags": {"$exists": True, "$elemMatch": {"$eq": tag.tag}},
                            "private": False,
                        }
                    ),
                }
            )

        data = [x for x in data if x["characters"] > 0]

        return responses.create_response(payload=data)

    @app.get("/render-character-avatar")
    @server.limiter.exempt
    @route_security.request_args_schema(schema=schemas.GET_RENDER_CHARACTER_AVATAR)
    @route_security.exclude
    def render_character_avatar():
        character_id = request.args["character_id"]
        character: Optional[Character] = Character.find_class({"id": character_id})
        if character is None:
            return responses.create_response(status_code=responses.CODE_404)

        if character.avatar_id:
            return redirect(f"/api/files/render-avatar?id={character.avatar_id}")
        elif character.image:
            return redirect(character.image)

        return responses.create_response(status_code=responses.CODE_404)

    @app.get("/details")
    @route_security.request_args_schema(schema=schemas.GET_CHARACTER_DETAILS)
    @route_security.exclude
    def get_character_details():
        """
        Get details about a specific character.
        """

        user_id = utils.get_user_id_from_request(anonymous=True)
        character_id = request.args["character_id"]
        character = Character.find_class({"id": character_id, "private": False})
        if character is None:
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

        character: Character
        bypass_definition_visibility = False
        if user_id == character.created_by:
            bypass_definition_visibility = True

        return responses.create_response(
            payload=character.to_json(
                bypass_definition_visibility=bypass_definition_visibility
            )
        )

    @app.post("/add-to-favorites")
    @route_security.request_args_schema(schema=schemas.POST_CHARACTERS_ADD_TO_FAVORITES)
    def add_to_favorites():
        """
        Add a character to your favorites.
        """

        user_id = utils.get_user_id_from_request()
        if user_id is None:
            return responses.create_response(status_code=responses.CODE_400)

        data = request.args
        character_id = data["id"]
        character: Optional[Character] = Character.find_class({"id": character_id})
        if character is None:
            return responses.create_response(status_code=responses.CODE_404)

        if FavoriteCharacter.count_documents(
            {"user_id": user_id, "character_id": character_id}
        ):
            return responses.create_response(status_code=responses.CODE_409)

        if character.private and character.created_by != user_id:
            return responses.create_response(status_code=responses.CODE_403)

        FavoriteCharacter(user_id=user_id, character_id=character.id).save()

        return responses.create_response()

    @app.delete("/remove-from-favorites")
    @route_security.request_args_schema(
        schema=schemas.DELETE_CHARACTERS_ADD_TO_FAVORITES
    )
    def remove_from_favorites():
        user_id = utils.get_user_id_from_request()
        if user_id is None:
            return responses.create_response(status_code=responses.CODE_400)

        data = request.args
        character_id = data["id"]
        character: Optional[Character] = Character.find_class({"id": character_id})
        if character is None:
            return responses.create_response(status_code=responses.CODE_404)

        fc = FavoriteCharacter.find_class(
            {"user_id": user_id, "character_id": character_id}
        )
        if not fc:
            return responses.create_response(status_code=responses.CODE_404)

        fc.delete()

        return responses.create_response()

    @app.get("/")
    @route_security.request_args_schema(schema=schemas.GET_CHARACTERS)
    @route_security.exclude
    def get_characters():
        """
        Get all of your characters or all publicly available characters.
        """

        page_size = int(request.args.get("page_size", 25))
        page = int(request.args.get("page", 1))

        my_characters = (
            request.args.get("my_characters", "False").lower() == "true"
            or request.args.get("private", "False").lower() == "true"
        )
        featured = request.args.get("featured", "False").lower() == "true"
        favorites = request.args.get("favorites", "False").lower() == "true"
        nsfw = request.args.get("nsfw", "disabled")
        tag = request.args.get("tag")

        sort = request.args.get("sort", "latest")
        q = request.args.get("q")
        user_id = utils.get_user_id_from_request()

        query = {"private": False}

        if favorites:
            favorite_ids = [
                x.character_id
                for x in FavoriteCharacter.find_classes({"user_id": user_id})
            ]
            query = {}
            query["id"] = {"$in": favorite_ids}

        if my_characters:
            query = {"created_by": user_id}

        if featured:
            query["featured"] = True

        if q:
            query["$and"] = [
                {
                    "$or": [
                        {"name": {"$regex": re.compile(q, re.IGNORECASE)}},
                        {"description": {"$regex": re.compile(q, re.IGNORECASE)}},
                    ]
                }
            ]

        if nsfw == "disabled":
            nsfw_filter = [{"nsfw": False}, {"nsfw": {"$exists": False}}]
            if "$and" not in query:
                query["$and"] = [{"$or": nsfw_filter}]
            else:
                query["$and"].append({"$or": nsfw_filter})
        elif nsfw == "only":
            query["nsfw"] = True

        sort_direction = -1
        sort_key = "_id"
        if sort == "uses":
            sort_key = "uses"

        sort_values = [(sort_key, sort_direction)]
        if tag:
            query["tags"] = {"$in": [tag]}
            sort_values.append(("tags_similarity", -1))

        logger.info(f"Querying characters with the query '{query}'")

        characters = [
            x.to_json(
                bypass_definition_visibility=True if user_id == x.created_by else False
            )
            for x in utils.paginate_mongoclass_cursor(
                Character.find_classes(query), page_size=page_size, page=page
            ).sort(sort_values)
        ]

        # Get documents count based on query to see how many pages there are
        total = Character.count_documents(query)

        return responses.create_paginated_response(
            objects=characters, page=page, page_size=page_size, total=total
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
                    "message": "You have reached your maximum amount of characters. Either upgrade to OptiTalk+ for just 4.99$/month to get unlimited messages and characters or delete your previous characters."
                },
            )

        # Get the real model name
        # model = data.get("model", "basic")
        model = "basic"  # Only the basic model is available
        model = config.model_mappings[model]
        kwargs = dict(
            created_by=user_id,
            name=data["name"],
            description=data["description"],
            parameters=CharacterParameters(model=model),
            personalities=data.get("personalities", []),
            favorite_words=data.get("favorite_words", []),
            example_exchanges=data.get("example_exchanges", []),
            private=data.get("private", False),
            image=data.get("image"),
            response_styles=data.get("response_styles", []),
            avatar_id=data.get("avatar_id"),
            public_description=data.get("public_description"),
            definition_visibility=data.get("definition_visibility", True),
            nsfw=data.get("nsfw", False),
            tags=data.get("tags", []),
            _moderated=True,
        )
        tweaks = data.get("tweaks")
        if tweaks:
            kwargs["tweaks"] = Tweaks(**tweaks)

        character = Character(**kwargs)
        character.save()
        logger.info(f"Created new character named '{character.name} ({character.id}).'")

        # Start saving the knowledge base
        knowledge_base = data.get("knowledge", [])

        st = time.perf_counter()
        for knowledge in knowledge_base:
            k = Knowledge(
                character_id=character.id, created_by=user_id, content=knowledge
            )

            try:
                k.update_embeddings()
            except Exception:
                logger.exception(f"Error updating embeddings for knowledge '{k.id}'.")

            k.save()

        et = time.perf_counter() - st
        tasks.log_time_took_metric.delay(
            name="save-full-knowledge-base",
            user_id=user_id,
            duration=et,
            character_id=character.id,
            ip_address=route_security.get_client_ip(),
        )

        return responses.create_response(
            payload=character.to_json(bypass_definition_visibility=True)
        )

    @app.get("/knowledge")
    @route_security.request_args_schema(schema=schemas.GET_CHARACTERS_KNOWLEDGE)
    @route_security.exclude
    def get_characters_knowledge():
        character_id = request.args["character_id"]
        page = int(request.args.get("page", "1"))
        page_size = int(request.args.get("page_size", "25"))

        query = {"character_id": character_id}

        knowledge = [
            x.to_json()
            for x in utils.paginate_mongoclass_cursor(
                Knowledge.find_classes(query), page_size=page_size, page=page
            )
        ]

        total = Knowledge.count_documents(query)
        return responses.create_paginated_response(
            objects=knowledge, page=page, page_size=page_size, total=total
        )

    @app.delete("/knowledge")
    @route_security.request_args_schema(schema=schemas.DELETE_CHARACTERS_KNOWLEDGE)
    def delete_characters_knowledge():
        id = request.args["id"]
        user_id = utils.get_user_id_from_request()
        knowledge = Knowledge.find_class({"id": id, "created_by": user_id})

        if knowledge is None:
            return responses.create_response(
                payload={"message": f"Can't find knowledge with ID of '{id}'."},
                status_code=responses.CODE_404,
            )

        knowledge.delete()
        return responses.create_response(status_code=responses.CODE_200)

    @app.patch("/knowledge")
    @route_security.request_json_schema(schema=schemas.PATCH_CHARACTERS_KNOWLEDGE)
    def patch_characters_knowledge():
        data = request.get_json()
        knowledge = data["knowledge_base"]

        user_id = utils.get_user_id_from_request()
        for item in knowledge:
            id = item.get("id")
            if id is None:
                k = Knowledge(
                    character_id=data["character_id"],
                    created_by=user_id,
                    content=item["content"],
                )
            else:
                k = Knowledge.find_class({"id": id, "created_by": user_id})
                if not k:
                    continue

            if k.content != item["content"] or id is None:
                k.content = item["content"]
                try:
                    k.update_embeddings()
                except Exception:
                    logger.exception(
                        f"Error updating embeddings for knowledge '{k.id}'."
                    )
                    return responses.create_response(
                        payload={
                            "message": "Error updating knowledge. Please try again."
                        },
                        status_code=responses.CODE_500,
                    )

                k.save()

        return responses.create_response()

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
                # model=config.model_mappings[data["model"]]
                model=config.model_mappings["basic"]
            )
            data.pop("model")

        for k, v in data.items():
            if k == "tweaks":
                for ik, iv in v.items():
                    setattr(character.tweaks, ik, iv)
            else:
                setattr(character, k, v)

            if k == "nsfw":
                setattr(character, "_moderated", True)

        character.save()
        return responses.create_response(
            payload=character.to_json(bypass_definition_visibility=True),
            status_code=responses.CODE_200,
        )

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
