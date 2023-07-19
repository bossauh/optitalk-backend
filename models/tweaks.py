import dataclasses
from typing import Literal

from database import mongoclass
from library.configlib import config


@mongoclass.mongoclass()
@dataclasses.dataclass
class Tweaks:
    length: Literal["very short", "short", "medium", "long", "very long"] = "medium"
    creativity: Literal[
        "predictable", "consistent", "normal", "creative", "extreme"
    ] = "normal"

    @property
    def model_notes(self) -> list[str]:
        notes = []
        tweaks = config.tweaks

        length = tweaks["length"].get(self.length, {}).get("model_note")
        if length:
            notes.append(length)

        creativity = tweaks["creativity"].get(self.creativity, {}).get("model_note")
        if creativity:
            notes.append(creativity)

        return notes

    @property
    def model_parameters(self) -> dict:
        parameters = {}
        tweaks = config.tweaks

        length = tweaks["length"].get(self.length, {}).get("parameters")
        if length:
            parameters.update(length)

        creativity = tweaks["creativity"].get(self.creativity, {}).get("parameters")
        if creativity:
            parameters.update(creativity)

        return parameters
