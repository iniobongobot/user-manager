import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { validateRequest, userSchema } from './middleware/validate.js';
import { generateHash } from './utils/hasher.js';
import { poolPromise, sql } from './utils/db.js';
import { sanitizeString } from './utils/sanitizer.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';


const app = express();
app.use(express.json());
app.use(cors());


const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Manager API',
      version: '1.0.0',
      description: 'A full-stack API for managing users and assets',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./src/**/*.js', './*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api/v3/docs', swaggerUi.serve, swaggerUi.setup(specs));


// This POST is for creating new records.

/**
 * @openapi
 * /api/v3/users:
 *   post:
 *     summary: Create a new user
 *     description: Validates input, generates a request hash, and inserts into MS SQL.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - gender
 *               - status
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "Clark"
 *               last_name:
 *                 type: string
 *                 example: "Kent"
 *               email:
 *                 type: string
 *                 example: "iobot1@sas.com"
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     gender:
 *                       type: string
 *                     status:
 *                       type: string
 *                     request_hash:
 *                       type: string
 *       409:
 *         description: Conflict - Duplicate entry
 *       500:
 *         description: Internal Server Error
 */
app.post('/api/v3/users', validateRequest, async (req, res) => {
    try {
        const { value } = userSchema.validate(req.body);
        const { first_name, last_name, email, gender, status } = value;
        
        const   {status: _, ...hashBody} = req.body
        const hash = generateHash(hashBody);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('first_name', sql.NVarChar, sanitizeString(first_name))
            .input('last_name', sql.NVarChar, sanitizeString(last_name))
            .input('email', sql.NVarChar, email)
            .input('gender', sql.NVarChar, gender)
            .input('status', sql.NVarChar, status)
            .input('hash', sql.NVarChar, hash)
            .query(`
                INSERT INTO records (first_name, last_name, email, gender, status, request_hash)
                OUTPUT inserted.id
                VALUES (@first_name, @last_name, @email, @gender, @status, @hash)
            `);

        // result.recordset will contain the output of the inserted.id
        const newId = result.recordset[0].id;

        res.status(201).json({
            message: "User created successfully",
            data: { id: newId, ...value, request_hash: hash }
        });

    } catch (err) {
        // use unique constant error code, 2627 for ptimary key and 2601 for unique index
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({
                error: "Duplicate Request",
                message: "An identical record already exists in the database."
            });
        }

        console.error("Post Error:", err);
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
});

//*********************************GET ALL ********************************************/
//This GET is for retrieving ALL records.
/**
 * @openapi
 * /api/v3/users:
 *   get:
 *     summary: Retrieve all users
 *     description: Fetches all user records from the database.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           description: Global search across first_name, last_name, email, gender, and status
 *       - in: query
 *         name: searchKey
 *         schema:
 *           type: string
 *           enum: [first_name, last_name, email, gender, status, all]
 *           description: Specify the column to search (use 'all' for global search)
 *       - in: query    
 *         name: searchValue
 *         schema:
 *           type: string
 *           description: The value to search for in the specified column
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [first_name, last_name, email, gender, status]
 *           description: The field to sort by (default= first_name)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           description: The sort order (default= ASC)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           description: Page number for pagination (default= 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           description: Number of records per page (default= 10)
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Database error occurred
 */
app.get('/api/v3/users', async (req, res) => {
try {
        const { searchKey, searchValue, sortField = 'first_name', sortOrder = 'ASC', search } = req.query;
        const allowedColumns = ['first_name', 'last_name', 'email', 'gender', 'status', "all"];
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        if (!allowedColumns.includes(sortField.toLowerCase())) {
            return res.status(400).json({ 
                error: `Invalid sort field: '${sortField}'. Allowed fields are: ${allowedColumns.join(', ')}` 
            });
        }

        if (searchKey && !allowedColumns.includes(searchKey.toLowerCase())) {
            return res.status(400).json({ 
                error: `Invalid search key: '${searchKey}'. Allowed keys are: ${allowedColumns.join(', ')}` 
            });
        }


        const validOrders = ['ASC', 'DESC'];
        if (!validOrders.includes(sortOrder.toUpperCase())) {
            return res.status(400).json({ error: "sortOrder must be 'ASC' or 'DESC'" });
        }

        const offset = (page - 1) * limit;
        const pool = await poolPromise;
        const request = pool.request();

        // WHERE clause for Searching
        let whereClause = "";
        if (searchKey || searchValue) {
            if (!searchKey || !searchValue) {
                return res.status(400).json({ 
                    error: "Both searchKey and searchValue must be provided together for searching." 
                });
            }
        }

        if (search || searchKey === 'all') {
            const finalSearch = searchValue || search;
            whereClause = `WHERE first_name LIKE @search 
            OR last_name LIKE @search 
            OR email LIKE @search
            OR gender = @exact
            OR status = @exact`;
            request.input('search', sql.NVarChar, `%${finalSearch}%`);
            request.input('exact', sql.NVarChar, finalSearch);
        }

        else if (searchKey && searchValue) {
            const normalizedKey = searchKey.toLowerCase();
            const isExact = ['gender', 'status'].includes(normalizedKey);
            // i will implememnt paramatized queries for sql injection
            if (isExact) {
                whereClause = `WHERE ${searchKey} = @val`;
                request.input('val', sql.NVarChar, searchValue);
            } else {
                whereClause = `WHERE ${searchKey} LIKE @val`;
                request.input('val', sql.NVarChar, `%${searchValue}%`);
            }
        } else {
                whereClause = "";
        }

        // Separate query for Total Count so the frontend knows how many pages exist
        const countQuery = `SELECT COUNT(*) as total FROM records ${whereClause}`;

        const dataQuery = `
            SELECT * FROM records 
            ${whereClause} 
            ORDER BY ${sortField} ${sortOrder} 
            OFFSET ${offset} ROWS 
            FETCH NEXT ${limit} ROWS ONLY`;
        const countResult = await request.query(countQuery);
        const dataResult = await request.query(dataQuery);

        const totalRecords = countResult.recordset[0].total;

        res.json({
            data: dataResult.recordset,
            meta: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / limit),
                currentPage: page,
                limit
            }
        });

    } catch (err) {
        console.error("SQL Error:", err);
        res.status(500).json({ error: "Database error occurred" });
    }
});

// ******************************** GET ONE *********************************************/
// This GET is for Fetching a single user by ID
/**
 * @openapi
 * /api/v3/users/{id}:
 *   get:
 *     summary: Retrieve a single user by ID
 *     description: Fetches a specific user record from the database by User ID (UUID).
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user to retrieve
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 gender:
 *                   type: string
 *                 status:
 *                   type: string
 *                 requet_hash:
 *                   type: string
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: User not found
 *       500:
 *         description: Database error occurred
 */
app.get('/api/v3/users/:id', async (req, res) => {
try {
        const { id } = req.params;

        // Regex checks for the standard 8-4-4-4-12 hex character format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (!uuidRegex.test(id)) {
            return res.status(400).json({
                error: "Invalid ID Format",
                method: req.method,
                message: "The user ID must be a valid UUID (e.g., 91171017-2afc...)"
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id) 
            .query('SELECT * FROM records WHERE id = @id');

        // Will be empty if no match is found
        if (result.recordset.length === 0) {
            return res.status(404).json({
                error: "User Not Found",
                method: req.method,
                message: `No user found with ID ${id}`
            });
        }

        res.status(200).json({
            data: result.recordset[0]
        });

    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @openapi
 * /api/v3/users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     description: Deletes a specific user record from the database by User ID (UUID).
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 method:
 *                   type: string
 *                 details:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "91171017-2afc-4c8c-8f2a-5c0f8e0b3c4d"
 *                     status:
 *                       type: string
 *                       example: "Deleted from SQL Server"
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: User not found
 *       500:
 *         description: Database error occurred
 */
app.delete('/api/v3/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (!uuidRegex.test(id)) {
            return res.status(400).json({
                error: "Invalid ID Format",
                method: req.method,
                message: "The user ID must be a valid UUID."
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('DELETE FROM records WHERE id = @id');

        // Check if any row was actually deleted
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                error: "User Not Found",
                method: req.method,
                message: `No record found in the database with ID ${id}`
            });
        }

        res.status(200).json({
            message: "User successfully deleted",
            method: req.method,
            details: {
                id: id,
                status: "Deleted from SQL Server"
            }
        });

    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: "Failed to delete record from database" });
    }
});


//******************************** PUT (UPDATE) ******************************** */
/**
 * @openapi
 * /api/v3/users/{id}:
 *   put:
 *     summary: Update an existing user
 *     description: Validates input, generates a request hash, and updates an existing user in MS SQL.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - gender
 *               - status
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "Clark"
 *               last_name:
 *                 type: string
 *                 example: "Kent"
 *               email:
 *                 type: string
 *                 example: "iobot1@sas.com"
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 example: "Male"
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *                 example: "Active"  
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12345
 *                     first_name:
 *                       type: string
 *                       example: "Clark"
 *                     last_name:
 *                       type: string
 *                       example: "Kent"
 *                     email:
 *                       type: string
 *                     gender:
 *                       type: string
 *                       example: "Male"
 *                     status:
 *                       type: string
 *                       example: "Active"
 *                     request_hash:
 *                       type: string
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: User not found
 *       409:
 *         description: Conflict - Duplicate entry
 *       500:
 *         description: Internal Server Error
 */
app.put('/api/v3/users/:id', validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const { value } = userSchema.validate(req.body);
        const { first_name, last_name, email, gender, status } = value;

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({ error: "Invalid ID Format" });
        }

        const   {status: _, ...hashBody} = value;
        const newHash = generateHash(hashBody);

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('fname', sql.NVarChar, sanitizeString(first_name))
            .input('lname', sql.NVarChar, sanitizeString(last_name))
            .input('email', sql.NVarChar, email)
            .input('gender', sql.NVarChar, gender)
            .input('status', sql.NVarChar, status)
            .input('hash', sql.NVarChar, newHash)
            .query(`
                UPDATE records 
                SET first_name = @fname, 
                    last_name = @lname, 
                    email = @email, 
                    gender = @gender, 
                    status = @status,
                    request_hash = @hash
                WHERE id = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                error: "User Not Found",
                message: `No user found with ID ${id}`
            });
        }

        res.status(200).json({
            message: "User updated successfully",
            data: { id, ...req.body, request_hash: newHash }
        });

    } catch (err) {
        // Handle Duplicate Hash (if they change data to match ANOTHER existing user)
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({
                error: "Conflict",
                message: "Another user with this exact configuration already exists."
            });
        }
        console.error("Update Error:", err);
        res.status(500).json({ error: "Internal Server Error", message: err.message });
    }
});


// ************************************************************************************

app.use((req, res) => {
    res.status(404).json({
        error: "Endpoint Not Found",
        method: req.method,
        path: req.originalUrl,
        message: `The ${req.method} request to ${req.originalUrl} is invalid. If you are attempting to UPDATE or DELETE, ensure the numeric ID is appended to the URL (e.g., /api/v3/users/1).`
    });
});

export { app };