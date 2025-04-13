# CitationFormatterService

## Description

The `CitationFormatterService` is responsible for formatting legal citations according to Canadian standards. It uses the OpenAI API (via the `AIProcessor`) to format citations based on different styles. It provides the following functionalities:

- `format_case_citation`: Formats a case citation according to the specified style (default: McGill Guide).
- `format_legislation_citation`: Formats a legislation citation according to the specified style (default: McGill Guide).
- `parse_citation`: Parses a citation into its components.

## How to Use

1.  **Initialization:** Create an instance of the `CitationFormatterService` class, passing an instance of the `AIProcessor` as an argument.
2.  **Formatting Case Citations:** Call the `format_case_citation` method with a dictionary containing case information and an optional style parameter. The method returns a dictionary containing the formatted citation.
3.  **Formatting Legislation Citations:** Call the `format_legislation_citation` method with a dictionary containing legislation information and an optional style parameter. The method returns a dictionary containing the formatted citation.
4.  **Parsing Citations:** Call the `parse_citation` method with the citation text to parse. The method returns a dictionary containing the parsed citation components.

## How to Extend

1.  **Custom Citation Styles:** You can extend the service by adding custom citation styles to the `_initialize_citation_styles` method.
2.  **Improved Parsing Logic:** The `parse_citation` method relies on the AI to parse the citation. You can improve the parsing logic by adding regular expressions or other parsing techniques to extract the citation components more accurately.
3.  **Support for More Citation Types:** The service currently supports case and legislation citations. You can extend the service to support other citation types, such as journal articles or books.
4.  **AI Model Customization:** The prompts sent to the AI processor can be customized to improve the accuracy and consistency of the formatted citations.
