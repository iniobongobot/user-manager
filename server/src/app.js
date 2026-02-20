import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { validateRequest, getAvailableKeys } from './middleware/validate.js';
import { generateHash } from './utils/hasher.js';

const app = express();
app.use(express.json());
app.use(cors());

//Temp Database
let users = [{
  id: "3fe75b97-68c7-4d95-b110-cc327fe3ab04",
  first_name: "Desi",
  last_name: "Christoforou",
  email: "dchristoforou0@miibeian.gov.cn",
  gender: "Male",
  status: "Active",
  requestHash: "01KHY6R6N0Q1VJF9T0EKXSWABP"
}, {
  id: "1a9aacc7-5292-4aeb-8cda-a1459472afa3",
  first_name: "Skylar",
  last_name: "Glenny",
  email: "sglenny1@noaa.gov",
  gender: "Male",
  status: "Active",
  requestHash: "01KHY6R6N3NQH9N3ZDPNYDRJ5Y"
}, {
  id: "957ddb3b-1bc2-4a83-b4d0-2547374b8043",
  first_name: "Griffin",
  last_name: "Gilffillan",
  email: "ggilffillan2@yelp.com",
  gender: "Male",
  status: "Active",
  requestHash: "01KHY6R6N4NAFKEC0Q4EAR2XZ7"
}, {
  id: "581a888d-fe76-4d90-9165-25aec9e37965",
  first_name: "Wilmer",
  last_name: "Crotch",
  email: "wcrotch3@webs.com",
  gender: "Male",
  status: "Active",
  requestHash: "01KHY6R6N55NNT3G9ZG4PMX751"
}, {
  id: "26bd74e6-2602-48e6-a036-9dd2903fccf4",
  first_name: "Faith",
  last_name: "Fitzackerley",
  email: "ffitzackerley4@opensource.org",
  gender: "Female",
  status: "Inactive",
  requestHash: "01KHY6R6N7V2G13BYBW047K3G8"
}]
let requestHashes = new Set();

// This POST is for creating new records.
app.post('/api/v1/users', validateRequest, (req, res) => {
    try {
        const hash = generateHash(req.body);

        // Check for duplicate request
        if (requestHashes.has(hash)) {
            return res.status(409).json({
                error: "Duplicate Request",
                message: "An identical record already exists or was recently submitted."
            });
        }
        const userId = uuidv4();
        const newUser = { id: userId, ...req.body, requestHash: hash };
        console.log(newUser)
        users.push(newUser);
        requestHashes.add(hash);

        res.status(201).json(newUser);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
});


//This GET is for retrieving ALL records.
app.get('/api/v1/users', (req, res) => {
    try {
        let results = [...users];
        const { searchKey, searchValue, sort, order, limit, page } = req.query;

        // This is my serach logic.
        if (searchKey || searchValue) {
            if (!searchKey || !searchValue) {
                return res.status(400).json({ 
                    error: "Invalid Search", 
                    message: "Both 'searchKey' and 'searchValue' must be provided together." ,
                    availableKeys: getAvailableKeys()
                });
            }

            // Validate that the searchKey is a valid property
            const validSearchKeys = getAvailableKeys().concat(['id']); 
            if (!validSearchKeys.includes(searchKey)) {
                return res.status(400).json({ 
                    error: "Invalid Search Key", 
                    message: `You can only search by: ${validSearchKeys.join(', ')}` 
                });
            }

            // Perform the filtered search
            if (searchKey === 'id') {
                results = results.filter(a => a.id === parseInt(searchValue));
            } else {
                results = results.filter(a => {
                    const itemValue = String(a[searchKey]).toLowerCase().trim();
                    const searchTerm = searchValue.toLowerCase().trim();

                    if (searchKey === 'gender' || searchKey === 'status') {
                        return itemValue === searchTerm;
                    }

                    return itemValue.includes(searchTerm);
                });
            }
        }

        // This is my sort logic. I can sort in ascending or descending order based on the query parameters.
        if (sort) {
            const sortOrder = order === 'desc' ? -1 : 1;
            results.sort((a, b) => {
                const valA = (a[sort] || '').toString().toLowerCase();
                const valB = (b[sort] || '').toString().toLowerCase();
                return valA < valB ? -1 * sortOrder : (valA > valB ? 1 * sortOrder : 0);
            });
        }
        // This logic adds pagination to the response
        const pageSize = parseInt(limit) || 10; 
        const currentPage = parseInt(page) || 1;
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const totalRecords = results.length;
        const paginatedResults = results.slice(startIndex, endIndex);

        res.json({
            total: totalRecords,
            page: currentPage,
            limit: pageSize,
            totalPages: Math.ceil(totalRecords / pageSize),
            data: paginatedResults
        });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
});


// This GET is for Fetching a single user by ID
app.get('/api/v1/users/:id', (req, res) => {
    const rawId = req.params.id;

    // 1. Gatekeeper: Validate ID format (Numeric only)
    // if (!/^\d+$/.test(rawId)) {
    //     return res.status(400).json({
    //         error: "Invalid ID Format",
    //         method: req.method,
    //         message: "The user ID must be a positive integer."
    //     });
    // }

    // const numericId = parseInt(rawId, 10);

    // 2. Search for the user
    const user = users.find(a => a.id === rawId);

    // 3. Handle Not Found
    if (!user) {
        return res.status(404).json({
            error: "User Not Found",
            method: req.method,
            message: `No user found with ID ${rawId}`
        });
    }

    // 4. Success Response
    res.status(200).json({
        data: user
    });
});


app.delete('/api/v1/users/:id', (req, res) => {
    const rawId = req.params.id;

    // 1. Validate ID format BEFORE conversion
    // We use a Regex to ensure the string contains ONLY digits
    // if (!/^\d+$/.test(rawId)) {
    //     return res.status(400).json({
    //         error: "Invalid ID Format",
    //         method: req.method,
    //         message: "The user ID must be a positive integer."
    //     });
    // }

    // 2. Safe to convert now
    // const id = parseInt(rawId, 10);

    const index = users.findIndex(a => a.id === rawId);

    if (index === -1) {
        return res.status(404).json(
            { 
                error: "User Not Found", 
                message: `No user found with ID ${rawId}` 
            });
    }

    // Remove the hash from our Set so the record can be re-added in the future
    const deletedUser = users[index];
    requestHashes.delete(deletedUser.requestHash);

    // Remove from array
    users.splice(index, 1);

    res.status(200).json({
        message: "User successfully decommissioned",
        method: req.method,
        details: {
            id: id,
            hostname: deletedUser.hostname,
            status: "Deleted"
        }
    });
});


app.put('/api/v1/users/:id', validateRequest, (req, res) => {
    const rawId = req.params.id;

    // We use a Regex to ensure the string contains ONLY digits
    // if (!/^\d+$/.test(rawId)) {
    //     return res.status(400).json({
    //         error: "Invalid ID Format",
    //         method: req.method,
    //         message: "The user ID must be a positive integer."
    //     });
    // }

    // const id = parseInt(rawId, 10);

    const index = users.findIndex(a => a.id === rawId);

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            error: "Empty Update",
            method: req.method,
            message: "No data provided for update. Please include the fields you wish to change."
        });
    }

    if (index === -1) {
        return res.status(404).json(
            { 
                error: "User Not Found", 
                message: `No user found with ID ${rawId}` 
            });
    }

    const oldUser = users[index];
    
    const newHash = generateHash(req.body); 

    if (newHash !== oldUser.requestHash && requestHashes.has(newHash)) {
        return res.status(409).json({
            error: "Conflict",
            message: "An user with this exact configuration already exists."
        });
    }

    requestHashes.delete(oldUser.requestHash); 
    requestHashes.add(newHash);   

    users[index] = { 
        ...oldUser, 
        ...req.body, 
        requestHash: newHash, // Save the new hash
        id: rawId
    };

    res.json(users[index]);
});


const PORT = 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

app.use((req, res) => {
    res.status(404).json({
        error: "Endpoint Not Found",
        method: req.method,
        path: req.originalUrl,
        message: `The ${req.method} request to ${req.originalUrl} is invalid. If you are attempting to UPDATE or DELETE, ensure the numeric ID is appended to the URL (e.g., /api/v1/users/1).`
    });
});


export { app };