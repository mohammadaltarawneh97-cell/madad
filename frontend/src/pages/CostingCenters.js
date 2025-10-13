import React from 'react';

const CostingCenters = () => {
  const centers = [
    { name: 'Screening / الفرز', budget: 500000, actual: 487500, variance: 12500, color: 'bg-blue-50' },
    { name: 'Crushing / التكسير', budget: 800000, actual: 825000, variance: -25000, color: 'bg-green-50' },
    { name: 'Hauling / النقل', budget: 450000, actual: 432000, variance: 18000, color: 'bg-purple-50' },
    { name: 'Feeding / التغذية', budget: 350000, actual: 355000, variance: -5000, color: 'bg-yellow-50' }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">مراكز التكلفة / Costing Centers</h1>
        <p className="text-gray-600 mt-1">تحليل التكاليف حسب مراكز العمل</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {centers.map((center, idx) => (
          <div key={idx} className={`${center.color} rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-shadow`}>
            <h3 className="text-lg font-semibold mb-4">{center.name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Budget:</span>
                <span className="font-semibold">{center.budget.toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Actual:</span>
                <span className="font-semibold">{center.actual.toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">Variance:</span>
                <span className={`font-bold ${center.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {center.variance > 0 ? '+' : ''}{center.variance.toLocaleString()} SAR
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border-2 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">تفصيل التكاليف / Cost Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold">Cost Center</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Fuel</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Labor</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Maintenance</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Others</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {centers.map((center, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{center.name}</td>
                  <td className="px-4 py-3">{(center.actual * 0.35).toLocaleString()}</td>
                  <td className="px-4 py-3">{(center.actual * 0.25).toLocaleString()}</td>
                  <td className="px-4 py-3">{(center.actual * 0.20).toLocaleString()}</td>
                  <td className="px-4 py-3">{(center.actual * 0.20).toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold">{center.actual.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CostingCenters;