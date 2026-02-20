# User Management System

A User tracking application built with **React (Vite)** and **Node.js (Express)**. Developed as part of a technical assessment for SAS.

## Key Features
* **Full CRUD:** Create, Read, Update, and Delete hardware/software assets.
* **Paramatized Queries**: to prevent SQL injection
* **Search:** Case-insensitive search with exact matching for categories (Gender/Status).
* **Sort:** Sorting based on any key in ASC or DESC.
* **Security:** Request hashing for integrity and GUID (UUID v4) generation for unique identifiers.
* **Modern Stack:** Fully converted to ES Modules (ESM) running on Node v24.

## Tech Stack
- **Frontend:** React 18, Vite, Bootstrap 5, Lucide Icons.
- **Backend:** Node.js, Express, Joi (Validation), crpto (Request Hashing).
- **Architecture:** REST API with middleware-based validation.

## 📦 Installation & Setup

### 1. Clone the repository
git clone [https://github.com/iniobongobot/user-manager.git](https://github.com/iniobongobot/user-manager.git)
cd user-manager