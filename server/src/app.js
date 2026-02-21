import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { validateRequest, userSchema } from './middleware/validate.js';
import { generateHash } from './utils/hasher.js';
import { poolPromise, sql } from './utils/db.js';

const app = express();
app.use(express.json());
app.use(cors());


//*************************************************************************************
// This POST is for creating new records.
app.post('/api/v2/users', validateRequest, async (req, res) => {
    try {
        const { value } = userSchema.validate(req.body);
        const { first_name, last_name, email, gender, status } = value;
        
        const   {status: _, ...hashBody} = req.body
        const hash = generateHash(hashBody);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('first_name', sql.NVarChar, first_name)
            .input('last_name', sql.NVarChar, last_name)
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


//This GET is for retrieving ALL records.
app.get('/api/v2/users', async (req, res) => {
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

        // 2. Build the WHERE clause for Searching
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


// This GET is for Fetching a single user by ID
app.get('/api/v2/users/:id', async (req, res) => {
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


app.delete('/api/v2/users/:id', async (req, res) => {
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
        // result.rowsAffected[0] tells us how many rows were removed
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


app.put('/api/v2/users/:id', validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const { value } = userSchema.validate(req.body);
        const { first_name, last_name, email, gender, status } = value;

        // 1. Gatekeeper: UUID Format Validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({ error: "Invalid ID Format" });
        }

        // 2. Generate new hash based on updated data
        const   {status: _, ...hashBody} = value;
        const newHash = generateHash(hashBody);

        const pool = await poolPromise;

        // 3. Execute Update
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('fname', sql.NVarChar, first_name)
            .input('lname', sql.NVarChar, last_name)
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

        // 4. Check if user existed
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
        message: `The ${req.method} request to ${req.originalUrl} is invalid. If you are attempting to UPDATE or DELETE, ensure the numeric ID is appended to the URL (e.g., /api/v2/users/1).`
    });
});

export { app };