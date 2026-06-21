import { pipeline } from '@huggingface/transformers';

let extractorInstance = null;

/**
 * Get or initialize the local feature-extraction pipeline.
 * Uses Xenova/all-MiniLM-L6-v2 which runs locally on WebAssembly/ONNX.
 */
async function getExtractor() {
  if (!extractorInstance) {
    console.log('Loading local feature extraction model (Xenova/all-MiniLM-L6-v2)...');
    extractorInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Local feature extraction model loaded successfully.');
  }
  return extractorInstance;
}

/**
 * Generate a vector embedding for a given text query locally.
 * Produces a 384-dimensional vector.
 * 
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
export async function getEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return [];
  }

  try {
    const extractor = await getExtractor();
    // Run local inference
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    
    // Convert Tensor data into standard JavaScript array
    if (output && output.data) {
      return Array.from(output.data);
    }
    
    console.error('Unexpected Tensor output format:', output);
    return [];
  } catch (error) {
    console.error('Local embedding generation failed:', error.message);
    return [];
  }
}

/**
 * Calculates the cosine similarity score between two numeric vectors.
 * Returns a value between -1 and 1.
 * 
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} similarity score
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  if (vecA.length !== vecB.length) {
    console.warn(`Cosine similarity warning: Vector lengths do not match (${vecA.length} vs ${vecB.length}).`);
    return 0;
  }

  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
