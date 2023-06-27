import logging
import pprint
from typing import TYPE_CHECKING, Optional

from flask import Blueprint, request
from library import responses, schemas, utils
from library.exceptions import *
from library.paypal import paypal
from library.security import route_security
from library.socketio import socketio
from models.user import User

if TYPE_CHECKING:
    from ..app import App


logger = logging.getLogger(__name__)


# pylint: disable=unused-argument
def setup(server: "App") -> Blueprint:
    app = Blueprint("payments", __name__, url_prefix="/api/payments")

    route_security.patch(app, authentication_methods=["api", "session"])

    @app.post("/add-subscription-id")
    @route_security.request_json_schema(schemas.POST_ADD_SUBSCRIPTION_ID)
    def add_subscription_id():
        data = request.get_json()
        user_id = utils.get_user_id_from_request()

        if user_id is None:
            return responses.create_response(status_code=responses.CODE_400)

        user = User.find_class({"id": user_id})
        user: User
        user.plan.subscription_id = data["id"]
        user.save()

        return responses.create_response()

    @app.post("/paypal/cancel")
    @route_security.request_json_schema(schemas.POST_SUBSCRIPTION_CANCEL)
    def paypal_cancel_subscription():
        user_id = utils.get_user_id_from_request()
        user: Optional[User] = User.find_class({"id": user_id})
        if user is None:
            return responses.create_response(status_code=responses.CODE_404)

        if user.plan.subscription_id is None:
            return responses.create_response(status_code=responses.CODE_404)

        data = request.get_json()

        paypal.cancel_subscription(id=user.plan.subscription_id, reason=data["reason"])
        user.plan.subscription_id = None
        user.plan.id = "free"
        user.save()

        return responses.create_response()

    @app.post("/paypal/webhook")
    @route_security.exclude
    def paypal_billing_plan_activated():
        data = request.json
        if data is None:
            return responses.create_response(status_code=responses.CODE_400)

        # Verify the webhook signature
        verified = paypal.verify_webhook_signature(
            auth_algo=request.headers["PAYPAL-AUTH-ALGO"],
            cert_url=request.headers["PAYPAL-CERT-URL"],
            transmission_id=request.headers["PAYPAL-TRANSMISSION-ID"],
            transmission_sig=request.headers["PAYPAL-TRANSMISSION-SIG"],
            transmission_time=request.headers["PAYPAL-TRANSMISSION-TIME"],
            webhook=data,
        )
        if not verified:
            logger.error(f"Invalid PayPal webhook: {pprint.pformat(data)}")
            return responses.create_response(status_code=responses.CODE_400)

        logger.debug(f"PayPal Webhook: {pprint.pformat(data)}")

        event_type = data["event_type"]
        subscription_id = data["resource"]["id"]

        if event_type == "BILLING.SUBSCRIPTION.CREATED":
            return responses.create_response(status_code=responses.CODE_200)

        user = User.find_class({"plan.data.subscription_id": subscription_id})
        if user is None:
            return responses.create_response(status_code=responses.CODE_200)

        user: User

        if event_type in [
            "BILLING.SUBSCRIPTION.ACTIVATED",
            "BILLING.SUBSCRIPTION.RE-ACTIVATED",
        ]:
            user.plan.id = "basic"
            logger.info(f"Subscription from '{user}' is now active.")
            socketio.emit("user-subscription-activated", room=user.id)
        elif event_type in [
            "BILLING.SUBSCRIPTION.SUSPENDED",
            "BILLING.SUBSCRIPTION.PAYMENT_FAILED",
        ]:
            user.plan.id = "free"
            logger.error(f"Subscription plan from '{user}' has become inactive.")
            socketio.emit("user-subscription-paused", room=user.id)
        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            if user.plan.subscription_id:
                socketio.emit("user-subscription-cancelled", room=user.id)

            user.plan.id = "free"
            user.plan.subscription_id = None

            logger.info(f"Subscription plan from '{user}' has been cancelled.")

        user.save()

        return responses.create_response()

    return app
