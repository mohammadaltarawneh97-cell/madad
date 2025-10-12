import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccountantDashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [expensesRes, invoicesRes, investmentsRes] = await Promise.all([
        axios.get(`${API}/expenses`),
        axios.get(`${API}/invoices`),
        axios.get(`${API}/investments`).catch(() => ({ data: [] }))
      ]);
      
      setExpenses(expensesRes.data);
      setInvoices(invoicesRes.data);
      setInvestments(investmentsRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('ar-SA', { minimumFractionDigits: 0 }) || '0';
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalInvoices = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalInvestments = investments.reduce((sum, i) => sum + (i.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم المالية</h1>
        <p className="text-gray-600">إدارة المصروفات والفواتير والاستثمارات</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">إجمالي المصروفات</p>
          <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs opacity-90">دينار أردني</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">إجمالي الفواتير</p>
          <p className="text-3xl font-bold">{formatCurrency(totalInvoices)}</p>
          <p className="text-xs opacity-90">دينار أردني</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">إجمالي الاستثمارات</p>
          <p className="text-3xl font-bold">{formatCurrency(totalInvestments)}</p>
          <p className="text-xs opacity-90">دينار أردني</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">آخر المصروفات</h2>
          {expenses.slice(0, 5).map((expense) => (
            <div key={expense.id} className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{expense.description || 'مصروف'}</p>
                  <p className="text-xs text-gray-600">{expense.category}</p>
                </div>
                <p className="text-lg font-bold text-red-600">{formatCurrency(expense.amount)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">آخر الفواتير</h2>
          {invoices.slice(0, 5).map((invoice) => (
            <div key={invoice.id} className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                  <p className="text-xs text-gray-600">{invoice.customer_name}</p>
                </div>
                <p className="text-lg font-bold text-green-600">{formatCurrency(invoice.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Information Notice */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          ℹ️ <span className="font-semibold">ملاحظة:</span> تم تقييد وصولك إلى البيانات المالية فقط (المصروفات، الفواتير، الاستثمارات).
        </p>
      </div>
    </div>
  );
};

export default AccountantDashboard;
