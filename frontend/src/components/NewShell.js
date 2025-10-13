import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from './MultiCompanyApp';

const NewShell = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuSections = [
    {
      title: 'Dashboard / لوحة التحكم',
      items: [
        { label: 'Dashboard', labelAr: 'لوحة التحكم', to: '/dashboard', icon: '📊' }
      ]
    },
    {
      title: 'Production / الإنتاج',
      items: [
        { label: 'Production', labelAr: 'الإنتاج', to: '/production', icon: '🏭' },
        { label: 'Equipment', labelAr: 'المعدات', to: '/equipment', icon: '🚜' },
        { label: 'Costing Centers', labelAr: 'مراكز التكلفة', to: '/costing-centers', icon: '💰' }
      ]
    },
    {
      title: 'Invoices / الفواتير',
      items: [
        { label: 'Screening', labelAr: 'الفرز', to: '/invoices/screening', icon: '📄' },
        { label: 'Feeding', labelAr: 'التغذية', to: '/invoices/feeding', icon: '📄' },
        { label: 'Crushing', labelAr: 'التكسير', to: '/invoices/crushing', icon: '📄' },
        { label: 'Hauling', labelAr: 'النقل', to: '/invoices/hauling', icon: '📄' }
      ]
    },
    {
      title: 'Expenses / المصاريف',
      items: [
        { label: 'Fuel', labelAr: 'الوقود', to: '/expenses/fuel', icon: '⛽' },
        { label: 'Oil & Coolant', labelAr: 'الزيوت', to: '/expenses/oil', icon: '🛢️' },
        { label: 'Grease', labelAr: 'الشحم', to: '/expenses/grease', icon: '🧴' },
        { label: 'Spare Parts', labelAr: 'قطع الغيار', to: '/expenses/spare-parts', icon: '🔧' },
        { label: 'Salaries', labelAr: 'الرواتب', to: '/expenses/salaries', icon: '💵' },
        { label: 'Others', labelAr: 'أخرى', to: '/expenses/others', icon: '📋' }
      ]
    },
    {
      title: 'Accounting / المحاسبة',
      items: [
        { label: 'Accounting Dashboard', labelAr: 'لوحة المحاسبة', to: '/accounting', icon: '📊' },
        { label: 'Chart of Accounts', labelAr: 'دليل الحسابات', to: '/accounting/chart-of-accounts', icon: '📑' },
        { label: 'Vendors', labelAr: 'الموردين', to: '/accounting/vendors', icon: '🏪' },
        { label: 'Bank Reconciliation', labelAr: 'التسوية البنكية', to: '/accounting/bank-reconciliation', icon: '🏦' },
        { label: 'Expense Claims', labelAr: 'مطالبات المصروفات', to: '/accounting/expense-claims', icon: '💳' },
        { label: 'Budgets', labelAr: 'الموازنات', to: '/accounting/budgets', icon: '📈' }
      ]
    },
    {
      title: 'CRM / إدارة العملاء',
      items: [
        { label: 'CRM Dashboard', labelAr: 'لوحة CRM', to: '/crm', icon: '👥' },
        { label: 'Leads', labelAr: 'العملاء المحتملين', to: '/crm/leads', icon: '🎯' },
        { label: 'Tasks', labelAr: 'المهام', to: '/crm/tasks', icon: '✅' },
        { label: 'Contracts', labelAr: 'العقود', to: '/crm/contracts', icon: '📝' }
      ]
    },
    {
      title: 'Warehouse / المستودعات',
      items: [
        { label: 'Warehouse Dashboard', labelAr: 'لوحة المستودعات', to: '/warehouse', icon: '📦' },
        { label: 'Products', labelAr: 'المنتجات', to: '/warehouse/products', icon: '📦' },
        { label: 'Stock Balance', labelAr: 'رصيد المخزون', to: '/warehouse/stock-balance', icon: '📊' },
        { label: 'Inventory Transfers', labelAr: 'نقل المخزون', to: '/warehouse/inventory-transfers', icon: '🚚' }
      ]
    },
    {
      title: 'Compliance / الامتثال',
      items: [
        { label: 'Licenses', labelAr: 'الرخص', to: '/compliance/licenses', icon: '📜' },
        { label: 'Insurance', labelAr: 'التأمين', to: '/compliance/insurance', icon: '🛡️' },
        { label: 'Certificates', labelAr: 'الشهادات', to: '/compliance/certificates', icon: '🏆' }
      ]
    },
    {
      title: 'Documents / المستندات',
      items: [
        { label: 'MOU', labelAr: 'مذكرة تفاهم', to: '/mou', icon: '📄' },
        { label: 'Financial Statement', labelAr: 'القوائم المالية', to: '/financials', icon: '💼' },
        { label: 'HSE', labelAr: 'الصحة والسلامة', to: '/hse', icon: '⚠️' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ☰
          </button>
          <h1 className="text-xl font-bold">Khairit Digital Core</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <input 
              type="search" 
              placeholder="Search..." 
              className="px-4 py-2 border rounded-lg w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{user?.name || user?.full_name}</span>
            <button 
              onClick={logout}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-72 bg-white border-r min-h-screen p-4 overflow-y-auto">
            <nav className="space-y-6">
              {menuSections.map((section, idx) => (
                <div key={idx}>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-3">
                    {section.title}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item, i) => (
                      <Link
                        key={i}
                        to={item.to}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default NewShell;
