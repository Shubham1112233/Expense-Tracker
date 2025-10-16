import { validationResult } from 'express-validator';
import Transaction from '../models/Transaction.js';

export async function listTransactions(req, res, next) {
  try {
    const { page = 1, limit = 20, type, category, q, startDate, endDate } = req.query;
    const filter = { userId: req.user.id };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (q) filter.description = { $regex: q, $options: 'i' };

    const docs = await Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    const total = await Transaction.countDocuments(filter);
    res.json({ data: docs, total });
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { type, amount, category, description, date } = req.body;
    const doc = await Transaction.create({
      userId: req.user.id,
      type,
      amount,
      category,
      description,
      date: new Date(date)
    });
    res.status(201).json({ data: doc });
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;
    const userId = req.user.id;
    
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: userId },
      { type, amount, category, description, date: new Date(date) },
      { new: true }
    );
    
    if (!updatedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ data: updatedTransaction });
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await Transaction.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}


