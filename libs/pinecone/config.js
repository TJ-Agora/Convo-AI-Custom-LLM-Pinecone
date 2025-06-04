/**
 * Pinecone Configuration
 * Sets up and exports the Pinecone client
 */
const { Pinecone } = require('@pinecone-database/pinecone');
const fetch = require('node-fetch');

// Initialize Pinecone client
const initPinecone = async () => {
  try {
    // Check for required environment variables
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }

    if (!process.env.PINECONE_INDEX_NAME) {
      throw new Error('PINECONE_INDEX_NAME environment variable is required');
    }

    // Check for environment variable which might be needed (depending on Pinecone setup)
    if (!process.env.PINECONE_ENVIRONMENT) {
      throw new Error('PINECONE_ENVIRONMENT environment variable is required');
    }

    // Initialize the Pinecone client
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      fetchApi: fetch
    });

    console.log('Pinecone client initialized successfully');

    // Get the index
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

    return {
      pinecone,
      index
    };
  } catch (error) {
    console.error('Error initializing Pinecone:', error.message);
    throw error;
  }
};

module.exports = {
  initPinecone
};
