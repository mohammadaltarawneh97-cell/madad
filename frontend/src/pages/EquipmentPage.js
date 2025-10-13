import React from 'react';

const EquipmentPage = () => {
  const equipment = [
    { id: 'DT798', name: 'DT 798', type: 'Dump Truck', status: 'Active', hours: 1240, lastService: '2025-01-10' },
    { id: 'HD785', name: 'HD785-7', type: 'Dump Truck', status: 'Active', hours: 980, lastService: '2025-01-08' },
    { id: 'PC240', name: 'PC240-7', type: 'Excavator', status: 'Maintenance', hours: 1520, lastService: '2025-01-05' },
    { id: 'GR140', name: 'GR 140H', type: 'Grader', status: 'Active', hours: 760, lastService: '2025-01-12' },
    { id: 'WL950', name: 'WL 950H', type: 'Wheel Loader', status: 'Active', hours: 1100, lastService: '2025-01-07' },
    { id: 'PC320', name: 'PC320-7', type: 'Excavator', status: 'Active', hours: 890, lastService: '2025-01-11' }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">المعدات / Equipment</h1>
        <p className="text-gray-600 mt-1">إدارة ومتابعة المعدات والآليات</p>
      </div>

      {/* Equipment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {equipment.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.type}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {item.status}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Working Hours:</span>
                <span className="font-semibold">{item.hours} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Service:</span>
                <span className="font-semibold">{item.lastService}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex gap-2">
              <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100">
                View Details
              </button>
              <button className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100">
                Service Log
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Equipment Summary */}
      <div className="bg-white rounded-2xl border-2 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">ملخص المعدات / Equipment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-3xl font-bold text-blue-600">{equipment.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Equipment</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="text-3xl font-bold text-green-600">{equipment.filter(e => e.status === 'Active').length}</div>
            <div className="text-sm text-gray-600 mt-1">Active</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-xl">
            <div className="text-3xl font-bold text-yellow-600">{equipment.filter(e => e.status === 'Maintenance').length}</div>
            <div className="text-sm text-gray-600 mt-1">Maintenance</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="text-3xl font-bold text-purple-600">98.2%</div>
            <div className="text-sm text-gray-600 mt-1">Availability</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentPage;