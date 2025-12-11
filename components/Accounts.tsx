import React, { useState } from 'react';
import { BankAccount, AccountType } from '../types';
import { Plus, Trash2, Edit2, CreditCard } from 'lucide-react';

interface AccountsProps {
  accounts: BankAccount[];
  onAdd: (account: Omit<BankAccount, 'id'>) => void;
  onDelete: (id: string) => void;
  onEdit: (account: BankAccount) => void;
}

const Accounts: React.FC<AccountsProps> = ({ accounts, onAdd, onDelete, onEdit }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: AccountType.BANK,
    balance: 0,
    currency: 'TWD'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEdit({ ...formData, id: editingId });
    } else {
      onAdd(formData);
    }
    closeModal();
  };

  const openModal = (account?: BankAccount) => {
    if (account) {
      setEditingId(account.id);
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        type: AccountType.BANK,
        balance: 0,
        currency: 'TWD'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">帳戶管理</h2>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} /> 新增帳戶
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${
                account.type === AccountType.BANK ? 'bg-blue-50 text-blue-600' :
                account.type === AccountType.INVESTMENT ? 'bg-purple-50 text-purple-600' :
                'bg-emerald-50 text-emerald-600'
              }`}>
                <CreditCard size={24} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(account)} className="p-2 text-slate-400 hover:text-blue-500">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => onDelete(account.id)} className="p-2 text-slate-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1">{account.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{account.type}</p>
            
            <div className="flex justify-between items-end border-t pt-4">
              <span className="text-sm text-slate-400">{account.currency}</span>
              <span className="text-2xl font-bold text-slate-800">${account.balance.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-xl font-bold mb-4">{editingId ? '編輯帳戶' : '新增帳戶'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">帳戶名稱</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">類型</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as AccountType})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">初始餘額</label>
                <input 
                  type="number" 
                  required
                  value={formData.balance}
                  onChange={e => setFormData({...formData, balance: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;