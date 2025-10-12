import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrganizationalChart = () => {
  const [departments, setDepartments] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('tree'); // tree or list

  useEffect(() => {
    fetchOrganizationalData();
  }, []);

  const fetchOrganizationalData = async () => {
    try {
      setLoading(true);
      const [deptResponse, treeResponse] = await Promise.all([
        axios.get(`${API}/departments`),
        axios.get(`${API}/departments/tree`)
      ]);
      setDepartments(deptResponse.data);
      setTree(treeResponse.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load organizational structure');
    } finally {
      setLoading(false);
    }
  };

  const DepartmentCard = ({ dept, level = 1 }) => (
    <div className={`mb-4 ${level > 1 ? 'mr-8' : ''}`}>
      <div className={`bg-white rounded-lg shadow-md p-4 border-r-4 ${
        level === 1 ? 'border-blue-600' : 'border-gray-400'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className={`font-bold text-gray-900 ${
              level === 1 ? 'text-xl' : 'text-lg'
            }`}>
              {dept.name_ar}
            </h3>
            <p className="text-sm text-gray-600">{dept.name}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {dept.code}
            </span>
          </div>
          {dept.employee_count > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{dept.employee_count}</p>
              <p className="text-xs text-gray-600">موظف</p>
            </div>
          )}
        </div>
        
        {dept.department_head_name && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">رئيس القسم:</span> {dept.department_head_name}
            </p>
          </div>
        )}
      </div>
      
      {dept.children && dept.children.length > 0 && (
        <div className="mt-2 mr-6 border-r-2 border-gray-300 pr-4">
          {dept.children.map((child) => (
            <DepartmentCard key={child.id} dept={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );

  const getDepartmentColor = (code) => {
    const colors = {
      'MKT': 'bg-purple-100 border-purple-500',
      'SLS': 'bg-blue-100 border-blue-500',
      'LEG': 'bg-red-100 border-red-500',
      'OPS': 'bg-green-100 border-green-500',
      'PRC': 'bg-yellow-100 border-yellow-500',
      'HR': 'bg-pink-100 border-pink-500',
      'FIN': 'bg-indigo-100 border-indigo-500',
      'MFG': 'bg-orange-100 border-orange-500',
      'IT': 'bg-teal-100 border-teal-500',
    };
    return colors[code] || 'bg-gray-100 border-gray-500';
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">الهيكل التنظيمي</h1>
        <p className="text-gray-600">عرض الإدارات والأقسام التنظيمية</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setViewMode('tree')}
          className={`px-4 py-2 rounded-lg font-medium ${
            viewMode === 'tree'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📊 عرض هرمي
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-lg font-medium ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📋 عرض قائمة
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">إجمالي الإدارات</p>
          <p className="text-3xl font-bold">{departments.filter(d => d.level === 1).length}</p>
          <p className="text-xs opacity-90">إدارة رئيسية</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">الأقسام الفرعية</p>
          <p className="text-3xl font-bold">{departments.filter(d => d.level === 2).length}</p>
          <p className="text-xs opacity-90">قسم فرعي</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">إجمالي الموظفين</p>
          <p className="text-3xl font-bold">
            {departments.reduce((sum, d) => sum + (d.employee_count || 0), 0)}
          </p>
          <p className="text-xs opacity-90">موظف</p>
        </div>
      </div>

      {/* Tree View */}
      {viewMode === 'tree' && (
        <div className="space-y-6">
          {tree.map((dept) => (
            <DepartmentCard key={dept.id} dept={dept} />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments
            .filter(d => d.level === 1)
            .map((dept) => (
              <div key={dept.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className={`h-2 ${getDepartmentColor(dept.code)}`}></div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{dept.name_ar}</h3>
                  <p className="text-sm text-gray-600 mb-3">{dept.name}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded font-mono">
                      {dept.code}
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {dept.employee_count || 0} موظف
                    </span>
                  </div>
                  
                  {/* Sub-departments count */}
                  {departments.filter(d => d.parent_department_id === dept.id).length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold">
                          {departments.filter(d => d.parent_department_id === dept.id).length}
                        </span>{' '}
                        قسم فرعي
                      </p>
                      <div className="mt-2 space-y-1">
                        {departments
                          .filter(d => d.parent_department_id === dept.id)
                          .slice(0, 3)
                          .map(subDept => (
                            <div key={subDept.id} className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">
                              • {subDept.name_ar}
                            </div>
                          ))}
                        {departments.filter(d => d.parent_department_id === dept.id).length > 3 && (
                          <p className="text-xs text-blue-600">
                            + {departments.filter(d => d.parent_department_id === dept.id).length - 3} المزيد
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationalChart;
