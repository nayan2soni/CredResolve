import express from 'express';
import { addExpense, getGroupExpenses } from '../controllers/expenseController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.use(requireAuth);

router.post('/', addExpense);
router.get('/group/:groupId', getGroupExpenses);

export default router;
