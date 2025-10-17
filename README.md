FinanceAI - This is a repository containing a backend code, A Finance AI is full stack MERN Application to fulfill your financial needs smartly with AI and top notch UI features.

API

- Auth
  - POST `/api/auth/signup` { name, email, password }
  - POST `/api/auth/login` { email, password }
- Transactions (requires `Authorization: Bearer <token>`)
  - GET `/api/transactions?type=&category=&q=&startDate=&endDate=&page=&limit=`
  - POST `/api/transactions` { type: 'income'|'expense', amount, category, description?, date }
  - DELETE `/api/transactions/:id`


