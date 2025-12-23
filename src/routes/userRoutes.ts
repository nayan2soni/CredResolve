import express from 'express';
import { searchUsers } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/search', requireAuth, searchUsers);

export default router;
