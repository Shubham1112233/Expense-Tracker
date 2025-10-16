import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import getUserData from '../controllers/userData.controller.js';

const router = Router();

router.get('/', requireAuth, getUserData);

export default router;