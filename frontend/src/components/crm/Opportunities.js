import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const Opportunities = () => {
  const { token } = useContext(AppContext);
  const [opportunities, setOpportunities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ opportunity_name: '', account_id: '', amount: 0, close_date: '', stage: 'prospecting', probability: 10 });

  const stages = { prospecting: 'تنقيب', qualification: 'تأهيل', proposal: 'عرض سعر', negotiation: 'تفاوض', closed_won: 'تم الإغلاق - فوز', closed_lost: 'تم الإغلاق - خسارة' };
  const stageColors = { prospecting: 'bg-blue-100 text-blue-800', qualification: 'bg-yellow-100 text-yellow-800', proposal: 'bg-orange-100 text-orange-800', negotiation: 'bg-purple-100 text-purple-800', closed_won: 'bg-green-100 text-green-800', closed_lost: 'bg-red-100 text-red-800' };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [oppsRes, accountsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/opportunities`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/accounts`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (oppsRes.ok && accountsRes.ok) {
        setOpportunities(await oppsRes.json());
        setAccounts(await accountsRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/opportunities`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowForm(false);
        fetchData();
        setFormData({ opportunity_name: '', account_id: '', amount: 0, close_date: '', stage: 'prospecting', probability: 10 });
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
    }
  };

  if (loading) return <div className="p-6 text-center" dir="rtl">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">إدارة الفرص التجارية</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">{showForm ? 'إلغاء' : '+ فرصة جديدة'}</button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">إضافة فرصة تجارية جديدة</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">اسم الفرصة *</label><input type="text" required value={formData.opportunity_name} onChange={(e) => setFormData({...formData, opportunity_name: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">الحساب *</label><select required value={formData.account_id} onChange={(e) => setFormData({...formData, account_id: e.target.value})} className="w-full p-2 border rounded-lg"><option value="">-- اختر حساب --</option>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">المبلغ (SAR) *</label><input type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">تاريخ الإغلاق المتوقع *</label><input type="date" required value={formData.close_date} onChange={(e) => setFormData({...formData, close_date: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">المرحلة *</label><select value={formData.stage} onChange={(e) => setFormData({...formData, stage: e.target.value})} className="w-full p-2 border rounded-lg">{Object.keys(stages).map(key => <option key={key} value={key}>{stages[key]}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">نسبة النجاح (%) *</label><input type="number" min="0" max="100" required value={formData.probability} onChange={(e) => setFormData({...formData, probability: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg" /></div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ الفرصة</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100"><tr><th className="p-3 text-right">الرقم</th><th className="p-3 text-right">اسم الفرصة</th><th className="p-3 text-right">الحساب</th><th className="p-3 text-right">المبلغ</th><th className="p-3 text-right">تاريخ الإغلاق</th><th className="p-3 text-right">المرحلة</th><th className="p-3 text-right">نسبة النجاح</th></tr></thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{opp.opportunity_number}</td>
                  <td className="p-3 font-semibold">{opp.opportunity_name}</td>
                  <td className="p-3">{opp.account_name}</td>
                  <td className="p-3 font-bold text-green-600">{opp.amount?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3">{new Date(opp.close_date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${stageColors[opp.stage]}`}>{stages[opp.stage]}</span></td>
                  <td className="p-3 font-semibold">{opp.probability}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {opportunities.length === 0 && <div className="text-center py-8 text-gray-500">لا توجد فرص تجارية</div>}
        </div>
      </div>
    </div>
  );
};

export default Opportunities;