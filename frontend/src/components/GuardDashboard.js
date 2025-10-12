import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GuardDashboard = () => {
  const [myProfile, setMyProfile] = useState(null);
  const [myAttendance, setMyAttendance] = useState([]);
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
        axios.get(`${API}/attendance`)
      ]);
      
      setMyProfile(profileRes.data);
      setMyAttendance(attendanceRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load your data');
    } finally {
      setLoading(false);
    }
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
        <p className="text-gray-600">سجل الحضور الخاص بك فقط</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Profile Card */}
      {myProfile && (
        <div className="mb-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold">
              🛡️
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{myProfile.full_name_ar}</h2>
              <p className="opacity-90">{myProfile.position_title_ar}</p>
              <p className="text-sm opacity-75">{myProfile.department_name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>👥</span>
          <span>سجل الحضور</span>
        </h2>

        {myAttendance.length > 0 ? (
          <div className="space-y-3">
            {myAttendance.slice(0, 10).map((record) => (
              <div key={record.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(record.date).toLocaleDateString('ar-SA')}
                    </p>
                    <p className="text-sm text-gray-600">{record.employee_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    record.status === 'present' 
                      ? 'bg-green-100 text-green-800' 
                      : record.status === 'absent'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.status === 'present' ? 'حاضر' : record.status === 'absent' ? 'غائب' : record.status}
                  </span>
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
          ℹ️ <span className="font-semibold">ملاحظة:</span> يمكنك فقط عرض وتسجيل سجلات الحضور. للوصول إلى وظائف أخرى، يرجى الاتصال بالمدير.
        </p>
      </div>
    </div>
  );
};

export default GuardDashboard;
