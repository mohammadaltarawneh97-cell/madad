import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DriverDashboard = () => {
  const [myProfile, setMyProfile] = useState(null);
  const [mySalary, setMySalary] = useState([]);
  const [myVehicle, setMyVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    try {
      setLoading(true);
      const [profileRes, salaryRes, vehicleRes] = await Promise.all([
        axios.get(`${API}/employees/me`),
        axios.get(`${API}/salary-payments`),
        axios.get(`${API}/vehicles`)
      ]);
      
      setMyProfile(profileRes.data);
      setMySalary(salaryRes.data);
      setMyVehicle(vehicleRes.data[0] || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('ar-SA', { minimumFractionDigits: 0 }) || '0';
  };

  const getMonthName = (month) => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1] || month;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم - السائق</h1>
        <p className="text-gray-600">معلوماتك الشخصية فقط</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Personal Profile Card */}
      {myProfile && (
        <div className="mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
              {myProfile.full_name_ar?.charAt(0) || 'س'}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Information */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>💰</span>
            <span>معلومات الراتب</span>
          </h2>

          {myProfile && (
            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 mb-1">الراتب الأساسي</p>
              <p className="text-3xl font-bold text-green-800">
                {formatCurrency(myProfile.base_salary)} {myProfile.currency}
              </p>
            </div>
          )}

          {mySalary.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">آخر المدفوعات</h3>
              {mySalary.slice(0, 3).map((payment) => (
                <div key={payment.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      {getMonthName(payment.month)} {payment.year}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      payment.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status === 'paid' ? 'مدفوع' : 'معلق'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">الراتب الأساسي</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(payment.base_salary)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">المكافآت</p>
                      <p className="font-semibold text-green-600">{formatCurrency(payment.bonuses)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">الخصومات</p>
                      <p className="font-semibold text-red-600">{formatCurrency(payment.deductions)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">الصافي</p>
                      <p className="font-bold text-blue-600">{formatCurrency(payment.net_salary)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد سجلات رواتب متاحة</p>
            </div>
          )}
        </div>

        {/* Vehicle Information */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🚗</span>
            <span>المركبة المخصصة</span>
          </h2>

          {myVehicle ? (
            <div>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  {myVehicle.vehicle_number}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-blue-700">النوع</p>
                    <p className="font-semibold text-blue-900">{myVehicle.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">الموديل</p>
                    <p className="font-semibold text-blue-900">{myVehicle.make} {myVehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">اللوحة</p>
                    <p className="font-semibold text-blue-900">{myVehicle.license_plate}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">الحالة</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      myVehicle.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {myVehicle.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                </div>
              </div>

              {/* GPS Location */}
              {myVehicle.last_location_lat && myVehicle.last_location_lng ? (
                <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <span>📍</span>
                    <span>الموقع الحالي</span>
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-green-700">خط العرض</p>
                      <p className="font-mono text-green-900">{myVehicle.last_location_lat}</p>
                    </div>
                    <div>
                      <p className="text-green-700">خط الطول</p>
                      <p className="font-mono text-green-900">{myVehicle.last_location_lng}</p>
                    </div>
                    {myVehicle.last_location_address && (
                      <div>
                        <p className="text-green-700">العنوان</p>
                        <p className="text-green-900">{myVehicle.last_location_address}</p>
                      </div>
                    )}
                    {myVehicle.last_location_update && (
                      <div>
                        <p className="text-green-700">آخر تحديث</p>
                        <p className="text-green-900">
                          {new Date(myVehicle.last_location_update).toLocaleString('ar-SA')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* View on Map */}
                  <a
                    href={`https://www.google.com/maps?q=${myVehicle.last_location_lat},${myVehicle.last_location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    عرض على الخريطة 🗺️
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                  <p className="text-yellow-800 text-sm">لم يتم تحديث الموقع بعد</p>
                </div>
              )}

              {/* Maintenance Info */}
              {myVehicle.next_maintenance_date && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-700 mb-1">الصيانة القادمة</p>
                  <p className="font-semibold text-orange-900">
                    {new Date(myVehicle.next_maintenance_date).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-2">🚗</p>
              <p>لم يتم تعيين مركبة لك بعد</p>
            </div>
          )}
        </div>
      </div>

      {/* Personal Information */}
      {myProfile && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>👤</span>
            <span>معلومات شخصية</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">رقم الهاتف</p>
              <p className="font-semibold text-gray-900">{myProfile.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">تاريخ التعيين</p>
              <p className="font-semibold text-gray-900">
                {myProfile.hire_date ? new Date(myProfile.hire_date).toLocaleDateString('ar-SA') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">حالة العمل</p>
              <span className={`inline-block px-3 py-1 text-sm rounded ${
                myProfile.employment_status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {myProfile.employment_status === 'active' ? 'نشط' : myProfile.employment_status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Information Notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ℹ️ <span className="font-semibold">ملاحظة:</span> هذه لوحة التحكم الخاصة بك. يمكنك فقط عرض معلوماتك الشخصية، راتبك، والمركبة المخصصة لك.
        </p>
      </div>
    </div>
  );
};

export default DriverDashboard;
