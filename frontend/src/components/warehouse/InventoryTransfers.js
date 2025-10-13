import React, { useState, useEffect } from 'react';
import { useApp } from '../MultiCompanyApp';

const InventoryTransfers = () => {
  const { apiCall } = useApp();
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [newTransfer, setNewTransfer] = useState({
    transfer_number: '',
    transfer_date: new Date().toISOString().split('T')[0],
    from_warehouse_id: '',
    to_warehouse_id: '',
    status: 'draft',
    notes: '',
    lines: []
  });

  const [newLine, setNewLine] = useState({
    product_id: '',
    quantity: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transfersRes, warehousesRes, productsRes] = await Promise.all([
        apiCall('/api/warehouse/stock-movements?movement_type=transfer'),
        apiCall('/api/warehouse/warehouses'),
        apiCall('/api/warehouse/products')
      ]);
      
      setTransfers(transfersRes || []);
      setWarehouses(warehousesRes || []);
      setProducts(productsRes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const addLineToTransfer = () => {
    if (!newLine.product_id || newLine.quantity <= 0) {
      alert('يرجى اختيار المنتج وإدخال الكمية');
      return;
    }

    const product = products.find(p => p.id === newLine.product_id);
    if (!product) return;

    setNewTransfer({
      ...newTransfer,
      lines: [
        ...newTransfer.lines,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: newLine.quantity
        }
      ]
    });

    setNewLine({ product_id: '', quantity: 0 });
  };

  const removeLineFromTransfer = (index) => {
    setNewTransfer({
      ...newTransfer,
      lines: newTransfer.lines.filter((_, i) => i !== index)
    });
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    
    if (newTransfer.lines.length === 0) {
      alert('يرجى إضافة منتج واحد على الأقل');
      return;
    }

    if (newTransfer.from_warehouse_id === newTransfer.to_warehouse_id) {
      alert('لا يمكن النقل من وإلى نفس المستودع');
      return;
    }

    try {
      // Create stock movement for transfer
      const transferData = {
        movement_type: 'transfer',
        movement_date: newTransfer.transfer_date,
        from_warehouse_id: newTransfer.from_warehouse_id,
        to_warehouse_id: newTransfer.to_warehouse_id,
        notes: newTransfer.notes,
        lines: newTransfer.lines
      };

      await apiCall('/api/warehouse/stock-movements', {
        method: 'POST',
        data: transferData
      });
      
      alert('تم إنشاء أمر النقل بنجاح');
      setNewTransfer({
        transfer_number: '',
        transfer_date: new Date().toISOString().split('T')[0],
        from_warehouse_id: '',
        to_warehouse_id: '',
        status: 'draft',
        notes: '',
        lines: []
      });
      setShowForm(false);
      fetchData();
    } catch (error) {
      alert('خطأ في إنشاء أمر النقل: ' + (error.message || 'حدث خطأ'));
    }
  };

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? (warehouse.name_ar || warehouse.name) : 'غير معروف';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">نقل المخزون</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'إخفاء النموذج' : 'أمر نقل جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">أمر نقل جديد</h2>
          <form onSubmit={handleCreateTransfer}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ النقل *</label>
                <input
                  type="date"
                  required
                  value={newTransfer.transfer_date}
                  onChange={(e) => setNewTransfer({...newTransfer, transfer_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">من مستودع *</label>
                <select
                  required
                  value={newTransfer.from_warehouse_id}
                  onChange={(e) => setNewTransfer({...newTransfer, from_warehouse_id: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- اختر مستودع --</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name_ar || wh.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">إلى مستودع *</label>
                <select
                  required
                  value={newTransfer.to_warehouse_id}
                  onChange={(e) => setNewTransfer({...newTransfer, to_warehouse_id: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- اختر مستودع --</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name_ar || wh.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea
                  value={newTransfer.notes}
                  onChange={(e) => setNewTransfer({...newTransfer, notes: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  rows="2"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="border-t pt-4 mb-4">
              <h3 className="text-xl font-bold mb-3">المنتجات</h3>
              
              {/* Add Line Form */}
              <div className="bg-gray-50 p-4 rounded mb-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">المنتج</label>
                    <select
                      value={newLine.product_id}
                      onChange={(e) => setNewLine({...newLine, product_id: e.target.value})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="">-- اختر منتج --</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name_ar || product.name} (SKU: {product.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الكمية</label>
                    <input
                      type="number"
                      min="1"
                      value={newLine.quantity}
                      onChange={(e) => setNewLine({...newLine, quantity: parseInt(e.target.value)})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <button
                      type="button"
                      onClick={addLineToTransfer}
                      className="bg-green-500 text-white px-4 py-1 rounded text-sm hover:bg-green-600 w-full"
                    >
                      إضافة منتج
                    </button>
                  </div>
                </div>
              </div>

              {/* Lines Table */}
              {newTransfer.lines.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-right text-sm">المنتج</th>
                        <th className="px-2 py-2 text-right text-sm">الكمية</th>
                        <th className="px-2 py-2 text-right text-sm">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newTransfer.lines.map((line, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-2 py-2 text-sm">{line.product_name}</td>
                          <td className="px-2 py-2 text-sm">{line.quantity}</td>
                          <td className="px-2 py-2 text-sm">
                            <button
                              type="button"
                              onClick={() => removeLineFromTransfer(idx)}
                              className="text-red-600 hover:text-red-800"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                إنشاء أمر النقل
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">أوامر النقل</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-right">رقم الحركة</th>
                <th className="px-4 py-2 text-right">التاريخ</th>
                <th className="px-4 py-2 text-right">من مستودع</th>
                <th className="px-4 py-2 text-right">إلى مستودع</th>
                <th className="px-4 py-2 text-right">عدد المنتجات</th>
                <th className="px-4 py-2 text-right">الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => (
                <tr key={transfer.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{transfer.movement_number}</td>
                  <td className="px-4 py-2">{new Date(transfer.movement_date).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-2">{getWarehouseName(transfer.from_warehouse_id)}</td>
                  <td className="px-4 py-2">{getWarehouseName(transfer.to_warehouse_id)}</td>
                  <td className="px-4 py-2">{transfer.lines?.length || 0}</td>
                  <td className="px-4 py-2">{transfer.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transfers.length === 0 && (
            <p className="text-center py-4 text-gray-500">لا توجد أوامر نقل</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryTransfers;
