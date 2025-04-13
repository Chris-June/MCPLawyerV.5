# RoleService

## Description

The `RoleService` is responsible for managing roles and processing queries. It provides functionalities to get roles, get a role by ID, create a new role, update an existing role, delete a role, generate a complete prompt, and process a query. It interacts with the `MemoryService` and `AIProcessor`.

The service includes the following key functionalities:

-   **Get Roles:** Retrieves a list of roles.
-   **Get Role:** Retrieves a specific role by ID.
-   **Create Role:** Creates a new role.
-   **Update Role:** Updates an existing role.
-   **Delete Role:** Deletes a role.
-   **Generate Complete Prompt:** Generates a complete system prompt for a role.
-   **Process Query:** Processes a query using a specific role.

## How to Use

1.  **Initialization:** Create an instance of the `RoleService` class, passing instances of the `MemoryService` and `AIProcessor` as arguments.
2.  **Get Roles:** Use the `get_roles` method to retrieve a list of roles.
3.  **Get Role:** Use the `get_role` method to retrieve a specific role by ID.
4.  **Create Role:** Use the `create_role` method to create a new role.
5.  **Update Role:** Use the `update_role` method to update an existing role.
6.  **Delete Role:** Use the `delete_role` method to delete a role.
7.  **Generate Complete Prompt:** Use the `generate_complete_prompt` method to generate a complete system prompt for a role.
8.  **Process Query:** Use the `process_query` method to process a query using a specific role.

## How to Extend

1.  **Adding New Roles:** You can extend the service by adding new roles to the `DEFAULT_ROLES` list in the `app/config.py` file.
2.  **Adding New Tones:** You can extend the service by adding new tones to the `TONE_PROFILES` dictionary in the `app/config.py` file.
3.  **Integration with Other Services:** Integrate the service with other services, such as document management systems or CRM.
