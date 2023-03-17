import logging
from typing import Optional

from models.user import User

from library import tasks, types
from library.exceptions import *

logger = logging.getLogger(__name__)


def register_user(
    email: str,
    password: str,
    account_type: types.AccountType = "default",
    display_name: Optional[str] = None,
) -> User:
    """
    Register a new user to OptiTalk.

    Raises
    ------
    `AccountAlreadyExists` :
        Raised when you're trying to create an account but an account with the same
        email already exists.

    Returns
    -------
    `User` :
        The newly created `User` object.
    """

    if User.count_documents({"email": email}):
        raise AccountAlreadyExists(email=email)

    user = User(
        email=email,
        display_name=display_name,
        password=password,
        account_type=account_type,
    )
    user.save()
    tasks.insert_application.delay(
        name="Default",
        user_id=user.id,
        description="The default application created on account creation.",
    )

    logger.info(f"Registered user '{user.id}' ({user.email}).")
    return user
