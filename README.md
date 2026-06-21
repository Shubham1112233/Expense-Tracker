# FinanceAI - Backend

> 🔗 Connected to Frontend: [Expense-Tracker-UI](https://github.com/Shubham1112233/Expense-Tracker-UI)

**FinanceAI** is a full-stack MERN application that combines personal finance tracking with AI-powered insights. It uses **Vector Search** and **Retrieval-Augmented Generation (RAG)** to deliver truly personalized financial advice based on your actual transaction history.

---

## 🚀 What's New - Vector Search & RAG Integration

We've upgraded the AI Playground with semantic intelligence:

- **Local Vector Embeddings**: Every transaction (category + description) is converted into a 384-dimensional semantic vector using `@huggingface/transformers` (`Xenova/all-MiniLM-L6-v2`) running locally via ONNX — no external API calls needed.
- **Cosine Similarity Search**: When you ask the AI about a financial goal, the backend finds the most semantically similar transactions in your history using cosine similarity.
- **RAG (Retrieval-Augmented Generation)**: The top matching transactions are injected as context into the Hugging Face LLM prompt, enabling it to give deeply personalized, data-backed advice (e.g., flagging that your Rent expense exceeds your monthly income when you ask about buying a phone).

---

## 🧠 Tech Stack

- **Runtime**: Node.js + Express
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT + bcryptjs
- **AI/LLM**: Hugging Face Router API (`zai-org/GLM-4.6:novita`)
- **Embeddings**: `@huggingface/transformers` (local ONNX inference)
- **Security**: Helmet, CORS, express-rate-limit, express-validator

---

## 📡 API Reference

### Auth
| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/api/auth/signup` | `{ name, email, password }` |
| POST | `/api/auth/login` | `{ email, password }` |

### Transactions
> All routes require `Authorization: Bearer <token>` header

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions (supports filters: `type`, `category`, `q`, `startDate`, `endDate`, `page`, `limit`) |
| POST | `/api/transactions` | Create transaction — auto-generates vector embedding |
| PUT | `/api/transactions/:id` | Update transaction — regenerates embedding |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/search?q=<query>&limit=5` | **NEW** — Semantic vector search across your transactions |

### AI Playground
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai-playground` | **RAG-enhanced** — Checks affordability using your real transaction history as context |

---

## ⚙️ Setup & Running Locally

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root with the following:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   PORT=4000
   ```
4. *(First time only)* Backfill embeddings for existing transactions:
   ```bash
   node src/scripts/backfill-embeddings.js
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🚢 Deployment

Deployed on **Render**.
