# CredResolve

CredResolve is a modern expense-sharing application designed to simplify shared financial management for friend groups, roommates, and trips. It allows users to track expenses, split costs efficiently, and settle debts with ease.

## 🚀 Features

*   **Group Management**: Create groups and add members via email or username.
*   **Expense Tracking**: Add expenses with flexible split options:
    *   **Equal**: Split costs evenly among all members.
    *   **Exact**: Specify exact amounts for each person.
    *   **Percentage**: Distribute costs by percentage.
*   **Smart Balances**: Real-time calculation of "Who owes Who".
*   **Settlements**: Record payments to settle debts between members.
*   **Audit Logs**: (Coming Soon) Track all changes and edits.

## 🛠️ Tech Stack

### Backend
*   **Node.js & Express**: API server.
*   **TypeScript**: Type safety and better developer experience.
*   **PostgreSQL**: Relational database for structured data.
*   **Prisma**: ORM for type-safe database access.
*   **Supabase Auth**: Secure authentication and user management.

### Frontend
*   **React (Vite)**: Fast and responsive UI.
*   **TypeScript**: Component props and API response typing.
*   **Supabase Client**: For authentication state management.
*   **Axios**: API requests.
*   **Lucide React**: Beautiful icons.

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL Database (or Supabase URL)

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/db?schema=public"

# Auth (Supabase)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
JWT_SECRET="your-jwt-secret" # Used for verifying Supabase tokens
PORT=3000
```

### Running Locally

1.  **Install Dependencies**
    ```bash
    npm install
    cd frontend && npm install && cd ..
    ```

2.  **Database Migration**
    ```bash
    npx prisma migrate dev
    npx prisma generate
    ```

3.  **Start Backend**
    ```bash
    npm run dev
    ```

4.  **Start Frontend**
    ```bash
    cd frontend
    npm run dev
    ```

## 🚀 Deployment

This project is configured for deployment on **Vercel**.

1.  Push to GitHub.
2.  Import the project into Vercel.
3.  Set the Root Directory to `.` (Current).
4.  Add the environment variables in Vercel.
5.  Deploy!

**Note:** The backend uses `api/index.ts` as the Serverless Function entry point.

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
