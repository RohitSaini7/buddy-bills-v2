import { test, expect } from "@playwright/test";

test.describe("Group Lifecycle", () => {
  // We skip this test suite by default in standard E2E unless a test user session can be mocked,
  // because Better Auth with Google OAuth requires a real Google account login.
  // In a real CI environment, you would use a "Test User" credential or mock the session cookie.
  test.skip("user can create a group, add an expense, and settle up", async ({ page }) => {
    // 1. Sign In (Mocked or test user)
    // await loginTestUser(page);

    // 2. Create Group
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /Create Group/i }).click();
    await page.getByLabel(/Group Name/i).fill("Weekend Trip");
    await page.getByRole("button", { name: "Create" }).click();

    // Verify group was created and navigated to
    await expect(page).toHaveURL(/.*\/groups\/.*/);
    await expect(page.getByRole("heading", { name: "Weekend Trip" })).toBeVisible();

    // 3. Add Member
    await page.getByRole("tab", { name: /Members/i }).click();
    await page.getByPlaceholder(/Email/i).fill("friend@example.com");
    await page.getByRole("button", { name: "Add Member" }).click();
    await expect(page.getByText("friend@example.com")).toBeVisible();

    // 4. Add Expense
    await page.getByRole("tab", { name: /Expenses/i }).click();
    await page.getByRole("button", { name: /Add Expense/i }).click();
    await page.getByLabel(/Description/i).fill("Dinner");
    await page.getByLabel(/Amount/i).fill("1000");
    await page.getByRole("button", { name: "Save Expense" }).click();

    // Verify expense appears
    await expect(page.getByText("Dinner")).toBeVisible();
    await expect(page.getByText("₹1,000.00")).toBeVisible();

    // 5. Verify Balances
    await page.getByRole("tab", { name: /Balances/i }).click();
    // Assuming equal split of 1000 between 2 members, creator is owed 500
    await expect(page.getByText(/You are owed ₹500\.00/i)).toBeVisible();

    // 6. Delete Group (Cleanup)
    await page.getByRole("tab", { name: /Settings/i }).click();
    await page.getByRole("button", { name: /Delete Group/i }).click();
    await page.getByRole("button", { name: /Confirm/i }).click();

    // Verify redirected to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});
