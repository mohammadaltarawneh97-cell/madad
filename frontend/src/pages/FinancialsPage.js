import React from 'react';

const FinancialsPage = () => {
  const statements = [
    { name: 'Balance Sheet Q4 2024', date: '2024-12-31', status: 'Final' },
    { name: 'Income Statement Q4 2024', date: '2024-12-31', status: 'Final' },
    { name: 'Cash Flow Statement Q4 2024', date: '2024-12-31', status: 'Final' },
    { name: 'Balance Sheet Q1 2025', date: '2025-01-15', status: 'Draft' }
  ];

  const financialSummary = [
    { label: 'Total Revenue', value: '12,500,000 SAR', change: '+15.2%', color: 'bg-green-50 border-green-200' },
    { label: 'Total Expenses', value: '8,750,000 SAR', change: '+8.5%', color: 'bg-red-50 border-red-200' },
    { label: 'Net Profit', value: '3,750,000 SAR', change: '+32.1%', color: 'bg-blue-50 border-blue-200' },
    { label: 'Assets', value: '25,000,000 SAR', change: '+5.8%', color: 'bg-purple-50 border-purple-200' }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">القوائم المالية / Financial Statements</h1>
        <p className="text-gray-600 mt-1">التقارير والقوائم المالية</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {financialSummary.map((item, idx) => (
          <div key={idx} className={`${item.color} rounded-2xl border-2 p-6 shadow-sm`}>
            <div className="text-sm text-gray-600 mb-2">{item.label}</div>
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            <div className="text-sm text-green-600 font-medium mt-1">{item.change}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border-2 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">القوائم المالية / Financial Statements</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Generate Report
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold">Statement / القائمة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Date / التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Status / الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {statements.map((stmt, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{stmt.name}</td>
                  <td className="px-4 py-3">{stmt.date}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      stmt.status === 'Final' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {stmt.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2 space-x-reverse">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                    <button className="text-green-600 hover:text-green-800 text-sm font-medium">Export</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialsPage;