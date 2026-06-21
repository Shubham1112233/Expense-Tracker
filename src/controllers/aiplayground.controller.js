import { OpenAI } from "openai";
import axios from "axios";
import Transaction from "../models/Transaction.js";
import { getEmbedding, cosineSimilarity } from "../lib/embeddings.js";

// Initialize Hugging Face router client
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HUGGINGFACE_API_KEY,
});

// Function to get estimated product price and affordability
export async function checkAffordability(productName, userIncome, userExpenses, relatedTransactionsContext) {
  try {
    // Compose the user message for the model
    const prompt = `
      Given a user with monthly income of ₹${userIncome} and monthly expenses of ₹${userExpenses},
      what is the estimated price of "${productName}" in India, and how many months would it take
      for the user to afford it?
      
      Here are the user's specific recent transactions semantically related to "${productName}":
      ${relatedTransactionsContext}
      
      Provide a personalized advice analyzing their budget, noting their average savings, and factoring in their relevant recent transactions. Keep it short.
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

    // Retrieve semantically matching transaction context for RAG
    let relatedTransactionsContext = "No specific related transactions found.";
    try {
      const queryVector = await getEmbedding(productName);
      if (queryVector && queryVector.length > 0) {
        const transactions = await Transaction.find({
          userId,
          embedding: { $exists: true, $ne: [] }
        }).lean();

        // Calculate similarity and sort
        const scored = transactions.map(t => ({
          ...t,
          score: cosineSimilarity(queryVector, t.embedding)
        }));
        scored.sort((a, b) => b.score - a.score);

        // Take top 5 transactions with similarity > 0.1
        const matches = scored.filter(s => s.score > 0.1).slice(0, 5);
        if (matches.length > 0) {
          relatedTransactionsContext = matches.map(m => {
            const dateStr = m.date ? new Date(m.date).toISOString().split('T')[0] : 'N/A';
            return `- Date: ${dateStr}, Category: ${m.category}, Description: ${m.description || 'N/A'}, Amount: ₹${m.amount}`;
          }).join('\n');
        }
      }
    } catch (err) {
      console.error("Error retrieving semantic context for RAG:", err);
    }

    const productDetails = await checkAffordability(productName, incomeAverage, expenseAverage, relatedTransactionsContext);
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
