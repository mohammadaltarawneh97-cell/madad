import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const ChartOfAccounts = () => {
  const { token } = useContext(AppContext);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_name_ar: '',
    account_type: 'asset',
    account_subtype: 'current_asset',
    opening_balance: 0,
    description: '',
    description_ar: ''
  });

  const accountTypes = {
    asset: { label: 'أصول', labelEn: 'Asset', subtypes: ['current_asset', 'fixed_asset', 'intangible_asset', 'other_asset'] },
    liability: { label: 'التزامات', labelEn: 'Liability', subtypes: ['current_liability', 'long_term_liability'] },
    equity: { label: 'حقوق ملكية', labelEn: 'Equity', subtypes: ['owner_equity', 'retained_earnings'] },
    revenue: { label: 'إيرادات', labelEn: 'Revenue', subtypes: ['operating_revenue', 'non_operating_revenue'] },
    expense: { label: 'مصروفات', labelEn: 'Expense', subtypes: ['operating_expense', 'cost_of_goods_sold', 'depreciation', 'interest_expense'] }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/chart-of-accounts`, {
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/chart-of-accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowForm(false);
        fetchAccounts();
        setFormData({
          account_code: '',
          account_name: '',
          account_name_ar: '',
          account_type: 'asset',
          account_subtype: 'current_asset',
          opening_balance: 0,
          description: '',
          description_ar: ''
        });
      }
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const getAccountTypeLabel = (type) => accountTypes[type]?.label || type;

  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">شجرة الحسابات</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'إلغاء' : '+ حساب جديد'}
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">إضافة حساب جديد</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">رمز الحساب *</label>
                <input
                  type="text"
                  required
                  value={formData.account_code}
                  onChange={(e) => setFormData({...formData, account_code: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">اسم الحساب (English) *</label>
                <input
                  type="text"
                  required
                  value={formData.account_name}
                  onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Cash"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">اسم الحساب (عربي) *</label>
                <input
                  type="text"
                  required
                  value={formData.account_name_ar}
                  onChange={(e) => setFormData({...formData, account_name_ar: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="النقدية"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">نوع الحساب *</label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({...formData, account_type: e.target.value, account_subtype: accountTypes[e.target.value].subtypes[0]})}
                  className="w-full p-2 border rounded-lg"
                >
                  {Object.keys(accountTypes).map(type => (
                    <option key={type} value={type}>{accountTypes[type].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">التصنيف الفرعي *</label>
                <select
                  value={formData.account_subtype}
                  onChange={(e) => setFormData({...formData, account_subtype: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  {accountTypes[formData.account_type].subtypes.map(subtype => (
                    <option key={subtype} value={subtype}>{subtype.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">الرصيد الافتتاحي</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({...formData, opening_balance: parseFloat(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">الوصف (عربي)</label>
                <textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({...formData, description_ar: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  rows="2"
                />
              </div>
              <div className="col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  حفظ الحساب
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-right">رمز الحساب</th>
                <th className="p-3 text-right">اسم الحساب</th>
                <th className="p-3 text-right">النوع</th>
                <th className="p-3 text-right">الرصيد الحالي</th>
                <th className="p-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{account.account_code}</td>
                  <td className="p-3">{account.account_name_ar}</td>
                  <td className="p-3">{getAccountTypeLabel(account.account_type)}</td>
                  <td className="p-3 font-semibold">
                    {account.current_balance?.toLocaleString('ar-SA')} {account.currency || 'SAR'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {account.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {accounts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              لا توجد حسابات. انقر على "حساب جديد" لإضافة الحساب الأول.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartOfAccounts;
