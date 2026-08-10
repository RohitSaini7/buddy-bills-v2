# BuddyBills — Manual Testing Playbook

> A step-by-step walkthrough to verify **every feature** works correctly.
> You need **two browser windows** (or profiles) — one for each test account.

---

## Prerequisites

| Item | Details |
|:-----|:--------|
| Dev server | `bun dev` → `http://localhost:3000` |
| Account A (Creator) | Sign in with your **primary** Google test account |
| Account B (Member) | Sign in with your **secondary** Google test account |

> [!TIP]
> Use two separate browser windows (or incognito for one) so you can stay logged into both accounts simultaneously.

---

## Phase 1 — Landing Page & Auth

### 1.1 Landing Page Renders
- [ ] Open `http://localhost:3000` in a **logged-out** browser
- [ ] Verify: BuddyBills logo, headline ("Settle bills. Keep friends."), interactive split demo, and sign-in button are all visible
- [ ] Verify: Footer shows copyright text
- [ ] Verify: Header has a "Sign In" button

### 1.2 Interactive Split Demo
- [ ] On the landing page, interact with the split demo component
- [ ] Verify: It responds to input and shows split calculations

### 1.3 Sign In (Account A)
- [ ] Click **"Get Started"** or **"Sign In"** button
- [ ] Complete Google OAuth flow with Account A
- [ ] Verify: You are redirected to `/dashboard`
- [ ] Verify: Welcome message shows your name and email

### 1.4 Sign In (Account B — separate browser window)
- [ ] Open `http://localhost:3000` in a second browser window
- [ ] Sign in with Account B
- [ ] Verify: Dashboard loads with Account B's name

### 1.5 Auth Guard — Unauthenticated Access
- [ ] In a logged-out browser, navigate directly to `http://localhost:3000/dashboard`
- [ ] Verify: You are redirected back to `/` (landing page)

---

## Phase 2 — Group Management (Account A)

### 2.1 Create Group
- [ ] On Account A's dashboard, click **"+ Create Group"**
- [ ] Enter name: `Weekend Trip`
- [ ] Select currency: `USD ($)`
- [ ] Click **"Create Group"**
- [ ] Verify: Group appears on the dashboard under "Your Groups"
- [ ] Verify: Group card shows "1 member" and today's date
- [ ] Verify: Sidebar updates to show the new group

### 2.2 Create Group — Empty Name Validation
- [ ] Click **"+ Create Group"** again
- [ ] Leave name empty, click **"Create Group"**
- [ ] Verify: Error message "Group name is required" appears
- [ ] Close the dialog

### 2.3 Edit Group (via header button)
- [ ] Click into the **"Weekend Trip"** group
- [ ] Click **"Edit Group"** button (pencil icon near group name)
- [ ] Change name to `Weekend Trip — Hawaii`
- [ ] Click **"Save Changes"**
- [ ] Verify: Group name updates immediately on the page header
- [ ] Verify: Success toast appears

### 2.4 Edit Group (via Settings tab)
- [ ] On the same group, click the **Settings** tab
- [ ] Change the group name and/or currency using the form there
- [ ] Click **"Save Changes"**
- [ ] Verify: Settings update, success toast appears

### 2.5 Delete Group (create a throwaway first)
- [ ] Go back to Dashboard
- [ ] Create a new group called `DELETE ME`
- [ ] Click into it
- [ ] Click **"Delete Group"** (red button near group name)
- [ ] Confirm deletion in the dialog
- [ ] Verify: You are redirected to Dashboard and `DELETE ME` is gone
- [ ] Verify: Sidebar no longer shows the deleted group

---

## Phase 3 — Member Management

### 3.1 Add Member (Account B — existing user)
- [ ] In Account A's browser, go to the **"Weekend Trip — Hawaii"** group
- [ ] Click the **Members** tab
- [ ] Enter Account B's email in the "Add Member" input
- [ ] Click **"Invite"**
- [ ] Verify: Success message appears ("Invite sent! Note: The email may go to their spam folder.")
- [ ] Verify: Member count increases to 2

### 3.2 Verify Member Joined (Account B)
- [ ] In Account B's browser, refresh the dashboard
- [ ] Verify: **"Weekend Trip — Hawaii"** now appears in Account B's group list
- [ ] Click into the group
- [ ] Verify: Account B can see the group details, members tab shows both users

### 3.3 Non-Creator Cannot Edit/Delete Group (Account B)
- [ ] In Account B's browser, on the **"Weekend Trip — Hawaii"** group page
- [ ] Verify: **"Edit Group"** and **"Delete Group"** buttons are **NOT visible**
- [ ] Verify: A **"Leave Group"** button IS visible instead
- [ ] Verify: On the Members tab, Account B does NOT see the "Invite" form or "Remove" buttons for other members

### 3.4 Non-Creator Sees "Access Denied" on Settings Tab
- [ ] In Account B's browser, click the **Settings** tab
- [ ] Verify: "Access Denied — Only the group creator can view and modify group settings." message appears

### 3.5 Add Member — Invite Non-Existing User
- [ ] In Account A's browser, go to Members tab
- [ ] Enter an email that is NOT registered: `nobody@example.com`
- [ ] Click **"Invite"**
- [ ] Verify: Success message appears (invite is recorded; email would be sent in production)

### 3.6 Add Member — Duplicate Email
- [ ] In Account A's browser, try inviting Account B's email again
- [ ] Verify: Error "User is already a member of this group."

---

## Phase 4 — Expenses

### 4.1 Add Expense — Equal Split
- [ ] In Account A's browser, go to the **"Weekend Trip — Hawaii"** group
- [ ] Click **"Add Expense"** button
- [ ] Fill in:
  - Description: `Dinner`
  - Amount: `100` (this is $100.00)
  - Paid by: Account A
  - Split type: **Equal**
  - Ensure both members are checked
  - Date: today
- [ ] Click **"Save"**
- [ ] Verify: Expense "Dinner" appears in the expense list showing `$100.00`
- [ ] Verify: Paid by shows Account A's name

### 4.2 Verify Expense Shows for Account B
- [ ] In Account B's browser, go to the **"Weekend Trip — Hawaii"** group
- [ ] Click the **Expenses** tab
- [ ] Verify: "Dinner" expense appears with `$100.00`

### 4.3 Verify Balances Update
- [ ] In Account A's browser, click the **Balances** tab
- [ ] Verify: Account A is **owed** `$50.00` (shown in green as Creditor)
- [ ] Verify: Account B **owes** `$50.00` (shown in red as Debtor)
- [ ] Verify: **Debt Map** on the right shows Account B → Account A: `$50.00`
- [ ] In Account B's browser, click the **Balances** tab
- [ ] Verify: Same balances are shown (mirrored perspective)

### 4.4 Add Expense — Exact Split
- [ ] In Account A's browser, click **"Add Expense"**
- [ ] Fill in:
  - Description: `Hotel`
  - Amount: `200`
  - Paid by: Account A
  - Split type: **Exact**
  - Account A: `80`, Account B: `120`
- [ ] Click **"Save"**
- [ ] Verify: Expense "Hotel" appears in the list at `$200.00`
- [ ] Verify: Splits must add up to total (try mismatched values first, expect error)

### 4.5 Add Expense — Percentage Split
- [ ] Click **"Add Expense"**
- [ ] Fill in:
  - Description: `Car Rental`
  - Amount: `150`
  - Paid by: Account B
  - Split type: **Percentage**
  - Account A: `60%`, Account B: `40%`
- [ ] Click **"Save"**
- [ ] Verify: Expense "Car Rental" appears at `$150.00`, paid by Account B

### 4.6 Add Expense — Shares Split
- [ ] Click **"Add Expense"**
- [ ] Fill in:
  - Description: `Snacks`
  - Amount: `90`
  - Paid by: Account A
  - Split type: **Shares**
  - Account A: `1` share, Account B: `2` shares
- [ ] Click **"Save"**
- [ ] Verify: Expense "Snacks" appears at `$90.00`
- [ ] Verify: Account A's split = `$30.00`, Account B's split = `$60.00`

### 4.7 Edit Expense
- [ ] In Account A's browser, click on the **"Dinner"** expense to expand it
- [ ] Click **"Edit"**
- [ ] Change the amount to `120`
- [ ] Click **"Save"**
- [ ] Verify: Expense updates to `$120.00`
- [ ] Verify: Balances tab reflects the updated amount

### 4.8 Delete Expense
- [ ] In Account A's browser, click on the **"Hotel"** expense
- [ ] Click **"Delete"**
- [ ] Confirm the deletion
- [ ] Verify: "Hotel" expense disappears from the list
- [ ] Verify: Balances update accordingly

### 4.9 Expense Sorting
- [ ] With multiple expenses in the list, try each sort option:
  - [ ] **Newest First** (default)
  - [ ] **Oldest First**
  - [ ] **Amount: High to Low**
  - [ ] **Amount: Low to High**
- [ ] Verify: Expenses reorder correctly for each option

### 4.10 Non-Payer Cannot Edit/Delete Someone Else's Expense (Account B)
- [ ] In Account B's browser, click on an expense that Account A paid for
- [ ] Verify: "Edit" and "Delete" options are **NOT available** (unless Account B is the group creator)

### 4.11 Payer Can Edit/Delete Their Own Expense (Account B)
- [ ] In Account B's browser, click on the "Car Rental" expense (paid by Account B)
- [ ] Verify: "Edit" and "Delete" options **ARE available**

---

## Phase 5 — Settle Up (Payments)

### 5.1 Record a Payment
- [ ] In Account B's browser, go to the **Balances** tab
- [ ] Click **"Settle Up"** button (appears only on Balances tab)
- [ ] Fill in:
  - Payer: Account B
  - Recipient: Account A
  - Amount: `50`
  - Date: today
- [ ] Click **"Record Payment"**
- [ ] Verify: Success toast appears
- [ ] Verify: Balances update — Account B's debt decreases by `$50.00`

### 5.2 Verify Settlement History
- [ ] On the **Balances** tab, scroll down to **"Settlement History"**
- [ ] Verify: The payment entry shows "Account B paid Account A" with `$50.00` and today's date
- [ ] Verify: Delete button (trash icon) is visible for payer/recipient

### 5.3 Verify Payment in Activity Tab
- [ ] Click the **Activity** tab
- [ ] Verify: An entry "Account B paid Account A — Settled up" appears with `$50.00` (green icon)
- [ ] Verify: All 3 activity types show: expenses (blue), payments (green), member joins (amber)

### 5.4 Delete a Payment
- [ ] Go back to the **Balances** tab → Settlement History
- [ ] Click the **trash icon** on the payment
- [ ] Confirm
- [ ] Verify: Payment disappears and balances revert

### 5.5 Payment Validation — Same Payer and Recipient
- [ ] Open Settle Up dialog
- [ ] Select the same person as both Payer and Recipient
- [ ] Verify: Error "Payer and recipient cannot be the same person"

---

## Phase 6 — Balances & Debt Map

### 6.1 Verify Debt Map
- [ ] Go to the **Balances** tab
- [ ] Verify: The **"Active Debt Map"** sidebar shows arrows with amounts for who owes whom
- [ ] Verify: If all debts are settled, it shows "Fully Settled" with a green checkmark

### 6.2 Verify "Settle Up" Auto-Fills
- [ ] With active debts, click **"Settle Up"**
- [ ] Verify: The payer and receiver dropdowns are pre-filled with the highest suggested debt path

### 6.3 Total Group Spend
- [ ] In the group header, verify the **"Total Group Spend"** badge
- [ ] Verify: It sums all active expenses correctly

---

## Phase 7 — Group Settings

### 7.1 Toggle Simplify Debts (Account A — Creator)
- [ ] In Account A's browser, go to the **Settings** tab of the group
- [ ] In the **"Features"** card, toggle **"Simplify Debts"** ON
- [ ] Verify: Toast confirms "Debt simplification enabled"
- [ ] Go to the **Balances** tab
- [ ] Verify: Debts are now simplified (fewer repayment arrows in debt map)
- [ ] Go back to **Settings**, toggle it OFF
- [ ] Verify: Toast confirms "Debt simplification disabled"
- [ ] Verify: Balances tab shows pairwise debts again

### 7.2 Transfer Ownership (Account A → Account B)
- [ ] In Account A's browser, go to the **Settings** tab
- [ ] In the **"Danger Zone"** card, click **"Transfer Ownership"**
- [ ] In the dialog, select Account B from the dropdown
- [ ] Click **"Transfer Ownership"**
- [ ] Verify: Success toast "Ownership transferred successfully"
- [ ] Verify: The page updates — Account A no longer sees "Edit Group", "Delete Group", or Settings form
- [ ] Verify: Account A now sees a "Leave Group" button instead
- [ ] In Account B's browser, refresh the group page
- [ ] Verify: Account B now sees "Edit Group" and "Delete Group" buttons

### 7.3 Transfer Ownership Back (Account B → Account A)
- [ ] In Account B's browser (now the creator), go to Settings, transfer ownership back to Account A
- [ ] Verify: Controls return to Account A

### 7.4 Transfer Ownership — No Eligible Members
- [ ] If only 1 member has a registered account, verify the "Transfer Ownership" button is **disabled**
- [ ] Verify: Message "There are no other verified members to transfer ownership to." appears

---

## Phase 8 — Leave Group & Remove Member

### 8.1 Leave Group — With Outstanding Balance (Should Fail)
- [ ] Make sure Account B has an outstanding balance (owes or is owed money)
- [ ] In Account B's browser, click **"Leave Group"** (in the group header)
- [ ] Verify: Error message about needing to settle balances first

### 8.2 Settle All Balances
- [ ] Record payments until Account B's balance is `$0.00`
- [ ] Verify both accounts show zero balance and "Settled" status

### 8.3 Leave Group — With Zero Balance (Should Succeed)
- [ ] In Account B's browser, click **"Leave Group"**
- [ ] Confirm in the dialog
- [ ] Verify: Account B is redirected to dashboard
- [ ] Verify: The group no longer appears in Account B's group list or sidebar
- [ ] In Account A's browser, refresh — member count should decrease

### 8.4 Re-Add Member & Remove via Creator
- [ ] In Account A's browser, re-add Account B to the group via Members tab
- [ ] After Account B joins, go to Members tab
- [ ] Click **"Remove"** next to Account B (only visible to Account A as creator)
- [ ] Confirm
- [ ] Verify: Account B is removed and member count decreases

### 8.5 Creator Cannot Leave Own Group
- [ ] In Account A's browser (creator), look at the group header
- [ ] Verify: There is NO "Leave Group" button — only "Delete Group"

### 8.6 Creator Cannot Remove Self
- [ ] In Account A's browser, go to Members tab
- [ ] Verify: There is no "Remove" button next to your own name

---

## Phase 9 — User Settings

### 9.1 Profile — Update Display Name
- [ ] In Account A's browser, go to **Settings** → **Profile** page (via sidebar)
- [ ] Change your display name (e.g., append " Test")
- [ ] Click **"Save Changes"**
- [ ] Verify: Success toast "Profile updated successfully", name updates
- [ ] Verify: Button is disabled when name hasn't changed

### 9.2 Profile — Email is Read-Only
- [ ] On the Profile page, verify the email field is **disabled**
- [ ] Verify: Helper text "Email address cannot be changed currently." is shown

### 9.3 Profile — Connected Accounts
- [ ] Verify: Google account shows as "Connected" with an "Unlink" button
- [ ] (Optional) If you try to unlink your only sign-in method, verify error: "Cannot unlink your only sign-in method."

### 9.4 Profile — Delete Account
- [ ] Verify: "Danger Zone" card is visible with a "Delete Account" button
- [ ] Verify: Warning text about needing to delete/transfer groups first is shown
- [ ] **DO NOT actually click delete** unless you want to destroy the test account

### 9.5 Preferences — Default Currency
- [ ] Go to **Settings** → **Preferences** page
- [ ] Change default currency to `EUR (€)`
- [ ] Click **"Save Preferences"**
- [ ] Verify: Success toast "Preferences updated successfully"
- [ ] Create a new group — verify that the currency dropdown defaults to EUR
- [ ] Verify: Button is disabled when currency hasn't changed

### 9.6 Preferences — Collapse Sidebar Toggle
- [ ] Toggle **"Collapse Sidebar"** switch
- [ ] Verify: Toast says "Sidebar preference saved. Refresh to see changes."
- [ ] Refresh the page
- [ ] Verify: Sidebar is collapsed (icons only, no text labels)

### 9.7 Preferences — Notifications (Coming Soon)
- [ ] Verify: Notifications section shows "Coming Soon" badge
- [ ] Verify: All notification switches are **disabled**

---

## Phase 10 — Dark Mode & Theme

### 10.1 Toggle Dark Mode
- [ ] In the sidebar, click your user profile area (bottom of sidebar)
- [ ] In the dropdown menu, click **"Dark Mode"** toggle
- [ ] Verify: The entire UI switches to dark theme
- [ ] Verify: All cards, inputs, buttons, and text have appropriate dark mode colors

### 10.2 Toggle Light Mode
- [ ] Click the toggle again (now shows **"Light Mode"**)
- [ ] Verify: UI reverts to light theme

---

## Phase 11 — Edge Cases & Negative Tests

### 11.1 Access Group You're Not a Member Of
- [ ] Copy a group URL that Account B is NOT a member of
- [ ] Paste it in Account B's browser
- [ ] Verify: Redirected to `/dashboard` (not a 500 error)

### 11.2 Invalid Group ID in URL
- [ ] Navigate to `http://localhost:3000/groups/not-a-valid-uuid`
- [ ] Verify: 404 page is shown with "Page Not Found", "Return to Dashboard" and "Go to Homepage" buttons

### 11.3 Non-Existent but Valid UUID in URL
- [ ] Navigate to `http://localhost:3000/groups/00000000-0000-0000-0000-000000000000`
- [ ] Verify: Redirected to `/dashboard` (group doesn't exist)

### 11.4 Sign Out
- [ ] Click your profile in the sidebar → Click **"Sign Out"**
- [ ] Verify: Redirected to the landing page
- [ ] Verify: Navigating to `/dashboard` redirects back to `/`

### 11.5 Dashboard Summary Amounts
- [ ] Sign back in with Account A
- [ ] On the Dashboard, verify:
  - [ ] **"Total you owe"** matches the sum of what you owe across all groups
  - [ ] **"Total owed to you"** matches the sum of what others owe you
  - [ ] Both are shown in the sidebar footer as well

### 11.6 Responsive Design (Mobile)
- [ ] Open DevTools → toggle device toolbar (or resize to ~375px width)
- [ ] Verify: Sidebar collapses to a hamburger menu
- [ ] Verify: Dashboard cards stack vertically
- [ ] Verify: Group detail tabs are still accessible (scroll horizontally if needed)
- [ ] Verify: Expense form is usable on mobile
- [ ] Verify: Activity tab is hidden on mobile (it has `hidden sm:flex` on its trigger)

### 11.7 Loading States
- [ ] Navigate to a group page — verify a loading skeleton appears before content loads
- [ ] Navigate to the dashboard — verify loading state appears

### 11.8 Group Error Boundary
- [ ] If a group page encounters an error, verify the error boundary at `/groups/[id]/error.tsx` catches it gracefully

### 11.9 Skip to Content Link
- [ ] On the dashboard, press **Tab** once
- [ ] Verify: A "Skip to content" link becomes visible at the top-left
- [ ] Press **Enter** — verify focus moves to the main content area

### 11.10 Sidebar Navigation
- [ ] Click each group in the sidebar
- [ ] Verify: You navigate to the correct group page
- [ ] Click the **Settings** link in the sidebar
- [ ] Verify: You navigate to the correct settings page for that group
- [ ] Click **"Collapse Sidebar"** button at bottom of sidebar
- [ ] Verify: Sidebar collapses to icon-only mode
- [ ] Click again to expand

### 11.11 Unverified Members Banner
- [ ] If you invited a non-existing user (`nobody@example.com`) to a group
- [ ] Verify: An amber warning banner appears: "Unverified Members Present"

---

## Phase 12 — Cleanup

### 12.1 Delete Test Groups
- [ ] Delete any remaining test groups created during testing
- [ ] Verify: Dashboard is clean

### 12.2 Restore Profile
- [ ] Revert any display name changes made during testing

### 12.3 Restore Preferences
- [ ] Set default currency back to original value (INR)

---

## Results Summary

| Phase | Feature Area | Status |
|:------|:-------------|:-------|
| 1 | Landing Page & Auth | `[ ]` |
| 2 | Group Management | `[ ]` |
| 3 | Member Management | `[ ]` |
| 4 | Expenses (Equal/Exact/Percentage/Shares) | `[ ]` |
| 5 | Settle Up / Payments | `[ ]` |
| 6 | Balances & Debt Map | `[ ]` |
| 7 | Group Settings | `[ ]` |
| 8 | Leave / Remove Member | `[ ]` |
| 9 | User Settings (Profile/Preferences) | `[ ]` |
| 10 | Dark Mode & Theme | `[ ]` |
| 11 | Edge Cases & Negative Tests | `[ ]` |
| 12 | Cleanup | `[ ]` |

> [!NOTE]
> If any step fails, note the **phase/step number**, what you **expected**, and what **actually happened**. Screenshot any error messages or unexpected UI states.
