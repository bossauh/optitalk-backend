import json
import os
import time
from pathlib import Path
from typing import Optional

CONFIG_PATH = os.path.join(os.getcwd(), "config")


class ConfigManager:

    """
    A dynamic configuration file manager. Each configuration file is stored as a
    .json file in the `./config` directory. Each configuration file is then
    accessed using the dot notation.

    For example:
    ```py
    user_data = config.user_data["id"] # Accesses the "id" key in `config/user_data.json`.
    ```
    """

    def __init__(self, base_path: str = CONFIG_PATH) -> None:
        self.base_path = base_path

        self._cache = {}

    def _get_config(self, name: str, base_path: Optional[str] = None) -> dict:
        path = os.path.join(base_path or self.base_path, name + ".json")

        if not Path(path).exists():
            raise AttributeError(f"Cannot find '{path}'.")

        cache_details = self._cache.get(path)
        if cache_details:
            if time.time() - cache_details["timestamp"] < 1:
                return cache_details["cache"]

        with open(path, encoding="utf-8", mode="r") as f:
            data = json.load(f)
            self._cache[path] = {"timestamp": time.time(), "cache": data}
            return data

    def _set_config(
        self, name: str, value: dict, base_path: Optional[str] = None
    ) -> None:
        path = os.path.join(base_path or self.base_path, name + ".json")

        if not Path(path).exists():
            raise AttributeError(f"Cannot find '{path}'.")

        with open(path, encoding="utf-8", mode="w") as f:
            json.dump(value, f, indent=2)

    def __getattribute__(self, name: str) -> dict:
        """
        Return a configuration file as a `dict` given its name.

        Raises
        ------
        `AttributeError` :
            If the provided name is not a valid configuration file.
        """

        try:
            return object.__getattribute__(self, name)
        except AttributeError:
            return self._get_config(name)

    def __setattr__(self, name: str, value: dict) -> None:
        """
        Replace the contents of a configuration file given its name.

        Raises
        ------
        `AttributeError` :
            If the provided name is not a valid configuration file.
        """

        if name in ("base_path", "_cache"):
            object.__setattr__(self, name, value)
        else:
            self._set_config(name, value)

    __getitem__ = __getattribute__
    __setitem__ = __setattr__


config = ConfigManager()
