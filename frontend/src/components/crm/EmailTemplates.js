import React, { useState, useEffect } from 'react';
import { useApp } from '../MultiCompanyApp';

const EmailTemplates = () => {
  const { apiCall } = useApp();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    template_code: '',
    template_name: '',
    subject: '',
    body_html: '',
    available_merge_fields: []
  });

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/crm/email-templates');
      setTemplates(response || []);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/crm/email-templates', { method: 'POST', data: newTemplate });
      alert('تم إنشاء القالب بنجاح');
      setNewTemplate({ template_code: '', template_name: '', subject: '', body_html: '', available_merge_fields: [] });
      setShowForm(false);
      fetchTemplates();
    } catch (error) { alert('خطأ: ' + (error.message || 'حدث خطأ')); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-xl">جاري التحميل...</div></div>;

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">قوالب البريد الإلكتروني</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          {showForm ? 'إخفاء النموذج' : 'قالب جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">قالب جديد</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">كود القالب *</label>
              <input type="text" required value={newTemplate.template_code} onChange={(e) => setNewTemplate({...newTemplate, template_code: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="welcome_email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم القالب *</label>
              <input type="text" required value={newTemplate.template_name} onChange={(e) => setNewTemplate({...newTemplate, template_name: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">الموضوع *</label>
              <input type="text" required value={newTemplate.subject} onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">محتوى HTML *</label>
              <textarea required value={newTemplate.body_html} onChange={(e) => setNewTemplate({...newTemplate, body_html: e.target.value})} className="w-full border rounded px-3 py-2" rows="6" placeholder="<html>...</html>" />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">حفظ القالب</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">القوالب</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-right">كود القالب</th>
                <th className="px-4 py-2 text-right">اسم القالب</th>
                <th className="px-4 py-2 text-right">الموضوع</th>
                <th className="px-4 py-2 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{template.template_code}</td>
                  <td className="px-4 py-2">{template.template_name_ar || template.template_name}</td>
                  <td className="px-4 py-2">{template.subject}</td>
                  <td className="px-4 py-2">
                    {template.is_active ? <span className="text-green-600 font-semibold">نشط</span> : <span className="text-red-600">غير نشط</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {templates.length === 0 && <p className="text-center py-4 text-gray-500">لا توجد قوالب</p>}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;