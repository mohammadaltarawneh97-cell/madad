import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FeasibilityStudyTracker = () => {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/feasibility-studies`);
      setStudies(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load feasibility studies');
    } finally {
      setLoading(false);
    }
  };

  const getPhaseStatusColor = (status) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      delayed: 'bg-red-100 text-red-700',
    };
    return colors[status] || colors.not_started;
  };

  const getPhaseStatusText = (status) => {
    const texts = {
      not_started: 'لم تبدأ',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتملة',
      delayed: 'متأخرة',
    };
    return texts[status] || status;
  };

  const getOverallStatusColor = (status) => {
    const colors = {
      not_started: 'bg-gray-500',
      in_progress: 'bg-blue-500',
      completed: 'bg-green-500',
      delayed: 'bg-red-500',
    };
    return colors[status] || colors.not_started;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">دراسات الجدوى</h1>
        <p className="text-gray-600">متابعة مراحل دراسات الجدوى للمشاريع</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {studies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">لا توجد دراسات جدوى</p>
        </div>
      ) : (
        <div className="space-y-8">
          {studies.map((study) => (
            <div key={study.id} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              {/* Study Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {study.study_name_ar}
                    </h2>
                    <p className="text-sm text-gray-600 mb-2">{study.study_name}</p>
                    {study.consultant && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">الاستشاري:</span> {study.consultant}
                      </p>
                    )}
                  </div>
                  <div className="text-left">
                    <span className={`inline-block px-4 py-2 rounded-full text-white font-medium ${getOverallStatusColor(study.overall_status)}`}>
                      {getPhaseStatusText(study.overall_status)}
                    </span>
                  </div>
                </div>

                {/* Study Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">تكلفة الدراسة</p>
                    <p className="text-lg font-bold text-gray-900">
                      {study.study_cost?.toLocaleString()} {study.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">المدة الإجمالية</p>
                    <p className="text-lg font-bold text-gray-900">
                      {study.total_duration_weeks} أسبوع
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">تاريخ البدء</p>
                    <p className="text-sm font-medium text-gray-900">
                      {study.start_date ? new Date(study.start_date).toLocaleDateString('ar-SA') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">تاريخ الانتهاء المتوقع</p>
                    <p className="text-sm font-medium text-gray-900">
                      {study.expected_end_date ? new Date(study.expected_end_date).toLocaleDateString('ar-SA') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Phases Timeline */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">المراحل</h3>
                <div className="space-y-4">
                  {study.phases && study.phases.map((phase, index) => (
                    <div key={index} className="relative">
                      {/* Connection Line */}
                      {index < study.phases.length - 1 && (
                        <div className="absolute right-6 top-12 w-0.5 h-full bg-gray-300 z-0"></div>
                      )}
                      
                      <div className="relative z-10 flex items-start gap-4">
                        {/* Phase Number Circle */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          phase.status === 'completed' ? 'bg-green-500' :
                          phase.status === 'in_progress' ? 'bg-blue-500' :
                          phase.status === 'delayed' ? 'bg-red-500' :
                          'bg-gray-400'
                        }`}>
                          {phase.status === 'completed' ? '✓' : phase.phase_number}
                        </div>

                        {/* Phase Content */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-gray-900 mb-1">
                                {phase.phase_name_ar}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">{phase.phase_name}</p>
                              {phase.description && (
                                <p className="text-sm text-gray-700 mb-3">{phase.description}</p>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPhaseStatusColor(phase.status)}`}>
                              {getPhaseStatusText(phase.status)}
                            </span>
                          </div>

                          {/* Phase Details */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-gray-600">المدة</p>
                              <p className="text-sm font-medium text-gray-900">
                                {phase.duration_weeks} أسبوع
                              </p>
                            </div>
                            {phase.start_date && (
                              <div>
                                <p className="text-xs text-gray-600">تاريخ البدء</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(phase.start_date).toLocaleDateString('ar-SA')}
                                </p>
                              </div>
                            )}
                            {phase.end_date && (
                              <div>
                                <p className="text-xs text-gray-600">تاريخ الانتهاء</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(phase.end_date).toLocaleDateString('ar-SA')}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-gray-600">نسبة الإنجاز</p>
                              <p className="text-xs font-medium text-gray-900">
                                {phase.completion_percentage.toFixed(0)}%
                              </p>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  phase.status === 'completed' ? 'bg-green-500' :
                                  phase.status === 'in_progress' ? 'bg-blue-500' :
                                  phase.status === 'delayed' ? 'bg-red-500' :
                                  'bg-gray-400'
                                }`}
                                style={{ width: `${phase.completion_percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Deliverables */}
                          {phase.deliverables && phase.deliverables.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-600 mb-2">المخرجات:</p>
                              <div className="flex flex-wrap gap-2">
                                {phase.deliverables.map((deliverable, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-white border border-gray-300 text-xs text-gray-700 rounded"
                                  >
                                    {deliverable}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {phase.notes && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-xs text-yellow-800">
                                <span className="font-semibold">ملاحظات:</span> {phase.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Findings & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {study.findings && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-bold text-blue-900 mb-2">النتائج</h4>
                    <p className="text-sm text-blue-800 whitespace-pre-line">{study.findings}</p>
                  </div>
                )}
                {study.recommendations && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-sm font-bold text-green-900 mb-2">التوصيات</h4>
                    <p className="text-sm text-green-800 whitespace-pre-line">{study.recommendations}</p>
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

export default FeasibilityStudyTracker;
