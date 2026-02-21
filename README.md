# User Management System

A User tracking application built with **React (Vite)** and **Node.js (Express)**. Developed as part of a technical assessment for SAS.

Version 2 introduces a MS SQL Server database to hold user records

## Key Features
* **CRUD:** Create, Read, Update, and Delete.
    POST   /api/v2/users       - Create a new user
    GET    /api/v2/users       - Get all users (supports pagination, sorting, and searching)
    GET    /api/v2/users/:id   - Get a single user by ID
    PUT    /api/v2/users/:id   - Update a user by ID
    DELETE /api/v2/users/:id   - Delete a user by ID
* **Paramatized Queries**: to prevent SQL injection
* **Search:** Case-insensitive search with exact matching for categories (Gender/Status).
* **Sort:** Sorting based on any key in ASC or DESC.
* **Security:** Request hashing for integrity and GUID (UUID v4) generation for unique identifiers.
* **Modern Stack:** Fully converted to ES Modules (ESM) running on Node v24.



## Tech Stack
- **Frontend:** 
        - React 18, 
        - Vite, 
        - Bootstrap 5, 
        - Lucide Icons.
- **Backend:** 
        - Node.js, 
        - Express, 
        - Joi (middleware-based validation), 
        - crypto (Request Hashing).

- **DATABASE**:
        - MS SQL SERVER


## 📦 Installation & Setup

### 1. Clone the repository
git clone [https://github.com/iniobongobot/user-manager.git](https://github.com/iniobongobot/user-manager.git)
cd user-manager