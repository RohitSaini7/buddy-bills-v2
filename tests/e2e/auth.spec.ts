import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test("landing page renders correctly", async ({ page }) => {
    await page.goto("/");

    // Check title and main heading
    await expect(page).toHaveTitle(/BuddyBills/);
    await expect(page.getByRole("heading", { name: /Settle bills/i })).toBeVisible();

    // Check for the sign-in button
    const signInButton = page.getByRole("button", { name: /Continue with Google/i });
    await expect(signInButton).toBeVisible();
  });

  test("unauthenticated users are redirected from protected routes", async ({ page }) => {
    // Attempting to visit the dashboard without being logged in
    await page.goto("/dashboard");

    // Should be redirected back to the landing page (or sign-in)
    await expect(page).toHaveURL(/.*\/$/);
  });
});
