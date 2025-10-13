import React, { useState, useEffect } from 'react';
import { useApp } from '../MultiCompanyApp';

const BankReconciliation = () => {
  const { apiCall } = useApp();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [statements, setStatements] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accounts');

  // New bank account form
  const [newAccount, setNewAccount] = useState({
    account_number: '',
    account_name: '',
    account_name_ar: '',
    account_type: 'checking',
    bank_name: '',
    bank_name_ar: '',
    currency: 'SAR',
    opening_balance: 0,
    gl_account_id: ''
  });

  // New statement form
  const [newStatement, setNewStatement] = useState({
    bank_account_id: '',
    statement_date: '',
    from_date: '',
    to_date: '',
    opening_balance: 0,
    closing_balance: 0,
    lines: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsRes, statementsRes, reconciliationsRes] = await Promise.all([
        apiCall('/api/accounting/bank-accounts'),
        apiCall('/api/accounting/bank-statements'),
        apiCall('/api/accounting/bank-reconciliations')
      ]);
      
      setBankAccounts(accountsRes || []);
      setStatements(statementsRes || []);
      setReconciliations(reconciliationsRes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/accounting/bank-accounts', {
        method: 'POST',
        data: newAccount
      });
      alert('تم إنشاء الحساب البنكي بنجاح');
      setNewAccount({
        account_number: '',
        account_name: '',
        account_name_ar: '',
        account_type: 'checking',
        bank_name: '',
        bank_name_ar: '',
        currency: 'SAR',
        opening_balance: 0,
        gl_account_id: ''
      });
      fetchData();
    } catch (error) {
      alert('خطأ في إنشاء الحساب البنكي: ' + (error.message || 'حدث خطأ'));
    }
  };

  const handleCreateStatement = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/accounting/bank-statements', {
        method: 'POST',
        data: newStatement
      });
      alert('تم رفع كشف الحساب بنجاح');
      setNewStatement({
        bank_account_id: '',
        statement_date: '',
        from_date: '',
        to_date: '',
        opening_balance: 0,
        closing_balance: 0,
        lines: []
      });
      fetchData();
    } catch (error) {
      alert('خطأ في رفع كشف الحساب: ' + (error.message || 'حدث خطأ'));
    }
  };

  const handleCreateReconciliation = async (statementId) => {
    try {
      await apiCall(`/api/accounting/bank-reconciliations?statement_id=${statementId}`, {
        method: 'POST'
      });
      alert('تم إنشاء التسوية البنكية بنجاح');
      fetchData();
    } catch (error) {
      alert('خطأ في إنشاء التسوية البنكية: ' + (error.message || 'حدث خطأ'));
    }
  };

  const handleCompleteReconciliation = async (reconId) => {
    try {
      await apiCall(`/api/accounting/bank-reconciliations/${reconId}/complete`, {
        method: 'POST'
      });
      alert('تم إتمام التسوية البنكية بنجاح');
      fetchData();
    } catch (error) {
      alert('خطأ في إتمام التسوية البنكية: ' + (error.message || 'حدث خطأ'));
    }
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
      <h1 className="text-3xl font-bold mb-6">التسوية البنكية</h1>

      {/* Tabs */}
      <div className="flex space-x-reverse space-x-4 mb-6 border-b">
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'accounts' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('accounts')}
        >
          الحسابات البنكية
        </button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'statements' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('statements')}
        >
          كشوف الحساب
        </button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'reconciliations' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('reconciliations')}
        >
          التسويات البنكية
        </button>
      </div>

      {/* Bank Accounts Tab */}
      {activeTab === 'accounts' && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">إضافة حساب بنكي جديد</h2>
            <form onSubmit={handleCreateAccount} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">رقم الحساب</label>
                <input
                  type="text"
                  required
                  value={newAccount.account_number}
                  onChange={(e) => setNewAccount({...newAccount, account_number: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">اسم الحساب</label>
                <input
                  type="text"
                  required
                  value={newAccount.account_name}
                  onChange={(e) => setNewAccount({...newAccount, account_name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">اسم الحساب (عربي)</label>
                <input
                  type="text"
                  value={newAccount.account_name_ar}
                  onChange={(e) => setNewAccount({...newAccount, account_name_ar: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">نوع الحساب</label>
                <select
                  value={newAccount.account_type}
                  onChange={(e) => setNewAccount({...newAccount, account_type: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="checking">حساب جاري</option>
                  <option value="savings">حساب توفير</option>
                  <option value="credit_card">بطاقة ائتمان</option>
                  <option value="line_of_credit">خط ائتمان</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">اسم البنك</label>
                <input
                  type="text"
                  required
                  value={newAccount.bank_name}
                  onChange={(e) => setNewAccount({...newAccount, bank_name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">اسم البنك (عربي)</label>
                <input
                  type="text"
                  value={newAccount.bank_name_ar}
                  onChange={(e) => setNewAccount({...newAccount, bank_name_ar: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">العملة</label>
                <input
                  type="text"
                  value={newAccount.currency}
                  onChange={(e) => setNewAccount({...newAccount, currency: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الرصيد الافتتاحي</label>
                <input
                  type="number"
                  step="0.01"
                  value={newAccount.opening_balance}
                  onChange={(e) => setNewAccount({...newAccount, opening_balance: parseFloat(e.target.value)})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">معرف حساب دليل الحسابات</label>
                <input
                  type="text"
                  required
                  placeholder="اختياري - معرف من دليل الحسابات"
                  value={newAccount.gl_account_id}
                  onChange={(e) => setNewAccount({...newAccount, gl_account_id: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                >
                  إضافة حساب بنكي
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">الحسابات البنكية</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-right">رقم الحساب</th>
                    <th className="px-4 py-2 text-right">اسم الحساب</th>
                    <th className="px-4 py-2 text-right">البنك</th>
                    <th className="px-4 py-2 text-right">النوع</th>
                    <th className="px-4 py-2 text-right">الرصيد الحالي</th>
                    <th className="px-4 py-2 text-right">العملة</th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.map((account) => (
                    <tr key={account.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{account.account_number}</td>
                      <td className="px-4 py-2">{account.account_name_ar || account.account_name}</td>
                      <td className="px-4 py-2">{account.bank_name_ar || account.bank_name}</td>
                      <td className="px-4 py-2">{account.account_type}</td>
                      <td className="px-4 py-2">{account.current_balance.toFixed(2)}</td>
                      <td className="px-4 py-2">{account.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bankAccounts.length === 0 && (
                <p className="text-center py-4 text-gray-500">لا توجد حسابات بنكية</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statements Tab */}
      {activeTab === 'statements' && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">رفع كشف حساب جديد</h2>
            <form onSubmit={handleCreateStatement} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">الحساب البنكي</label>
                <select
                  required
                  value={newStatement.bank_account_id}
                  onChange={(e) => setNewStatement({...newStatement, bank_account_id: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- اختر حساب --</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} ({acc.account_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ الكشف</label>
                <input
                  type="date"
                  required
                  value={newStatement.statement_date}
                  onChange={(e) => setNewStatement({...newStatement, statement_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">من تاريخ</label>
                <input
                  type="date"
                  required
                  value={newStatement.from_date}
                  onChange={(e) => setNewStatement({...newStatement, from_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  required
                  value={newStatement.to_date}
                  onChange={(e) => setNewStatement({...newStatement, to_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الرصيد الافتتاحي</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newStatement.opening_balance}
                  onChange={(e) => setNewStatement({...newStatement, opening_balance: parseFloat(e.target.value)})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الرصيد الختامي</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newStatement.closing_balance}
                  onChange={(e) => setNewStatement({...newStatement, closing_balance: parseFloat(e.target.value)})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                >
                  رفع كشف الحساب
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">كشوف الحساب</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-right">رقم الكشف</th>
                    <th className="px-4 py-2 text-right">الحساب البنكي</th>
                    <th className="px-4 py-2 text-right">تاريخ الكشف</th>
                    <th className="px-4 py-2 text-right">الرصيد الختامي</th>
                    <th className="px-4 py-2 text-right">الحالة</th>
                    <th className="px-4 py-2 text-right">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {statements.map((stmt) => (
                    <tr key={stmt.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{stmt.statement_number}</td>
                      <td className="px-4 py-2">{stmt.bank_account_name}</td>
                      <td className="px-4 py-2">{new Date(stmt.statement_date).toLocaleDateString('ar-EG')}</td>
                      <td className="px-4 py-2">{stmt.closing_balance.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        {stmt.is_reconciled ? (
                          <span className="text-green-600 font-semibold">تمت التسوية</span>
                        ) : (
                          <span className="text-yellow-600 font-semibold">بانتظار التسوية</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {!stmt.is_reconciled && (
                          <button
                            onClick={() => handleCreateReconciliation(stmt.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            إنشاء تسوية
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {statements.length === 0 && (
                <p className="text-center py-4 text-gray-500">لا توجد كشوف حساب</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reconciliations Tab */}
      {activeTab === 'reconciliations' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">التسويات البنكية</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-right">رقم التسوية</th>
                  <th className="px-4 py-2 text-right">تاريخ التسوية</th>
                  <th className="px-4 py-2 text-right">رصيد الكشف</th>
                  <th className="px-4 py-2 text-right">رصيد دليل الحسابات</th>
                  <th className="px-4 py-2 text-right">الفرق</th>
                  <th className="px-4 py-2 text-right">الحالة</th>
                  <th className="px-4 py-2 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {reconciliations.map((recon) => (
                  <tr key={recon.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{recon.reconciliation_number}</td>
                    <td className="px-4 py-2">{new Date(recon.reconciliation_date).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-2">{recon.statement_balance.toFixed(2)}</td>
                    <td className="px-4 py-2">{recon.gl_balance.toFixed(2)}</td>
                    <td className={`px-4 py-2 font-semibold ${Math.abs(recon.difference) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                      {recon.difference.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      {recon.is_reconciled ? (
                        <span className="text-green-600 font-semibold">مكتملة</span>
                      ) : (
                        <span className="text-yellow-600 font-semibold">قيد المعالجة</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {!recon.is_reconciled && (
                        <button
                          onClick={() => handleCompleteReconciliation(recon.id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          إتمام التسوية
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reconciliations.length === 0 && (
              <p className="text-center py-4 text-gray-500">لا توجد تسويات بنكية</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankReconciliation;
