import { AppData, AccountType, TransactionType } from './types';

export const CATEGORIES = {
  [TransactionType.EXPENSE]: ['飲食', '交通', '居住', '娛樂', '醫療', '教育', '購物', '雜項'],
  [TransactionType.INCOME]: ['薪資', '獎金', '投資收益', '兼職', '其他'],
  [TransactionType.TRANSFER]: ['轉帳']
};

export const DEMO_DATA: AppData = {
  accounts: [
    { id: '1', name: '中國信託 - 薪轉戶', type: AccountType.BANK, balance: 150000, currency: 'TWD' },
    { id: '2', name: '玉山銀行 - 證券戶', type: AccountType.INVESTMENT, balance: 50000, currency: 'TWD' },
    { id: '3', name: '錢包現金', type: AccountType.CASH, balance: 3500, currency: 'TWD' },
  ],
  stocks: [
    { id: '1', symbol: '2330.TW', name: '台積電', shares: 1000, avgPrice: 500, currentPrice: 800, lastUpdated: new Date().toISOString() },
    { id: '2', symbol: 'AAPL', name: 'Apple Inc.', shares: 50, avgPrice: 150, currentPrice: 180, lastUpdated: new Date().toISOString() },
    { id: '3', symbol: '0050.TW', name: '元大台灣50', shares: 2000, avgPrice: 120, currentPrice: 150, lastUpdated: new Date().toISOString() },
  ],
  transactions: [
    { id: '1', accountId: '1', type: TransactionType.INCOME, amount: 65000, category: '薪資', date: '2023-10-05', note: '十月薪資' },
    { id: '2', accountId: '3', type: TransactionType.EXPENSE, amount: 120, category: '飲食', date: '2023-10-06', note: '午餐' },
    { id: '3', accountId: '3', type: TransactionType.EXPENSE, amount: 1280, category: '交通', date: '2023-10-07', note: '高鐵票' },
    { id: '4', accountId: '1', type: TransactionType.EXPENSE, amount: 15000, category: '居住', date: '2023-10-10', note: '房租' },
    { id: '5', accountId: '1', type: TransactionType.EXPENSE, amount: 3000, category: '娛樂', date: '2023-10-12', note: '週末聚餐' },
  ]
};