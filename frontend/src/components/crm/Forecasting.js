import React, { useState, useEffect } from 'react';
import { useApp } from '../MultiCompanyApp';

const Forecasting = () => {
  const { apiCall } = useApp();
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newForecast, setNewForecast] = useState({
    forecast_name: '',
    fiscal_year: new Date().getFullYear(),
    period: 'quarterly',
    period_name: 'Q1 2025',
    start_date: '',
    end_date: '',
    owner_id: '',
    territory: '',
    pipeline_amount: 0,
    best_case: 0,
    commit: 0,
    most_likely: 0,
    opportunities: []
  });

  useEffect(() => { fetchForecasts(); }, []);

  const fetchForecasts = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/crm/forecasts');
      setForecasts(response || []);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/crm/forecasts', { method: 'POST', data: newForecast });
      alert('تم إنشاء التوقعات بنجاح');
      setShowForm(false);
      fetchForecasts();
    } catch (error) { alert('خطأ: ' + (error.message || 'حدث خطأ')); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-xl">جاري التحميل...</div></div>;

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">توقعات المبيعات</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          {showForm ? 'إخفاء النموذج' : 'توقعات جديدة'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">توقعات جديدة</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">اسم التوقعات *</label>
              <input type="text" required value={newForecast.forecast_name} onChange={(e) => setNewForecast({...newForecast, forecast_name: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">السنة المالية *</label>
              <input type="number" required value={newForecast.fiscal_year} onChange={(e) => setNewForecast({...newForecast, fiscal_year: parseInt(e.target.value)})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الفترة *</label>
              <select required value={newForecast.period} onChange={(e) => setNewForecast({...newForecast, period: e.target.value})} className="w-full border rounded px-3 py-2">
                <option value="monthly">شهرية</option>
                <option value="quarterly">ربع سنوية</option>
                <option value="annual">سنوية</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم الفترة *</label>
              <input type="text" required value={newForecast.period_name} onChange={(e) => setNewForecast({...newForecast, period_name: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="Q1 2025" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ البداية *</label>
              <input type="date" required value={newForecast.start_date} onChange={(e) => setNewForecast({...newForecast, start_date: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ النهاية *</label>
              <input type="date" required value={newForecast.end_date} onChange={(e) => setNewForecast({...newForecast, end_date: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">أفضل حالة</label>
              <input type="number" step="0.01" value={newForecast.best_case} onChange={(e) => setNewForecast({...newForecast, best_case: parseFloat(e.target.value)})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الأكثر احتمالاً</label>
              <input type="number" step="0.01" value={newForecast.most_likely} onChange={(e) => setNewForecast({...newForecast, most_likely: parseFloat(e.target.value)})} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">حفظ التوقعات</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">التوقعات</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-right">رقم التوقعات</th>
                <th className="px-4 py-2 text-right">اسم التوقعات</th>
                <th className="px-4 py-2 text-right">السنة المالية</th>
                <th className="px-4 py-2 text-right">الفترة</th>
                <th className="px-4 py-2 text-right">الأكثر احتمالاً</th>
                <th className="px-4 py-2 text-right">المغلق</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((forecast) => (
                <tr key={forecast.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{forecast.forecast_number}</td>
                  <td className="px-4 py-2">{forecast.forecast_name}</td>
                  <td className="px-4 py-2">{forecast.fiscal_year}</td>
                  <td className="px-4 py-2">{forecast.period_name}</td>
                  <td className="px-4 py-2">{forecast.most_likely.toFixed(2)}</td>
                  <td className="px-4 py-2">{forecast.closed_won.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {forecasts.length === 0 && <p className="text-center py-4 text-gray-500">لا توجد توقعات</p>}
        </div>
      </div>
    </div>
  );
};

export default Forecasting;