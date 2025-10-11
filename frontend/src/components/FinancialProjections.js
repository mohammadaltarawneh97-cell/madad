import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FinancialProjections = () => {
  const [projections, setProjections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    fetchProjections();
  }, []);

  const fetchProjections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/financial-projections`);
      setProjections(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load financial projections');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return value.toLocaleString('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getMaxValue = (metric) => {
    if (projections.length === 0) return 0;
    return Math.max(...projections.map(p => Math.abs(p[metric] || 0)));
  };

  const getBarHeight = (value, maxValue) => {
    if (!value || maxValue === 0) return 0;
    return (Math.abs(value) / maxValue) * 100;
  };

  const calculateTotals = () => {
    return projections.reduce((acc, p) => ({
      totalCapex: acc.totalCapex + (p.capex || 0),
      totalOpex: acc.totalOpex + (p.opex || 0),
      totalRevenue: acc.totalRevenue + (p.revenue || 0),
      totalProfit: acc.totalProfit + (p.net_profit || 0),
    }), { totalCapex: 0, totalOpex: 0, totalRevenue: 0, totalProfit: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totals = calculateTotals();
  const maxRevenue = getMaxValue('revenue');
  const maxProfit = getMaxValue('net_profit');
  const maxCashFlow = getMaxValue('cash_flow');

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">التوقعات المالية</h1>
        <p className="text-gray-600">نموذج مالي لـ {projections.length} سنوات</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {projections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">لا توجد توقعات مالية</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6 shadow-lg">
              <p className="text-sm opacity-90 mb-1">إجمالي CAPEX</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalCapex)}</p>
              <p className="text-xs opacity-90">النفقات الرأسمالية</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
              <p className="text-sm opacity-90 mb-1">إجمالي OPEX</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalOpex)}</p>
              <p className="text-xs opacity-90">النفقات التشغيلية</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
              <p className="text-sm opacity-90 mb-1">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</p>
              <p className="text-xs opacity-90">{projections.length} سنوات</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
              <p className="text-sm opacity-90 mb-1">صافي الربح</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalProfit)}</p>
              <p className="text-xs opacity-90">متوقع</p>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">الرسم البياني المالي</h2>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="revenue">الإيرادات</option>
                <option value="net_profit">صافي الربح</option>
                <option value="cash_flow">التدفق النقدي</option>
                <option value="capex">CAPEX</option>
                <option value="opex">OPEX</option>
              </select>
            </div>

            {/* Simple Bar Chart */}
            <div className="flex items-end justify-around gap-4 h-64 border-b-2 border-gray-300 pb-4">
              {projections.map((projection) => {
                const value = projection[selectedMetric] || 0;
                const maxValue = getMaxValue(selectedMetric);
                const height = getBarHeight(value, maxValue);
                const isNegative = value < 0;

                return (
                  <div key={projection.id} className="flex flex-col items-center flex-1">
                    <div className="text-xs text-gray-600 mb-2 font-medium">
                      {formatCurrency(Math.abs(value))}
                    </div>
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        isNegative ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="text-sm font-bold text-gray-900 mt-2">{projection.year}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">السنة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">CAPEX</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">OPEX</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">الإيرادات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">إجمالي الربح</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">صافي الربح</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">التدفق النقدي</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">ROI %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projections.map((projection) => (
                    <tr key={projection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{projection.year}</td>
                      <td className="px-6 py-4 text-sm text-red-600">
                        {formatCurrency(projection.capex)}
                      </td>
                      <td className="px-6 py-4 text-sm text-orange-600">
                        {formatCurrency(projection.opex)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600">
                        {formatCurrency(projection.revenue)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(projection.gross_profit)}
                      </td>
                      <td className={`px-6 py-4 text-sm font-medium ${
                        (projection.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(projection.net_profit)}
                      </td>
                      <td className={`px-6 py-4 text-sm ${
                        (projection.cash_flow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(projection.cash_flow)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">
                        {projection.roi ? projection.roi.toFixed(2) : '-'}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-6 py-4 text-sm text-gray-900">الإجمالي</td>
                    <td className="px-6 py-4 text-sm text-red-700">
                      {formatCurrency(totals.totalCapex)}
                    </td>
                    <td className="px-6 py-4 text-sm text-orange-700">
                      {formatCurrency(totals.totalOpex)}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-700">
                      {formatCurrency(totals.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 text-sm">-</td>
                    <td className={`px-6 py-4 text-sm ${
                      totals.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formatCurrency(totals.totalProfit)}
                    </td>
                    <td className="px-6 py-4 text-sm">-</td>
                    <td className="px-6 py-4 text-sm">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {projections.some(p => p.notes) && (
            <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-3">ملاحظات</h3>
              <div className="space-y-2">
                {projections.filter(p => p.notes).map((projection) => (
                  <div key={projection.id} className="text-sm text-blue-800">
                    <span className="font-semibold">{projection.year}:</span> {projection.notes}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialProjections;
