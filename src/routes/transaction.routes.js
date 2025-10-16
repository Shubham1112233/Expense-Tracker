import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from '../controllers/transaction.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listTransactions);

router.post(
  '/',
  [
    body('type').isIn(['income', 'expense']),
    body('amount').isFloat({ gt: 0 }),
    body('category').isString().isLength({ min: 1 }).trim(),
    body('description').optional().isString().trim(),
    body('date').isISO8601()
  ],
  createTransaction
);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('type').isIn(['income', 'expense']),
    body('amount').isFloat({ gt: 0 }),
    body('category').isString().isLength({ min: 1 }).trim(),
    body('description').optional().isString().trim(),
    body('date').isISO8601()
  ],
  updateTransaction
);

router.delete('/:id', [param('id').isMongoId()], deleteTransaction);

export default router;


