# AIProcessor Service

## Description

The `AIProcessor` service is responsible for interacting with the OpenAI API to generate responses and create embeddings. It provides the following functionalities:

- `generate_response`: Generates a response based on a system prompt and a user prompt.
- `create_embedding`: Creates an embedding vector for a given text.
- `process_prompt`: Processes a prompt using the OpenAI API, specifically for drafting legal clauses for Canadian jurisdictions.

## How to Use

1.  **Initialization:** Create an instance of the `AIProcessor` class.
2.  **Generating Responses:** Call the `generate_response` method with a system prompt and a user prompt. The method returns the generated response as a string.
3.  **Creating Embeddings:** Call the `create_embedding` method with the text to embed. The method returns a list of floats representing the embedding vector.
4.  **Processing Prompts:** Call the `process_prompt` method with a prompt. The method returns the generated response as a string.

## How to Extend

1.  **Custom Prompts:** You can extend the service by creating custom system and user prompts to tailor the generated responses to specific needs.
2.  **Different Models:** The service currently uses the model specified in the settings (`settings.openai_model`). You can modify the `model` attribute to use different OpenAI models.
3.  **Additional Functionality:** You can add new methods to the `AIProcessor` class to implement additional functionalities, such as:

    *   Summarizing text
    *   Translating text
    *   Generating different kinds of creative text formats, like poems, code, scripts, musical pieces, email, letters, etc.
4. **Error Handling:** The service includes basic error handling. You can extend the error handling to provide more specific error messages or implement retry mechanisms.
