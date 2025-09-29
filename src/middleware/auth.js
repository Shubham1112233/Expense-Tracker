import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || '');
    const user = await User.findById(payload.userId).lean();
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = { id: user._id, email: user.email, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}


