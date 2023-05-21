import importlib
import logging
import os

import eventlet
import flask_monitoringdashboard as flask_monitor
import waitress
from dotenv import load_dotenv
from flask_socketio import SocketIO

if not os.getenv("PRODUCTION"):
    load_dotenv()
    logging.info("Loaded development .env file.")

import coloredlogs
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_session import Session

from database import mongoclass

coloredlogs.install(level="DEBUG")
logger = logging.getLogger(__name__)


class App:
    def __init__(self) -> None:
        self.app = Flask(__name__, static_folder="./build")
        # flask_monitor.config.init_from(
        #     file=os.path.join(os.getcwd(), "flask_monitor.cfg")
        # )
        # flask_monitor.bind(self.app)

        self.socket = SocketIO(
            self.app, async_mode="eventlet", cors_allowed_origins="*"
        )
        self.app.url_map.strict_slashes = False
        CORS(self.app)

        self.app.config["SERVER_NAME"] = None
        self.app.config["SESSION_TYPE"] = "mongodb"
        self.app.config["SESSION_MONGODB"] = mongoclass
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

    def register_index_route(self) -> None:
        """
        Register the routes that will serve the react frontend.
        """

        @self.app.route("/", defaults={"path": ""})
        @self.app.route("/<path:path>")
        def serve_react(path):
            if path != "" and os.path.exists(
                (self.app.static_folder or "") + "/" + path
            ):
                return send_from_directory(self.app.static_folder, path)
            else:
                return send_from_directory(self.app.static_folder, "index.html")

    def start(self) -> None:
        logger.info("Starting OptiTalk...")
        self.register_index_route()
        self.register_blueprints()

        if os.getenv("PRODUCTION"):
            logger.info("Starting with eventlet server.")
            eventlet.wsgi.server(eventlet.listen(("0.0.0.0", 80)), self.app)
            waitress.serve(self.app, listen="0.0.0.0:80")
        else:
            logger.info("Starting with development server.")
            self.socket.run(
                self.app, host="127.0.0.1", port=5000, debug=True, use_reloader=False
            )


if __name__ == "__main__":
    App().start()
