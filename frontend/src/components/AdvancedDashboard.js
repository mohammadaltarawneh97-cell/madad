import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdvancedDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('MONTH');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-8 text-red-600">خطأ في تحميل الإحصائيات</div>;
  }

  const StatCard = ({ title, value, icon, color = "blue", subtext, trend }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-r-4 border-${color}-500 hover:shadow-xl transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600 mb-1`}>{value}</p>
          {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <span className="ml-1">{trend.direction === 'up' ? '↗️' : '↘️'}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );

  const completionRate = stats.production?.avg_completion || 0;
  const totalExpenses = stats.expenses?.reduce((sum, exp) => sum + (exp.total_amount || 0), 0) || 0;
  const totalInvoices = stats.invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
  const profitMargin = totalInvoices - totalExpenses;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">لوحة التحكم التنفيذية</h1>
          <p className="text-gray-600">{stats.month} - تقرير شامل للعمليات</p>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="WEEK">الأسبوع الحالي</option>
            <option value="MONTH">الشهر الحالي</option>
            <option value="QUARTER">الربع الحالي</option>
            <option value="YEAR">السنة الحالية</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            📊 تصدير التقرير
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="معدل الإنجاز"
          value={`${completionRate.toFixed(1)}%`}
          icon="⚡"
          color="green"
          subtext="من الهدف المحدد"
          trend={{ direction: completionRate > 80 ? 'up' : 'down', value: `${completionRate > 80 ? '+' : '-'}${Math.abs(completionRate - 80).toFixed(1)}%` }}
        />
        <StatCard
          title="الإيرادات"
          value={`${totalInvoices.toLocaleString()} ر.س`}
          icon="💰"
          color="blue"
          subtext="إجمالي الفواتير"
          trend={{ direction: 'up', value: '+12.5%' }}
        />
        <StatCard
          title="المصروفات"
          value={`${totalExpenses.toLocaleString()} ر.س`}
          icon="📊"
          color="red"
          subtext="التكاليف التشغيلية"
          trend={{ direction: 'down', value: '-5.2%' }}
        />
        <StatCard
          title="صافي الربح"
          value={`${profitMargin.toLocaleString()} ر.س`}
          icon="📈"
          color={profitMargin > 0 ? "green" : "red"}
          subtext="هامش الربح"
          trend={{ direction: profitMargin > 0 ? 'up' : 'down', value: `${profitMargin > 0 ? '+' : ''}${((profitMargin / totalInvoices) * 100 || 0).toFixed(1)}%` }}
        />
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="المعدات النشطة"
          value={stats.equipment_count}
          icon="🚛"
          color="purple"
          subtext="معدة في الخدمة"
        />
        <StatCard
          title="الإنتاج اليومي"
          value={(stats.production?.total_actual || 0).toLocaleString()}
          icon="⚙️"
          color="indigo"
          subtext="طن متري"
        />
        <StatCard
          title="الكمية المتعاقدة"
          value={(stats.production?.total_contract || 0).toLocaleString()}
          icon="📋"
          color="gray"
          subtext="هدف الشهر"
        />
        <StatCard
          title="عدد العمليات"
          value="1"
          icon="🔄"
          color="yellow"
          subtext="عملية نشطة"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Production Performance Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">أداء الإنتاج</h3>
            <select className="text-sm border border-gray-300 rounded px-3 py-1">
              <option>آخر 7 أيام</option>
              <option>آخر 30 يوم</option>
              <option>آخر 3 أشهر</option>
            </select>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">الكمية الفعلية</span>
                <span className="text-green-600 font-semibold">{(stats.production?.total_actual || 0).toLocaleString()} طن</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((stats.production?.total_actual || 0) / (stats.production?.total_contract || 1) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">الهدف المحدد</span>
                <span className="text-blue-600 font-semibold">{(stats.production?.total_contract || 0).toLocaleString()} طن</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">معدل الإنجاز الإجمالي</span>
                <span className={`text-lg font-bold ${completionRate >= 90 ? 'text-green-600' : completionRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {completionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">الملخص المالي</h3>
          <div className="space-y-6">
            {/* Revenue Breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">توزيع الإيرادات</h4>
              <div className="space-y-3">
                {stats.invoices?.map((invoice, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{invoice._id || 'غير محدد'}</span>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-sm font-semibold text-green-600">
                        {(invoice.total_amount || 0).toLocaleString()} ر.س
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${((invoice.total_amount || 0) / totalInvoices) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">توزيع المصروفات</h4>
              <div className="space-y-3">
                {stats.expenses?.map((expense, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {expense._id === 'FUEL' ? 'وقود' :
                       expense._id === 'MAINTENANCE' ? 'صيانة' :
                       expense._id === 'LABOR' ? 'عمالة' :
                       expense._id === 'MATERIALS' ? 'مواد' : 'أخرى'}
                    </span>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-sm font-semibold text-red-600">
                        {(expense.total_amount || 0).toLocaleString()} ر.س
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${((expense.total_amount || 0) / totalExpenses) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profit Margin */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">صافي الربح</span>
                <span className={`text-xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitMargin.toLocaleString()} ر.س
                </span>
              </div>
              <div className="text-xs text-gray-500">
                هامش الربح: {totalInvoices > 0 ? ((profitMargin / totalInvoices) * 100).toFixed(1) : '0'}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Utilization */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">حالة المعدات والاستخدام</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl mb-2">🚛</div>
            <div className="text-2xl font-bold text-green-600">{stats.equipment_count}</div>
            <div className="text-sm text-gray-600">معدات نشطة</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl mb-2">⏱️</div>
            <div className="text-2xl font-bold text-blue-600">1,250.5</div>
            <div className="text-sm text-gray-600">ساعات تشغيل</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl mb-2">🔧</div>
            <div className="text-2xl font-bold text-yellow-600">95%</div>
            <div className="text-sm text-gray-600">معدل الجاهزية</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">إجراءات سريعة</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <div className="text-2xl mb-2">📊</div>
            <span className="text-sm font-medium text-blue-800">تقرير يومي</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <div className="text-2xl mb-2">💰</div>
            <span className="text-sm font-medium text-green-800">إضافة مصروف</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <div className="text-2xl mb-2">📄</div>
            <span className="text-sm font-medium text-purple-800">فاتورة جديدة</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <div className="text-2xl mb-2">⚙️</div>
            <span className="text-sm font-medium text-yellow-800">صيانة معدات</span>
          </button>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">تنبيهات ومؤشرات</h3>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-500 text-xl ml-3">✅</div>
            <div>
              <div className="font-semibold text-green-800">إنجاز ممتاز</div>
              <div className="text-sm text-green-600">معدل الإنجاز {completionRate.toFixed(1)}% يتجاوز الهدف المحدد</div>
            </div>
          </div>
          
          {totalExpenses > totalInvoices * 0.8 && (
            <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-500 text-xl ml-3">⚠️</div>
              <div>
                <div className="font-semibold text-yellow-800">تحذير من التكاليف</div>
                <div className="text-sm text-yellow-600">المصروفات مرتفعة نسبياً مقارنة بالإيرادات</div>
              </div>
            </div>
          )}

          <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-blue-500 text-xl ml-3">ℹ️</div>
            <div>
              <div className="font-semibold text-blue-800">تذكير صيانة</div>
              <div className="text-sm text-blue-600">موعد الصيانة الدورية للشاحنة قلاب 1 بعد 50 ساعة تشغيل</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;