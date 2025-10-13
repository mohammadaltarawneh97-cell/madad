import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const Contacts = () => {
  const { token } = useContext(AppContext);
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ account_id: '', first_name: '', last_name: '', email: '', phone: '', mobile: '', title: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contactsRes, accountsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/contacts`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/accounts`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (contactsRes.ok && accountsRes.ok) {
        setContacts(await contactsRes.json());
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/contacts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowForm(false);
        fetchData();
        setFormData({ account_id: '', first_name: '', last_name: '', email: '', phone: '', mobile: '', title: '' });
      }
    } catch (error) {
      console.error('Error creating contact:', error);
    }
  };

  if (loading) return <div className="p-6 text-center" dir="rtl">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">إدارة جهات الاتصال</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">{showForm ? 'إلغاء' : '+ جهة اتصال جديدة'}</button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">إضافة جهة اتصال جديدة</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-sm font-medium mb-2">الحساب *</label><select required value={formData.account_id} onChange={(e) => setFormData({...formData, account_id: e.target.value})} className="w-full p-2 border rounded-lg"><option value="">-- اختر حساب --</option>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">الاسم الأول *</label><input type="text" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">اسم العائلة *</label><input type="text" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">المسمى الوظيفي</label><input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">البريد الإلكتروني *</label><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">رقم الهاتف</label><input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">الجوال</label><input type="text" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ جهة الاتصال</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100"><tr><th className="p-3 text-right">الرقم</th><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">المسمى الوظيفي</th><th className="p-3 text-right">الحساب</th><th className="p-3 text-right">البريد الإلكتروني</th><th className="p-3 text-right">الهاتف</th><th className="p-3 text-right">الحالة</th></tr></thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{contact.contact_number}</td>
                  <td className="p-3 font-semibold">{contact.full_name}</td>
                  <td className="p-3">{contact.title}</td>
                  <td className="p-3">{contact.account_name}</td>
                  <td className="p-3">{contact.email}</td>
                  <td className="p-3">{contact.phone || contact.mobile}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${contact.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{contact.is_active ? 'نشط' : 'غير نشط'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {contacts.length === 0 && <div className="text-center py-8 text-gray-500">لا توجد جهات اتصال</div>}
        </div>
      </div>
    </div>
  );
};

export default Contacts;