import importlib
import logging
import os

import coloredlogs
from flask import Flask
from flask_session import Session

coloredlogs.install(level="DEBUG")
logger = logging.getLogger(__name__)


class App:
    def __init__(self) -> None:
        self.app = Flask(__name__)
        self.app.config["SESSION_TYPE"] = "redis"
        Session(self.app)

        self.app.secret_key = "aeed32d8aec44a388640b02c18ef6de0"

    def register_blueprints(self) -> None:
        """
        Register all the blueprints in the `./blueprints` directory.
        """

        logger.info("Registering blueprints...")

        # Collect all of the path names in a `.` format (i.e., `blueprints/users.py` -> `blueprints.users`)
        blueprints_dir = os.path.join(os.getcwd(), "blueprints")
        path_names = [
            f"blueprints.{entry.name[:-3]}"
            for entry in os.scandir(blueprints_dir)
            if entry.name.endswith(".py")
        ]
        logger.debug(f"{path_names=}")

        i = 0
        for i, module in enumerate(path_names, start=1):
            blueprint = importlib.import_module(module, module)
            self.app.register_blueprint(blueprint=blueprint.setup(self))

            logger.info(f"Registered '{module}'.")

        logger.info(f"Registered {i} blueprints.")

    def start(self) -> None:
        logger.info("Starting OptiTalk...")
        self.register_blueprints()

        self.app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)


if __name__ == "__main__":
    App().start()
