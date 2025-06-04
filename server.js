const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import route modules
const chatCompletionRouter = require('./routes/chatCompletionRouter');
const pineconeRouter = require('./routes/pineconeRouter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON
app.use(express.json());

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Register API routes
app.use('/chat/completions', chatCompletionRouter);
app.use('/rag/pinecone', pineconeRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
