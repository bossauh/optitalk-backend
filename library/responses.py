import math
import time
from typing import Optional

from flask import Response, jsonify

from .types import JsonType, ResponseType, StatusCodeType

# Code 200 Responses
CODE_200 = ("OK", 200)
CODE_201 = ("Created", 201)
CODE_202 = ("Accepted", 202)
CODE_203 = ("Non-Authoritative Information", 203)
CODE_204 = ("No Content", 204)
CODE_205 = ("Reset Content", 205)
CODE_206 = ("Partial Content", 206)

# Code 300 Responses
CODE_300 = ("Multiple Choice", 300)
CODE_301 = ("Moved Permanently", 301)
CODE_302 = ("Found", 302)
CODE_304 = ("See Other", 303)
CODE_305 = ("Use Proxy", 305)
CODE_307 = ("Temporary Redirect", 307)
CODE_308 = ("Permanent Redirect", 308)

# Code 400 Responses
CODE_400 = ("Bad Request", 400)
CODE_400_MISSING_REQUIRED_PARAMETERS = ("MissingParameters", 400)
CODE_401 = ("Unauthorized", 401)
CODE_403 = ("Forbidden", 403)
CODE_404 = ("Not Found", 404)
CODE_405 = ("Method Not Allowed", 405)
CODE_406 = ("Not Acceptable", 406)
CODE_407 = ("Proxy Authentication Required", 407)
CODE_408 = ("Request Timeout", 408)
CODE_409 = ("Conflict", 409)
CODE_410 = ("Gone", 410)
CODE_411 = ("Length Required", 411)
CODE_412 = ("Precondition Failed", 412)
CODE_413 = ("Payload Too Large", 413)
CODE_414 = ("URI Too Long", 414)
CODE_415 = ("Unsupported Media Type", 415)
CODE_416 = ("Range Not Satisfiable", 416)
CODE_417 = ("Expectation Failed", 417)
CODE_418 = ("I'm a teapot", 418)
CODE_421 = ("Misdirected Request", 421)
CODE_422 = ("Unprocessable Entity", 422)
CODE_423 = ("Locked", 423)
CODE_424 = ("Failed Dependency", 424)
CODE_426 = ("Upgrade Required", 426)
CODE_428 = ("Precondition Required", 428)
CODE_429 = ("Too Many Requests", 429)
CODE_431 = ("Request Header Fields Too Large", 431)
CODE_451 = ("Unavailable For Legal Reasons", 451)

# Code 500 Responses
CODE_500 = ("Internal Server Error", 500)
CODE_501 = ("Not Implemented", 501)
CODE_502 = ("Bad Gateway", 502)
CODE_503 = ("Service Unavailable", 503)
CODE_504 = ("Gateway Timeout", 504)
CODE_505 = ("HTTP Version Not Supported", 505)
CODE_506 = ("Variant Also Negotiates", 506)
CODE_507 = ("Insufficient Storage", 507)
CODE_508 = ("Loop Detected", 508)
CODE_510 = ("Not Extended", 510)
CODE_511 = ("Network Authentication Required", 511)


def create_response(
    payload: JsonType = None,
    message: Optional[str] = None,
    status_code: Optional[StatusCodeType] = None,
    type_: Optional[ResponseType] = None,
    exception: Optional[Exception] = None,
) -> tuple[Response, int]:
    """
    Create a structured API response. We have this function to ensure all API responses
    follow a consistent format.

    Parameters
    ----------
    `payload` : JsonType
        Any JSON serializable object. Defaults to None.
    `message` : str
        A optional message as a string. Defaults to the message mapped to the
        `status_code`.
    `status_code` : StatusCodeType
        The status code of the request. Defaults to 200. This parameter accepts a tuple
        wherein the first value is the message and the second is the status code.
    `type_` : ResponseType
        The type of request. Defaults to "error" if `status_code` is < 400 or error if
        `status_code` is >= 400.
    `exception` : Exception
        If provided, the exception's attributes are automatically stored in the
        `payload`, the `type_` is forced to be `error`, and the status code defaults to
        500.
    """

    if exception is not None:
        message = exception.__class__.__name__
        if status_code is None:
            status_code = CODE_500

        type_ = "error"
        if isinstance(payload, dict):
            copy = payload.copy()
            copy.update(exception.__dict__)
            payload = copy
        else:
            payload = exception.__dict__
    else:
        status_code = status_code if status_code is not None else CODE_200

    if message is None:
        message = status_code[0]

    if type_ is None:
        if status_code[1] < 400:
            type_ = "response"
        else:
            type_ = "error"

    return (
        jsonify(
            {
                "timestamp": time.time(),
                "message": message,
                "status_code": status_code[1],
                "type": type_,
                "payload": payload,
            }
        ),
        status_code[1],
    )


def create_paginated_response(
    objects: list,
    page: int,
    page_size: int,
    total: Optional[int] = None,
    *args,
    **kwargs
) -> tuple[Response, int]:
    """
    Create a structured paginated API response.

    Parameters
    ----------
    `objects` : list
        The list of objects to return.
    `page` : int
        The current page number.
    `page_size` : int
        The maximum number of items in a page.
    `total` : int
        The total amount of items in a page. Defaults to None. If this value
        is present, it will be used to calculate how many pages there are.
    `*args, **kwargs` :
        Other arguments and keyword arguments to be passed onto `create_response()`.
    """

    payload = {"data": objects, "page": page, "page_size": page_size}
    if total is not None:
        payload["pages"] = math.ceil(total / page_size)

    return create_response(payload=payload, *args, **kwargs)
