import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccountantDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    expenses: [],
    invoices: [],
    salaryPayments: [],
    investments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [expensesRes, invoicesRes, salaryRes, investmentsRes] = await Promise.all([
        axios.get(`${API}/expenses`).catch(() => ({ data: [] })),
        axios.get(`${API}/invoices`).catch(() => ({ data: [] })),
        axios.get(`${API}/salary-payments`).catch(() => ({ data: [] })),
        axios.get(`${API}/investments`).catch(() => ({ data: [] }))
      ]);
      
      setDashboardData({
        expenses: expensesRes.data.slice(0, 5),
        invoices: invoicesRes.data.slice(0, 5),
        salaryPayments: salaryRes.data.slice(0, 5),
        investments: investmentsRes.data.slice(0, 3)
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('ar-SA', { minimumFractionDigits: 0 }) || '0';
  };

  const calculateTotals = () => {
    const totalExpenses = dashboardData.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalInvoices = dashboardData.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalSalaries = dashboardData.salaryPayments.reduce((sum, sal) => sum + (sal.net_salary || 0), 0);
    const totalInvestments = dashboardData.investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    return { totalExpenses, totalInvoices, totalSalaries, totalInvestments };
  };

  const { totalExpenses, totalInvoices, totalSalaries, totalInvestments } = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم - المحاسب</h1>
        <p className="text-gray-600">نظرة شاملة على العمليات المالية</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">💸</div>
            <span className="text-xs opacity-75">المصروفات</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
          <p className="text-sm opacity-90">SAR</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📄</div>
            <span className="text-xs opacity-75">الفواتير</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalInvoices)}</p>
          <p className="text-sm opacity-90">SAR</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">👥</div>
            <span className="text-xs opacity-75">الرواتب</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalSalaries)}</p>
          <p className="text-sm opacity-90">SAR</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📊</div>
            <span className="text-xs opacity-75">الاستثمارات</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalInvestments)}</p>
          <p className="text-sm opacity-90">SAR</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>💸</span>
              <span>المصروفات الأخيرة</span>
            </h2>
            <Link to="/expenses" className="text-sm text-blue-600 hover:text-blue-800">
              عرض الكل ←
            </Link>
          </div>

          {dashboardData.expenses.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.expenses.map((expense) => (
                <div key={expense.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{expense.description}</span>
                    <span className="text-red-700 font-bold">{formatCurrency(expense.amount)} SAR</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{expense.category}</span>
                    <span>{expense.date ? new Date(expense.date).toLocaleDateString('ar-SA') : '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد مصروفات</p>
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>📄</span>
              <span>الفواتير الأخيرة</span>
            </h2>
            <Link to="/invoices" className="text-sm text-blue-600 hover:text-blue-800">
              عرض الكل ←
            </Link>
          </div>

          {dashboardData.invoices.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.invoices.map((invoice) => (
                <div key={invoice.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
                    <span className="text-green-700 font-bold">{formatCurrency(invoice.amount)} SAR</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{invoice.customer_name}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status === 'paid' ? 'مدفوع' : invoice.status === 'pending' ? 'معلق' : 'ملغي'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد فواتير</p>
            </div>
          )}
        </div>

        {/* Recent Salary Payments */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>👥</span>
              <span>مدفوعات الرواتب</span>
            </h2>
          </div>

          {dashboardData.salaryPayments.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.salaryPayments.map((payment) => (
                <div key={payment.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{payment.employee_name_ar || 'موظف'}</span>
                    <span className="text-purple-700 font-bold">{formatCurrency(payment.net_salary)} SAR</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{payment.month}/{payment.year}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      payment.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status === 'paid' ? 'مدفوع' : 'معلق'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد سجلات رواتب</p>
            </div>
          )}
        </div>

        {/* Investments Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>📊</span>
              <span>الاستثمارات</span>
            </h2>
            <Link to="/investments" className="text-sm text-blue-600 hover:text-blue-800">
              عرض الكل ←
            </Link>
          </div>

          {dashboardData.investments.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.investments.map((investment) => (
                <div key={investment.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{investment.name}</span>
                    <span className="text-blue-700 font-bold">{formatCurrency(investment.amount)} SAR</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{investment.type || 'استثمار'}</span>
                    <span className={`px-2 py-1 text-xs rounded bg-blue-100 text-blue-800`}>
                      {investment.status || 'نشط'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد استثمارات</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/expenses"
            className="flex flex-col items-center justify-center p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
          >
            <span className="text-3xl mb-2">💸</span>
            <span className="text-sm font-semibold text-gray-900">إدارة المصروفات</span>
          </Link>
          <Link
            to="/invoices"
            className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
          >
            <span className="text-3xl mb-2">📄</span>
            <span className="text-sm font-semibold text-gray-900">إدارة الفواتير</span>
          </Link>
          <Link
            to="/investments"
            className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <span className="text-3xl mb-2">📊</span>
            <span className="text-sm font-semibold text-gray-900">الاستثمارات</span>
          </Link>
          <Link
            to="/financial-projections"
            className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
          >
            <span className="text-3xl mb-2">📈</span>
            <span className="text-sm font-semibold text-gray-900">التوقعات المالية</span>
          </Link>
        </div>
      </div>

      {/* Information Notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ℹ️ <span className="font-semibold">ملاحظة:</span> لوحة التحكم الخاصة بالمحاسب. يمكنك إدارة جميع العمليات المالية بما في ذلك المصروفات، الفواتير، الرواتب، والاستثمارات.
        </p>
      </div>
    </div>
  );
};

export default AccountantDashboard;
