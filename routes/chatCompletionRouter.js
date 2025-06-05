/**
 * LLM Proxy Route
 * Acts as a middleware between our application and LLM API
 * Implements RAG (Retrieval-Augmented Generation) using Pinecone
 */
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { queryRecords } = require('../libs/pinecone/pineconeService');

// OpenAI API endpoint
const LLM_API_URL = "https://api.openai.com/v1/chat/completions";
const llmApiKey = process.env.LLM_API_KEY;
/**
 * POST /chat/completions
 * Proxies requests to LLM API
 * Logs the request and forwards it to the API
 */
router.post('/', async (req, res) => {
  try {
    const {
      messages,
      model = 'gpt-4o-mini',
      stream = false,
      channel = 'ccc',
      userId = '111',
      appId = '20b7c51ff4c644ab80cf5a4e646b0537',
      queryRag = false,
    } = req.body;

    const payload = {
      messages,
      model,
      stream
    }

    const checks = [
      { value: llmApiKey, error: 'LLM API key not configured' },
      { value: messages, error: 'Missing "messages" in request body' },
      { value: appId, error: 'Missing "appId" in request body' },
    ];

    for (const { value, error } of checks) {
      if (!value) {
        return res.status(400).json({ error });
      }
    }

    // Query RAG if enabled
    if (queryRag) {
      const lastMessage = messages[messages.length - 1];
      const userQuery = lastMessage.content;

      try {
        // 1) Retrieve relevant records based on the user's query
        const relevantRecords = await queryRecords(userQuery, { limit: 5 });

        // 2) Decide which context message to insert
        let systemContextMessage;

        if (relevantRecords.length > 0) {
          // --- We have at least one relevant record ---
          // Sort by timestamp (oldest first)
          relevantRecords.sort((a, b) => {
            const aTime = typeof a.timestamp === 'string'
              ? parseInt(a.timestamp, 10)
              : a.timestamp;
            const bTime = typeof b.timestamp === 'string'
              ? parseInt(b.timestamp, 10)
              : b.timestamp;
            return aTime - bTime;
          });

          // Build a generic “records” context string
          let contextText = "Here are some records from the database that may help answer your query:\n\n";
          relevantRecords.forEach(record => {
            contextText += `- ${record.text}\n`;
          });

          systemContextMessage = {
            role: 'system',
            content:
              contextText +
              "\nUse the above information to answer the user's question. " +
              "If you don't have enough information to answer completely, acknowledge what you know and what you don't know."
          };
        } else {
          // --- No relevant records found; do NOT fetch recentRecords ---
          systemContextMessage = {
            role: 'system',
            content:
              `We were not able to find information in our database concerning this user's query: "${userQuery}". ` +
              "Try to answer if you know the answer; otherwise explain that you don't have that information."
          };
        }

        // 3) Insert the chosen system message just before the user's last message
        messages.splice(messages.length - 1, 0, systemContextMessage);
        console.log('Added context to messages');
      } catch (error) {
        console.error('Error retrieving records:', error.message);
        // Continue without context if there's an error with Pinecone
        console.log('Proceeding without context due to error');
      }
    }

    if (stream) {
      // Handle streaming response
      const llmResponse = await axios({
        method: 'post',
        url: LLM_API_URL,
        data: payload,
        headers: {
          'Authorization': `Bearer ${llmApiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      });

      // Set appropriate headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Listen for streaming data
      llmResponse.data.on('data', (chunk) => {
        const chunkString = chunk.toString();
        res.write(chunkString);
      });

      // Handle the end of the stream
      llmResponse.data.on('end', () => {
        res.end();
      });

      // Handle errors in the stream
      llmResponse.data.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error' });
        }
      });

      // No need to end the response here, as it will be ended by the pipe
    } else {
      // Handle non-streaming response
      const llmResponse = await axios.post(LLM_API_URL, payload, {
        headers: {
          'Authorization': `Bearer ${llmApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return res.status(200).json(llmResponse.data);
    }
  } catch (error) {
    console.error('LLM Proxy Error:');

    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data.error || 'Error from LLM API'
      });
    } else if (error.request) {
      return res.status(500).json({ error: 'No response received from LLM API' });
    } else {
      return res.status(500).json({ error: error.message || 'Unknown error occurred' });
    }
  }
});

module.exports = router;
