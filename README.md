# Agora Conversational AI with RAG and Pinecone

This repository demonstrates how to integrate Retrieval-Augmented Generation (RAG) using Pinecone into a custom LLM for Agora's Conversational AI. The project provides a foundation for creating more contextually aware and knowledge-enhanced AI conversations by leveraging vector embeddings and semantic similarity search.

## Features

- **Vector Database Integration**: Store and retrieve vector embeddings with Pinecone
- **RAG Implementation**: Enhance LLM responses with relevant context from your knowledge base
- **API Endpoints**: Ready-to-use REST APIs for managing records and generating AI completions
- **Streaming Support**: Real-time streaming responses from LLM APIs
- **Easy Setup**: Simple configuration with environment variables

## Prerequisites

- Node.js (v18+)
- Pinecone account and API key
- OpenAI API key (or other LLM provider)
- Agora account (for Conversational AI integration)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/TJ-Agora/Convo-AI-Custom-LLM-Pinecone.git
cd Convo-AI-Custom-LLM-Pinecone
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```
# LLM API (OpenAI by default)
LLM_API_KEY=your_llm_api_key

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=your_pinecone_index_name

# Server Configuration
PORT=3000
```

### 4. Start the Server

```bash
npm run dev
```

The server will be available at `http://localhost:3000` (or the port you specified).

## Project Structure

```
.
├── libs/
│   └── pinecone/
│       ├── config.js         # Pinecone initialization
│       └── pineconeService.js # Vector database operations
├── routes/
│   ├── chatCompletionRouter.js # LLM integration with RAG
│   └── pineconeRouter.js     # CRUD operations for Pinecone
├── .env.example              # Example environment variables
├── package.json              # Dependencies and scripts
├── server.js                 # Express server setup
└── README.md                 # Project documentation
```

## API Endpoints

### Pinecone Operations

- **POST /rag/pinecone/store**: Store a new record with vector embedding
  ```json
  {
    "text": "Your text to be embedded and stored",
    "id": "optional-custom-id"
  }
  ```

- **POST /rag/pinecone/query**: Search for records by semantic similarity
  ```json
  {
    "query": "Your search query",
    "options": {
      "limit": 5
    }
  }
  ```

- **DELETE /rag/pinecone/:id**: Delete a specific record by ID

- **DELETE /rag/pinecone/clear/all**: Clear all records (use with caution)

- **POST /rag/pinecone/embed**: Generate embedding for text without storing
  ```json
  {
    "text": "Text to generate embedding for"
  }
  ```

### Chat Completion with RAG

- **POST /chat/completions**: Get AI response with RAG enhancement
  ```json
  {
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Tell me about vector databases."}
    ],
    "model": "gpt-4o-mini",
    "stream": false,
    "queryRag": true
  }
  ```

## How RAG Works in This Project

1. User query is received by the chat completion endpoint
2. If `queryRag` is enabled, the system:
   - Converts the query to a vector embedding
   - Searches Pinecone for semantically similar records
   - Formats and injects relevant records as context
3. The enhanced prompt is sent to the LLM (e.g., OpenAI)
4. The LLM response, now informed by your knowledge base, is returned

## Integration with Agora Conversational AI

This project is designed to work with Agora's Conversational AI by:

1. Providing enhanced context to improve responses
2. Supporting streaming for real-time conversation
3. Maintaining conversation history and context

For full integration with Agora's Convo AI Engine, refer to the [official Agora documentation](https://docs.agora.io/en/conversational-ai/overview/product-overview).

---

Built for demonstration purposes - customize for your specific needs.
