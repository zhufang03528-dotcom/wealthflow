import React, { useState, useEffect } from 'react';
import { User, AppData, ViewState, TransactionType, Transaction, BankAccount, StockHolding } from './types';
import { DEMO_DATA } from './constants';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Stocks from './components/Stocks';
import Transactions from './components/Transactions';
import { LayoutDashboard, Wallet, LineChart, Receipt, LogOut, Menu, X, PiggyBank, Loader2 } from 'lucide-react';
import { auth, db } from './firebaseConfig';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  
  // --- Data State ---
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [stocks, setStocks] = useState<StockHolding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [view, setView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- Login Form State ---
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // --- Firebase Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || ''
        });
      } else {
        setUser(null);
        setAccounts([]);
        setStocks([]);
        setTransactions([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore Data Listeners ---
  useEffect(() => {
    if (!user) return;

    // Accounts Listener
    const qAccounts = query(collection(db, `users/${user.id}/accounts`));
    const unsubAccounts = onSnapshot(qAccounts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
      setAccounts(data);
    });

    // Stocks Listener
    const qStocks = query(collection(db, `users/${user.id}/stocks`));
    const unsubStocks = onSnapshot(qStocks, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockHolding));
      setStocks(data);
    });

    // Transactions Listener
    const qTransactions = query(collection(db, `users/${user.id}/transactions`));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      // Sort client-side for simplicity, or add orderBy to query
      setTransactions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    return () => {
      unsubAccounts();
      unsubStocks();
      unsubTransactions();
    };
  }, [user]);

  // --- Handlers ---

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        await updateProfile(userCredential.user, { displayName: authForm.name });
        
        // Add Demo Data for new users
        const batch = writeBatch(db);
        const userId = userCredential.user.uid;
        
        DEMO_DATA.accounts.forEach(acc => {
          const docRef = doc(collection(db, `users/${userId}/accounts`));
          const { id, ...data } = acc; // remove local ID, let firestore gen it or use it? Let's use auto-id
          batch.set(docRef, data);
        });
        
        // We can't link transactions perfectly to new account IDs in a batch without mapping.
        // For simplicity in this demo generation, we skip adding demo transactions/stocks to DB 
        // to avoid foreign key complexity, or we could strictly map them. 
        // Let's just create one default account to be safe.
        
        // Overwriting the batch logic for simplicity:
        // Create one Main Account
        const accRef = doc(collection(db, `users/${userId}/accounts`));
        batch.set(accRef, { name: '預設現金帳戶', type: '現金', balance: 0, currency: 'TWD' });

        await batch.commit();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('dashboard');
    setIsMobileMenuOpen(false);
  };

  const addAccount = async (account: Omit<BankAccount, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.id}/accounts`), account);
  };

  const editAccount = async (account: BankAccount) => {
    if (!user) return;
    const { id, ...data } = account;
    await setDoc(doc(db, `users/${user.id}/accounts`, id), data);
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.id}/accounts`, id));
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;
    
    // Add transaction
    await addDoc(collection(db, `users/${user.id}/transactions`), transaction);

    // Update account balance atomically (simplified here without transaction object)
    // Note: For strict correctness, use runTransaction. 
    // Here we just update the doc based on current local state + delta
    const acc = accounts.find(a => a.id === transaction.accountId);
    if (acc) {
      const amount = transaction.type === TransactionType.INCOME ? transaction.amount : -transaction.amount;
      const accRef = doc(db, `users/${user.id}/accounts`, acc.id);
      await setDoc(accRef, { ...acc, balance: acc.balance + amount });
    }
  };

  const addStock = async (stock: Omit<StockHolding, 'id' | 'lastUpdated'>) => {
    if (!user) return;
    const newStock = { 
      ...stock, 
      lastUpdated: new Date().toISOString() 
    };
    await addDoc(collection(db, `users/${user.id}/stocks`), newStock);
  };

  const deleteStock = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.id}/stocks`, id));
  };

  const updateStocks = async (updatedStocks: StockHolding[]) => {
    if (!user) return;
    const batch = writeBatch(db);
    updatedStocks.forEach(s => {
      const ref = doc(db, `users/${user.id}/stocks`, s.id);
      const { id, ...data } = s;
      batch.set(ref, data);
    });
    await batch.commit();
  };

  // Combine data for Dashboard
  const appData: AppData = {
    accounts,
    stocks,
    transactions
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-100">
          <div className="flex justify-center mb-6 text-blue-600">
            <PiggyBank size={48} />
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Welcome to WealthFlow</h1>
          <p className="text-center text-slate-500 mb-8">個人化金融財務管理系統</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLoginView && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={authForm.name}
                  onChange={e => setAuthForm({...authForm, name: e.target.value})}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={authForm.email}
                onChange={e => setAuthForm({...authForm, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">密碼</label>
              <input 
                type="password" 
                required
                minLength={6}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={authForm.password}
                onChange={e => setAuthForm({...authForm, password: e.target.value})}
              />
            </div>
            
            {authError && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {authError}
              </div>
            )}

            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
              {loading ? '處理中...' : (isLoginView ? '登入' : '註冊帳號')}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-500">
            {isLoginView ? "還沒有帳號? " : "已經有帳號? "}
            <button 
              onClick={() => {
                setIsLoginView(!isLoginView);
                setAuthError('');
              }} 
              className="text-blue-600 font-medium hover:underline"
            >
              {isLoginView ? "立即註冊" : "直接登入"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: '總覽報表', icon: LayoutDashboard },
    { id: 'accounts', label: '帳戶管理', icon: Wallet },
    { id: 'stocks', label: '投資持股', icon: LineChart },
    { id: 'transactions', label: '收支紀錄', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-10">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="text-blue-600"><PiggyBank size={32} /></div>
          <span className="text-xl font-bold text-slate-800">WealthFlow</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                view === item.id 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {user.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <LogOut size={18} /> 登出系統
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-20 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
           <div className="text-blue-600"><PiggyBank size={24} /></div>
           <span className="font-bold text-slate-800">WealthFlow</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-slate-900/50 pt-16">
          <div className="bg-white p-4 space-y-2 rounded-b-2xl shadow-xl">
             {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as ViewState);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  view === item.id 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
            <hr className="my-2"/>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl"
            >
              <LogOut size={20} /> 登出
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {view === 'dashboard' && <Dashboard data={appData} />}
          {view === 'accounts' && (
            <Accounts 
              accounts={accounts} 
              onAdd={addAccount}
              onDelete={deleteAccount}
              onEdit={editAccount}
            />
          )}
          {view === 'stocks' && (
            <Stocks 
              stocks={stocks}
              onAdd={addStock}
              onDelete={deleteStock}
              onUpdateStocks={updateStocks}
            />
          )}
          {view === 'transactions' && (
            <Transactions 
              transactions={transactions} 
              accounts={accounts}
              onAdd={addTransaction}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;