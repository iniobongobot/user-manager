import { app } from './app.js';

// Start the server

const PORT = 3000;
app.listen(PORT, () => 
    console.log(`SAS Interview Test Server running on http://localhost:${PORT}`),
    console.log(`Available API Endpoints:
    POST   /api/v3/users       - Create a new user
    GET    /api/v3/users       - Get all users (supports pagination, sorting, and searching)
    GET    /api/v3/users/:id   - Get a single user by ID
    PUT    /api/v3/users/:id   - Update a user by ID
    DELETE /api/v3/users/:id   - Delete a user by ID`)     
        
    );
