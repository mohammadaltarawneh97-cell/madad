import React from 'react';

const HSEPage = () => {
  const incidents = [
    { date: '2025-01-10', type: 'Near Miss', severity: 'Low', location: 'Site A', status: 'Closed' },
    { date: '2025-01-08', type: 'Safety Observation', severity: 'Low', location: 'Site B', status: 'Open' },
    { date: '2025-01-05', type: 'Environmental', severity: 'Medium', location: 'Site A', status: 'In Progress' }
  ];

  const stats = [
    { label: 'Days Without Incident', value: '45', color: 'bg-green-50 border-green-200' },
    { label: 'Total Incidents (YTD)', value: '3', color: 'bg-yellow-50 border-yellow-200' },
    { label: 'Safety Score', value: '98%', color: 'bg-blue-50 border-blue-200' },
    { label: 'Training Completion', value: '92%', color: 'bg-purple-50 border-purple-200' }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">الصحة والسلامة والبيئة / Health, Safety & Environment</h1>
        <p className="text-gray-600 mt-1">إدارة السلامة والبيئة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className={`${stat.color} rounded-2xl border-2 p-6 shadow-sm`}>
            <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border-2 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">سجل الحوادث / Incident Log</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Report Incident
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold">Date / التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Type / النوع</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Severity / الخطورة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Location / الموقع</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Status / الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {incidents.map((incident, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{incident.date}</td>
                  <td className="px-4 py-3 font-medium">{incident.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      incident.severity === 'Low' ? 'bg-green-100 text-green-700' :
                      incident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">{incident.location}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      incident.status === 'Closed' ? 'bg-gray-100 text-gray-700' :
                      incident.status === 'Open' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {incident.status}
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

export default HSEPage;