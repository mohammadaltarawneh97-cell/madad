import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../MultiCompanyApp';

const AccountingDashboard = () => {
  const { token } = useContext(AppContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    accounts: 0,
    vendors: 0,
    customers: 0,
    assets: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [accountsRes, vendorsRes, customersRes, assetsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/chart-of-accounts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/vendors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/fixed-assets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (accountsRes.ok && vendorsRes.ok && customersRes.ok && assetsRes.ok) {
        const [accounts, vendors, customers, assets] = await Promise.all([
          accountsRes.json(),
          vendorsRes.json(),
          customersRes.json(),
          assetsRes.json()
        ]);

        setStats({
          accounts: accounts.length,
          vendors: vendors.length,
          customers: customers.length,
          assets: assets.length
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const modules = [
    {
      title: 'شجرة الحسابات',
      description: 'إدارة الحسابات والدليل المحاسبي',
      icon: '📊',
      path: '/accounting/chart-of-accounts',
      color: 'bg-blue-500',
      stat: `${stats.accounts} حساب`
    },
    {
      title: 'دفتر الأستاذ العام',
      description: 'القيود اليومية والترحيل',
      icon: '📖',
      path: '/accounting/general-ledger',
      color: 'bg-green-500'
    },
    {
      title: 'الموردين',
      description: 'إدارة بيانات الموردين',
      icon: '🏭',
      path: '/accounting/vendors',
      color: 'bg-purple-500',
      stat: `${stats.vendors} مورد`
    },
    {
      title: 'فواتير الموردين',
      description: 'الحسابات الدائنة والمدفوعات',
      icon: '📄',
      path: '/accounting/vendor-bills',
      color: 'bg-red-500'
    },
    {
      title: 'العملاء',
      description: 'إدارة بيانات العملاء',
      icon: '👥',
      path: '/accounting/customers',
      color: 'bg-indigo-500',
      stat: `${stats.customers} عميل`
    },
    {
      title: 'فواتير العملاء',
      description: 'الحسابات المدينة والمحصلات',
      icon: '💰',
      path: '/accounting/ar-invoices',
      color: 'bg-teal-500'
    },
    {
      title: 'الأصول الثابتة',
      description: 'سجل الأصول والاستهلاك',
      icon: '🏢',
      path: '/accounting/fixed-assets',
      color: 'bg-orange-500',
      stat: `${stats.assets} أصل`
    },
    {
      title: 'التقارير المالية',
      description: 'ميزان المراجعة والميزانية',
      icon: '📈',
      path: '/accounting/reports',
      color: 'bg-pink-500'
    }
  ];

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">النظام المحاسبي المتكامل</h2>
          <p className="text-gray-600 mt-2">نظام محاسبي شامل يشمل دفتر الأستاذ، الحسابات الدائنة والمدينة، والتقارير المالية</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              {module.stat && (
                <div className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-700 inline-block">
                  {module.stat}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-r-4 border-blue-500">
          <h3 className="text-lg font-bold text-gray-800 mb-2">📌 الميزات الرئيسية</h3>
          <ul className="grid grid-cols-2 gap-3 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>نظام القيد المزدوج</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>دعم العملات المتعددة</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>احتساب الضرائب تلقائياً</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>التقارير المالية الشاملة</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>إدارة الأصول والاستهلاك</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>متوافق مع المعايير الدولية</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccountingDashboard;
