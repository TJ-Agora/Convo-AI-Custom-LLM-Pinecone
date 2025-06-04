/**
 * Pinecone Router
 * Routes for interacting with the Pinecone database through pineconeService
 */
const express = require('express');
const router = express.Router();
const {
  storeRecord,
  queryRecords,
  deleteRecord,
  clearAllRecords,
  generateEmbedding
} = require('../libs/pinecone/pineconeService');

// Store a new record in Pinecone
router.post('/store', async (req, res) => {
  try {
    const record = req.body;

    if (!record || !record.text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = await storeRecord(record);
    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('Error in store endpoint:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Query records from Pinecone based on semantic similarity
router.post('/query', async (req, res) => {
  try {
    const { query, options } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await queryRecords(query, options || {});
    res.json(results);
  } catch (error) {
    console.error('Error in query endpoint:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete a record from Pinecone by ID
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await deleteRecord(id);
    res.json({ success: true, message: `Record ${id} deleted successfully` });
  } catch (error) {
    console.error('Error in delete endpoint:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Clear all records from Pinecone (dangerous operation)
router.delete('/clear/all', async (req, res) => {
  try {
    await clearAllRecords();
    res.json({ success: true, message: 'All records cleared successfully' });
  } catch (error) {
    console.error('Error in clear all endpoint:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Generate embeddings for text (utility endpoint)
router.post('/embed', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const embedding = await generateEmbedding(text);
    res.json({ embedding });
  } catch (error) {
    console.error('Error in embed endpoint:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
