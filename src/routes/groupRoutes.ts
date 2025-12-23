import express from 'express';
import { createGroup, getGroups, getGroupById } from '../controllers/groupController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.use(requireAuth);

router.route('/')
    .get(getGroups)
    .post(createGroup);

router.route('/:id')
    .get(getGroupById);

export default router;
