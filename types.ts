export interface User {
  id: string;
  name: string;
  email: string;
}

export enum AccountType {
  BANK = '銀行',
  CASH = '現金',
  INVESTMENT = '投資',
  CREDIT = '信用卡'
}

export interface BankAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}

export interface StockHolding {
  id: string;
  symbol: string; // e.g., 2330.TW
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  lastUpdated: string;
}

export enum TransactionType {
  INCOME = '收入',
  EXPENSE = '支出',
  TRANSFER = '轉帳'
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string;
}

export type ViewState = 'dashboard' | 'accounts' | 'stocks' | 'transactions' | 'settings';

export interface AppData {
  accounts: BankAccount[];
  stocks: StockHolding[];
  transactions: Transaction[];
}