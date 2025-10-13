import React, { useState, useEffect } from 'react';
import { useApp } from '../MultiCompanyApp';

const PaymentBatches = () => {
  const { apiCall } = useApp();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newBatch, setNewBatch] = useState({
    batch_name: '',
    batch_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    payments: []
  });

  const [newPayment, setNewPayment] = useState({
    vendor_id: '',
    vendor_name: '',
    invoice_number: '',
    amount: 0,
    currency: 'SAR',
    payment_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchBatches(); }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/accounting/payment-batches');
      setBatches(response || []);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const addPaymentToBatch = () => {
    if (!newPayment.vendor_name || newPayment.amount <= 0) {
      alert('يرجى ملء تفاصيل الدفعة');
      return;
    }

    setNewBatch({
      ...newBatch,
      payments: [...newBatch.payments, { ...newPayment }]
    });

    setNewPayment({
      vendor_id: '',
      vendor_name: '',
      invoice_number: '',
      amount: 0,
      currency: 'SAR',
      payment_date: new Date().toISOString().split('T')[0]
    });
  };

  const removePayment = (index) => {
    setNewBatch({
      ...newBatch,
      payments: newBatch.payments.filter((_, i) => i !== index)
    });
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (newBatch.payments.length === 0) {
      alert('يرجى إضافة دفعة واحدة على الأقل');
      return;
    }

    try {
      await apiCall('/api/accounting/payment-batches', { method: 'POST', data: newBatch });
      alert('تم إنشاء دفعة الدفع بنجاح');
      setNewBatch({
        batch_name: '',
        batch_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        payments: []
      });
      setShowForm(false);
      fetchBatches();
    } catch (error) {
      alert('خطأ: ' + (error.message || 'حدث خطأ'));
    }
  };

  const handleProcessBatch = async (batchId) => {
    if (!window.confirm('هل أنت متأكد من معالجة هذه الدفعة؟')) return;
    try {
      await apiCall(`/api/accounting/payment-batches/${batchId}/process`, { method: 'POST' });
      alert('تم بدء معالجة الدفعة');
      fetchBatches();
    } catch (error) { alert('خطأ: ' + error.message); }
  };

  const handleCompleteBatch = async (batchId) => {
    try {
      await apiCall(`/api/accounting/payment-batches/${batchId}/complete`, { method: 'POST' });
      alert('تم إكمال الدفعة بنجاح');
      fetchBatches();
    } catch (error) { alert('خطأ: ' + error.message); }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-200 text-yellow-700',
      processing: 'bg-blue-200 text-blue-700',
      completed: 'bg-green-200 text-green-700',
      failed: 'bg-red-200 text-red-700'
    };
    const labels = { pending: 'معلق', processing: 'قيد المعالجة', completed: 'مكتمل', failed: 'فشل' };
    return <span className={`px-2 py-1 rounded text-sm font-semibold ${badges[status]}`}>{labels[status]}</span>;
  };

  const calculateTotal = () => newBatch.payments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-xl">جاري التحميل...</div></div>;

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">دفعات الدفع</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          {showForm ? 'إخفاء النموذج' : 'دفعة جديدة'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">دفعة دفع جديدة</h2>
          <form onSubmit={handleCreateBatch}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">اسم الدفعة *</label>
                <input type="text" required value={newBatch.batch_name} onChange={(e) => setNewBatch({...newBatch, batch_name: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ الدفعة *</label>
                <input type="date" required value={newBatch.batch_date} onChange={(e) => setNewBatch({...newBatch, batch_date: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">طريقة الدفع *</label>
                <select value={newBatch.payment_method} onChange={(e) => setNewBatch({...newBatch, payment_method: e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="check">شيك</option>
                  <option value="cash">نقدي</option>
                  <option value="credit_card">بطاقة ائتمان</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <h3 className="text-xl font-bold mb-3">إضافة دفعات</h3>
              <div className="bg-gray-50 p-4 rounded mb-4">
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">اسم المورد</label>
                    <input type="text" value={newPayment.vendor_name} onChange={(e) => setNewPayment({...newPayment, vendor_name: e.target.value})} className="w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">رقم الفاتورة</label>
                    <input type="text" value={newPayment.invoice_number} onChange={(e) => setNewPayment({...newPayment, invoice_number: e.target.value})} className="w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">المبلغ</label>
                    <input type="number" step="0.01" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})} className="w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={addPaymentToBatch} className="bg-green-500 text-white px-4 py-1 rounded text-sm hover:bg-green-600 w-full">
                      إضافة
                    </button>
                  </div>
                </div>
              </div>

              {newBatch.payments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-right text-sm">المورد</th>
                        <th className="px-3 py-2 text-right text-sm">الفاتورة</th>
                        <th className="px-3 py-2 text-right text-sm">المبلغ</th>
                        <th className="px-3 py-2 text-right text-sm">العملة</th>
                        <th className="px-3 py-2 text-right text-sm">التاريخ</th>
                        <th className="px-3 py-2 text-right text-sm">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newBatch.payments.map((payment, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-3 py-2 text-sm">{payment.vendor_name}</td>
                          <td className="px-3 py-2 text-sm">{payment.invoice_number}</td>
                          <td className="px-3 py-2 text-sm">{payment.amount.toFixed(2)}</td>
                          <td className="px-3 py-2 text-sm">{payment.currency}</td>
                          <td className="px-3 py-2 text-sm">{new Date(payment.payment_date).toLocaleDateString('ar-EG')}</td>
                          <td className="px-3 py-2 text-sm">
                            <button type="button" onClick={() => removePayment(idx)} className="text-red-600 hover:text-red-800">حذف</button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan="2" className="px-3 py-2 text-sm text-left">الإجمالي:</td>
                        <td className="px-3 py-2 text-sm">{calculateTotal().toFixed(2)}</td>
                        <td colSpan="3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">حفظ الدفعة</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">دفعات الدفع</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-right">رقم الدفعة</th>
                <th className="px-4 py-2 text-right">اسم الدفعة</th>
                <th className="px-4 py-2 text-right">التاريخ</th>
                <th className="px-4 py-2 text-right">عدد الدفعات</th>
                <th className="px-4 py-2 text-right">المبلغ الإجمالي</th>
                <th className="px-4 py-2 text-right">الحالة</th>
                <th className="px-4 py-2 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{batch.batch_number}</td>
                  <td className="px-4 py-2">{batch.batch_name}</td>
                  <td className="px-4 py-2">{new Date(batch.batch_date).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-2">{batch.payment_count}</td>
                  <td className="px-4 py-2">{batch.total_amount.toFixed(2)} ريال</td>
                  <td className="px-4 py-2">{getStatusBadge(batch.status)}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      {batch.status === 'pending' && (
                        <button onClick={() => handleProcessBatch(batch.id)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">معالجة</button>
                      )}
                      {batch.status === 'processing' && (
                        <button onClick={() => handleCompleteBatch(batch.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">إكمال</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {batches.length === 0 && <p className="text-center py-4 text-gray-500">لا توجد دفعات دفع</p>}
        </div>
      </div>
    </div>
  );
};

export default PaymentBatches;
