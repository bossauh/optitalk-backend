import logging
import random
import statistics
import time

import coloredlogs

coloredlogs.install(level="DEBUG")

MODEL_COST = 0.02
TOKEN_CONSUMPTION_RANGE = (1000, 3000)
API_COST = 25
USERS_COUNT = 10

users = {}
for i in range(USERS_COUNT):
    users[i] = {"requests": 0, "tokens": 0, "months": 1}

total_token_consumption = 0
total_requests = 0

while True:
    for user, user_data in users.copy().items():
        token_consumption = random.randint(*TOKEN_CONSUMPTION_RANGE)
        if user_data["requests"] >= 500:
            users[user]["requests"] = 0
            users[user]["months"] += 1

        users[user]["tokens"] += token_consumption
        users[user]["requests"] += 1

        total_token_consumption += token_consumption
        total_requests += 1

    income_sum = 0
    months = []
    for user_data in users.values():
        income_sum += API_COST * user_data["months"]
        months.append(user_data["months"])

    logging.info(
        f"Total Token Consumption: {total_token_consumption} | USD Charged: {round(MODEL_COST * (total_token_consumption / 1000), 2)} | Total Requests: {total_requests} | Total Income: {income_sum} | Average Months Used: {statistics.mean(months)} | Total Profit: {round(income_sum - MODEL_COST * (total_token_consumption / 1000))}"
    )

    # time.sleep(0.0000001)
