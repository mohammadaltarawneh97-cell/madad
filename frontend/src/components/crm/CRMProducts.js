import React, { useState, useEffect } from 'react';
import { useApp } from '../MultiCompanyApp';

const CRMProducts = () => {
  const { apiCall } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_code: '',
    product_name: '',
    product_name_ar: '',
    product_family: '',
    description: '',
    list_price: 0,
    unit_of_measure: 'piece'
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/crm/products');
      setProducts(response || []);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/crm/products', { method: 'POST', data: newProduct });
      alert('تم إنشاء المنتج بنجاح');
      setNewProduct({ product_code: '', product_name: '', product_name_ar: '', product_family: '', description: '', list_price: 0, unit_of_measure: 'piece' });
      setShowForm(false);
      fetchProducts();
    } catch (error) { alert('خطأ: ' + (error.message || 'حدث خطأ')); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-xl">جاري التحميل...</div></div>;

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">كتالوج المنتجات</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          {showForm ? 'إخفاء النموذج' : 'منتج جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">منتج جديد</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">كود المنتج *</label>
              <input type="text" required value={newProduct.product_code} onChange={(e) => setNewProduct({...newProduct, product_code: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم المنتج *</label>
              <input type="text" required value={newProduct.product_name} onChange={(e) => setNewProduct({...newProduct, product_name: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم المنتج (عربي)</label>
              <input type="text" value={newProduct.product_name_ar} onChange={(e) => setNewProduct({...newProduct, product_name_ar: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">عائلة المنتج</label>
              <input type="text" value={newProduct.product_family} onChange={(e) => setNewProduct({...newProduct, product_family: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">الوصف</label>
              <textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">سعر القائمة *</label>
              <input type="number" step="0.01" required value={newProduct.list_price} onChange={(e) => setNewProduct({...newProduct, list_price: parseFloat(e.target.value)})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">وحدة القياس</label>
              <input type="text" value={newProduct.unit_of_measure} onChange={(e) => setNewProduct({...newProduct, unit_of_measure: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">حفظ المنتج</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">المنتجات</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-right">كود المنتج</th>
                <th className="px-4 py-2 text-right">اسم المنتج</th>
                <th className="px-4 py-2 text-right">العائلة</th>
                <th className="px-4 py-2 text-right">السعر</th>
                <th className="px-4 py-2 text-right">الوحدة</th>
                <th className="px-4 py-2 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{product.product_code}</td>
                  <td className="px-4 py-2">{product.product_name_ar || product.product_name}</td>
                  <td className="px-4 py-2">{product.product_family || '-'}</td>
                  <td className="px-4 py-2">{product.list_price.toFixed(2)} {product.currency}</td>
                  <td className="px-4 py-2">{product.unit_of_measure}</td>
                  <td className="px-4 py-2">
                    {product.is_active ? <span className="text-green-600 font-semibold">نشط</span> : <span className="text-red-600">غير نشط</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <p className="text-center py-4 text-gray-500">لا توجد منتجات</p>}
        </div>
      </div>
    </div>
  );
};

export default CRMProducts;