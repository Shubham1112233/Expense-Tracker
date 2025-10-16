import { Router } from 'express';
import { aiPlayground } from '../controllers/aiplayground.controller.js';
import { requireAuth } from '../middleware/auth.js';


const router = Router();

router.post('/', requireAuth , aiPlayground);

export default router;