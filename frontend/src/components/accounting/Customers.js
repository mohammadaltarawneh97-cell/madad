import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const Customers = () => {
  const { token } = useContext(AppContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_code: '',
    customer_name: '',
    customer_name_ar: '',
    customer_type: 'company',
    tax_id: '',
    phone: '',
    email: '',
    payment_terms_days: 30
  });

  const customerTypes = {
    individual: 'فرد',
    company: 'شركة',
    government: 'جهة حكومية',
    other: 'أخرى'
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowForm(false);
        fetchCustomers();
        setFormData({
          customer_code: '',
          customer_name: '',
          customer_name_ar: '',
          customer_type: 'company',
          tax_id: '',
          phone: '',
          email: '',
          payment_terms_days: 30
        });
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">إدارة العملاء</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'إلغاء' : '+ عميل جديد'}
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">إضافة عميل جديد</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">رمز العميل *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_code}
                  onChange={(e) => setFormData({...formData, customer_code: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="C001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">اسم العميل (English) *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">اسم العميل (عربي)</label>
                <input
                  type="text"
                  value={formData.customer_name_ar}
                  onChange={(e) => setFormData({...formData, customer_name_ar: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">نوع العميل *</label>
                <select
                  value={formData.customer_type}
                  onChange={(e) => setFormData({...formData, customer_type: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  {Object.keys(customerTypes).map(type => (
                    <option key={type} value={type}>{customerTypes[type]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">الرقم الضريبي</label>
                <input
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">شروط الدفع (أيام)</label>
                <input
                  type="number"
                  value={formData.payment_terms_days}
                  onChange={(e) => setFormData({...formData, payment_terms_days: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  حفظ العميل
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
                <th className="p-3 text-right">الرمز</th>
                <th className="p-3 text-right">اسم العميل</th>
                <th className="p-3 text-right">النوع</th>
                <th className="p-3 text-right">الهاتف</th>
                <th className="p-3 text-right">شروط الدفع</th>
                <th className="p-3 text-right">الرصيد</th>
                <th className="p-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{customer.customer_code}</td>
                  <td className="p-3">{customer.customer_name_ar || customer.customer_name}</td>
                  <td className="p-3">{customerTypes[customer.customer_type]}</td>
                  <td className="p-3">{customer.phone}</td>
                  <td className="p-3">{customer.payment_terms_days} يوم</td>
                  <td className="p-3 font-semibold">{customer.current_balance?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {customer.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              لا يوجد عملاء. انقر على "عميل جديد" لإضافة العميل الأول.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customers;
