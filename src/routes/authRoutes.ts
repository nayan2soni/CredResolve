import express from 'express';
import { syncUser } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// This endpoint should be called after Supabase signup to sync user data to our DB
// We require auth token to ensure the user owns the ID they are claiming (from Supabase)
router.post('/sync', requireAuth, syncUser);

export default router;
