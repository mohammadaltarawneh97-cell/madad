import React, { useState, useEffect } from 'react';
import { useApp } from '../MultiCompanyApp';

const Contracts = () => {
  const { apiCall } = useApp();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newContract, setNewContract] = useState({
    contract_name: '',
    contract_name_ar: '',
    contract_type: 'service_agreement',
    account_id: '',
    contact_id: '',
    start_date: '',
    end_date: '',
    contract_value: 0,
    billing_frequency: 'monthly',
    owner_id: ''
  });

  useEffect(() => { fetchContracts(); }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/crm/contracts');
      setContracts(response || []);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/crm/contracts', { method: 'POST', data: newContract });
      alert('تم إنشاء العقد بنجاح');
      setShowForm(false);
      fetchContracts();
    } catch (error) { alert('خطأ: ' + (error.message || 'حدث خطأ')); }
  };

  const handleActivate = async (contractId) => {
    try {
      await apiCall(`/api/crm/contracts/${contractId}/activate`, { method: 'POST' });
      alert('تم تفعيل العقد بنجاح');
      fetchContracts();
    } catch (error) { alert('خطأ: ' + (error.message || 'حدث خطأ')); }
  };

  const getStatusBadge = (status) => {
    const badges = { draft: 'bg-gray-200 text-gray-700', pending_approval: 'bg-yellow-200 text-yellow-700', active: 'bg-green-200 text-green-700', expired: 'bg-red-200 text-red-700', terminated: 'bg-red-300 text-red-800' };
    const labels = { draft: 'مسودة', pending_approval: 'بانتظار الموافقة', active: 'نشط', expired: 'منتهي', terminated: 'ملغى' };
    return <span className={`px-2 py-1 rounded text-sm font-semibold ${badges[status]}`}>{labels[status]}</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-xl">جاري التحميل...</div></div>;

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة العقود</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          {showForm ? 'إخفاء النموذج' : 'عقد جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">عقد جديد</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">اسم العقد *</label>
              <input type="text" required value={newContract.contract_name} onChange={(e) => setNewContract({...newContract, contract_name: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم العقد (عربي)</label>
              <input type="text" value={newContract.contract_name_ar} onChange={(e) => setNewContract({...newContract, contract_name_ar: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نوع العقد *</label>
              <select required value={newContract.contract_type} onChange={(e) => setNewContract({...newContract, contract_type: e.target.value})} className="w-full border rounded px-3 py-2">
                <option value="service_agreement">اتفاقية خدمة</option>
                <option value="maintenance">صيانة</option>
                <option value="subscription">اشتراك</option>
                <option value="supply_agreement">اتفاقية توريد</option>
                <option value="nda">اتفاقية سرية</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">معرف الحساب *</label>
              <input type="text" required value={newContract.account_id} onChange={(e) => setNewContract({...newContract, account_id: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="معرف الحساب" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ البداية *</label>
              <input type="date" required value={newContract.start_date} onChange={(e) => setNewContract({...newContract, start_date: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ النهاية *</label>
              <input type="date" required value={newContract.end_date} onChange={(e) => setNewContract({...newContract, end_date: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">قيمة العقد *</label>
              <input type="number" step="0.01" required value={newContract.contract_value} onChange={(e) => setNewContract({...newContract, contract_value: parseFloat(e.target.value)})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">معرف المالك *</label>
              <input type="text" required value={newContract.owner_id} onChange={(e) => setNewContract({...newContract, owner_id: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="معرف المستخدم" />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">حفظ العقد</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">العقود</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-right">رقم العقد</th>
                <th className="px-4 py-2 text-right">اسم العقد</th>
                <th className="px-4 py-2 text-right">الحساب</th>
                <th className="px-4 py-2 text-right">القيمة</th>
                <th className="px-4 py-2 text-right">تاريخ البداية</th>
                <th className="px-4 py-2 text-right">الحالة</th>
                <th className="px-4 py-2 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{contract.contract_number}</td>
                  <td className="px-4 py-2">{contract.contract_name_ar || contract.contract_name}</td>
                  <td className="px-4 py-2">{contract.account_name}</td>
                  <td className="px-4 py-2">{contract.contract_value.toFixed(2)} {contract.currency}</td>
                  <td className="px-4 py-2">{new Date(contract.start_date).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-2">{getStatusBadge(contract.status)}</td>
                  <td className="px-4 py-2">
                    {contract.status === 'draft' && (
                      <button onClick={() => handleActivate(contract.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">تفعيل</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contracts.length === 0 && <p className="text-center py-4 text-gray-500">لا توجد عقود</p>}
        </div>
      </div>
    </div>
  );
};

export default Contracts;