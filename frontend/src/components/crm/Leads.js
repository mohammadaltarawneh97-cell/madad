import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const Leads = () => {
  const { token } = useContext(AppContext);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    source: 'website',
    estimated_value: 0
  });

  const sources = { website: 'الموقع الإلكتروني', referral: 'إحالة', cold_call: 'اتصال بارد', email_campaign: 'حملة بريدية', social_media: 'وسائل التواصل', trade_show: 'معرض تجاري', other: 'أخرى' };
  const statuses = { new: 'جديد', contacted: 'تم الاتصال', qualified: 'مؤهل', unqualified: 'غير مؤهل', converted: 'تم التحويل', lost: 'ضائع' };
  const statusColors = { new: 'bg-blue-100 text-blue-800', contacted: 'bg-yellow-100 text-yellow-800', qualified: 'bg-green-100 text-green-800', unqualified: 'bg-gray-100 text-gray-800', converted: 'bg-purple-100 text-purple-800', lost: 'bg-red-100 text-red-800' };

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/leads`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowForm(false);
        fetchLeads();
        setFormData({ first_name: '', last_name: '', email: '', phone: '', company: '', source: 'website', estimated_value: 0 });
      }
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const convertLead = async (leadId) => {
    if (!window.confirm('هل تريد تحويل هذا العميل المحتمل إلى حساب وجهة اتصال وفرصة؟')) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('تم تحويل العميل المحتمل بنجاح!');
        fetchLeads();
      }
    } catch (error) {
      console.error('Error converting lead:', error);
    }
  };

  if (loading) return <div className="p-6 text-center" dir="rtl">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">إدارة العملاء المحتملين</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            {showForm ? 'إلغاء' : '+ عميل محتمل جديد'}
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">إضافة عميل محتمل جديد</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">الاسم الأول *</label><input type="text" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">اسم العائلة *</label><input type="text" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">البريد الإلكتروني *</label><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">رقم الهاتف</label><input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">الشركة</label><input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">المصدر *</label><select value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})} className="w-full p-2 border rounded-lg">{Object.keys(sources).map(key => <option key={key} value={key}>{sources[key]}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">القيمة المتوقعة (SAR)</label><input type="number" value={formData.estimated_value} onChange={(e) => setFormData({...formData, estimated_value: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" /></div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ العميل المحتمل</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100"><tr><th className="p-3 text-right">الرقم</th><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الشركة</th><th className="p-3 text-right">البريد الإلكتروني</th><th className="p-3 text-right">المصدر</th><th className="p-3 text-right">القيمة المتوقعة</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">الإجراءات</th></tr></thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{lead.lead_number}</td>
                  <td className="p-3">{lead.full_name}</td>
                  <td className="p-3">{lead.company}</td>
                  <td className="p-3">{lead.email}</td>
                  <td className="p-3">{sources[lead.source]}</td>
                  <td className="p-3 font-semibold">{lead.estimated_value?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColors[lead.status]}`}>{statuses[lead.status]}</span></td>
                  <td className="p-3">{!lead.is_converted && <button onClick={() => convertLead(lead.id)} className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">تحويل</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && <div className="text-center py-8 text-gray-500">لا يوجد عملاء محتملين</div>}
        </div>
      </div>
    </div>
  );
};

export default Leads;