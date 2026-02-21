import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Configuration object using your SSMS details
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME, 
    options: {
        ...(process.env.DB_INSTANCE && { instanceName: process.env.DB_INSTANCE }),
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Create the connection pool
export const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server: ' + process.env.DB_NAME);
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed!', err);
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
    });

export { sql };