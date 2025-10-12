import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForemanDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    equipment: [],
    production: [],
    attendance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [equipmentRes, productionRes, attendanceRes] = await Promise.all([
        axios.get(`${API}/equipment`).catch(() => ({ data: [] })),
        axios.get(`${API}/production`).catch(() => ({ data: [] })),
        axios.get(`${API}/attendance`).catch(() => ({ data: [] }))
      ]);
      
      setDashboardData({
        equipment: equipmentRes.data.slice(0, 5),
        production: productionRes.data.slice(0, 5),
        attendance: attendanceRes.data.slice(0, 10)
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return num?.toLocaleString('ar-SA', { minimumFractionDigits: 0 }) || '0';
  };

  const getAttendanceStatusColor = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      on_leave: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getAttendanceStatusText = (status) => {
    const texts = {
      present: 'حاضر',
      absent: 'غائب',
      late: 'متأخر',
      on_leave: 'إجازة'
    };
    return texts[status] || status;
  };

  const calculateSummary = () => {
    const totalProduction = dashboardData.production.reduce((sum, prod) => sum + (prod.quantity || 0), 0);
    const activeEquipment = dashboardData.equipment.filter(eq => eq.status === 'active').length;
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = dashboardData.attendance.filter(a => a.date === today);
    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    
    return { totalProduction, activeEquipment, presentToday, totalWorkers: todayAttendance.length };
  };

  const { totalProduction, activeEquipment, presentToday, totalWorkers } = calculateSummary();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم - المشرف</h1>
        <p className="text-gray-600">إدارة العمليات الإنتاجية والمعدات والعمال</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📦</div>
            <span className="text-xs opacity-75">الإنتاج الكلي</span>
          </div>
          <p className="text-2xl font-bold">{formatNumber(totalProduction)}</p>
          <p className="text-sm opacity-90">وحدة</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">🚜</div>
            <span className="text-xs opacity-75">المعدات النشطة</span>
          </div>
          <p className="text-2xl font-bold">{activeEquipment}</p>
          <p className="text-sm opacity-90">من {dashboardData.equipment.length}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">👷</div>
            <span className="text-xs opacity-75">الحضور اليوم</span>
          </div>
          <p className="text-2xl font-bold">{presentToday}</p>
          <p className="text-sm opacity-90">من {totalWorkers} عامل</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">⚡</div>
            <span className="text-xs opacity-75">نسبة الحضور</span>
          </div>
          <p className="text-2xl font-bold">
            {totalWorkers > 0 ? Math.round((presentToday / totalWorkers) * 100) : 0}%
          </p>
          <p className="text-sm opacity-90">معدل الحضور</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Status */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>🚜</span>
              <span>حالة المعدات</span>
            </h2>
            <Link to="/equipment" className="text-sm text-blue-600 hover:text-blue-800">
              عرض الكل ←
            </Link>
          </div>

          {dashboardData.equipment.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.equipment.map((equipment) => (
                <div key={equipment.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{equipment.name}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      equipment.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : equipment.status === 'maintenance'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {equipment.status === 'active' ? 'نشط' : equipment.status === 'maintenance' ? 'صيانة' : 'متوقف'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <p className="text-xs">النوع</p>
                      <p className="font-medium text-gray-900">{equipment.type || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs">الموقع</p>
                      <p className="font-medium text-gray-900">{equipment.location || '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد معدات</p>
            </div>
          )}
        </div>

        {/* Production Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>📦</span>
              <span>سجل الإنتاج</span>
            </h2>
            <Link to="/production" className="text-sm text-blue-600 hover:text-blue-800">
              عرض الكل ←
            </Link>
          </div>

          {dashboardData.production.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.production.map((prod) => (
                <div key={prod.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{prod.product_name || prod.description}</span>
                    <span className="text-blue-700 font-bold">{formatNumber(prod.quantity)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{prod.production_date ? new Date(prod.production_date).toLocaleDateString('ar-SA') : '-'}</span>
                    <span>{prod.unit || 'وحدة'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد سجلات إنتاج</p>
            </div>
          )}
        </div>

        {/* Attendance Today */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>👷</span>
              <span>حضور العمال اليوم</span>
            </h2>
            <Link to="/attendance" className="text-sm text-blue-600 hover:text-blue-800">
              عرض الكل ←
            </Link>
          </div>

          {dashboardData.attendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">دخول</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">خروج</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.attendance.slice(0, 8).map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.employee_name_ar || record.employee_id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.date).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {record.check_in_time || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {record.check_out_time || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${getAttendanceStatusColor(record.status)}`}>
                          {getAttendanceStatusText(record.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-2">📋</p>
              <p>لا توجد سجلات حضور</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            to="/equipment"
            className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
          >
            <span className="text-3xl mb-2">🚜</span>
            <span className="text-sm font-semibold text-gray-900">إدارة المعدات</span>
          </Link>
          <Link
            to="/production"
            className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <span className="text-3xl mb-2">📦</span>
            <span className="text-sm font-semibold text-gray-900">إدارة الإنتاج</span>
          </Link>
          <Link
            to="/attendance"
            className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
          >
            <span className="text-3xl mb-2">👷</span>
            <span className="text-sm font-semibold text-gray-900">إدارة الحضور</span>
          </Link>
        </div>
      </div>

      {/* Information Notice */}
      <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-sm text-orange-800">
          ℹ️ <span className="font-semibold">ملاحظة:</span> لوحة التحكم الخاصة بالمشرف. يمكنك إدارة العمليات اليومية، المعدات، الإنتاج، وحضور العمال.
        </p>
      </div>
    </div>
  );
};

export default ForemanDashboard;
