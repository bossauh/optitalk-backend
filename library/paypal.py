import logging
import os
import time

import requests
from requests.auth import HTTPBasicAuth

logger = logging.getLogger(__name__)


class PayPalSDK:
    def __init__(self) -> None:
        self.mode = os.environ["PAYPAL_MODE"]
        self.client_id = os.environ["PAYPAL_CLIENT_ID"]
        self.client_secret = os.environ["PAYPAL_CLIENT_SECRET"]
        self.webhook_id = os.environ["PAYPAL_WEBHOOK_ID"]

        self.access_token = None
        self.expires_in = None

        if (
            self.client_id is None
            or self.client_secret is None
            or self.webhook_id is None
        ):
            raise ValueError("Missing PayPal credentials.")

    @property
    def base_url(self) -> str:
        if self.mode == "sandbox":
            return "https://api-m.sandbox.paypal.com"
        return "https://api-m.paypal.com"

    @property
    def headers(self) -> dict:
        if self.access_token is None or (
            self.expires_in is not None and time.time() >= self.expires_in
        ):
            self.update_access_token()

        return {"Authorization": f"Bearer {self.access_token}"}

    def update_access_token(self) -> str:
        url = self.base_url + "/v1/oauth2/token"
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        auth = HTTPBasicAuth(self.client_id, self.client_secret)

        r = requests.post(
            url, auth=auth, headers=headers, data={"grant_type": "client_credentials"}
        )
        r.raise_for_status()
        data = r.json()

        self.access_token = data["access_token"]
        self.expires_in = time.time() + (data["expires_in"] - 60)

        logger.info("Update PayPal access token.")

        return self.access_token

    def verify_webhook_signature(
        self,
        auth_algo: str,
        cert_url: str,
        transmission_id: str,
        transmission_sig: str,
        transmission_time: str,
        webhook: dict,
    ) -> bool:
        headers = self.headers
        url = self.base_url + "/v1/notifications/verify-webhook-signature"
        r = requests.post(
            url,
            json={
                "auth_algo": auth_algo,
                "cert_url": cert_url,
                "transmission_id": transmission_id,
                "transmission_sig": transmission_sig,
                "transmission_time": transmission_time,
                "webhook_id": self.webhook_id,
                "webhook_event": webhook,
            },
            headers=headers,
        )
        data = r.json()

        return data["verification_status"] == "SUCCESS"

    def cancel_subscription(self, id: str, reason: str) -> None:
        headers = self.headers
        url = self.base_url + f"/v1/billing/subscriptions/{id}/cancel"
        data = {"reason": reason}

        r = requests.post(url, json=data, headers=headers)
        r.raise_for_status()


paypal = PayPalSDK()
paypal.update_access_token()
