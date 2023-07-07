import os

import gridfs
from mongoclass import MongoClassClient

mongoclass = MongoClassClient(os.environ["MONGODB_DB_NAME"], os.environ["MONGODB_URI"])

db = mongoclass[os.environ["MONGODB_DB_NAME"]]
fs = gridfs.GridFS(db)
