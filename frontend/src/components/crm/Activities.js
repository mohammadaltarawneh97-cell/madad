import React, { useState, useEffect } from 'react';
import { useApp } from '../MultiCompanyApp';

const Activities = () => {
  const { apiCall } = useApp();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_type: 'call',
    subject: '',
    description: '',
    related_to_type: 'lead',
    related_to_id: '',
    activity_date: new Date().toISOString().split('T')[0],
    duration_minutes: 30,
    outcome: '',
    next_step: ''
  });

  useEffect(() => { fetchActivities(); }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/crm/activities');
      setActivities(response || []);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/crm/activities', { method: 'POST', data: newActivity });
      alert('تم إنشاء النشاط بنجاح');
      setShowForm(false);
      fetchActivities();
    } catch (error) { alert('خطأ: ' + (error.message || 'حدث خطأ')); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-xl">جاري التحميل...</div></div>;

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">سجل الأنشطة</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          {showForm ? 'إخفاء النموذج' : 'نشاط جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">نشاط جديد</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">نوع النشاط *</label>
              <select required value={newActivity.activity_type} onChange={(e) => setNewActivity({...newActivity, activity_type: e.target.value})} className="w-full border rounded px-3 py-2">
                <option value="call">مكالمة</option>
                <option value="meeting">اجتماع</option>
                <option value="email">بريد إلكتروني</option>
                <option value="demo">عرض توضيحي</option>
                <option value="site_visit">زيارة موقع</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الموضوع *</label>
              <input type="text" required value={newActivity.subject} onChange={(e) => setNewActivity({...newActivity, subject: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">الوصف</label>
              <textarea value={newActivity.description} onChange={(e) => setNewActivity({...newActivity, description: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نوع السجل المرتبط *</label>
              <select required value={newActivity.related_to_type} onChange={(e) => setNewActivity({...newActivity, related_to_type: e.target.value})} className="w-full border rounded px-3 py-2">
                <option value="lead">عميل محتمل</option>
                <option value="account">حساب</option>
                <option value="contact">جهة اتصال</option>
                <option value="opportunity">فرصة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">معرف السجل المرتبط *</label>
              <input type="text" required value={newActivity.related_to_id} onChange={(e) => setNewActivity({...newActivity, related_to_id: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ النشاط *</label>
              <input type="date" required value={newActivity.activity_date} onChange={(e) => setNewActivity({...newActivity, activity_date: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المدة (دقائق)</label>
              <input type="number" value={newActivity.duration_minutes} onChange={(e) => setNewActivity({...newActivity, duration_minutes: parseInt(e.target.value)})} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">حفظ النشاط</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">الأنشطة</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-right">رقم النشاط</th>
                <th className="px-4 py-2 text-right">النوع</th>
                <th className="px-4 py-2 text-right">الموضوع</th>
                <th className="px-4 py-2 text-right">المرتبط بـ</th>
                <th className="px-4 py-2 text-right">التاريخ</th>
                <th className="px-4 py-2 text-right">المالك</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{activity.activity_number}</td>
                  <td className="px-4 py-2">{activity.activity_type}</td>
                  <td className="px-4 py-2">{activity.subject}</td>
                  <td className="px-4 py-2">{activity.related_to_name}</td>
                  <td className="px-4 py-2">{new Date(activity.activity_date).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-2">{activity.owner_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {activities.length === 0 && <p className="text-center py-4 text-gray-500">لا توجد أنشطة</p>}
        </div>
      </div>
    </div>
  );
};

export default Activities;