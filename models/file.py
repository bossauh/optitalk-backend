import dataclasses
import datetime as dt
import logging
import traceback
import uuid
from typing import IO, Optional

from database import fs, mongoclass
from gridfs import GridOut
from library import tasks, utils

logger = logging.getLogger(__name__)


@mongoclass.mongoclass()
@dataclasses.dataclass
class File:
    """
    Represents a file stored in the database. Used by images, etc.
    """

    type: str
    filename: str
    created_by: str

    private: bool = False
    mimetype: Optional[str] = None
    uploaded: bool = False
    id: str = dataclasses.field(default_factory=lambda: str(uuid.uuid4()))

    created_at: dt.datetime = dataclasses.field(default_factory=dt.datetime.now)

    def __str__(self) -> str:
        uploaded_text = "Uploaded"
        if not self.uploaded:
            uploaded_text = "Not Uploaded"
        return f"{self.type} {self.filename} ({self.id}) ({uploaded_text})"

    def get_file(self) -> Optional[GridOut]:
        file = fs.find_one({"id": self.id})
        return file

    def delete_file(self) -> bool:
        """
        Deletes the File object as well as the actual file contents in the database.
        Returns False if the file contents never got uploaded
        """

        self.delete()
        if not self.uploaded:
            return False

        file = self.get_file()
        fs.delete(file._id)
        return True

    @classmethod
    def from_file_like_object(cls, f: IO, **kwargs):
        """
        Create and upload the provided file.
        """

        file = cls(**kwargs)
        if kwargs["type"] == "avatar":
            f = utils.compress_image(f, 5 * 1024 * 1024)

        try:
            fs.put(f, id=file.id)
            file.uploaded = True
            logger.info(f"Successfully uploaded '{file}'.")
        except Exception:
            logger.exception(f"Error while uploading '{file}'.")
            tasks.error_alert.delay(
                f"Error while uploading '{file}'",
                "It is unsure as to why the error has failed.",
                traceback.format_exc(),
                metadata=dataclasses.asdict(file),
            )
        file.save()

        return file
