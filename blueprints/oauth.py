import logging
import os
import time
from typing import TYPE_CHECKING

import google.auth.transport.requests
import requests
from flask import Blueprint, make_response, redirect, request, session
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from library import responses, users
from library.exceptions import *
from models.user import User
from pip._vendor import cachecontrol

if TYPE_CHECKING:
    from ..app import App


logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = (
    "642032225194-h2pemvbhf6ueuiscfgdthsh9dqm399u5.apps.googleusercontent.com"
)


def get_flow():
    google_flow = Flow.from_client_secrets_file(
        client_secrets_file=os.path.join(
            os.getcwd(), "data", "google-client-secret.json"
        ),
        scopes=[
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
            "openid",
        ],
        redirect_uri="https://optitalk.net/oauth/google-callback"
        if os.getenv("PRODUCTION")
        else "http://127.0.0.1:5000/oauth/google-callback",
    )
    return google_flow


# TODO: Remove in production
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


# pylint: disable=unused-argument
def setup(server: "App") -> Blueprint:
    app = Blueprint("oauth", __name__, url_prefix="/oauth")

    @app.get("/google-oauth")
    def google_oauth():
        google_flow = get_flow()
        authorization_url, state = google_flow.authorization_url()

        response = make_response(redirect(authorization_url))
        response.set_cookie("google-oauth-state", state)
        time.sleep(1)

        return response

    @app.get("/google-callback")
    def google_oauth_callback():
        google_flow = get_flow()
        time.sleep(1)

        state = request.cookies.get("google-oauth-state")

        if state != request.args["state"]:
            return responses.create_response(status_code=responses.CODE_500)

        fetch_attempts = 0
        while fetch_attempts < 4:
            try:
                google_flow.fetch_token(authorization_response=request.url)
                break
            except Exception:
                fetch_attempts += 1
                if fetch_attempts >= 4:
                    return (
                        "A unknown error has occurred. Please try again by going back to optitalk.net and signing up again.",
                        500,
                    )
                time.sleep(0.3)

        time.sleep(1)

        credentials = google_flow.credentials
        request_session = requests.session()
        cached_session = cachecontrol.CacheControl(request_session)  # type: ignore
        token_request = google.auth.transport.requests.Request(session=cached_session)

        verify_attempts = 0
        id_info: dict = {}
        while verify_attempts < 4:
            try:
                id_info = id_token.verify_oauth2_token(
                    id_token=credentials._id_token,
                    request=token_request,
                    audience=GOOGLE_CLIENT_ID,
                )
                break
            except Exception:
                verify_attempts += 1
                if fetch_attempts >= 4:
                    return (
                        "A unknown error has occurred. Please try again by going back to optitalk.net and signing up again.",
                        500,
                    )
                time.sleep(0.3)

        redirect_url = "/"
        try:
            user = users.register_user(
                email=id_info["email"],
                password=id_info["sub"],
                account_type="google",
                display_name=id_info["name"],
            )
        except AccountAlreadyExists:
            logger.warning(f"Account '{id_info['email']}' already exists.")
            user = User.find_class({"email": id_info["email"]})

        user.plan.verified = True
        user.save()

        users.authorize_session(user.id)

        return redirect(redirect_url)

    return app
