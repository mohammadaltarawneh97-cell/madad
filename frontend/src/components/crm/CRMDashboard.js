import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../MultiCompanyApp';

const CRMDashboard = () => {
  const { token } = useContext(AppContext);
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/dashboard/sales-analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    { title: 'إدارة العملاء المحتملين', description: 'جذب وتأهيل وتحويل العملاء المحتملين', icon: '🎯', path: '/crm/leads', color: 'bg-blue-500', stat: analytics?.leads?.total || 0 },
    { title: 'الحسابات', description: 'إدارة المؤسسات والشركاء', icon: '🏢', path: '/crm/accounts', color: 'bg-green-500', stat: analytics?.accounts || 0 },
    { title: 'جهات الاتصال', description: 'إدارة الأشخاص والعلاقات', icon: '👤', path: '/crm/contacts', color: 'bg-purple-500', stat: analytics?.contacts || 0 },
    { title: 'الفرص التجارية', description: 'تتبع الصفقات والمبيعات', icon: '💼', path: '/crm/opportunities', color: 'bg-orange-500', stat: analytics?.opportunities?.total || 0 },
    { title: 'حالات الدعم', description: 'خدمة العملاء والدعم الفني', icon: '🎫', path: '/crm/cases', color: 'bg-red-500', stat: analytics?.cases?.total || 0 },
    { title: 'الحملات التسويقية', description: 'إدارة الحملات وقياس ROI', icon: '📢', path: '/crm/campaigns', color: 'bg-pink-500' }
  ];

  if (loading) {
    return <div className="p-6 text-center" dir="rtl">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">نظام إدارة علاقات العملاء (CRM)</h2>
          <p className="text-gray-600 mt-2">نظام متكامل لإدارة المبيعات والتسويق وخدمة العملاء</p>
        </div>

        {/* KPI Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-r-4 border-blue-500">
              <div className="text-sm text-gray-600 mb-1">معدل تحويل العملاء المحتملين</div>
              <div className="text-2xl font-bold text-blue-700">{analytics.leads.conversion_rate.toFixed(1)}%</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-r-4 border-green-500">
              <div className="text-sm text-gray-600 mb-1">معدل الفوز بالصفقات</div>
              <div className="text-2xl font-bold text-green-700">{analytics.opportunities.win_rate.toFixed(1)}%</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-r-4 border-orange-500">
              <div className="text-sm text-gray-600 mb-1">قيمة خط الأنابيب</div>
              <div className="text-2xl font-bold text-orange-700">{(analytics.pipeline.total_value / 1000).toFixed(0)}K SAR</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-r-4 border-purple-500">
              <div className="text-sm text-gray-600 mb-1">الإيرادات المحققة</div>
              <div className="text-2xl font-bold text-purple-700">{(analytics.pipeline.won_revenue / 1000).toFixed(0)}K SAR</div>
            </div>
          </div>
        )}

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, idx) => (
            <div
              key={idx}
              onClick={() => navigate(module.path)}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
            >
              <div className={`${module.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg`}>
                {module.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{module.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{module.description}</p>
              {module.stat !== undefined && (
                <div className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-700 inline-block">
                  {module.stat} عنصر
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border-r-4 border-indigo-500">
          <h3 className="text-lg font-bold text-gray-800 mb-2">📌 الميزات الرئيسية</h3>
          <ul className="grid grid-cols-2 gap-3 text-gray-700">
            <li className="flex items-center gap-2"><span className="text-green-600">✓</span><span>إدارة متكاملة للعملاء المحتملين</span></li>
            <li className="flex items-center gap-2"><span className="text-green-600">✓</span><span>خط أنابيب المبيعات</span></li>
            <li className="flex items-center gap-2"><span className="text-green-600">✓</span><span>نظام دعم العملاء</span></li>
            <li className="flex items-center gap-2"><span className="text-green-600">✓</span><span>تتبع الحملات التسويقية</span></li>
            <li className="flex items-center gap-2"><span className="text-green-600">✓</span><span>تقارير وتحليلات المبيعات</span></li>
            <li className="flex items-center gap-2"><span className="text-green-600">✓</span><span>تحويل تلقائي للعملاء المحتملين</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;