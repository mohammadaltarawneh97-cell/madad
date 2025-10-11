import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvestmentDashboard = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/investments`);
      setInvestments(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const getInvestmentTypeColor = (type) => {
    const colors = {
      equity: 'bg-blue-100 text-blue-800 border-blue-300',
      debt: 'bg-green-100 text-green-800 border-green-300',
      grant: 'bg-purple-100 text-purple-800 border-purple-300',
      internal: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[type] || colors.internal;
  };

  const getInvestmentTypeText = (type) => {
    const texts = {
      equity: 'أسهم',
      debt: 'قرض',
      grant: 'منحة',
      internal: 'داخلي',
    };
    return texts[type] || type;
  };

  const getInvestmentTypeIcon = (type) => {
    const icons = {
      equity: '📈',
      debt: '💰',
      grant: '🎁',
      internal: '🏢',
    };
    return icons[type] || '💵';
  };

  const calculateTotalInvestment = () => {
    return investments.reduce((total, inv) => total + inv.amount, 0);
  };

  const getInvestmentsByType = () => {
    const byType = {};
    investments.forEach(inv => {
      if (!byType[inv.investment_type]) {
        byType[inv.investment_type] = { count: 0, total: 0 };
      }
      byType[inv.investment_type].count += 1;
      byType[inv.investment_type].total += inv.amount;
    });
    return byType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalInvestment = calculateTotalInvestment();
  const investmentsByType = getInvestmentsByType();

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">الاستثمارات</h1>
        <p className="text-gray-600">متابعة وإدارة استثمارات المشاريع</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Investment */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">إجمالي الاستثمارات</p>
          <p className="text-3xl font-bold mb-1">
            {totalInvestment.toLocaleString()}
          </p>
          <p className="text-sm opacity-90">دينار أردني</p>
        </div>

        {/* Number of Investments */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">عدد الاستثمارات</p>
          <p className="text-3xl font-bold mb-1">{investments.length}</p>
          <p className="text-sm opacity-90">استثمار نشط</p>
        </div>

        {/* Equity */}
        {investmentsByType.equity && (
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <p className="text-sm opacity-90 mb-1">استثمارات الأسهم</p>
            <p className="text-3xl font-bold mb-1">
              {investmentsByType.equity.total.toLocaleString()}
            </p>
            <p className="text-sm opacity-90">{investmentsByType.equity.count} استثمار</p>
          </div>
        )}

        {/* Debt */}
        {investmentsByType.debt && (
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
            <p className="text-sm opacity-90 mb-1">القروض</p>
            <p className="text-3xl font-bold mb-1">
              {investmentsByType.debt.total.toLocaleString()}
            </p>
            <p className="text-sm opacity-90">{investmentsByType.debt.count} قرض</p>
          </div>
        )}
      </div>

      {/* Investments List */}
      {investments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">لا توجد استثمارات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {investments.map((investment) => (
            <div
              key={investment.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">
                    {getInvestmentTypeIcon(investment.investment_type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {investment.investor_name}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getInvestmentTypeColor(investment.investment_type)}`}>
                      {getInvestmentTypeText(investment.investment_type)}
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-gray-900">
                    {investment.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">{investment.currency}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">تاريخ الاستثمار</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(investment.investment_date).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                
                {investment.expected_return_percentage && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">العائد المتوقع</p>
                    <p className="text-sm font-medium text-green-600">
                      {investment.expected_return_percentage}%
                    </p>
                  </div>
                )}

                {investment.maturity_date && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">تاريخ الاستحقاق</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(investment.maturity_date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-600 mb-1">الحالة</p>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {investment.status === 'active' ? 'نشط' : investment.status}
                  </span>
                </div>
              </div>

              {investment.terms && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">الشروط:</p>
                  <p className="text-sm text-gray-800">{investment.terms}</p>
                </div>
              )}

              {investment.notes && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">ملاحظات:</p>
                  <p className="text-sm text-blue-800">{investment.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvestmentDashboard;
