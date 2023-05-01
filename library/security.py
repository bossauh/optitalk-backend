import functools
import logging
from typing import Callable, Optional, Union

from flask import Blueprint, Flask, request, session, url_for
from models.user import Application, User
from voluptuous import Invalid, Schema

from library import responses, types, users, utils
from library.configlib import config

logger = logging.getLogger(__name__)


class RouteSecurity:
    """
    A route manager for flask's routes. This class' tasks is to secure API routes
    as well as provide utility tools/decorators to eliminate redundant functionalities
    such as creating a schema check for a request's json body.
    """

    def __init__(self) -> None:
        self.excluded = set()

    def patch(
        self,
        instance: Union[Flask, Blueprint],
        authentication_methods: types.AuthenticationMethods,
    ) -> None:
        """
        Patch a instance of `Flask` or `Blueprint` by creating a `before_request`
        function on the provided instance. The `before_request` function will be
        responsible for checking if the request is authenticated properly.

        Parameters
        ----------
        `instance` : Union[Flask, Blueprint]
            The instance to patch.
        `authentication_methods` : types.AuthenticationMethods
            A list of valid authentication methods to check for. This uses "or" rather than
            "and" meaning only one of the methods has to return True for the request
            to be considered authenticated.
        """

        # TODO: Use Redis for caching
        # TODO: Implement HMAC for the session based authentication

        def check_api() -> bool:
            authorization = request.authorization
            if authorization is None:
                return False

            application: Optional[Application] = Application.find_class(
                {"id": authorization.username}
            )
            if application is None:
                return False

            return application.api_key == authorization.password

        def check_session() -> bool:
            user_id: Optional[str] = session.get("user_id")
            if user_id is None:
                return False

            user_agent = session.get("user_agent")
            if user_agent != request.headers.get("User-Agent"):
                return False

            return bool(User.count_documents({"id": user_id}))

        def check_rapid_api() -> bool:
            # First check if the rapid api secret is present and correct

            if not utils.is_from_rapid_api():
                return False

            user_id = request.headers.get("X-Rapidapi-User")

            # Check if user exists
            if not User.count_documents(
                {
                    "account_type": "rapid-api",
                    "email": users.format_rapid_api_user(user_id),
                }
            ):
                users.register_user(
                    email=user_id, password=user_id, account_type="rapid-api"
                )

            return True

        authentication_methods_mapping = {
            "rapid-api": check_rapid_api,
            "session": check_session,
            "api": check_api,
        }

        @instance.before_request
        def before_request():
            if request.endpoint in self.excluded:
                return

            client_ip = self.get_client_ip()

            for method in authentication_methods:
                if authentication_methods_mapping[method]():
                    logger.info(
                        f"Request to '{url_for(request.endpoint)}' from '{client_ip}' with authentication method(s) '{', '.join(authentication_methods)}' is authenticated."
                    )
                    return

            logger.warning(
                f"Request to '{url_for(request.endpoint)}' from '{client_ip}' with authentication method(s) '{', '.join(authentication_methods)}' is NOT authenticated."
            )
            return responses.create_response(status_code=responses.CODE_401)

    def exclude(self, func: Callable) -> Callable:
        """
        A decorator that excludes a route from requiring a valid Authorization
        header to access.
        """

        endpoint = ".".join(f"{func.__module__}.{func.__name__}".split(".")[1:])

        logger.info(f"Added {endpoint} to excluded routes for authorization.")
        self.excluded.add(endpoint)
        return func

    def get_client_ip(self) -> Optional[str]:
        """
        Returns the request's IP address by attempting to check multiple areas where
        the IP address can reside.

        If it still can't find the IP address, a `None` is returned.
        """

        return request.headers.get("X-Forwarded-For", "").split(",")[
            0
        ] or request.headers.get("Remote-Addr", request.remote_addr)

    def request_args_schema(self, schema: Schema) -> Callable:
        """
        Similar to `self.request_json_schema` but for Query Parameters via `request.args`.
        """

        def decorator(func: Callable):
            @functools.wraps(func)
            def inner(*args, **kwargs):
                try:
                    schema(request.args.to_dict())
                except Invalid as e:
                    errors = {"message": e.msg, "paths": {}}

                    for path in e.path:
                        errors["paths"][str(path)] = type(path).__name__

                    return responses.create_response(
                        payload=errors,
                        message="IncorrectQueryParmeters",
                        status_code=responses.CODE_400,
                    )

                return func(*args, **kwargs)

            return inner

        return decorator

    def request_json_schema(self, schema: Schema) -> Callable:
        """
        A decorator that validates the JSON body of a request sent to the decorated route against the provided schema. If the request data is invalid, a `IncorrectJSONBody`
        is returned as a error response.
        """

        def decorator(func: Callable):
            @functools.wraps(func)
            def inner(*args, **kwargs):
                try:
                    schema(request.get_json(silent=True))
                except Invalid as e:
                    errors = {"message": e.msg, "paths": {}}

                    for path in e.path:
                        errors["paths"][str(path)] = type(path).__name__

                    return responses.create_response(
                        payload=errors,
                        message="IncorrectJSONBody",
                        status_code=responses.CODE_400,
                    )

                return func(*args, **kwargs)

            return inner

        return decorator


route_security = RouteSecurity()
