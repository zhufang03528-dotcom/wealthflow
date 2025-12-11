import React, { useMemo } from 'react';
import { AppData, TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface DashboardProps {
  data: AppData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  
  const totalBalance = useMemo(() => {
    return data.accounts.reduce((acc, curr) => acc + curr.balance, 0);
  }, [data.accounts]);

  const stockValue = useMemo(() => {
    return data.stocks.reduce((acc, curr) => acc + (curr.shares * curr.currentPrice), 0);
  }, [data.stocks]);

  const stockCost = useMemo(() => {
    return data.stocks.reduce((acc, curr) => acc + (curr.shares * curr.avgPrice), 0);
  }, [data.stocks]);

  const totalAssets = totalBalance + stockValue;
  const unrealizedPL = stockValue - stockCost;

  const expenseByCategory = useMemo(() => {
    const expenses = data.transactions.filter(t => t.type === TransactionType.EXPENSE);
    const catMap: Record<string, number> = {};
    expenses.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [data.transactions]);

  const monthlyCashflow = useMemo(() => {
    // Group by month YYYY-MM
    const flowMap: Record<string, { income: number; expense: number }> = {};
    
    data.transactions.forEach(t => {
      const month = t.date.substring(0, 7); // 2023-10
      if (!flowMap[month]) flowMap[month] = { income: 0, expense: 0 };
      
      if (t.type === TransactionType.INCOME) flowMap[month].income += t.amount;
      if (t.type === TransactionType.EXPENSE) flowMap[month].expense += t.amount;
    });

    return Object.entries(flowMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, val]) => ({ name, ...val }));
  }, [data.transactions]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Summary Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">總資產 (含證券)</p>
            <h3 className="text-2xl font-bold text-slate-800">${totalAssets.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-full text-green-600">
            <ArrowUpCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">銀行現金總額</p>
            <h3 className="text-2xl font-bold text-slate-800">${totalBalance.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 rounded-full text-purple-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">股票現值</p>
            <h3 className="text-2xl font-bold text-slate-800">${stockValue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className={`p-3 rounded-full ${unrealizedPL >= 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
            {unrealizedPL >= 0 ? <TrendingUp size={24} /> : <ArrowDownCircle size={24} />}
          </div>
          <div>
            <p className="text-sm text-slate-500">證券未實現損益</p>
            <h3 className={`text-2xl font-bold ${unrealizedPL >= 0 ? 'text-red-500' : 'text-green-600'}`}>
              {unrealizedPL > 0 ? '+' : ''}{unrealizedPL.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">支出類別分佈</h3>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">尚無支出資料</div>
          )}
        </div>

        {/* Cashflow Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">每月收支趨勢</h3>
          {monthlyCashflow.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCashflow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Legend />
                <Bar dataKey="income" name="收入" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="支出" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-400">尚無交易資料</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;