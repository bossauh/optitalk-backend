import openai

openai.api_key = "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"


for resp in openai.Completion.create(
    model="text-davinci-003", prompt="Create 5 your mom jokes", stream=True
):
    print(resp.choices[0].text)
