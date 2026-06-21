import dotenv from 'dotenv';
// Load environment variables from parent directory if needed
dotenv.config();

import { connectToDatabase } from '../config/db.js';
import Transaction from '../models/Transaction.js';
import { getEmbedding } from '../lib/embeddings.js';
import mongoose from 'mongoose';

async function backfill() {
  console.log('Starting transaction embeddings backfill script...');
  
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.error('ERROR: HUGGINGFACE_API_KEY is not defined in the environment. Exiting.');
    process.exit(1);
  }

  try {
    await connectToDatabase();

    // Find transactions where embedding field doesn't exist, is null, or is empty
    const transactions = await Transaction.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: null },
        { embedding: { $size: 0 } }
      ]
    });

    console.log(`Found ${transactions.length} transactions requiring embeddings.`);

    if (transactions.length === 0) {
      console.log('No transactions require backfilling.');
      return;
    }

    let processedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const textToEmbed = `${transaction.category} - ${transaction.description || ''}`;
      
      console.log(`[${i + 1}/${transactions.length}] Generating embedding for: "${textToEmbed}" (Amount: ₹${transaction.amount})`);
      
      // Call HF API
      const embedding = await getEmbedding(textToEmbed);
      
      if (embedding && embedding.length > 0) {
        transaction.embedding = embedding;
        await transaction.save();
        processedCount++;
        
        // Wait a tiny bit (100ms) to respect free-tier rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        console.error(`Failed to generate embedding for transaction ID: ${transaction._id}`);
        failedCount++;
      }
    }

    console.log(`\nBackfill complete!`);
    console.log(`Successfully updated: ${processedCount} transactions`);
    console.log(`Failed to update: ${failedCount} transactions`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

backfill();
