# User Management System

A User tracking application built with **React (Vite)** and **Node.js (Express)**. Developed as part of a technical assessment for SAS.

Version 2 introduces a MS SQL Server database to hold user records
Version 3 introduces test cases, github workflows and a swagger

## Key Features
* **CRUD:** Create, Read, Update, and Delete.
    - POST   /api/v3/users       - Create a new user
    - GET    /api/v3/users       - Get all users (supports pagination, sorting, and searching)
    - GET    /api/v3/users/:id   - Get a single user by ID
    - PUT    /api/v3/users/:id   - Update a user by ID
    - DELETE /api/v3/users/:id   - Delete a user by ID
* **Paramatized Queries**: to prevent SQL injection
* **Search:** Case-insensitive search with exact matching for categories (Gender/Status).
* **Sort:** Sorting based on any key in ASC or DESC.
* **Security:** Request hashing for integrity and GUID (UUID v4) generation for unique identifiers.
* **Modern Stack:** Fully converted to ES Modules (ESM) running on Node v34.



## Tech Stack
- **Frontend:** 
        - React 18, 
        - Vite, 
        - Bootstrap 5, 
        - Lucide Icons.
        - Axios
- **Backend:** 
        - Node.js, 
        - Express, 
        - Joi (middleware-based validation), 
        - crypto (Request Hashing).
        - swagger (for documentation)

- **DATABASE**:
        - MS SQL SERVER - Relational architecture with indexing on searchable fields
        - SETUP:
          - id (uniqueidentifier, PK)
          - first_name (nvarchar)
          - last_name (nvarchar)
          - email (nvarchar, Unique)
          - gender (nvarchar)
          - status (nvarchar)
          - request_hash (nvarchar, Unique)


## 📦 Installation & Setup

### 1. Clone the repository
git clone [https://github.com/iniobongobot/user-manager.git](https://github.com/iniobongobot/user-manager.git)
cd user-manager
npm run dev

### 2. Test
cd server
npm run test
