import { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

type Tx = {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#7b61ff', '#e76f51'];

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alertedCategories = useRef<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Tx | null>(null);

  const [type, setType] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [q, setQ] = useState<string>('');

  async function fetchList() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.listTransactions({ type, category, q, limit: 100 }, token);
      setItems(res.data as any);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategorySpendings() {
    if (!token) return;
    setError(null);
    try {
      const res = await api.listTransactions({ limit: 1000 }, token);
      const txs: Tx[] = res.data as any;

      // Determine this month
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      // Filter out only expenses
      const expenses = txs.filter(tx => tx.type === 'expense');

      // Group spendings by category and month
      const categoryMonthSpendings: Record<string, Record<string, number>> = {};
      for (const tx of expenses) {
        const date = new Date(tx.date);
        const ym = `${date.getFullYear()}-${date.getMonth()}`; // e.g., "2024-3"
        if (!categoryMonthSpendings[tx.category]) categoryMonthSpendings[tx.category] = {};
        categoryMonthSpendings[tx.category]![ym] = (categoryMonthSpendings[tx.category]![ym] || 0) + tx.amount;
      }

      for (const [cat, monthData] of Object.entries(categoryMonthSpendings)) {
        if (alertedCategories.current.has(cat)) continue;

        const currMonthKey = `${thisYear}-${thisMonth}`;
        const thisMonthSpent = monthData[currMonthKey] || 0;

        const prevMonths = Object.entries(monthData).filter(([k]) => k !== currMonthKey);
        if (prevMonths.length === 0) continue;

        const prevTotal = prevMonths.reduce((sum, [, value]) => sum + value, 0);
        const prevAvg = prevTotal / prevMonths.length;

        if (prevAvg === 0) continue;

        if (thisMonthSpent > prevAvg * 1.25) {
          setToastMessage(
            `Your spending in "${cat}" this month (₹${thisMonthSpent.toFixed(2)}) is more than 25% higher than your average of previous months (₹${prevAvg.toFixed(2)})`
          );
          alertedCategories.current.add(cat);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze spending');
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      fetchCategorySpendings();
    }
  }, [items.length]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      type: String(formData.get('type')) as 'income'|'expense',
      amount: Number(formData.get('amount')),
      category: String(formData.get('category')),
      description: String(formData.get('description') || ''),
      date: new Date(String(formData.get('date') || new Date().toISOString())).toISOString()
    };
    try {
      if (editingTransaction) {
        await api.updateTransaction(editingTransaction._id, payload, token);
        setEditingTransaction(null);
      } else {
        await api.createTransaction(payload, token);
      }
      form.reset();
      await fetchList();
    } catch (err: any) {
      alert(err.message || `Failed to ${editingTransaction ? 'update' : 'create'}`);
    }
  }

  function onEdit(transaction: Tx) {
    setEditingTransaction(transaction);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onCancelEdit() {
    setEditingTransaction(null);
  }

  async function onDelete(id: string) {
    if (!token) return;
    if (!confirm('Delete this item?')) return;
    try {
      await api.deleteTransaction(id, token);
      await fetchList();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  }

  const categoryData = useMemo(() => {
    const sums = new Map<string, number>();
    items
      .filter(it => it.type === 'expense')
      .forEach(it => {
        const key = it.category;
        sums.set(key, (sums.get(key) || 0) + it.amount);
      });
    return Array.from(sums.entries()).map(([name, value]) => ({ name, value }));
  }, [items]);

  const totalIncome = useMemo(() => 
    items.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0), [items]
  );
  
  const totalExpense = useMemo(() => 
    items.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), [items]
  );

  return (
    <div className="pb-5">
      {toastMessage && (
        <div 
          className="toast-container-msge position-fixed top-0 end-0 p-3" 
          style={{ zIndex: 9999 }}
        >
          <div 
            className="toast show" 
            role="alert"
          >
            <div className="toast-header bg-warning text-dark">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong className="me-auto">Spending Alert</strong>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setToastMessage(null)}
              ></button>
            </div>
            <div className="toast-body">
              {toastMessage}
            </div>
          </div>
        </div>
      )}
      
      {/* Welcome Header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="display-6 mb-1 heading-title-text">
            <i className="bi bi-emoji-smile text-primary me-2"></i>
            Welcome, {user?.name}!
          </h1>
          <p className="text-muted">Track and manage your personal finances in intelligent way 🧠💰</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-4">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Income</h6>
                  <h3 className="mb-0">₹{totalIncome.toFixed(2)}</h3>
                </div>
                <i className="bi bi-arrow-up-circle" style={{ fontSize: '2rem' }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Expenses</h6>
                  <h3 className="mb-0">₹{totalExpense.toFixed(2)}</h3>
                </div>
                <i className="bi bi-arrow-down-circle" style={{ fontSize: '2rem' }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Net Balance</h6>
                  <h3 className="mb-0">₹{(totalIncome - totalExpense).toFixed(2)}</h3>
                </div>
                <i className="bi bi-wallet2" style={{ fontSize: '2rem' }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Transaction Form */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className={`bi ${editingTransaction ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
            {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h5>
          {editingTransaction && (
            <button 
              type="button" 
              className="btn btn-sm btn-outline-secondary" 
              onClick={onCancelEdit}
            >
              Cancel Edit
            </button>
          )}
        </div>
        <div className="card-body">
          <form onSubmit={onCreate} className="row g-3">
            <div className="col-md-2">
              <label className="form-label">Type</label>
              <select 
                name="type" 
                className="form-select" 
                defaultValue={editingTransaction?.type || "expense"} 
                key={editingTransaction?._id || 'new'}
                required
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Amount</label>
              <input 
                name="amount" 
                type="number" 
                step="0.01" 
                className="form-control" 
                placeholder="0.00"
                defaultValue={editingTransaction?.amount || ''}
                key={editingTransaction?._id || 'new'}
                required 
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Category</label>
              <input 
                name="category" 
                className="form-control" 
                placeholder="e.g., Food, Rent"
                defaultValue={editingTransaction?.category || ''}
                key={editingTransaction?._id || 'new'}
                required 
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Description</label>
              <input 
                name="description" 
                className="form-control" 
                placeholder="Optional description"
                defaultValue={editingTransaction?.description || ''}
                key={editingTransaction?._id || 'new'}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Date</label>
              <input 
                name="date" 
                type="datetime-local" 
                className="form-control" 
                defaultValue={editingTransaction ? new Date(editingTransaction.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
                key={editingTransaction?._id || 'new'}
              />
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <button type="submit" className="btn btn-primary w-100">
                <i className={`bi ${editingTransaction ? 'bi-check-lg' : 'bi-plus'}`}></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-funnel me-2"></i>
            Filters
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value)} 
                className="form-select"
              >
                <option value="">All Types</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Category</label>
              <input 
                placeholder="Filter by category" 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Search</label>
              <input 
                placeholder="Search descriptions" 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                className="form-control"
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button onClick={fetchList} className="btn btn-outline-primary w-100">
                <i className="bi bi-search me-1"></i>
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Transactions Table */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>
                Recent Transactions
              </h5>
            </div>
            <div className="card-body p-0">
              {loading && (
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="alert alert-danger m-3" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
              {!loading && !error && (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th className="text-end">Amount</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            <i className="bi bi-inbox" style={{ fontSize: '2rem' }}></i>
                            <div className="mt-2">No transactions found</div>
                          </td>
                        </tr>
                      ) : (
                        items.map(it => (
                          <tr key={it._id}>
                            <td>
                              <small className="text-muted">
                                {new Date(it.date).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <span className={`badge ${it.type === 'expense' ? 'bg-danger' : 'bg-success'}`}>
                                {it.type}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-secondary">{it.category}</span>
                            </td>
                            <td className="text-end">
                              <span className={`fw-bold ${it.type === 'expense' ? 'text-danger' : 'text-success'}`}>
                                {it.type === 'expense' ? '-' : '+'}₹{it.amount.toFixed(2)}
                              </span>
                            </td>
                            <td>
                              <small className="text-muted">{it.description || '-'}</small>
                            </td>
                            <td>
                              <button 
                                onClick={() => onEdit(it)} 
                                className="btn btn-sm btn-outline-primary me-1"
                                title="Edit transaction"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button 
                                onClick={() => onDelete(it._id)} 
                                className="btn btn-sm btn-outline-danger"
                                title="Delete transaction"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Chart */}
        <div className="col-lg-4 my-5 my-sm-0">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-pie-chart me-2"></i>
                Spending by Category
              </h5>
            </div>
            <div className="card-body">
              {categoryData.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-pie-chart" style={{ fontSize: '2rem' }}></i>
                  <div className="mt-2">No data to display</div>
                </div>
              ) : (
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={categoryData} 
                        dataKey="value" 
                        nameKey="name" 
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


