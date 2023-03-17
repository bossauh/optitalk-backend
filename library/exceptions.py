class OptitalkException(Exception):
    pass


class UserNotFound(OptitalkException):
    """
    Raised when the user is not found.
    """


class AccountAlreadyExists(OptitalkException):
    """
    Raised when you're trying to create an account but an account with the same
    email already exists.
    """

    def __init__(self, email: str, *args, **kwargs) -> None:
        self.email = email
        super().__init__(*args, **kwargs)


class ModelRequestsLimitExceeded(OptitalkException):
    """
    Raised when the user has exceeded their requests limit.
    """

    def __init__(self, model: str, limit: str, *args, **kwargs) -> None:
        self.model = model
        self.limit = limit
        super().__init__(*args, **kwargs)
