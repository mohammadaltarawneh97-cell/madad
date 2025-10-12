import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ManagerDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [production, setProduction] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const [projectsRes, equipmentRes, productionRes, employeesRes] = await Promise.all([
        axios.get(`${API}/projects`).catch(() => ({ data: [] })),
        axios.get(`${API}/equipment`),
        axios.get(`${API}/production`),
        axios.get(`${API}/employees`).catch(() => ({ data: [] }))
      ]);
      
      setProjects(projectsRes.data);
      setEquipment(equipmentRes.data);
      setProduction(productionRes.data);
      setEmployees(employeesRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load manager data');
    } finally {
      setLoading(false);
    }
  };

  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const activeEquipment = equipment.filter(e => e.status === 'active').length;
  const activeEmployees = employees.filter(e => e.employment_status === 'active').length;

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم - المدير</h1>
        <p className="text-gray-600">نظرة عامة على العمليات والمشاريع</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Management Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">المشاريع النشطة</p>
          <p className="text-4xl font-bold">{activeProjects}</p>
          <p className="text-xs opacity-90">من {projects.length} مشروع</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">المعدات النشطة</p>
          <p className="text-4xl font-bold">{activeEquipment}</p>
          <p className="text-xs opacity-90">من {equipment.length} معدة</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">عمليات الإنتاج</p>
          <p className="text-4xl font-bold">{production.length}</p>
          <p className="text-xs opacity-90">عملية</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">الموظفون النشطون</p>
          <p className="text-4xl font-bold">{activeEmployees}</p>
          <p className="text-xs opacity-90">من {employees.length} موظف</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">المشاريع النشطة</h2>
          <div className="space-y-3">
            {projects.filter(p => p.status === 'in_progress').slice(0, 5).map((project) => (
              <div key={project.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{project.name_ar}</p>
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                    {project.completion_percentage?.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${project.completion_percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {projects.filter(p => p.status === 'in_progress').length === 0 && (
              <p className="text-center text-gray-500 py-4">لا توجد مشاريع نشطة</p>
            )}
          </div>
        </div>

        {/* Equipment & Production */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">الإنتاج والمعدات</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 mb-1">المعدات المتاحة</p>
              <p className="text-2xl font-bold text-green-800">{activeEquipment} / {equipment.length}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-700 mb-1">إجمالي عمليات الإنتاج</p>
              <p className="text-2xl font-bold text-orange-800">{production.length}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700 mb-1">الموظفون العاملون</p>
              <p className="text-2xl font-bold text-purple-800">{activeEmployees} / {employees.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Information Notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ℹ️ <span className="font-semibold">ملاحظة:</span> لديك وصول إلى جميع البيانات التشغيلية. للمعلومات المالية التفصيلية، راجع قسم المحاسبة.
        </p>
      </div>
    </div>
  );
};

export default ManagerDashboard;
