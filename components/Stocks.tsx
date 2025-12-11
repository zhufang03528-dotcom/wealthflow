import React, { useState } from 'react';
import { StockHolding } from '../types';
import { Plus, Trash2, RefreshCw, TrendingUp } from 'lucide-react';
import { updateStockPrices } from '../services/geminiService';

interface StocksProps {
  stocks: StockHolding[];
  onAdd: (stock: Omit<StockHolding, 'id' | 'lastUpdated'>) => void;
  onDelete: (id: string) => void;
  onUpdateStocks: (stocks: StockHolding[]) => void;
}

const Stocks: React.FC<StocksProps> = ({ stocks, onAdd, onDelete, onUpdateStocks }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    shares: 0,
    avgPrice: 0,
    currentPrice: 0
  });

  const handleUpdatePrices = async () => {
    setIsUpdating(true);
    const updated = await updateStockPrices(stocks);
    onUpdateStocks(updated);
    setIsUpdating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setIsModalOpen(false);
    setFormData({ symbol: '', name: '', shares: 0, avgPrice: 0, currentPrice: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">持股管理</h2>
        <div className="flex gap-2">
           <button 
            onClick={handleUpdatePrices}
            disabled={isUpdating}
            className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors ${isUpdating ? 'opacity-70 cursor-wait' : ''}`}
          >
            <RefreshCw size={20} className={isUpdating ? 'animate-spin' : ''} />
            {isUpdating ? 'AI 更新中...' : '更新股價'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} /> 新增持股
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">代碼</th>
              <th className="px-6 py-4 font-medium">名稱</th>
              <th className="px-6 py-4 font-medium text-right">股數</th>
              <th className="px-6 py-4 font-medium text-right">均價</th>
              <th className="px-6 py-4 font-medium text-right">現價</th>
              <th className="px-6 py-4 font-medium text-right">損益</th>
              <th className="px-6 py-4 font-medium text-right">現值</th>
              <th className="px-6 py-4 font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stocks.map((stock) => {
              const marketValue = stock.shares * stock.currentPrice;
              const cost = stock.shares * stock.avgPrice;
              const profit = marketValue - cost;
              const profitPercent = cost === 0 ? 0 : (profit / cost) * 100;
              
              return (
                <tr key={stock.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{stock.symbol}</td>
                  <td className="px-6 py-4 text-slate-600">{stock.name}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{stock.shares.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{stock.avgPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-medium">{stock.currentPrice.toLocaleString()}</td>
                  <td className={`px-6 py-4 text-right font-medium ${profit >= 0 ? 'text-red-500' : 'text-green-600'}`}>
                     {profit >= 0 ? '+' : ''}{profit.toLocaleString()}
                     <span className="text-xs ml-1">({profitPercent.toFixed(2)}%)</span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">{marketValue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onDelete(stock.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {stocks.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">目前沒有持股紀錄</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-400 text-right">
        * 股價更新功能使用 Google Gemini (Search Grounding)，可能與即時市價有微小延遲。
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
             <h3 className="text-xl font-bold mb-4">新增持股</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">股票代碼 (例: 2330.TW)</label>
                <input 
                  type="text" 
                  required
                  placeholder="2330.TW"
                  value={formData.symbol}
                  onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">股票名稱</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">持有股數</label>
                   <input 
                      type="number" 
                      required
                      value={formData.shares || ''}
                      onChange={e => setFormData({...formData, shares: Number(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">平均成本</label>
                   <input 
                      type="number" 
                      required
                      value={formData.avgPrice || ''}
                      onChange={e => setFormData({...formData, avgPrice: Number(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">目前市價 (預設)</label>
                 <input 
                    type="number" 
                    required
                    value={formData.currentPrice || ''}
                    onChange={e => setFormData({...formData, currentPrice: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">新增</button>
              </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stocks;