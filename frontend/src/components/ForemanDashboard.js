import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForemanDashboard = () => {
  const [equipment, setEquipment] = useState([]);
  const [production, setProduction] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOperationsData();
  }, []);

  const fetchOperationsData = async () => {
    try {
      setLoading(true);
      const [equipmentRes, productionRes, attendanceRes] = await Promise.all([
        axios.get(`${API}/equipment`),
        axios.get(`${API}/production`),
        axios.get(`${API}/attendance`)
      ]);
      
      setEquipment(equipmentRes.data);
      setProduction(productionRes.data);
      setAttendance(attendanceRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load operations data');
    } finally {
      setLoading(false);
    }
  };

  const activeEquipment = equipment.filter(e => e.status === 'active').length;
  const todayProduction = production.filter(p => {
    const today = new Date().toDateString();
    return new Date(p.date).toDateString() === today;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم - المشرف</h1>
        <p className="text-gray-600">إدارة الإنتاج والمعدات والحضور</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Operations Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">المعدات النشطة</p>
          <p className="text-4xl font-bold">{activeEquipment}</p>
          <p className="text-xs opacity-90">من {equipment.length} معدة</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">الإنتاج اليوم</p>
          <p className="text-4xl font-bold">{todayProduction}</p>
          <p className="text-xs opacity-90">عملية إنتاج</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">سجلات الحضور</p>
          <p className="text-4xl font-bold">{attendance.length}</p>
          <p className="text-xs opacity-90">سجل</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Status */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">حالة المعدات</h2>
          <div className="space-y-3">
            {equipment.slice(0, 5).map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-600">{item.type}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Production */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">آخر الإنتاج</h2>
          <div className="space-y-3">
            {production.slice(0, 5).map((prod) => (
              <div key={prod.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{prod.product_name}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(prod.date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{prod.actual_qty || prod.planned_qty}</p>
                    <p className="text-xs text-gray-600">{prod.unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Information Notice */}
      <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-sm text-orange-800">
          ℹ️ <span className="font-semibold">ملاحظة:</span> تركز لوحة التحكم هذه على الإنتاج والمعدات والحضور. للوصول إلى البيانات المالية، اتصل بقسم المحاسبة.
        </p>
      </div>
    </div>
  );
};

export default ForemanDashboard;
