import express from 'express';
import { addSettlement } from '../controllers/settlementController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.use(requireAuth);

router.post('/', addSettlement);

export default router;
