import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ManagerDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    projects: [],
    employees: [],
    equipment: [],
    production: [],
    expenses: [],
    vehicles: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsRes, employeesRes, equipmentRes, productionRes, expensesRes, vehiclesRes] = await Promise.all([
        axios.get(`${API}/projects`).catch(() => ({ data: [] })),
        axios.get(`${API}/employees`).catch(() => ({ data: [] })),
        axios.get(`${API}/equipment`).catch(() => ({ data: [] })),
        axios.get(`${API}/production`).catch(() => ({ data: [] })),
        axios.get(`${API}/expenses`).catch(() => ({ data: [] })),
        axios.get(`${API}/vehicles`).catch(() => ({ data: [] }))
      ]);
      
      setDashboardData({
        projects: projectsRes.data.slice(0, 5),
        employees: employeesRes.data.slice(0, 10),
        equipment: equipmentRes.data.slice(0, 5),
        production: productionRes.data.slice(0, 5),
        expenses: expensesRes.data.slice(0, 5),
        vehicles: vehiclesRes.data.slice(0, 5)
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('ar-SA', { minimumFractionDigits: 0 }) || '0';
  };

  const formatNumber = (num) => {
    return num?.toLocaleString('ar-SA', { minimumFractionDigits: 0 }) || '0';
  };

  const calculateSummary = () => {
    const activeProjects = dashboardData.projects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
    const activeEmployees = dashboardData.employees.filter(e => e.employment_status === 'active').length;
    const totalExpenses = dashboardData.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalProduction = dashboardData.production.reduce((sum, prod) => sum + (prod.quantity || 0), 0);
    const activeVehicles = dashboardData.vehicles.filter(v => v.status === 'active').length;
    
    return { activeProjects, activeEmployees, totalExpenses, totalProduction, activeVehicles };
  };

  const { activeProjects, activeEmployees, totalExpenses, totalProduction, activeVehicles } = calculateSummary();

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم - المدير</h1>
        <p className="text-gray-600">نظرة شاملة على العمليات والمشاريع والموارد</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📊</div>
            <span className="text-xs opacity-75">المشاريع النشطة</span>
          </div>
          <p className="text-2xl font-bold">{activeProjects}</p>
          <p className="text-sm opacity-90">من {dashboardData.projects.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">👥</div>
            <span className="text-xs opacity-75">الموظفون النشطون</span>
          </div>
          <p className="text-2xl font-bold">{activeEmployees}</p>
          <p className="text-sm opacity-90">موظف</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📦</div>
            <span className="text-xs opacity-75">الإنتاج الكلي</span>
          </div>
          <p className="text-2xl font-bold">{formatNumber(totalProduction)}</p>
          <p className="text-sm opacity-90">وحدة</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">💰</div>
            <span className="text-xs opacity-75">المصروفات</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
          <p className="text-sm opacity-90">SAR</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">🚗</div>
            <span className="text-xs opacity-75">المركبات النشطة</span>
          </div>
          <p className="text-2xl font-bold">{activeVehicles}</p>
          <p className="text-sm opacity-90">من {dashboardData.vehicles.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>📊</span>
              <span>المشاريع النشطة</span>
            </h2>
            <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-800">
              عرض الكل ←
            </Link>
          </div>

          {dashboardData.projects.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.projects.map((project) => (
                <div key={project.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{project.name}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'in_progress' || project.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status === 'completed' ? 'مكتمل' : project.status === 'in_progress' || project.status === 'active' ? 'قيد التنفيذ' : project.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <p className="text-xs">الميزانية</p>
                      <p className="font-medium text-gray-900">{formatCurrency(project.budget || 0)} SAR</p>
                    </div>
                    <div>
                      <p className="text-xs">الموقع</p>
                      <p className="font-medium text-gray-900">{project.location || '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد مشاريع</p>
            </div>
          )}
        </div>

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
                <div key={equipment.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{equipment.name}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      equipment.status === 'active' ? 'bg-green-100 text-green-800' :
                      equipment.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {equipment.status === 'active' ? 'نشط' : equipment.status === 'maintenance' ? 'صيانة' : 'متوقف'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>النوع: {equipment.type || '-'}</p>
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
              <span>نظرة على الإنتاج</span>
            </h2>
            <Link to="/production" className="text-sm text-blue-600 hover:text-blue-800">
              عرض الكل ←
            </Link>
          </div>

          {dashboardData.production.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.production.map((prod) => (
                <div key={prod.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{prod.product_name || prod.description}</span>
                    <span className="text-purple-700 font-bold">{formatNumber(prod.quantity)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{prod.production_date ? new Date(prod.production_date).toLocaleDateString('ar-SA') : '-'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد سجلات إنتاج</p>
            </div>
          )}
        </div>

        {/* Vehicles Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>🚗</span>
              <span>أسطول المركبات</span>
            </h2>
          </div>

          {dashboardData.vehicles.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{vehicle.vehicle_number}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      vehicle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {vehicle.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{vehicle.vehicle_type} - {vehicle.make} {vehicle.model}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد مركبات</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Overview */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>👥</span>
          <span>نظرة على الفريق</span>
        </h2>
        
        {dashboardData.employees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.employees.slice(0, 6).map((employee) => (
              <div key={employee.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {employee.full_name_ar?.charAt(0) || 'م'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{employee.full_name_ar}</p>
                    <p className="text-sm text-gray-600">{employee.position_title_ar || employee.department_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>لا توجد بيانات موظفين</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/projects" className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
            <span className="text-3xl mb-2">📊</span>
            <span className="text-sm font-semibold text-gray-900">المشاريع</span>
          </Link>
          <Link to="/equipment" className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
            <span className="text-3xl mb-2">🚜</span>
            <span className="text-sm font-semibold text-gray-900">المعدات</span>
          </Link>
          <Link to="/production" className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
            <span className="text-3xl mb-2">📦</span>
            <span className="text-sm font-semibold text-gray-900">الإنتاج</span>
          </Link>
          <Link to="/org-chart" className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors">
            <span className="text-3xl mb-2">🏢</span>
            <span className="text-sm font-semibold text-gray-900">الهيكل التنظيمي</span>
          </Link>
        </div>
      </div>

      {/* Information Notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ℹ️ <span className="font-semibold">ملاحظة:</span> لوحة التحكم الخاصة بالمدير. يمكنك الوصول إلى جميع العمليات والإشراف على المشاريع والموارد والفرق.
        </p>
      </div>
    </div>
  );
};

export default ManagerDashboard;
