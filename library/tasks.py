import logging
import os
import pprint
import time

from dotenv import load_dotenv

if not os.getenv("PRODUCTION"):
    load_dotenv()
    logging.info("Loaded development .env file.")

from typing import Generator, Optional

from celery import Celery
from models.message import Message
from models.open_ai import ChatCompletion, Completion
from models.session import ChatSession
from models.state import UserPlanState
from models.user import Application

from library.gpt import gpt

app = Celery(
    "optitalk.tasks",
    broker=os.environ["CELERY_BROKER_URI"],
    backend=os.environ["CELERY_BACKEND_URI"],
)
logger = logging.getLogger(__name__)


@app.task
def log_chat_completion(**attributes):
    completion = ChatCompletion(**attributes)
    completion.save()

    logger.info(f"Logged chat completion: {pprint.pformat(completion)}")


@app.task
def log_text_completion(**attributes):
    completion = Completion(**attributes)
    completion.save()

    logger.info(f"Logged text completion: {pprint.pformat(completion)}")


@app.task
def insert_message(**attributes):
    message = Message(**attributes)
    message.save()

    messages_count = Message.count_documents(
        {
            "session_id": message.session_id,
            "created_by": message.created_by,
            "character_id": message.character_id,
        }
    )
    if messages_count == 2:
        if not ChatSession.count_documents(
            {
                "id": message.session_id,
                "name_changed": True,
                "character_id": message.character_id,
                "created_by": message.created_by,
            }
        ):
            logger.info(
                "Messages count is 2, auto naming its session since it's not yet manually named."
            )
            auto_label_message.delay(
                session_id=message.session_id,
                created_by=message.created_by,
                character_id=message.character_id,
            )

    logger.info(f"Saved message: {pprint.pformat(message)}")


@app.task
def insert_application(**attributes):
    application = Application(**attributes)
    application.save()

    logger.info(f"Created application: {pprint.pformat(application)}")


@app.task
def delete_chat_session(query):
    session: Optional[ChatSession] = ChatSession.find_class(query)
    if session is None:
        return

    deleted = 0
    for message in session.messages():
        message.delete()
        deleted += 1

    session.delete()
    logger.info(f"Deleted session '{session.id}' and {deleted} message(s) from it.")


@app.task
def auto_label_message(session_id: str, created_by: str, character_id: str):
    system_message = """
You are a tool whose job is to give a conversation exchange a labeled topic title. You will respond only with the labeled topic title and nothing more.

Example Input:
User: yo
Deadpool: What's up what's up are you my buddy Haha! How ya doing mate?

Example Response:
Casual greetings from deadpool
"""

    messages: list[Message] = list(
        Message.find_classes(
            {
                "session_id": session_id,
                "created_by": created_by,
                "character_id": character_id,
            }
        )
        .sort("_id", -1)
        .limit(4)
    )
    messages.reverse()

    prompt = []
    for message in messages:
        prompt.append(f"{message.role.title}: {message.content}")
    prompt = "\n".join(prompt)

    session: Optional[ChatSession] = ChatSession.find_class(
        {"id": session_id, "created_by": created_by, "character_id": character_id}
    )
    if session is None:
        return

    response = gpt.create_chat_completion(
        system=system_message, messages=[{"role": "user", "content": prompt}]
    )
    label = response[0].result

    session.name_changed = True
    session.name = label
    session.save()


@app.task
def increase_model_requests_state(id: str, model: str, value: int):
    state: Optional[UserPlanState] = UserPlanState.find_class({"id": id})
    if state is None:
        return

    if model in ("gpt-3.5-turbo", "gpt-4"):
        if state.basic_model_requests == 0:
            state.timestamp = time.time()

        state.basic_model_requests += 1
        model_type = "basic"
    else:
        if state.advanced_model_requests == 0:
            state.timestamp = time.time()

        state.advanced_model_requests += 1
        model_type = "advanced"

    logger.info(
        f"Incremented request counter of model '{model_type}' for user with ID: {id}"
    )

    state.save()


@app.task
def reset_users_state_monthly_cap():
    states: Generator[UserPlanState, None, None] = UserPlanState.find_classes({})
    for state in states:
        if time.time() - state.timestamp >= 2.628e6:
            state.advanced_model_requests = 0
            state.basic_model_requests = 0
            state.timestamp = time.time()
            state.save()

            logger.info(f"Reset monthly cap for user '{state.id}'")


@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        schedule=10.0,
        sig=reset_users_state_monthly_cap.s(),
        name="reset users monthly cap",
    )
