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

### 2. Database Setup

        This project uses **Microsoft SQL Server**. Follow the steps below to initialize the database and the required table.

        Run the following SQL script in your SQL Server Management Studio (SSMS) or via your preferred CLI tool to create the database and the `Records` table.

        ```sql
        -- Create the Database
        IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'UserAssetDB')
        BEGIN
        CREATE DATABASE UserAssetDB;
        END
        GO

        USE UserAssetDB;
        GO

        -- Create the Records Table
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Records]') AND type in (N'U'))
        BEGIN
        CREATE TABLE Records (
                id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                first_name   NVARCHAR(50) NOT NULL,
                last_name    NVARCHAR(50) NOT NULL,
                email        NVARCHAR(100) NOT NULL UNIQUE,
                gender       NVARCHAR(50) NOT NULL,
                status       NVARCHAR(50) NOT NULL,
                request_hash NVARCHAR(128) NOT NULL UNIQUE 
        );
        END
        GO

### 3. Test
        cd server
        npm run test
