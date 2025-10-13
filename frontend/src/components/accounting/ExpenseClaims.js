import React, { useState, useEffect } from 'react';
import { useApp } from '../MultiCompanyApp';

const ExpenseClaims = () => {
  const { apiCall } = useApp();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // New claim form
  const [newClaim, setNewClaim] = useState({
    claim_date: new Date().toISOString().split('T')[0],
    employee_id: '',
    lines: [],
    notes: ''
  });

  // New line form
  const [newLine, setNewLine] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    expense_category: '',
    description: '',
    amount: 0,
    tax_amount: 0,
    receipt_attached: false
  });

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/accounting/expense-claims');
      setClaims(response || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
    }
    setLoading(false);
  };

  const addLineToNewClaim = () => {
    if (!newLine.description || newLine.amount <= 0) {
      alert('يرجى ملء تفاصيل المصروف');
      return;
    }

    setNewClaim({
      ...newClaim,
      lines: [
        ...newClaim.lines,
        {
          ...newLine,
          line_number: newClaim.lines.length + 1
        }
      ]
    });

    // Reset line form
    setNewLine({
      expense_date: new Date().toISOString().split('T')[0],
      expense_category: '',
      description: '',
      amount: 0,
      tax_amount: 0,
      receipt_attached: false
    });
  };

  const removeLineFromNewClaim = (index) => {
    setNewClaim({
      ...newClaim,
      lines: newClaim.lines.filter((_, i) => i !== index)
    });
  };

  const handleCreateClaim = async (e) => {
    e.preventDefault();
    
    if (newClaim.lines.length === 0) {
      alert('يرجى إضافة بند مصروف واحد على الأقل');
      return;
    }

    try {
      await apiCall('/api/accounting/expense-claims', {
        method: 'POST',
        data: newClaim
      });
      alert('تم إنشاء مطالبة المصروفات بنجاح');
      setNewClaim({
        claim_date: new Date().toISOString().split('T')[0],
        employee_id: '',
        lines: [],
        notes: ''
      });
      setShowForm(false);
      fetchClaims();
    } catch (error) {
      alert('خطأ في إنشاء مطالبة المصروفات: ' + (error.message || 'حدث خطأ'));
    }
  };

  const handleSubmitClaim = async (claimId) => {
    try {
      await apiCall(`/api/accounting/expense-claims/${claimId}/submit`, {
        method: 'POST'
      });
      alert('تم تقديم المطالبة للموافقة');
      fetchClaims();
    } catch (error) {
      alert('خطأ في تقديم المطالبة: ' + (error.message || 'حدث خطأ'));
    }
  };

  const handleApproveClaim = async (claimId) => {
    try {
      await apiCall(`/api/accounting/expense-claims/${claimId}/approve`, {
        method: 'POST'
      });
      alert('تم الموافقة على المطالبة');
      fetchClaims();
    } catch (error) {
      alert('خطأ في الموافقة على المطالبة: ' + (error.message || 'حدث خطأ'));
    }
  };

  const handleRejectClaim = async (claimId) => {
    const reason = prompt('يرجى إدخال سبب الرفض:');
    if (!reason) return;

    try {
      await apiCall(`/api/accounting/expense-claims/${claimId}/reject?reason=${encodeURIComponent(reason)}`, {
        method: 'POST'
      });
      alert('تم رفض المطالبة');
      fetchClaims();
    } catch (error) {
      alert('خطأ في رفض المطالبة: ' + (error.message || 'حدث خطأ'));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-200 text-gray-700',
      submitted: 'bg-blue-200 text-blue-700',
      approved: 'bg-green-200 text-green-700',
      rejected: 'bg-red-200 text-red-700',
      paid: 'bg-purple-200 text-purple-700'
    };

    const labels = {
      draft: 'مسودة',
      submitted: 'قيد المراجعة',
      approved: 'موافق عليها',
      rejected: 'مرفوضة',
      paid: 'تم الدفع'
    };

    return (
      <span className={`px-2 py-1 rounded text-sm font-semibold ${badges[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  const calculateTotal = (lines) => {
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    const tax = lines.reduce((sum, line) => sum + line.tax_amount, 0);
    return { total, tax, net: total + tax };
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
        <h1 className="text-3xl font-bold">مطالبات المصروفات</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'إخفاء النموذج' : 'مطالبة جديدة'}
        </button>
      </div>

      {/* New Claim Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">مطالبة مصروفات جديدة</h2>
          <form onSubmit={handleCreateClaim}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ المطالبة</label>
                <input
                  type="date"
                  required
                  value={newClaim.claim_date}
                  onChange={(e) => setNewClaim({...newClaim, claim_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">معرف الموظف</label>
                <input
                  type="text"
                  required
                  placeholder="معرف الموظف"
                  value={newClaim.employee_id}
                  onChange={(e) => setNewClaim({...newClaim, employee_id: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea
                  value={newClaim.notes}
                  onChange={(e) => setNewClaim({...newClaim, notes: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  rows="2"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="border-t pt-4 mb-4">
              <h3 className="text-xl font-bold mb-3">بنود المصروفات</h3>
              
              {/* Add Line Form */}
              <div className="bg-gray-50 p-4 rounded mb-4">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">تاريخ المصروف</label>
                    <input
                      type="date"
                      value={newLine.expense_date}
                      onChange={(e) => setNewLine({...newLine, expense_date: e.target.value})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الفئة</label>
                    <select
                      value={newLine.expense_category}
                      onChange={(e) => setNewLine({...newLine, expense_category: e.target.value})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="">-- اختر الفئة --</option>
                      <option value="travel">سفر</option>
                      <option value="meals">وجبات</option>
                      <option value="transport">مواصلات</option>
                      <option value="supplies">مستلزمات مكتبية</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الوصف</label>
                    <input
                      type="text"
                      value={newLine.description}
                      onChange={(e) => setNewLine({...newLine, description: e.target.value})}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="وصف المصروف"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">المبلغ</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newLine.amount}
                      onChange={(e) => setNewLine({...newLine, amount: parseFloat(e.target.value)})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الضريبة</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newLine.tax_amount}
                      onChange={(e) => setNewLine({...newLine, tax_amount: parseFloat(e.target.value)})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addLineToNewClaim}
                      className="bg-green-500 text-white px-4 py-1 rounded text-sm hover:bg-green-600 w-full"
                    >
                      إضافة بند
                    </button>
                  </div>
                </div>
              </div>

              {/* Lines Table */}
              {newClaim.lines.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-right text-sm">التاريخ</th>
                        <th className="px-2 py-2 text-right text-sm">الفئة</th>
                        <th className="px-2 py-2 text-right text-sm">الوصف</th>
                        <th className="px-2 py-2 text-right text-sm">المبلغ</th>
                        <th className="px-2 py-2 text-right text-sm">الضريبة</th>
                        <th className="px-2 py-2 text-right text-sm">الإجمالي</th>
                        <th className="px-2 py-2 text-right text-sm">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newClaim.lines.map((line, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-2 py-2 text-sm">{new Date(line.expense_date).toLocaleDateString('ar-EG')}</td>
                          <td className="px-2 py-2 text-sm">{line.expense_category}</td>
                          <td className="px-2 py-2 text-sm">{line.description}</td>
                          <td className="px-2 py-2 text-sm">{line.amount.toFixed(2)}</td>
                          <td className="px-2 py-2 text-sm">{line.tax_amount.toFixed(2)}</td>
                          <td className="px-2 py-2 text-sm">{(line.amount + line.tax_amount).toFixed(2)}</td>
                          <td className="px-2 py-2 text-sm">
                            <button
                              type="button"
                              onClick={() => removeLineFromNewClaim(idx)}
                              className="text-red-600 hover:text-red-800"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan="3" className="px-2 py-2 text-sm text-left">الإجمالي:</td>
                        <td className="px-2 py-2 text-sm">
                          {calculateTotal(newClaim.lines).total.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-sm">
                          {calculateTotal(newClaim.lines).tax.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-sm">
                          {calculateTotal(newClaim.lines).net.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
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
                حفظ المطالبة
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

      {/* Claims List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">المطالبات</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-right">رقم المطالبة</th>
                <th className="px-4 py-2 text-right">اسم الموظف</th>
                <th className="px-4 py-2 text-right">تاريخ المطالبة</th>
                <th className="px-4 py-2 text-right">المبلغ الإجمالي</th>
                <th className="px-4 py-2 text-right">الحالة</th>
                <th className="px-4 py-2 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{claim.claim_number}</td>
                  <td className="px-4 py-2">{claim.employee_name}</td>
                  <td className="px-4 py-2">{new Date(claim.claim_date).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-2">{claim.net_amount.toFixed(2)} ريال</td>
                  <td className="px-4 py-2">{getStatusBadge(claim.status)}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      {claim.status === 'draft' && (
                        <button
                          onClick={() => handleSubmitClaim(claim.id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          تقديم
                        </button>
                      )}
                      {claim.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => handleApproveClaim(claim.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            موافقة
                          </button>
                          <button
                            onClick={() => handleRejectClaim(claim.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            رفض
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {claims.length === 0 && (
            <p className="text-center py-4 text-gray-500">لا توجد مطالبات مصروفات</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseClaims;
