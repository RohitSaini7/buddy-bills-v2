import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test("landing page renders correctly", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/BuddyBills/);
    await expect(page.getByRole("heading", { name: /Settle bills/i })).toBeVisible();

    const signInButton = page.getByRole("button", { name: /Continue with Google/i });
    await expect(signInButton).toBeVisible();
  });

  test("unauthenticated users are redirected from protected routes", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/.*\/$/);
  });
});
