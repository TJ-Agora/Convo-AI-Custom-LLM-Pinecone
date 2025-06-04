/**
 * Pinecone Utility
 * Handles storing and retrieving data to and from Pinecone
 */
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { initPinecone } = require('./config');

// OpenAI API for embeddings
const EMBEDDING_API = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';

// Generate embeddings using OpenAI API
const generateEmbedding = async (text) => {
  try {
    const response = await axios.post(
      EMBEDDING_API,
      {
        input: text,
        model: EMBEDDING_MODEL
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
};

// Store a record in Pinecone
const storeRecord = async (event) => {
  try {
    // Create metadata with text and timestamp
    const timestamp = event.timestamp || Date.now();
    const metadata = {
      text: event.text,
      timestamp: timestamp.toString(),
      // Add other fields as needed
    };

    // Generate embedding for the event text
    const embedding = await generateEmbedding(event.text);

    // Initialize Pinecone
    const { index } = await initPinecone();

    // Create a unique ID for the event
    const id = event.id || uuidv4();

    // Create the vector record
    const record = {
      id,
      values: embedding,
      metadata
    };

    // Upsert the event into Pinecone - using array format as per documentation
    await index.upsert([record]);

    console.log(`Record stored with ID: ${id}`);
    return id;
  } catch (error) {
    if (error.response) {
      console.error('Upsert error:', error.response.data);
    }
    throw error;
  }
};

// Query relevant records based on a user query
const queryRecords = async (query, options = {}) => {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Initialize Pinecone
    const { index } = await initPinecone();

    // Set up filter based on options
    let filter = {};

    // Query Pinecone for similar events
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: options.limit || 5,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined
    });

    // Format and return the results
    return queryResponse.matches.map(match => ({
      id: match.id,
      text: match.metadata.text,
      timestamp: match.metadata.timestamp,
      similarity: match.score
    }));
  } catch (error) {
    if (error.response) {
      console.error('Query error:', error.response.data);
    }
    throw error;
  }
};

// Delete a record from Pinecone
const deleteRecord = async (id) => {
  try {
    // Initialize Pinecone
    const { index } = await initPinecone();

    // Delete the event - using the correct format for Pinecone SDK 5.1.0
    await index.deleteOne(id);

    console.log(`Record deleted with ID: ${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting record:', error.message);
    throw error;
  }
};

// Clear all game events (useful for testing or resetting)
const clearAllRecords = async () => {
  try {
    // Initialize Pinecone
    const { index } = await initPinecone();

    // In newer versions of Pinecone, we need to use a different approach
    // to delete all vectors - we'll use deleteAll
    await index.deleteAll();

    console.log('All records cleared');
    return true;
  } catch (error) {
    console.error('Error clearing records:', error.message);
    throw error;
  }
};

module.exports = {
  storeRecord,
  queryRecords,
  deleteRecord,
  clearAllRecords,
  generateEmbedding
};
