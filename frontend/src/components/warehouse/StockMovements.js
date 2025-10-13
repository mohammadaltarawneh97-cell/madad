import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const StockMovements = () => {
  const { token } = useContext(AppContext);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({movement_date: new Date().toISOString().split('T')[0], movement_type: 'receipt', product_id: '', to_warehouse_id: '', quantity: 0, unit_cost: 0});

  const types = {receipt: 'استلام', issue: 'صرف', transfer: 'تحويل', adjustment: 'تسوية', return: 'مرتجع'};
  const typeColors = {receipt: 'bg-green-100 text-green-800', issue: 'bg-red-100 text-red-800', transfer: 'bg-blue-100 text-blue-800', adjustment: 'bg-yellow-100 text-yellow-800', return: 'bg-orange-100 text-orange-800'};

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movRes, prodRes, whRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/stock-movements`, {headers: {'Authorization': `Bearer ${token}`}}),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/products`, {headers: {'Authorization': `Bearer ${token}`}}),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/warehouses`, {headers: {'Authorization': `Bearer ${token}`}})
      ]);
      if (movRes.ok && prodRes.ok && whRes.ok) {
        setMovements(await movRes.json());
        setProducts(await prodRes.json());
        setWarehouses(await whRes.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/stock-movements`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        fetchData();
        setFormData({movement_date: new Date().toISOString().split('T')[0], movement_type: 'receipt', product_id: '', to_warehouse_id: '', quantity: 0, unit_cost: 0});
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
          <h2 className="text-2xl font-bold text-gray-800">حركة المخزون</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{showForm ? 'إلغاء' : '+ حركة جديدة'}</button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">إضافة حركة مخزون</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">التاريخ *</label><input type="date" required value={formData.movement_date} onChange={(e) => setFormData({...formData, movement_date: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">نوع الحركة *</label><select value={formData.movement_type} onChange={(e) => setFormData({...formData, movement_type: e.target.value})} className="w-full p-2 border rounded-lg">{Object.keys(types).map(k => <option key={k} value={k}>{types[k]}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">المنتج *</label><select required value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} className="w-full p-2 border rounded-lg"><option value="">-- اختر منتج --</option>{products.map(p => <option key={p.id} value={p.id}>{p.product_name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">المستودع *</label><select required value={formData.to_warehouse_id} onChange={(e) => setFormData({...formData, to_warehouse_id: e.target.value})} className="w-full p-2 border rounded-lg"><option value="">-- اختر مستودع --</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.warehouse_name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">الكمية *</label><input type="number" step="0.01" required value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">التكلفة *</label><input type="number" step="0.01" required value={formData.unit_cost} onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" /></div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ الحركة</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100"><tr><th className="p-3 text-right">الرقم</th><th className="p-3 text-right">التاريخ</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">المستودع</th><th className="p-3 text-right">الكمية</th><th className="p-3 text-right">التكلفة</th></tr></thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{m.movement_number}</td>
                  <td className="p-3">{new Date(m.movement_date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${typeColors[m.movement_type]}`}>{types[m.movement_type]}</span></td>
                  <td className="p-3">{m.product_name}</td>
                  <td className="p-3">{m.to_warehouse_id ? 'إلى' : 'من'}</td>
                  <td className="p-3 font-semibold">{m.quantity.toLocaleString('ar-SA')}</td>
                  <td className="p-3">{m.total_cost.toLocaleString('ar-SA')} SAR</td>
                </tr>
              ))}
            </tbody>
          </table>
          {movements.length === 0 && <div className="text-center py-8 text-gray-500">لا توجد حركات مخزون</div>}
        </div>
      </div>
    </div>
  );
};

export default StockMovements;