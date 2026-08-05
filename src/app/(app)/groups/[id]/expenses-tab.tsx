import { useState, useEffect, useRef, useCallback } from "react";
import { ReceiptText, ChevronDown, Trash2, Loader2, ArrowUpDown } from "lucide-react";
import { minorUnitsToDisplay } from "@lib/money";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { getGroupExpensesAction } from "@/app/(app)/groups/api-actions";
import type { Expense, Split, UserType, Member } from "@/types/group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";

interface ExpensesTabProps {
  expenses: Expense[];
  splits: Split[];
  currentUser: UserType;
  currencySymbol: string;
  isCreator: boolean;
  groupId: string;
  members: Member[];
  onDeleteExpense: (expenseId: string) => void;
  serverPage?: number;
  hasNextPage?: boolean;
}

import Link from "next/link";

export function ExpensesTab({
  expenses,
  splits,
  currentUser,
  currencySymbol,
  isCreator,
  groupId,
  members,
  onDeleteExpense,
  serverPage = 1,
  hasNextPage = false,
}: ExpensesTabProps) {
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  type SortType = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
  const [sortBy, setSortBy] = useState<SortType>("date_desc");

  const [localExpenses, setLocalExpenses] = useState<Expense[]>(expenses);
  const [localSplits, setLocalSplits] = useState<Split[]>(splits);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(expenses.length >= 50); // assume 50 is limit
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sync props on revalidatePath
  useEffect(() => {
    if (sortBy === "date_desc" && page === 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalExpenses(expenses);
      setLocalSplits(splits);
    }
  }, [expenses, splits, sortBy, page]);

  // Handle Sort Change
  const handleSortChange = async (newSort: SortType) => {
    setSortBy(newSort);
    setPage(1);
    setIsLoadingMore(true);
    const res = await getGroupExpensesAction(groupId, 0, 50, newSort);
    if (res.success && res.expenses) {
      setLocalExpenses(res.expenses);
      setLocalSplits(res.splits || []);
      setHasMore(res.expenses.length === 50);
    }
    setIsLoadingMore(false);
  };

  const pageRef = useRef(page);
  const sortByRef = useRef(sortBy);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const isMountedRef = useRef(true);

  useEffect(() => {
    pageRef.current = page;
    sortByRef.current = sortBy;
    hasMoreRef.current = hasMore;
    isLoadingMoreRef.current = isLoadingMore;
  }, [page, sortBy, hasMore, isLoadingMore]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Intersection Observer for Infinite Scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastExpenseElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoadingMoreRef.current) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current) {
          setIsLoadingMore(true);
          const nextPage = pageRef.current + 1;
          const currentSort = sortByRef.current;

          const res = await getGroupExpensesAction(groupId, (nextPage - 1) * 50, 50, currentSort);

          if (!isMountedRef.current) return;

          if (res.success && res.expenses) {
            setLocalExpenses((prev) => [...prev, ...res.expenses!]);
            setLocalSplits((prev) => [...prev, ...(res.splits || [])]);
            setHasMore(res.expenses.length === 50);
            setPage(nextPage);
          }
          setIsLoadingMore(false);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [groupId]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">Expenses</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="sort-expenses" className="sr-only">
            Sort Expenses
          </Label>
          <Select value={sortBy} onValueChange={(val) => handleSortChange(val as SortType)}>
            <SelectTrigger id="sort-expenses" className="w-40 h-8 text-xs font-semibold bg-card">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="amount_desc">Highest Amount</SelectItem>
              <SelectItem value="amount_asc">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {localExpenses.length === 0 && !isLoadingMore ? (
        /* Empty state placeholder */
        <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-75">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-bold text-foreground">No expenses logged yet</h3>
            <p className="text-sm text-muted-foreground">
              Record your first expense by clicking the &quot;Add Expense&quot; button above.
            </p>
          </div>
        </div>
      ) : (
        /* Chronological Feed List */
        <div className="space-y-3">
          {localExpenses.map((expense, index) => {
            const isExpanded = expandedExpenseId === expense.id;
            const expenseItemSplits = localSplits.filter((s) => s.expenseId === expense.id);
            const isLast = index === localExpenses.length - 1;

            return (
              <div
                key={expense.id}
                ref={isLast ? lastExpenseElementRef : null}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:border-primary/20 transition-all"
              >
                <div
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setExpandedExpenseId(isExpanded ? null : expense.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {currencySymbol}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-sm truncate">
                        {expense.description}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Paid by{" "}
                        <span className="font-semibold text-foreground">
                          {expense.paidByUserId === currentUser.id ? "You" : expense.paidByName}
                        </span>{" "}
                        &bull;{" "}
                        <span suppressHydrationWarning>
                          {new Intl.DateTimeFormat("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            // Issue #18: Append T00:00:00 to date-only strings to avoid timezone-shifted parsing
                          }).format(new Date(expense.transactionDate + "T00:00:00"))}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-foreground text-base">
                      {currencySymbol}
                      {minorUnitsToDisplay(expense.amount)}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-all shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/10 space-y-3 animate-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Split Method:{" "}
                        <span className="font-semibold text-foreground capitalize">
                          {expense.splitType.toLowerCase()}
                        </span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span suppressHydrationWarning>
                          Logged at:{" "}
                          {new Intl.DateTimeFormat([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(expense.createdAt))}
                        </span>
                        {(expense.paidByUserId === currentUser.id || isCreator) && (
                          <div className="flex items-center gap-2">
                            <EditExpenseDialog
                              groupId={groupId}
                              members={members}
                              expense={expense}
                              expenseSplits={expenseItemSplits}
                              currencySymbol={currencySymbol}
                              currentUser={currentUser}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteExpense(expense.id);
                              }}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold flex items-center gap-1 cursor-pointer h-8 px-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1.5 border-t border-border/60">
                      <span className="text-xs font-semibold text-muted-foreground block">
                        Owed Share Breakdowns
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {expenseItemSplits.map((split) => {
                          const isMe = split.owedByUserId === currentUser.id;
                          return (
                            <div
                              key={split.id}
                              className="flex items-center justify-between p-2.5 bg-background border border-border/80 rounded-xl text-xs"
                            >
                              <span className="font-semibold text-foreground flex items-center gap-1.5">
                                {isMe ? "You" : split.owedByName}
                                {expense.splitType === "SHARES" && split.shareValue != null && (
                                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium">
                                    {split.shareValue} {split.shareValue === 1 ? "share" : "shares"}
                                  </span>
                                )}
                              </span>
                              <span className="font-mono font-bold text-foreground">
                                {currencySymbol}
                                {minorUnitsToDisplay(split.amount)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {isLoadingMore && (
            <div className="flex justify-center py-4 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}

          {/* Static Pagination Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
            {serverPage > 1 ? (
              <Link
                href={`/groups/${groupId}?page=${serverPage - 1}`}
                className="text-sm font-medium hover:underline text-primary"
              >
                &larr; Previous Page
              </Link>
            ) : (
              <span />
            )}
            {hasNextPage ? (
              <Link
                href={`/groups/${groupId}?page=${serverPage + 1}`}
                className="text-sm font-medium hover:underline text-primary"
              >
                Next Page &rarr;
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
