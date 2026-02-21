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
        expect(res.body.error).toBe("Invalid ID Format");
    });

    // Test 3:POST TEST (Create)
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


    // Test 4: DUPLICATE POST TEST (Create)
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

    // test 5:PUT TEST (Update) ---
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

    // test 5:PUT TEST (Update) ---
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

    // Test 6: DELETE TEST (Remove) ---
    it('should delete the test user', async () => {
        const res = await request(app)
            .delete(`/api/v3/users/${testUserId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('User successfully deleted');
    });

    // Test 7: DELETE TEST (Remove) ---
    it('should not delete a non-existent user', async () => {
        const res = await request(app)
            .delete(`/api/v3/users/1111155D-B173-44C5-88C9-396905F30F3D`);

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toContain('No record found');
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
