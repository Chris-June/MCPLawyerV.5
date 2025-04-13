# OpenAIService

## Description

The `OpenAIService` is responsible for interacting with the OpenAI API. It provides functionalities to generate completions.

The service includes the following key functionalities:

-   **Generate Completion:** Generates a completion from the OpenAI API based on a list of messages or a prompt.
-   **Extract Text from Completion:** Extracts the generated text from a completion response.
-   **Create System Message:** Creates a system message for the OpenAI API.
-   **Create User Message:** Creates a user message for the OpenAI API.
-   **Create Assistant Message:** Creates an assistant message for the OpenAI API.

## How to Use

1.  **Initialization:** Create an instance of the `OpenAIService` class.
2.  **Generate Completion:** Use the `generate_completion` method to generate a completion from the OpenAI API.
3.  **Extract Text from Completion:** Use the `extract_text_from_completion` method to extract the generated text from a completion response.
4.  **Create Messages:** Use the `create_system_message`, `create_user_message`, and `create_assistant_message` methods to create messages for the OpenAI API.

## How to Extend

1.  **Custom Models:** You can extend the service by using different OpenAI models.
2.  **Custom API Base:** You can extend the service by using a different OpenAI API base.
3.  **Integration with Other Services:** Integrate the service with other services, such as document management systems or CRM.
