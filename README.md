# BuddyBills

A group expense tracking application. BuddyBills calculates splits and tracks group balances.

This replaces the 2024 V1 Next.js and NestJS monolith with a Next.js serverless app.

## Tech stack

- **Framework:** Next.js (App Router + Server Actions)
- **Database:** PostgreSQL (Hosted on Neon)
- **ORM:** Drizzle ORM
- **Authentication:** Better Auth (Google OAuth)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Package Manager:** Bun

## Core features

- **OAuth authentication.** Login via Google.
- **Group management.** Create groups and manage members.
- **Split options.** Split bills by equal amounts, exact amounts, percentages, or shares.
- **Debt simplification.** Calculates the fewest number of transactions needed to settle debts.

## Local development

This project uses [Bun](https://bun.sh/) for dependency management and execution.

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
