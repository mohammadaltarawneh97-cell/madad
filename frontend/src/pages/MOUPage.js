import React from 'react';

const MOUPage = () => {
  const mous = [
    { title: 'Project ABC Contract', date: '2024-01-15', status: 'Active', value: '5,000,000 SAR', expiry: '2025-12-31' },
    { title: 'Equipment Lease Agreement', date: '2024-03-20', status: 'Active', value: '1,200,000 SAR', expiry: '2025-06-30' },
    { title: 'Maintenance Service Contract', date: '2024-05-10', status: 'Active', value: '800,000 SAR', expiry: '2025-12-31' }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">مذكرات التفاهم / Memorandum of Understanding</h1>
        <p className="text-gray-600 mt-1">إدارة العقود ومذكرات التفاهم</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-6">
          <div className="text-3xl font-bold text-blue-600">{mous.length}</div>
          <div className="text-sm text-gray-600 mt-1">Active MOUs</div>
        </div>
        <div className="bg-green-50 rounded-2xl border-2 border-green-200 p-6">
          <div className="text-3xl font-bold text-green-600">7.0M SAR</div>
          <div className="text-sm text-gray-600 mt-1">Total Value</div>
        </div>
        <div className="bg-purple-50 rounded-2xl border-2 border-purple-200 p-6">
          <div className="text-3xl font-bold text-purple-600">0</div>
          <div className="text-sm text-gray-600 mt-1">Expiring Soon</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">العقود والمذكرات / MOUs & Contracts</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Add New MOU
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold">Title / العنوان</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Date / التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Value / القيمة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Expiry / الانتهاء</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Status / الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mous.map((mou, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{mou.title}</td>
                  <td className="px-4 py-3">{mou.date}</td>
                  <td className="px-4 py-3 font-semibold">{mou.value}</td>
                  <td className="px-4 py-3">{mou.expiry}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {mou.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
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

export default MOUPage;