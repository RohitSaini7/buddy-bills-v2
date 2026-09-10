import { test, expect } from "@playwright/test";

test.describe("Group Lifecycle", () => {
  test.skip("user can create a group, add an expense, and settle up", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /Create Group/i }).click();
    await page.getByLabel(/Group Name/i).fill("Weekend Trip");
    await page.getByRole("button", { name: "Create" }).click();

    await expect(page).toHaveURL(/.*\/groups\/.*/);
    await expect(page.getByRole("heading", { name: "Weekend Trip" })).toBeVisible();

    await page.getByRole("tab", { name: /Members/i }).click();
    await page.getByPlaceholder(/Email/i).fill("friend@example.com");
    await page.getByRole("button", { name: "Add Member" }).click();
    await expect(page.getByText("friend@example.com")).toBeVisible();

    await page.getByRole("tab", { name: /Expenses/i }).click();
    await page.getByRole("button", { name: /Add Expense/i }).click();
    await page.getByLabel(/Description/i).fill("Dinner");
    await page.getByLabel(/Amount/i).fill("1000");
    await page.getByRole("button", { name: "Save Expense" }).click();

    await expect(page.getByText("Dinner")).toBeVisible();
    await expect(page.getByText("₹1,000.00")).toBeVisible();

    await page.getByRole("tab", { name: /Balances/i }).click();

    await expect(page.getByText(/You are owed ₹500\.00/i)).toBeVisible();

    await page.getByRole("tab", { name: /Settings/i }).click();
    await page.getByRole("button", { name: /Delete Group/i }).click();
    await page.getByRole("button", { name: /Confirm/i }).click();

    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});
