export interface Member {
  id: string;
  name: string;
  email: string;
  hasAccount: boolean;
  image?: string | null;
  joinedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  createdByUserId: string;
  currency: string;
  simplifyDebts: boolean;
}

export interface UserType {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  defaultCurrency?: string;
}

export interface Expense {
  id: string;
  groupId: string;
  paidByUserId: string;
  description: string;
  amount: number;
  transactionDate: string;
  splitType: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";
  createdAt: Date;
  paidByName: string;
}

export interface Split {
  id: string;
  expenseId: string;
  owedByUserId: string;
  amount: number;
  shareValue?: number | null;
  owedByName: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  groupId: string;
  paidByUserId: string;
  paidToUserId: string;
  amount: number;
  paymentDate: string;
  paidByName: string;
  paidToName: string;
  createdAt: Date;
}
