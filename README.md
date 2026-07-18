# BuddyBills

A modern, fast group expense tracking application. BuddyBills handles complex group balances, calculates exact splits, and tracks who owes what without friction.

This is a complete architectural rewrite of the original 2024 V1, migrating from a split Next.js/NestJS monolith to a unified, serverless edge infrastructure.

## 🚀 Tech Stack

- **Framework:** Next.js (App Router + Server Actions)
- **Database:** PostgreSQL (Hosted on Neon)
- **ORM:** Drizzle ORM
- **Authentication:** Better Auth (Google OAuth)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Package Manager:** Bun

## ✨ Core Features

- **OAuth Authentication:** Secure, password-less login via Google.
- **Group Management:** Create groups and manage members seamlessly.
- **Complex Math Engine:** Supports uneven splits (equal, exact, percentage, and shares).
- **Automated Ledger:** Calculates the most efficient repayment paths to settle debts.

## 🛠 Local Development

This project uses [Bun](https://bun.sh/) for ultra-fast dependency management and execution.

### 1. Clone the repository

```bash
git clone https://github.com/RohitSaini7/buddy-bills-v2
cd buddy-bills-v2
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up environment variables

Create a `.env` file in the root directory and add the following keys:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/buddy_bills"

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your-random-32-char-secret"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 4. Push the database schema

Sync the Drizzle schema with your Postgres instance:

```bash
bunx drizzle-kit push
```

### 5. Start the development server

```bash
bun dev
```

The application will be available at `http://localhost:3000`.
