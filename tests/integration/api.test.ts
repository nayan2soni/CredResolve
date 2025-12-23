import request from 'supertest';

// Mock Prisma Client to prevent initialization error
jest.mock('../../src/config/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
        },
        // Add other models if needed
    },
}));

// Mock Supabase Client
jest.mock('../../src/config/supabase', () => ({
    __esModule: true,
    supabase: {
        auth: {
            getUser: jest.fn(),
        },
    },
}));

import app from '../../src/app';

describe('API Integration Tests', () => {
    it('GET /health should return 200 OK', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });

    it('GET /api/balances should return 401 without token', async () => {
        const res = await request(app).get('/api/balances/group123'); // Assuming route structure
        // Since we didn't send a token, and auth middleware is presumably applied
        // checks authController logic.
        // If auth middleware is applied globally or on this route, it should be 401.
        // If "Core Features Complete" includes auth, then yes.
        expect(res.status).toBe(401);
    });
});
