import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

export async function getUserData(req, res, next) {
    try {
        const userId = req.user.id;
        const transactions = await Transaction.find({ userId: userId });
        res.status(200).json({
            success: true,
            message: "User data fetched successfully",
            data: { transactions },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching user data",
            error: error.message,
        });
    }
}

export default getUserData;