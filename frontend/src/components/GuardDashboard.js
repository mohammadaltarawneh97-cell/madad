import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GuardDashboard = () => {
  const [myProfile, setMyProfile] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    try {
      setLoading(true);
      const [profileRes, attendanceRes] = await Promise.all([
        axios.get(`${API}/employees/me`).catch(() => ({ data: null })),
        axios.get(`${API}/attendance`).catch(() => ({ data: [] }))
      ]);
      
      setMyProfile(profileRes.data);
      
      // Filter today's attendance
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = attendanceRes.data.filter(record => 
        record.date === today
      );
      setTodayAttendance(todayRecords);
      
      // Get recent 10 records
      setRecentAttendance(attendanceRes.data.slice(0, 10));
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم - الحارس</h1>
        <p className="text-gray-600">إدارة الحضور والأمن</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Personal Profile Card */}
      {myProfile && (
        <div className="mb-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold">
              {myProfile.full_name_ar?.charAt(0) || 'ح'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{myProfile.full_name_ar}</h2>
              <p className="opacity-90">{myProfile.position_title_ar}</p>
              <p className="text-sm opacity-75">{myProfile.department_name}</p>
            </div>
            <div className="text-left">
              <p className="text-sm opacity-75">رقم الموظف</p>
              <p className="text-xl font-bold">{myProfile.employee_number}</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Summary */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">الحضور اليوم</p>
              <p className="text-3xl font-bold text-green-600">
                {todayAttendance.filter(a => a.status === 'present').length}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">الغياب اليوم</p>
              <p className="text-3xl font-bold text-red-600">
                {todayAttendance.filter(a => a.status === 'absent').length}
              </p>
            </div>
            <div className="text-4xl">❌</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">المتأخرون</p>
              <p className="text-3xl font-bold text-yellow-600">
                {todayAttendance.filter(a => a.status === 'late').length}
              </p>
            </div>
            <div className="text-4xl">⏰</div>
          </div>
        </div>
      </div>

      {/* Today's Attendance Details */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>📋</span>
          <span>سجل الحضور اليوم</span>
        </h2>

        {todayAttendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وقت الدخول</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وقت الخروج</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todayAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.employee_name_ar || record.employee_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.check_in_time || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.check_out_time || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
            <p>لا توجد سجلات حضور لهذا اليوم</p>
          </div>
        )}
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🕒</span>
          <span>السجلات الأخيرة</span>
        </h2>

        {recentAttendance.length > 0 ? (
          <div className="space-y-3">
            {recentAttendance.map((record) => (
              <div key={record.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {record.employee_name_ar || record.employee_id}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(record.date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xs text-gray-600">دخول</p>
                    <p className="text-sm font-semibold text-gray-900">{record.check_in_time || '-'}</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xs text-gray-600">خروج</p>
                    <p className="text-sm font-semibold text-gray-900">{record.check_out_time || '-'}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 text-xs rounded ${getAttendanceStatusColor(record.status)}`}>
                      {getAttendanceStatusText(record.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">📋</p>
            <p>لا توجد سجلات حضور</p>
          </div>
        )}
      </div>

      {/* Information Notice */}
      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <p className="text-sm text-indigo-800">
          ℹ️ <span className="font-semibold">ملاحظة:</span> لوحة التحكم الخاصة بالحارس. يمكنك عرض وإدارة سجلات الحضور والغياب للموظفين.
        </p>
      </div>
    </div>
  );
};

export default GuardDashboard;
