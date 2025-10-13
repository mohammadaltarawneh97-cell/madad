import React, { useState, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const FinancialReports = () => {
  const { token } = useContext(AppContext);
  const [selectedReport, setSelectedReport] = useState('trial_balance');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0]
  });

  const reports = {
    trial_balance: 'ميزان المراجعة',
    balance_sheet: 'الميزانية العمومية',
    income_statement: 'قائمة الدخل'
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `${process.env.REACT_APP_BACKEND_URL}/api/accounting/reports/${selectedReport.replace('_', '-')}`;
      
      if (selectedReport === 'income_statement') {
        url += `?from_date=${dateRange.from_date}&to_date=${dateRange.to_date}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTrialBalance = () => {
    if (!reportData || !reportData.accounts) return null;
    
    return (
      <div className="overflow-x-auto">
        <div className="mb-4">
          <h3 className="text-xl font-bold">ميزان المراجعة</h3>
          <p className="text-gray-600">كما في: {new Date(reportData.as_of_date).toLocaleDateString('ar-SA')}</p>
        </div>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-right">رمز الحساب</th>
              <th className="p-3 text-right">اسم الحساب</th>
              <th className="p-3 text-right">نوع الحساب</th>
              <th className="p-3 text-right">مدين</th>
              <th className="p-3 text-right">دائن</th>
            </tr>
          </thead>
          <tbody>
            {reportData.accounts.map((account, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-3 font-mono">{account.account_code}</td>
                <td className="p-3">{account.account_name_ar || account.account_name}</td>
                <td className="p-3">{account.account_type}</td>
                <td className="p-3 text-green-600 font-semibold">
                  {account.debit > 0 ? account.debit.toLocaleString('ar-SA') : '-'}
                </td>
                <td className="p-3 text-red-600 font-semibold">
                  {account.credit > 0 ? account.credit.toLocaleString('ar-SA') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-200 font-bold">
            <tr>
              <td colSpan="3" className="p-3 text-right">الإجمالي:</td>
              <td className="p-3 text-green-700">{reportData.total_debit?.toLocaleString('ar-SA')}</td>
              <td className="p-3 text-red-700">{reportData.total_credit?.toLocaleString('ar-SA')}</td>
            </tr>
            <tr>
              <td colSpan="5" className="p-3 text-center">
                <span className={`px-4 py-2 rounded-full ${reportData.balanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {reportData.balanced ? '✓ متوازن' : '✗ غير متوازن'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!reportData) return null;
    
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold">الميزانية العمومية</h3>
          <p className="text-gray-600">كما في: {new Date(reportData.as_of_date).toLocaleDateString('ar-SA')}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Assets */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-3 text-blue-800">الأصول</h4>
            {reportData.assets?.map((account, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b border-blue-200">
                <span>{account.account_name_ar || account.account_name}</span>
                <span className="font-semibold">{account.balance?.toLocaleString('ar-SA')}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 mt-2 font-bold text-blue-900">
              <span>إجمالي الأصول:</span>
              <span>{reportData.total_assets?.toLocaleString('ar-SA')} SAR</span>
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div>
            <div className="bg-red-50 p-4 rounded-lg mb-4">
              <h4 className="text-lg font-semibold mb-3 text-red-800">الالتزامات</h4>
              {reportData.liabilities?.map((account, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-red-200">
                  <span>{account.account_name_ar || account.account_name}</span>
                  <span className="font-semibold">{account.balance?.toLocaleString('ar-SA')}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 mt-2 font-bold text-red-900">
                <span>إجمالي الالتزامات:</span>
                <span>{reportData.total_liabilities?.toLocaleString('ar-SA')} SAR</span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-3 text-green-800">حقوق الملكية</h4>
              {reportData.equity?.map((account, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-green-200">
                  <span>{account.account_name_ar || account.account_name}</span>
                  <span className="font-semibold">{account.balance?.toLocaleString('ar-SA')}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 mt-2 font-bold text-green-900">
                <span>إجمالي حقوق الملكية:</span>
                <span>{reportData.total_equity?.toLocaleString('ar-SA')} SAR</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <div className="flex justify-between font-bold text-lg">
            <span>إجمالي الالتزامات وحقوق الملكية:</span>
            <span>{reportData.total_liabilities_and_equity?.toLocaleString('ar-SA')} SAR</span>
          </div>
          <div className="mt-2 text-center">
            <span className={`px-4 py-2 rounded-full ${reportData.balanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {reportData.balanced ? '✓ متوازنة' : '✗ غير متوازنة'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    if (!reportData) return null;
    
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold">قائمة الدخل</h3>
          <p className="text-gray-600">
            من: {new Date(reportData.from_date).toLocaleDateString('ar-SA')} - 
            إلى: {new Date(reportData.to_date).toLocaleDateString('ar-SA')}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <h4 className="text-lg font-semibold mb-3 text-green-800">الإيرادات</h4>
          {reportData.revenues?.map((account, idx) => (
            <div key={idx} className="flex justify-between py-2 border-b border-green-200">
              <span>{account.account_name_ar || account.account_name}</span>
              <span className="font-semibold">{account.balance?.toLocaleString('ar-SA')}</span>
            </div>
          ))}
          <div className="flex justify-between py-2 mt-2 font-bold text-green-900">
            <span>إجمالي الإيرادات:</span>
            <span>{reportData.total_revenue?.toLocaleString('ar-SA')} SAR</span>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg mb-4">
          <h4 className="text-lg font-semibold mb-3 text-red-800">المصروفات</h4>
          {reportData.expenses?.map((account, idx) => (
            <div key={idx} className="flex justify-between py-2 border-b border-red-200">
              <span>{account.account_name_ar || account.account_name}</span>
              <span className="font-semibold">{account.balance?.toLocaleString('ar-SA')}</span>
            </div>
          ))}
          <div className="flex justify-between py-2 mt-2 font-bold text-red-900">
            <span>إجمالي المصروفات:</span>
            <span>{reportData.total_expenses?.toLocaleString('ar-SA')} SAR</span>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${reportData.net_income >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <div className="flex justify-between font-bold text-xl">
            <span>{reportData.net_income >= 0 ? 'صافي الربح:' : 'صافي الخسارة:'}</span>
            <span className={reportData.net_income >= 0 ? 'text-blue-900' : 'text-orange-900'}>
              {Math.abs(reportData.net_income)?.toLocaleString('ar-SA')} SAR
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">التقارير المالية</h2>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">نوع التقرير</label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {Object.keys(reports).map(key => (
                  <option key={key} value={key}>{reports[key]}</option>
                ))}
              </select>
            </div>
            
            {selectedReport === 'income_statement' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">من تاريخ</label>
                  <input
                    type="date"
                    value={dateRange.from_date}
                    onChange={(e) => setDateRange({...dateRange, from_date: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">إلى تاريخ</label>
                  <input
                    type="date"
                    value={dateRange.to_date}
                    onChange={(e) => setDateRange({...dateRange, to_date: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </>
            )}
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'جاري التحميل...' : 'إنشاء التقرير'}
          </button>
        </div>

        {reportData && (
          <div className="bg-white border rounded-lg p-6">
            {selectedReport === 'trial_balance' && renderTrialBalance()}
            {selectedReport === 'balance_sheet' && renderBalanceSheet()}
            {selectedReport === 'income_statement' && renderIncomeStatement()}
          </div>
        )}

        {!reportData && !loading && (
          <div className="text-center py-12 text-gray-500">
            اختر نوع التقرير واضغط على "إنشاء التقرير" لعرض النتائج
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReports;
