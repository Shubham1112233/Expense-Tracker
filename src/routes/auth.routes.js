import { Router } from 'express';
import { body } from 'express-validator';
import { login, signup } from '../controllers/auth.controller.js';

const router = Router();

router.post(
  '/signup',
  [
    body('name').isString().isLength({ min: 1 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 6 })
  ],
  signup
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').isString().isLength({ min: 6 })],
  login
);

export default router;


