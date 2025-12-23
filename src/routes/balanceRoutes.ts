
import express from 'express';
import { getUserBalance } from '../controllers/balanceController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.use(requireAuth);

router.get('/summary', getUserBalance);

export default router;
