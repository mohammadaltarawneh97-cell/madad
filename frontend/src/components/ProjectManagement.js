import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.planning;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      critical: 'bg-red-100 text-red-600',
    };
    return colors[priority] || colors.medium;
  };

  const getStatusText = (status) => {
    const texts = {
      planning: 'التخطيط',
      in_progress: 'قيد التنفيذ',
      on_hold: 'متوقف مؤقتاً',
      completed: 'مكتمل',
      cancelled: 'ملغى',
    };
    return texts[status] || status;
  };

  const getPriorityText = (priority) => {
    const texts = {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
      critical: 'حرجة',
    };
    return texts[priority] || priority;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المشاريع</h1>
        <p className="text-gray-600">متابعة وإدارة مشاريع الشركة</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">لا توجد مشاريع</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {project.name_ar}
                  </h2>
                  <p className="text-sm text-gray-600 mb-3">{project.name}</p>
                  {project.description && (
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 mr-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priority)}`}>
                    {getPriorityText(project.priority)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {project.location && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="text-xs text-gray-600">الموقع</p>
                      <p className="text-sm font-medium text-gray-900">{project.location}</p>
                    </div>
                  </div>
                )}
                
                {project.estimated_budget && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-xs text-gray-600">الميزانية المقدرة</p>
                      <p className="text-sm font-medium text-gray-900">
                        {project.estimated_budget.toLocaleString()} د.أ
                      </p>
                    </div>
                  </div>
                )}

                {project.project_manager && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    <div>
                      <p className="text-xs text-gray-600">مدير المشروع</p>
                      <p className="text-sm font-medium text-gray-900">{project.project_manager}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="text-xs text-gray-600">نسبة الإنجاز</p>
                    <p className="text-sm font-medium text-gray-900">
                      {project.completion_percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${project.completion_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Objectives */}
              {project.objectives && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">الأهداف:</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{project.objectives}</p>
                </div>
              )}

              {/* Deliverables */}
              {project.deliverables && project.deliverables.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">المخرجات:</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.deliverables.map((deliverable, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                      >
                        {deliverable}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedProject(project)}
                  className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  عرض التفاصيل الكاملة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Details Modal (simplified for now) */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name_ar}</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">{selectedProject.description}</p>
              {/* Add more details here */}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
