import React from 'react';

const Production = () => {
  const kpis = [
    { label: 'Completion Rate', labelAr: 'معدل الإنجاز', value: '92.4%', trend: '+5.2%', color: 'bg-green-50 border-green-200' },
    { label: 'Actual Qty (Month)', labelAr: 'الكمية الفعلية', value: '41,200 t', trend: '+2,100 t', color: 'bg-blue-50 border-blue-200' },
    { label: 'Contract Qty', labelAr: 'كمية العقد', value: '45,000 t', trend: '0%', color: 'bg-gray-50 border-gray-200' },
    { label: 'Efficiency', labelAr: 'الكفاءة', value: '91.6%', trend: '+3.1%', color: 'bg-purple-50 border-purple-200' }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">الإنتاج / Production</h1>
        <p className="text-gray-600 mt-1">مراقبة ومتابعة الإنتاج اليومي</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className={`${kpi.color} rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="text-sm text-gray-600 mb-1">{kpi.labelAr}</div>
            <div className="text-sm text-gray-500 mb-2">{kpi.label}</div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{kpi.value}</div>
            <div className="text-sm text-green-600 font-medium">{kpi.trend}</div>
          </div>
        ))}
      </div>

      {/* Production Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">معدل الإنجاز الشهري / Monthly Completion Rate</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            [Chart: Line chart showing completion rate trend]
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">الإنتاج الفعلي مقابل المخطط / Actual vs Contract</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            [Chart: Bar chart comparing actual vs contract quantities]
          </div>
        </div>
      </div>

      {/* Production Breakdown */}
      <div className="bg-white rounded-2xl border-2 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">تفصيل الإنتاج / Production Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold">Activity / النشاط</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Target / المستهدف</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actual / الفعلي</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Variance / الفرق</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">%</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">Screening / الفرز</td>
                <td className="px-4 py-3">15,000 t</td>
                <td className="px-4 py-3 font-semibold">14,200 t</td>
                <td className="px-4 py-3 text-red-600">-800 t</td>
                <td className="px-4 py-3">94.7%</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">Crushing / التكسير</td>
                <td className="px-4 py-3">20,000 t</td>
                <td className="px-4 py-3 font-semibold">18,500 t</td>
                <td className="px-4 py-3 text-red-600">-1,500 t</td>
                <td className="px-4 py-3">92.5%</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">Hauling / النقل</td>
                <td className="px-4 py-3">10,000 t</td>
                <td className="px-4 py-3 font-semibold">8,500 t</td>
                <td className="px-4 py-3 text-red-600">-1,500 t</td>
                <td className="px-4 py-3">85.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Production;