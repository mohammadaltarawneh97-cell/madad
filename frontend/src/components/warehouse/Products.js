import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const Products = () => {
  const { token } = useContext(AppContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({product_code: '', product_name: '', product_name_ar: '', product_type: 'raw_material', unit_of_measure: 'piece', unit_cost: 0, unit_price: 0, barcode: ''});

  const types = {raw_material: 'خامات', finished_goods: 'منتجات تامة', semi_finished: 'نصف مصنعة', spare_parts: 'قطع غيار', consumables: 'مستهلكات'};
  const uoms = {piece: 'قطعة', kg: 'كغ', liter: 'لتر', meter: 'متر', ton: 'طن', box: 'صندوق'};

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/products`, {headers: {'Authorization': `Bearer ${token}`}});
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/products`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        fetchProducts();
        setFormData({product_code: '', product_name: '', product_name_ar: '', product_type: 'raw_material', unit_of_measure: 'piece', unit_cost: 0, unit_price: 0, barcode: ''});
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
          <h2 className="text-2xl font-bold text-gray-800">إدارة المنتجات</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{showForm ? 'إلغاء' : '+ منتج جديد'}</button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">إضافة منتج جديد</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">رمز المنتج *</label><input type="text" required value={formData.product_code} onChange={(e) => setFormData({...formData, product_code: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">اسم المنتج (English) *</label><input type="text" required value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">اسم المنتج (عربي)</label><input type="text" value={formData.product_name_ar} onChange={(e) => setFormData({...formData, product_name_ar: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">نوع المنتج *</label><select value={formData.product_type} onChange={(e) => setFormData({...formData, product_type: e.target.value})} className="w-full p-2 border rounded-lg">{Object.keys(types).map(k => <option key={k} value={k}>{types[k]}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">وحدة القياس *</label><select value={formData.unit_of_measure} onChange={(e) => setFormData({...formData, unit_of_measure: e.target.value})} className="w-full p-2 border rounded-lg">{Object.keys(uoms).map(k => <option key={k} value={k}>{uoms[k]}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">تكلفة الوحدة</label><input type="number" step="0.01" value={formData.unit_cost} onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">سعر البيع</label><input type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">الباركود</label><input type="text" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ المنتج</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100"><tr><th className="p-3 text-right">الرمز</th><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">الوحدة</th><th className="p-3 text-right">التكلفة</th><th className="p-3 text-right">سعر البيع</th><th className="p-3 text-right">الباركود</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{p.product_code}</td>
                  <td className="p-3">{p.product_name_ar || p.product_name}</td>
                  <td className="p-3">{types[p.product_type]}</td>
                  <td className="p-3">{uoms[p.unit_of_measure]}</td>
                  <td className="p-3">{p.unit_cost.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3 font-semibold">{p.unit_price.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3 font-mono text-sm">{p.barcode}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <div className="text-center py-8 text-gray-500">لا توجد منتجات</div>}
        </div>
      </div>
    </div>
  );
};

export default Products;