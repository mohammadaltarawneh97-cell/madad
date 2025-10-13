import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const Warehouses = () => {
  const { token } = useContext(AppContext);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({warehouse_code: '', warehouse_name: '', warehouse_name_ar: '', warehouse_type: 'main', address: '', city: ''});

  const types = {main: 'رئيسي', regional: 'إقليمي', retail: 'تجزئة', transit: 'عبور'};

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/warehouses`, {headers: {'Authorization': `Bearer ${token}`}});
      if (res.ok) setWarehouses(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/warehouses`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        fetchWarehouses();
        setFormData({warehouse_code: '', warehouse_name: '', warehouse_name_ar: '', warehouse_type: 'main', address: '', city: ''});
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6 text-center" dir="rtl">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">إدارة المستودعات</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{showForm ? 'إلغاء' : '+ مستودع جديد'}</button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">إضافة مستودع جديد</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">رمز المستودع *</label><input type="text" required value={formData.warehouse_code} onChange={(e) => setFormData({...formData, warehouse_code: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">اسم المستودع (English) *</label><input type="text" required value={formData.warehouse_name} onChange={(e) => setFormData({...formData, warehouse_name: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">اسم المستودع (عربي)</label><input type="text" value={formData.warehouse_name_ar} onChange={(e) => setFormData({...formData, warehouse_name_ar: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">نوع المستودع *</label><select value={formData.warehouse_type} onChange={(e) => setFormData({...formData, warehouse_type: e.target.value})} className="w-full p-2 border rounded-lg">{Object.keys(types).map(k => <option key={k} value={k}>{types[k]}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">العنوان</label><input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">المدينة</label><input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ المستودع</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100"><tr><th className="p-3 text-right">الرمز</th><th className="p-3 text-right">اسم المستودع</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">المدينة</th><th className="p-3 text-right">العنوان</th><th className="p-3 text-right">الحالة</th></tr></thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{w.warehouse_code}</td>
                  <td className="p-3 font-semibold">{w.warehouse_name_ar || w.warehouse_name}</td>
                  <td className="p-3">{types[w.warehouse_type]}</td>
                  <td className="p-3">{w.city}</td>
                  <td className="p-3">{w.address}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${w.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{w.is_active ? 'نشط' : 'غير نشط'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {warehouses.length === 0 && <div className="text-center py-8 text-gray-500">لا توجد مستودعات</div>}
        </div>
      </div>
    </div>
  );
};

export default Warehouses;