FinanceAI - This is a repository containing a backend code, A Finance AI is full stack MERN Application to fulfill your financial needs smartly with AI and top notch UI features.

Setup

1. Copy `.env.example` to `.env` and fill values:
   - `PORT` (default 4000)
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `Chatbot_API_Key`
2. Install dependencies:
   - `npm install`
3. Run dev server:
   - `npm run dev`

API

- Auth
  - POST `/api/auth/signup` { name, email, password }
  - POST `/api/auth/login` { email, password }
- Transactions (requires `Authorization: Bearer <token>`)
  - GET `/api/transactions?type=&category=&q=&startDate=&endDate=&page=&limit=`
  - POST `/api/transactions` { type: 'income'|'expense', amount, category, description?, date }
  - DELETE `/api/transactions/:id`


