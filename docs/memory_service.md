# MemoryService

## Description

The `MemoryService` is responsible for managing memory storage and retrieval. It provides functionalities to store a new memory, get memories for a specific role, get relevant memories, clear memories, and close the service.

The service includes the following key functionalities:

-   **Store Memory:** Stores a new memory.
-   **Get Memories:** Retrieves memories for a specific role.
-   **Get Relevant Memories:** Retrieves memories relevant to a query using vector similarity.
-   **Clear Memories:** Clears memories for a specific role.
-   **Close:** Cleans up resources.

## How to Use

1.  **Initialization:** Create an instance of the `MemoryService` class.
2.  **Store Memory:** Use the `store_memory` method to store a new memory.
3.  **Get Memories:** Use the `get_memories_by_role_id` method to retrieve memories for a specific role.
4.  **Get Relevant Memories:** Use the `get_relevant_memories` method to retrieve memories relevant to a query using vector similarity.
5.  **Clear Memories:** Use the `clear_memories_by_role_id` method to clear memories for a specific role.
6.  **Close:** Use the `close` method to clean up resources.

## How to Extend

1.  **Using a Proper Database:** Replace the in-memory storage with a proper database for production use.
2.  **Improving Similarity Scores:** Improve the similarity scores by using more sophisticated vector embedding techniques.
3.  **Integration with Other Services:** Integrate the service with other services, such as document management systems or CRM.
