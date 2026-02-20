// I created a hasher utility to generate unique hashes for my data. 
// The hash will be stored in the database and used to check if the data already exists so we don't duplicate entries.
// we first convert to lowercase and trim the data to ensure consistency, 
// then we use a simple hash function to generate a unique hash.

import crypto from 'crypto';

function generateHash(data) {
    // Convert to lowercase and trim whitespace
    const hash = crypto.createHash('sha256');
    const stringifiedData = JSON.stringify(data, Object.keys(data).sort()).toLowerCase().trim();
    hash.update(stringifiedData);
    return hash.digest('hex');  
}

export { generateHash };