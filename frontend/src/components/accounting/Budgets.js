import React, { useState, useEffect } from 'react';
import { useApp } from '../MultiCompanyApp';

const Budgets = () => {
  const { apiCall } = useApp();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  // New budget form
  const [newBudget, setNewBudget] = useState({
    budget_name: '',
    budget_name_ar: '',
    budget_type: 'annual',
    fiscal_year: new Date().getFullYear(),
    period: '',
    start_date: '',
    end_date: '',
    department_id: '',
    cost_center_id: '',
    lines: [],
    notes: ''
  });

  // New line form
  const [newLine, setNewLine] = useState({
    account_id: '',
    account_code: '',
    account_name: '',
    budgeted_amount: 0
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/accounting/budgets');
      setBudgets(response || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
    setLoading(false);
  };

  const addLineToBudget = () => {
    if (!newLine.account_code || !newLine.account_name || newLine.budgeted_amount <= 0) {
      alert('يرجى ملء تفاصيل بند الموازنة');
      return;
    }

    setNewBudget({
      ...newBudget,
      lines: [
        ...newBudget.lines,
        {
          ...newLine,
          account_id: newLine.account_id || `acc-${Date.now()}`,
          actual_amount: 0,
          variance: -newLine.budgeted_amount,
          variance_percentage: -100
        }
      ]
    });

    // Reset line form
    setNewLine({
      account_id: '',
      account_code: '',
      account_name: '',
      budgeted_amount: 0
    });
  };

  const removeLineFromBudget = (index) => {
    setNewBudget({
      ...newBudget,
      lines: newBudget.lines.filter((_, i) => i !== index)
    });
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    
    if (newBudget.lines.length === 0) {
      alert('يرجى إضافة بند موازنة واحد على الأقل');
      return;
    }

    try {
      await apiCall('/api/accounting/budgets', {
        method: 'POST',
        data: newBudget
      });
      alert('تم إنشاء الموازنة بنجاح');
      setNewBudget({
        budget_name: '',
        budget_name_ar: '',
        budget_type: 'annual',
        fiscal_year: new Date().getFullYear(),
        period: '',
        start_date: '',
        end_date: '',
        department_id: '',
        cost_center_id: '',
        lines: [],
        notes: ''
      });
      setShowForm(false);
      fetchBudgets();
    } catch (error) {
      alert('خطأ في إنشاء الموازنة: ' + (error.message || 'حدث خطأ'));
    }
  };

  const handleApproveBudget = async (budgetId) => {
    try {
      await apiCall(`/api/accounting/budgets/${budgetId}/approve`, {
        method: 'POST'
      });
      alert('تم الموافقة على الموازنة');
      fetchBudgets();
    } catch (error) {
      alert('خطأ في الموافقة على الموازنة: ' + (error.message || 'حدث خطأ'));
    }
  };

  const viewBudgetDetails = async (budgetId) => {
    try {
      const budget = await apiCall(`/api/accounting/budgets/${budgetId}`);
      setSelectedBudget(budget);
    } catch (error) {
      alert('خطأ في عرض تفاصيل الموازنة: ' + (error.message || 'حدث خطأ'));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-200 text-gray-700',
      approved: 'bg-green-200 text-green-700',
      active: 'bg-blue-200 text-blue-700',
      closed: 'bg-red-200 text-red-700'
    };

    const labels = {
      draft: 'مسودة',
      approved: 'موافق عليها',
      active: 'نشطة',
      closed: 'مغلقة'
    };

    return (
      <span className={`px-2 py-1 rounded text-sm font-semibold ${badges[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  const calculateTotalBudget = (lines) => {
    return lines.reduce((sum, line) => sum + line.budgeted_amount, 0);
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
        <h1 className="text-3xl font-bold">إدارة الموازنات</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'إخفاء النموذج' : 'موازنة جديدة'}
        </button>
      </div>

      {/* New Budget Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">موازنة جديدة</h2>
          <form onSubmit={handleCreateBudget}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">اسم الموازنة</label>
                <input
                  type="text"
                  required
                  value={newBudget.budget_name}
                  onChange={(e) => setNewBudget({...newBudget, budget_name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Budget 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">اسم الموازنة (عربي)</label>
                <input
                  type="text"
                  value={newBudget.budget_name_ar}
                  onChange={(e) => setNewBudget({...newBudget, budget_name_ar: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  placeholder="موازنة 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">نوع الموازنة</label>
                <select
                  value={newBudget.budget_type}
                  onChange={(e) => setNewBudget({...newBudget, budget_type: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="annual">سنوية</option>
                  <option value="quarterly">ربع سنوية</option>
                  <option value="monthly">شهرية</option>
                  <option value="project">مشروع</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">السنة المالية</label>
                <input
                  type="number"
                  required
                  value={newBudget.fiscal_year}
                  onChange={(e) => setNewBudget({...newBudget, fiscal_year: parseInt(e.target.value)})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الفترة (اختياري)</label>
                <input
                  type="text"
                  value={newBudget.period}
                  onChange={(e) => setNewBudget({...newBudget, period: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Q1, Q2, Jan, Feb, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">معرف القسم (اختياري)</label>
                <input
                  type="text"
                  value={newBudget.department_id}
                  onChange={(e) => setNewBudget({...newBudget, department_id: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ البداية</label>
                <input
                  type="date"
                  required
                  value={newBudget.start_date}
                  onChange={(e) => setNewBudget({...newBudget, start_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ النهاية</label>
                <input
                  type="date"
                  required
                  value={newBudget.end_date}
                  onChange={(e) => setNewBudget({...newBudget, end_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea
                  value={newBudget.notes}
                  onChange={(e) => setNewBudget({...newBudget, notes: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  rows="2"
                />
              </div>
            </div>

            {/* Budget Lines */}
            <div className="border-t pt-4 mb-4">
              <h3 className="text-xl font-bold mb-3">بنود الموازنة</h3>
              
              {/* Add Line Form */}
              <div className="bg-gray-50 p-4 rounded mb-4">
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">كود الحساب</label>
                    <input
                      type="text"
                      value={newLine.account_code}
                      onChange={(e) => setNewLine({...newLine, account_code: e.target.value})}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">اسم الحساب</label>
                    <input
                      type="text"
                      value={newLine.account_name}
                      onChange={(e) => setNewLine({...newLine, account_name: e.target.value})}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="المصروفات التشغيلية"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">المبلغ المخطط</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newLine.budgeted_amount}
                      onChange={(e) => setNewLine({...newLine, budgeted_amount: parseFloat(e.target.value)})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addLineToBudget}
                      className="bg-green-500 text-white px-4 py-1 rounded text-sm hover:bg-green-600 w-full"
                    >
                      إضافة بند
                    </button>
                  </div>
                </div>
              </div>

              {/* Lines Table */}
              {newBudget.lines.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-right text-sm">كود الحساب</th>
                        <th className="px-2 py-2 text-right text-sm">اسم الحساب</th>
                        <th className="px-2 py-2 text-right text-sm">المبلغ المخطط</th>
                        <th className="px-2 py-2 text-right text-sm">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newBudget.lines.map((line, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-2 py-2 text-sm">{line.account_code}</td>
                          <td className="px-2 py-2 text-sm">{line.account_name}</td>
                          <td className="px-2 py-2 text-sm">{line.budgeted_amount.toFixed(2)}</td>
                          <td className="px-2 py-2 text-sm">
                            <button
                              type="button"
                              onClick={() => removeLineFromBudget(idx)}
                              className="text-red-600 hover:text-red-800"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan="2" className="px-2 py-2 text-sm text-left">الإجمالي:</td>
                        <td className="px-2 py-2 text-sm">
                          {calculateTotalBudget(newBudget.lines).toFixed(2)}
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
                حفظ الموازنة
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

      {/* Budget Details Modal */}
      {selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">تفاصيل الموازنة</h2>
              <button
                onClick={() => setSelectedBudget(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">رقم الموازنة</p>
                <p className="font-semibold">{selectedBudget.budget_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">اسم الموازنة</p>
                <p className="font-semibold">{selectedBudget.budget_name_ar || selectedBudget.budget_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">السنة المالية</p>
                <p className="font-semibold">{selectedBudget.fiscal_year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الحالة</p>
                <p>{getStatusBadge(selectedBudget.status)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-right">كود الحساب</th>
                    <th className="px-3 py-2 text-right">اسم الحساب</th>
                    <th className="px-3 py-2 text-right">المخطط</th>
                    <th className="px-3 py-2 text-right">الفعلي</th>
                    <th className="px-3 py-2 text-right">الفرق</th>
                    <th className="px-3 py-2 text-right">النسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBudget.lines.map((line, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2">{line.account_code}</td>
                      <td className="px-3 py-2">{line.account_name}</td>
                      <td className="px-3 py-2">{line.budgeted_amount.toFixed(2)}</td>
                      <td className="px-3 py-2">{line.actual_amount.toFixed(2)}</td>
                      <td className={`px-3 py-2 ${line.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {line.variance.toFixed(2)}
                      </td>
                      <td className={`px-3 py-2 ${line.variance_percentage < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {line.variance_percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan="2" className="px-3 py-2">الإجمالي:</td>
                    <td className="px-3 py-2">{selectedBudget.total_budget.toFixed(2)}</td>
                    <td className="px-3 py-2">{selectedBudget.total_actual.toFixed(2)}</td>
                    <td className={`px-3 py-2 ${selectedBudget.total_variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedBudget.total_variance.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Budgets List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">الموازنات</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-right">رقم الموازنة</th>
                <th className="px-4 py-2 text-right">اسم الموازنة</th>
                <th className="px-4 py-2 text-right">السنة المالية</th>
                <th className="px-4 py-2 text-right">النوع</th>
                <th className="px-4 py-2 text-right">المبلغ المخطط</th>
                <th className="px-4 py-2 text-right">الحالة</th>
                <th className="px-4 py-2 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((budget) => (
                <tr key={budget.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{budget.budget_number}</td>
                  <td className="px-4 py-2">{budget.budget_name_ar || budget.budget_name}</td>
                  <td className="px-4 py-2">{budget.fiscal_year}</td>
                  <td className="px-4 py-2">{budget.budget_type}</td>
                  <td className="px-4 py-2">{budget.total_budget.toFixed(2)} ريال</td>
                  <td className="px-4 py-2">{getStatusBadge(budget.status)}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewBudgetDetails(budget.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        عرض
                      </button>
                      {budget.status === 'draft' && (
                        <button
                          onClick={() => handleApproveBudget(budget.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          موافقة
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {budgets.length === 0 && (
            <p className="text-center py-4 text-gray-500">لا توجد موازنات</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Budgets;
