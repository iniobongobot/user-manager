/* global describe, it, expect, afterAll */
import request from 'supertest';
import { app } from '../src/app';
import { sql } from '../src/utils/db';

describe('User API Endpoints', () => {
    let testUserId;

    // Test 1: GET Users
    it('should return 200 OK for the users list', async () => {
        const res = await request(app).get('/api/v3/users');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    // Test 2: Validation Check
    it('should return 400 for an invalid UUID format', async () => {
        const res = await request(app).get('/api/v3/users/not-a-uuid');
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe("Bad Request");
    });

    // POST TEST (Create)
    it('should create a new user', async () => {
        const newUser = {
            first_name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            gender: 'Male',
            status: 'Active'
        };

        const res = await request(app)
            .post('/api/v3/users')
            .send(newUser);

        expect(res.statusCode).toEqual(201);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data).toHaveProperty('request_hash');
        testUserId = res.body.data.id;
        console.log('Created test user with ID:', testUserId);
    });

    // SQL Injection Protection
    it('should neutralize SQL injection attempts in input fields', async () => {
        const maliciousUser = {
            first_name: "'; DROP TABLE Users; --", // The "payload"
            last_name: 'Attacker',
            email: 'hacker@example.com',
            gender: 'Male',
            status: 'Active'
        };

        const res = await request(app)
            .post('/api/v3/users')
            .send(maliciousUser);

        expect(res.statusCode).toBe(400); 
        console.log('SQL Injection attempt blocked by Validation Layer');
    });

    // DUPLICATE POST TEST (Create)
    it('should fail to create duplicate user', async () => {
        const newUser = {
            first_name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            gender: 'Male',
            status: 'Active'
        };

        const res = await request(app)
            .post('/api/v3/users')
            .send(newUser);

        expect(res.statusCode).toEqual(409);
    });

    // PUT TEST (Update) ---
    it('should update the user we just created', async () => {
        const updatedData = {
            first_name: 'UpdatedName',
            last_name: 'User',
            email: 'test@example.com',
            gender: 'Male',
            status: 'Inactive'
        };

        const res = await request(app)
            .put(`/api/v3/users/${testUserId}`)
            .send(updatedData);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('User updated successfully');
    });

    //PUT TEST (Update) ---
    it('should not update with invalid parameters', async () => {
        const updatedData = {
            first_name: 'UpdatedName',
            lastname: 'User',
            email: 'test@example.com',
            gender: 'Male',
            status: 'Inactive'
        };

        const res = await request(app)
            .put(`/api/v3/users/${testUserId}`)
            .send(updatedData);

        expect(res.statusCode).toEqual(400);
    });

    // DELETE TEST (Remove) ---
    it('should delete the test user', async () => {
        const res = await request(app)
            .delete(`/api/v3/users/${testUserId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('User successfully deleted');
    });

    // DELETE TEST (Remove) ---
    it('should not delete a non-existent user', async () => {
        const res = await request(app)
            .delete(`/api/v3/users/1111155D-B173-44C5-88C9-396905F30F3D`);

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toContain('No record found');
    });

    it('should return a limited number of records based on query params', async () => {
        const limit = 2;
        const res = await request(app)
            .get(`/api/v3/users?limit=${limit}&page=1`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toBeLessThanOrEqual(limit);
        expect(res.body.meta).toHaveProperty('currentPage');
        console.log(`Pagination check: Returned ${res.body.data.length} records.`);
    });


    it('should reject names containing invalid characters (numbers/symbols)', async () => {
        const invalidUser = {
            first_name: 'John123', // Numbers should not be allowed
            last_name: 'Doe!',     // Symbols should be stripped or rejected
            email: 'not-an-email', // Invalid email format
            gender: 'Male',
            status: 'Active'
        };

        const res = await request(app)
            .post('/api/v3/users')
            .send(invalidUser);

        expect(res.statusCode).toEqual(400);
        console.log('Sanitization check: Invalid data rejected.');
    });

    afterAll(async () => {
        try {
            await sql.close(); 
            console.log('SQL Pool closed. Jest can exit safely.');
        } catch (err) {
            console.error('Error closing SQL pool:', err);
        }
    });

    

});
