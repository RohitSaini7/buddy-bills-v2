# Deployment Guide

This guide outlines how to deploy BuddyBills v2 to a production environment (such as Vercel).

## 1. Environment Variables

Set the following environment variables in your Vercel project settings:

- `DATABASE_URL`: Your production PostgreSQL connection string.
- `BETTER_AUTH_SECRET`: A secure random string (e.g., generated with `openssl rand -base64 32`).
- `BETTER_AUTH_URL`: The production URL of your application (e.g., `https://buddybills.yourdomain.com`).
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: OAuth credentials from Google Cloud Console. Make sure your production domain is added to the allowed origins and redirect URIs in Google Cloud Console.
- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Credentials for your production Redis instance (used for rate limiting).
- `SENTRY_DSN`: If you choose to use Sentry for error tracking, add your project's DSN.

## 2. Database Migrations

**Important:** Do not use `bunx drizzle-kit push` for a production database.

For production, you should:

1. Generate a migration file locally:
   ```bash
   bunx drizzle-kit generate
   ```
2. Apply the migrations to the production database:
   ```bash
   bunx drizzle-kit migrate
   ```

_Note: Since the project uses Postgres, running `migrate` via a separate script or CI step ensures controlled schema updates._

## 3. Rate Limiting (Redis)

Create a separate Upstash Redis database for production. This isolates development rate-limit state from production. Ensure the production credentials are set in the Vercel environment variables.

## 4. CI/CD & Preview Deployments

- A GitHub Actions workflow is provided (`.github/workflows/ci.yml`) to automatically run linting, formatting checks, and a full build on every push to `main` and all pull requests.
- Vercel automatically creates preview deployments for Pull Requests.

## 5. Security & Analytics

- **Security Headers**: `next.config.ts` is configured with strict security headers (CSP, HSTS, X-Frame-Options) out of the box.
- **Analytics & Error Tracking**: The app uses `@vercel/analytics` and `@sentry/nextjs`. They will automatically activate when deployed to Vercel with the proper DSN configured.
