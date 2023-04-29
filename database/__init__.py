import os

from mongoclass import MongoClassClient

mongoclass = MongoClassClient(os.environ["MONGODB_DB_NAME"], os.environ["MONGODB_URI"])
