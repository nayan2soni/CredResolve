import express from 'express';
import { createGroup, getGroups } from '../controllers/groupController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.use(requireAuth);

router.route('/')
    .get(getGroups)
    .post(createGroup);

export default router;
