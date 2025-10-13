import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const Cases = () => {
  const { token } = useContext(AppContext);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ subject: '', description: '', priority: 'medium', case_type: 'question', customer_email: '', customer_phone: '' });

  const priorities = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' };
  const priorityColors = { low: 'bg-gray-100 text-gray-800', medium: 'bg-blue-100 text-blue-800', high: 'bg-orange-100 text-orange-800', urgent: 'bg-red-100 text-red-800' };
  const statuses = { new: 'جديدة', in_progress: 'قيد المعالجة', waiting_customer: 'في انتظار العميل', escalated: 'تم التصعيد', resolved: 'تم الحل', closed: 'مغلقة' };
  const statusColors = { new: 'bg-blue-100 text-blue-800', in_progress: 'bg-yellow-100 text-yellow-800', waiting_customer: 'bg-purple-100 text-purple-800', escalated: 'bg-red-100 text-red-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800' };
  const types = { question: 'استفسار', problem: 'مشكلة', feature_request: 'طلب ميزة', complaint: 'شكوى', other: 'أخرى' };

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/cases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/cases`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowForm(false);
        fetchCases();
        setFormData({ subject: '', description: '', priority: 'medium', case_type: 'question', customer_email: '', customer_phone: '' });
      }
    } catch (error) {
      console.error('Error creating case:', error);
    }
  };

  if (loading) return <div className="p-6 text-center" dir="rtl">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">إدارة حالات الدعم</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">{showForm ? 'إلغاء' : '+ حالة جديدة'}</button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">إضافة حالة دعم جديدة</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-sm font-medium mb-2">الموضوع *</label><input type="text" required value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div className="col-span-2"><label className="block text-sm font-medium mb-2">الوصف *</label><textarea required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded-lg" rows="3" /></div>
              <div><label className="block text-sm font-medium mb-2">نوع الحالة *</label><select value={formData.case_type} onChange={(e) => setFormData({...formData, case_type: e.target.value})} className="w-full p-2 border rounded-lg">{Object.keys(types).map(key => <option key={key} value={key}>{types[key]}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">الأولوية *</label><select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full p-2 border rounded-lg">{Object.keys(priorities).map(key => <option key={key} value={key}>{priorities[key]}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">بريد العميل</label><input type="email" value={formData.customer_email} onChange={(e) => setFormData({...formData, customer_email: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">هاتف العميل</label><input type="text" value={formData.customer_phone} onChange={(e) => setFormData({...formData, customer_phone: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ الحالة</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100"><tr><th className="p-3 text-right">الرقم</th><th className="p-3 text-right">الموضوع</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">الأولوية</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">تاريخ الفتح</th></tr></thead>
            <tbody>
              {cases.map((caseItem) => (
                <tr key={caseItem.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{caseItem.case_number}</td>
                  <td className="p-3 font-semibold">{caseItem.subject}</td>
                  <td className="p-3">{types[caseItem.case_type]}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${priorityColors[caseItem.priority]}`}>{priorities[caseItem.priority]}</span></td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColors[caseItem.status]}`}>{statuses[caseItem.status]}</span></td>
                  <td className="p-3">{new Date(caseItem.opened_date).toLocaleDateString('ar-SA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {cases.length === 0 && <div className="text-center py-8 text-gray-500">لا توجد حالات دعم</div>}
        </div>
      </div>
    </div>
  );
};

export default Cases;