import logging
import os
import time
from pathlib import Path

logger = logging.getLogger(__name__)


class SystemMessageHandler:

    """
    This class houses a set of methods that would ease the retrieval of system
    messages. A system message is a message provided to a GPT model that basically
    instructs it how to act and behave.
    """

    def __init__(self) -> None:
        self._cached = {}

    def get_system_message(self, filename: str) -> str:
        """
        Get a specific system message.

        Parameters
        ----------
        `filename` : str
            The filename without the .txt extension.

        Returns
        -------
        `str` :
            The system message.
        """

        cache_data = self._cached.get(filename)
        if cache_data and (time.time() - cache_data["timestamp"] < 5):
            return cache_data["message"]

        path = os.path.join(os.getcwd(), "data", "system_messages", f"{filename}.txt")
        if not Path(path).exists():
            logger.warning(
                f"System message '{filename}' not found. Defaulting to 'default'."
            )
            path = os.path.join(os.getcwd(), "data", "system_messages", "default.txt")

        with open(path, encoding="utf-8") as f:
            message = f.read()
            self._cached[filename] = {"timestamp": time.time(), "message": message}

            return message


system_message_handler = SystemMessageHandler()
