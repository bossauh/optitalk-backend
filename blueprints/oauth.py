import logging
import os
from typing import TYPE_CHECKING

import google.auth.transport.requests
import requests
from flask import Blueprint, redirect, request, session
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
google_flow = Flow.from_client_secrets_file(
    client_secrets_file=os.path.join(os.getcwd(), "data", "google-client-secret.json"),
    scopes=[
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
        "openid",
    ],
    redirect_uri="http://127.0.0.1:5000/oauth/google-callback",
)

# TODO: Remove in production
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


# pylint: disable=unused-argument
def setup(server: "App") -> Blueprint:
    app = Blueprint("oauth", __name__, url_prefix="/oauth")

    @app.get("/google-oauth")
    def google_oauth():
        authorization_url, state = google_flow.authorization_url()
        session["google-oauth-state"] = state
        return redirect(authorization_url)

    @app.get("/google-callback")
    def google_oauth_callback():
        google_flow.fetch_token(authorization_response=request.url)
        time.sleep(1)
        if session["google-oauth-state"] != request.args["state"]:
            return responses.create_response(status_code=responses.CODE_500)

        credentials = google_flow.credentials
        request_session = requests.session()
        cached_session = cachecontrol.CacheControl(request_session)  # type: ignore
        token_request = google.auth.transport.requests.Request(session=cached_session)

        id_info = id_token.verify_oauth2_token(
            id_token=credentials._id_token,
            request=token_request,
            audience=GOOGLE_CLIENT_ID,
        )

        redirect_url = "/dashboard"
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

        session["user_id"] = user.id

        return redirect(redirect_url)

    return app
