import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const Vendors = () => {
  const { token } = useContext(AppContext);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vendor_code: '',
    vendor_name: '',
    vendor_name_ar: '',
    vendor_type: 'supplier',
    tax_id: '',
    phone: '',
    email: '',
    payment_terms_days: 30
  });

  const vendorTypes = {
    supplier: 'مورد',
    contractor: 'مقاول',
    service_provider: 'مزود خدمة',
    consultant: 'مستشار',
    other: 'أخرى'
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/vendors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/vendors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowForm(false);
        fetchVendors();
        setFormData({
          vendor_code: '',
          vendor_name: '',
          vendor_name_ar: '',
          vendor_type: 'supplier',
          tax_id: '',
          phone: '',
          email: '',
          payment_terms_days: 30
        });
      }
    } catch (error) {
      console.error('Error creating vendor:', error);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">إدارة الموردين</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'إلغاء' : '+ مورد جديد'}
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">إضافة مورد جديد</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">رمز المورد *</label>
                <input
                  type="text"
                  required
                  value={formData.vendor_code}
                  onChange={(e) => setFormData({...formData, vendor_code: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="V001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">اسم المورد (English) *</label>
                <input
                  type="text"
                  required
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">اسم المورد (عربي)</label>
                <input
                  type="text"
                  value={formData.vendor_name_ar}
                  onChange={(e) => setFormData({...formData, vendor_name_ar: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">نوع المورد *</label>
                <select
                  value={formData.vendor_type}
                  onChange={(e) => setFormData({...formData, vendor_type: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  {Object.keys(vendorTypes).map(type => (
                    <option key={type} value={type}>{vendorTypes[type]}</option>
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
                  حفظ المورد
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
                <th className="p-3 text-right">اسم المورد</th>
                <th className="p-3 text-right">النوع</th>
                <th className="p-3 text-right">الهاتف</th>
                <th className="p-3 text-right">شروط الدفع</th>
                <th className="p-3 text-right">الرصيد</th>
                <th className="p-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{vendor.vendor_code}</td>
                  <td className="p-3">{vendor.vendor_name_ar || vendor.vendor_name}</td>
                  <td className="p-3">{vendorTypes[vendor.vendor_type]}</td>
                  <td className="p-3">{vendor.phone}</td>
                  <td className="p-3">{vendor.payment_terms_days} يوم</td>
                  <td className="p-3 font-semibold">{vendor.current_balance?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {vendor.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vendors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              لا يوجد موردين. انقر على "مورد جديد" لإضافة المورد الأول.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vendors;
