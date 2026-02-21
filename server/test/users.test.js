import request from 'supertest';
import { app } from '../src/app';
import { sql } from '../src/utils/db';

describe('User API Endpoints', () => {
    let testUserId;

    // Test 1: GET Users
    it('should return 200 OK for the users list', async () => {
        const res = await request(app).get('/api/v2/users');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    // Test 2: Validation Check
    it('should return 400 for an invalid UUID format', async () => {
        const res = await request(app).get('/api/v2/users/not-a-uuid');
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
            .post('/api/v2/users')
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
            .post('/api/v2/users')
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
            .put(`/api/v2/users/${testUserId}`)
            .send(updatedData);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('User updated successfully');
    });

    // Test 6: DELETE TEST (Remove) ---
    it('should delete the test user', async () => {
        const res = await request(app)
            .delete(`/api/v2/users/${testUserId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('User successfully deleted');
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
