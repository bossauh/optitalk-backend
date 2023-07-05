import dataclasses
from typing import TYPE_CHECKING, Optional

import bcrypt
from flask import Blueprint, request, session
from library import responses, schemas, users, utils
from library.exceptions import *
from library.security import route_security
from models.character import Character
from models.message import Message
from models.state import UserPlanState
from models.user import Application, User

if TYPE_CHECKING:
    from ..app import App


# pylint: disable=unused-argument
def setup(server: "App") -> Blueprint:
    app = Blueprint("users", __name__, url_prefix="/api/users")

    route_security.patch(app, authentication_methods=["session", "api"])

    @app.get("/logout")
    def logout():
        """
        Logout from flask's session.
        """

        session.pop("user_id", None)

        return responses.create_response()

    @app.patch("/display-name")
    @server.limiter.limit("1/second")
    @route_security.request_json_schema(schema=schemas.PATCH_DISPLAY_NAME)
    def change_display_name():
        user_id = utils.get_user_id_from_request()
        user: Optional[User] = User.find_class({"id": user_id})
        if user is None:
            return responses.create_response(status_code=responses.CODE_400)

        data = request.get_json()
        user.display_name = data["name"]
        user.display_name_changed = True
        user.save()

        return responses.create_response()

    @app.post("/login")
    @route_security.request_json_schema(schema=schemas.POST_USERS_LOGIN)
    @route_security.exclude
    def login():
        """
        Login using flask's session.
        """

        data: dict = request.json
        user: Optional[User] = User.find_class({"email": data["email"]})
        if user is None:
            return responses.create_response(status_code=responses.CODE_403)

        if not bcrypt.checkpw(data["password"].encode(), user.password):
            return responses.create_response(status_code=responses.CODE_403)

        users.authorize_session(user.id)

        return responses.create_response()

    @app.get("/applications")
    def get_applications():
        """
        Retrieve the applications of the user.
        """

        user_id = utils.get_user_id_from_request()
        applications = [
            dataclasses.asdict(x)
            for x in Application.find_classes({"user_id": user_id})
        ]
        return responses.create_response(payload=applications)

    @app.post("/")
    @route_security.request_json_schema(schema=schemas.POST_USERS)
    @route_security.exclude
    def post_user():
        """
        Register a new user to OptiTalk.
        """

        data: dict = request.json

        try:
            user = users.register_user(**data)
        except AccountAlreadyExists as e:
            return responses.create_response(
                status_code=responses.CODE_409, exception=e
            )
        except Exception as e:
            return responses.create_response(exception=e)

        return responses.create_response(payload=user.to_json())

    @app.get("/is-authenticated")
    def is_authenticated():
        """
        Check if the incoming request is authenticated or not. This checks via the session
        as well as the Authorization header and also returns additional information
        about the user.
        """

        user_id = utils.get_user_id_from_request()
        user = User.find_class({"id": user_id})

        return responses.create_response(payload=user.to_json())

    @app.get("/ip-address")
    @route_security.exclude
    def get_ip_address():
        """
        Return the request's IP Address.
        """

        return responses.create_response(payload=route_security.get_client_ip())

    @app.get("/details")
    def get_details():
        """
        Returns details about a user's account.
        """

        user_id = utils.get_user_id_from_request()
        user: User = User.find_class({"id": user_id})
        user.save()

        plan = user.plan
        plan_state: UserPlanState = UserPlanState.find_class({"id": user_id})
        if plan_state is None:
            plan_state = UserPlanState(id=user_id)
            plan_state.save()

        data = {
            "email": user.email,
            "display_name": user.display_name,
            "admin": user.admin,
            "plan": plan.id,
            "plan_name": plan.name,
            "created_at": user.created_at,
        }
        limits = {
            "messages": {
                "limit": plan.max_basic_model_requests_per_hour,
                "current": plan_state.basic_model_requests,
            },
            "characters": {
                "limit": plan.max_characters,
                "current": Character.count_documents({"created_by": user_id}),
            },
        }

        if plan.id == "basic":
            limits["characters"]["limit"] = -1
            limits["messages"]["limit"] = -1

        statistics = {"messages": Message.count_documents({"created_by": user_id})}

        return responses.create_response(
            {"basic": data, "limits": limits, "statistics": statistics}
        )

    return app
