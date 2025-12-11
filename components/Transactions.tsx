import React, { useState } from 'react';
import { Transaction, TransactionType, BankAccount } from '../types';
import { CATEGORIES } from '../constants';
import { Plus, Filter } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, accounts, onAdd }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  
  const [formData, setFormData] = useState({
    accountId: accounts[0]?.id || '',
    type: TransactionType.EXPENSE,
    amount: 0,
    category: CATEGORIES[TransactionType.EXPENSE][0],
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setIsModalOpen(false);
    // Reset form but keep date
    setFormData(prev => ({ ...prev, amount: 0, note: '' }));
  };

  const filteredTransactions = transactions
    .filter(t => filterType === 'ALL' || t.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">財務紀錄</h2>
        <div className="flex gap-2">
           <div className="relative">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as any)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">全部紀錄</option>
                <option value={TransactionType.INCOME}>收入</option>
                <option value={TransactionType.EXPENSE}>支出</option>
              </select>
              <Filter size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
           </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} /> 記帳
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">日期</th>
                <th className="px-6 py-4 font-medium">分類</th>
                <th className="px-6 py-4 font-medium">項目/備註</th>
                <th className="px-6 py-4 font-medium">帳戶</th>
                <th className="px-6 py-4 font-medium text-right">金額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((t) => {
                const accountName = accounts.find(a => a.id === t.accountId)?.name || '未知帳戶';
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{t.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        t.type === TransactionType.INCOME ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{t.note}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{accountName}</td>
                    <td className={`px-6 py-4 text-right font-medium ${
                      t.type === TransactionType.INCOME ? 'text-blue-600' : 'text-red-500'
                    }`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                 <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">目前沒有交易紀錄</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">新增紀錄</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                {[TransactionType.EXPENSE, TransactionType.INCOME].map(type => (
                   <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, type: type as TransactionType, category: CATEGORIES[type as TransactionType][0]})}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      formData.type === type ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                    }`}
                   >
                     {type}
                   </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">日期</label>
                <input 
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">帳戶</label>
                  <select 
                    value={formData.accountId}
                    onChange={e => setFormData({...formData, accountId: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">金額</label>
                   <input 
                      type="number"
                      required
                      min="1"
                      value={formData.amount || ''}
                      onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">分類</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES[formData.type].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({...formData, category: cat})}
                      className={`py-1 text-xs border rounded transition-colors ${
                        formData.category === cat 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">備註</label>
                <input 
                  type="text"
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 午餐"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;