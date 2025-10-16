import { OpenAI } from "openai";
import axios from "axios";
import Transaction from "../models/Transaction.js";

// Initialize Hugging Face router client
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HUGGINGFACE_API_KEY,
});

// Function to get estimated product price and affordability
export async function checkAffordability(productName, userIncome, userExpenses) {
  try {
    // Compose the user message for the model
    const prompt = `
      Given a user with monthly income of ₹${userIncome} and monthly expenses of ₹${userExpenses},
      what is the estimated price of ${productName} in India, and how many months would it take
      for the user to afford it? Give a short explanation.
    `;

    const chatCompletion = await client.chat.completions.create({
      model: "zai-org/GLM-4.6:novita", // You can change model if needed
      messages: [
        { role: "user", content: prompt },
      ],
    });

    // Extract model response
    const responseText = chatCompletion.choices[0].message.content;

    return {
      productName,
      userIncome,
      userExpenses,
      aiOutput: responseText,
    };

  } catch (error) {
    console.error("AI error:", error);
    return { error: "Failed to fetch AI response" };
  }
}

async function calculateIncomeAverages(userId) {
    const result = await Transaction.aggregate([
        { $match: { userId: userId, type: 'income' } },
        { $group: { _id: null, averageIncome: { $avg: "$amount" } } }
    ]);
    // Return the averageIncome value, or null if there are no records
    return result.length > 0 ? result[0].averageIncome : null;
}

async function calculateExpenseAverages(userId) {
    const result = await Transaction.aggregate([
        { $match: { userId: userId, type: 'expense' } },
        { $group: { _id: null, averageExpense: { $avg: "$amount" } } }
    ]);
    // Return the averageExpense value, or null if there are no records
    return result.length > 0 ? result[0].averageExpense : null;
}

export async function aiPlayground(req, res, next) {
  try {
    const { productName } = req.body;
    console.log(productName);
    const userId = req.user.id;
    const incomeAverage = await calculateIncomeAverages(userId);
    const expenseAverage = await calculateExpenseAverages(userId);
    console.log(incomeAverage, expenseAverage);

    if (!incomeAverage || !expenseAverage ) {
        return res.status(400).json({
            success: false,
            message: "No income or expense data found",
        });
    }

    const productDetails = await checkAffordability(productName, incomeAverage, expenseAverage);
    console.log(productDetails);

    res.status(200).json({
      success: true,
      message: "Data received successfully",
      data: { productName, productDetails },
    });
  } catch (error) {
    next(error);
  }
}
