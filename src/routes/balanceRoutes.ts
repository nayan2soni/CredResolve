import express from 'express';
import { getBalances } from '../controllers/balanceController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.use(requireAuth);

router.get('/:groupId', getBalances);

export default router;
