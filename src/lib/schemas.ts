import { z } from "zod";

export const expenseSplitSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  amount: z.number().int().positive("Split amount must be greater than 0"),
  shareValue: z.number().int().positive("Share value must be a positive whole number").optional(),
});

export const expenseInputSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  paidByUserId: z.string().uuid("Invalid user ID"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(255, "Description must be 255 characters or less"),
  amount: z.number().int().positive("Amount must be greater than 0"),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  splitType: z.enum(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"]),
  splits: z.array(expenseSplitSchema).min(1, "At least one member must be selected in the split"),
  currency: z.string().optional(),
});

// Form Schemas for react-hook-form
export const createGroupFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(100, "Name must be 100 characters or less"),
  currency: z.string().min(3).max(3),
});

export const settleUpFormSchema = z.object({
  paidByUserId: z.string().uuid("Please select who paid"),
  paidToUserId: z.string().uuid("Please select who received"),
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be greater than 0"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export const expenseFormSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(255, "Description must be 255 characters or less"),
    amount: z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Amount must be greater than 0"),
    paidByUserId: z.string().uuid("Invalid user ID"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    splitType: z.enum(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"]),
    splits: z.array(
      z.object({
        userId: z.string(),
        isSelected: z.boolean(),
        customValue: z.string(),
      })
    ),
  })
  .superRefine((data, ctx) => {
    const selectedSplits = data.splits.filter((s) => s.isSelected);
    if (selectedSplits.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one member must be selected in the split",
        path: ["splits"],
      });
      return;
    }

    const totalAmount = parseFloat(data.amount);
    if (isNaN(totalAmount) || totalAmount <= 0) return;

    if (data.splitType === "EXACT") {
      let sum = 0;
      for (const s of selectedSplits) {
        const val = parseFloat(s.customValue);
        if (isNaN(val) || val < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid exact amount",
            path: ["splits"],
          });
          return;
        }
        sum += val;
      }
      if (Math.abs(sum - totalAmount) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Sum of shares must equal total amount. Current diff: ${Math.abs(totalAmount - sum).toFixed(2)}`,
          path: ["splits"],
        });
      }
    } else if (data.splitType === "PERCENTAGE") {
      let sum = 0;
      for (const s of selectedSplits) {
        const val = parseFloat(s.customValue);
        if (isNaN(val) || val < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid percentage",
            path: ["splits"],
          });
          return;
        }
        sum += val;
      }
      if (Math.abs(sum - 100) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Sum of percentages must equal exactly 100%. Current sum: ${sum.toFixed(2)}%`,
          path: ["splits"],
        });
      }
    } else if (data.splitType === "SHARES") {
      for (const s of selectedSplits) {
        const val = parseFloat(s.customValue);
        if (isNaN(val) || val <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid shares (must be > 0)",
            path: ["splits"],
          });
          return;
        }
      }
    }
  });
