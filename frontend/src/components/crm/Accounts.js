import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const Accounts = () => {
  const { token } = useContext(AppContext);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ account_name: '', account_name_ar: '', account_type: 'prospect', industry: '', phone: '', email: '' });

  const accountTypes = { prospect: 'عميل محتمل', customer: 'عميل', partner: 'شريك', competitor: 'منافس', other: 'أخرى' };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/accounts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowForm(false);
        fetchAccounts();
        setFormData({ account_name: '', account_name_ar: '', account_type: 'prospect', industry: '', phone: '', email: '' });
      }
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  if (loading) return <div className="p-6 text-center" dir="rtl">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">إدارة الحسابات</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">{showForm ? 'إلغاء' : '+ حساب جديد'}</button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">إضافة حساب جديد</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">اسم الحساب (English) *</label><input type="text" required value={formData.account_name} onChange={(e) => setFormData({...formData, account_name: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">اسم الحساب (عربي)</label><input type="text" value={formData.account_name_ar} onChange={(e) => setFormData({...formData, account_name_ar: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">نوع الحساب *</label><select value={formData.account_type} onChange={(e) => setFormData({...formData, account_type: e.target.value})} className="w-full p-2 border rounded-lg">{Object.keys(accountTypes).map(key => <option key={key} value={key}>{accountTypes[key]}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">الصناعة</label><input type="text" value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">رقم الهاتف</label><input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">البريد الإلكتروني</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ الحساب</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100"><tr><th className="p-3 text-right">الرقم</th><th className="p-3 text-right">اسم الحساب</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">الصناعة</th><th className="p-3 text-right">الهاتف</th><th className="p-3 text-right">البريد الإلكتروني</th><th className="p-3 text-right">الحالة</th></tr></thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{account.account_number}</td>
                  <td className="p-3">{account.account_name_ar || account.account_name}</td>
                  <td className="p-3">{accountTypes[account.account_type]}</td>
                  <td className="p-3">{account.industry}</td>
                  <td className="p-3">{account.phone}</td>
                  <td className="p-3">{account.email}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{account.is_active ? 'نشط' : 'غير نشط'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {accounts.length === 0 && <div className="text-center py-8 text-gray-500">لا توجد حسابات</div>}
        </div>
      </div>
    </div>
  );
};

export default Accounts;