import logging
import statistics
from typing import TYPE_CHECKING

from flask import Blueprint
from library import responses, utils
from library.gpt import gpt
from library.security import route_security
from models.open_ai import ChatCompletion, Completion
from models.user import User

if TYPE_CHECKING:
    from ..app import App


logger = logging.getLogger(__name__)


# pylint: disable=unused-argument
def setup(server: "App") -> Blueprint:
    app = Blueprint("metrics", __name__, url_prefix="/api/metrics")

    route_security.patch(app, authentication_methods=["session", "api"])

    @app.get("/completions")
    def get_tokens_usage():
        """
        Retrieve all information about OpenAI completions.

        TODO: Majority of how I collect the data in here is terribly un-optimized. So work
        on a system for collecting these metrics more efficiently. Perhaps a celery beat
        task that calculates these metrics every X seconds?
        """

        user_id = utils.get_user_id_from_request()
        user = User.find_class({"id": user_id})

        if not user.admin:
            return "Not Found", 404

        chat_completion_tokens = []
        text_completion_tokens = []

        chat_completion_costs = []
        text_completion_costs = []

        chat_response_times = []
        text_response_times = []

        chat_models = []
        text_models = []

        for chat_completion in ChatCompletion.find_classes({}):
            chat_completion_tokens.append(chat_completion.total_tokens)
            chat_completion_costs.append(
                gpt.calculate_completion_cost(
                    chat_completion.model, chat_completion.total_tokens
                )
            )
            chat_response_times.append(chat_completion.tt)
            chat_models.append(chat_completion.model)

        for text_completion in Completion.find_classes({}):
            text_completion_tokens.append(text_completion.total_tokens)
            text_completion_costs.append(
                gpt.calculate_completion_cost(
                    text_completion.model, text_completion.total_tokens
                )
            )
            text_response_times.append(text_completion.tt)
            text_models.append(text_completion.model)

        payload = {
            "chat": {
                "tokens": {
                    "average": statistics.mean(chat_completion_tokens),
                    "minimum": min(chat_completion_tokens),
                    "maximum": max(chat_completion_tokens),
                    "total": sum(chat_completion_tokens),
                },
                "cost": {
                    "average": statistics.mean(chat_completion_costs),
                    "minimum": min(chat_completion_costs),
                    "maximum": max(chat_completion_costs),
                    "total": sum(chat_completion_costs),
                },
                "response_times": {
                    "average": statistics.mean(chat_response_times),
                    "minimum": min(chat_response_times),
                    "maximum": max(chat_response_times),
                },
                "models": {
                    "least_used": min(chat_models, key=chat_models.count),
                    "most_used": max(chat_models, key=chat_models.count),
                },
            },
            "text": {
                "tokens": {
                    "average": statistics.mean(text_completion_tokens),
                    "minimum": min(text_completion_tokens),
                    "maximum": max(text_completion_tokens),
                    "total": sum(text_completion_tokens),
                },
                "cost": {
                    "average": statistics.mean(text_completion_costs),
                    "minimum": min(text_completion_costs),
                    "maximum": max(text_completion_costs),
                    "total": sum(text_completion_costs),
                },
                "response_times": {
                    "average": statistics.mean(text_response_times),
                    "minimum": min(text_response_times),
                    "maximum": max(text_response_times),
                },
                "models": {
                    "least_used": min(text_models, key=chat_models.count),
                    "most_used": max(text_models, key=chat_models.count),
                },
            },
        }

        return responses.create_response(payload=payload)

    return app
