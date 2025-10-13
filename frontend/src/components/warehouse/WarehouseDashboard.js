import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../MultiCompanyApp';

const WarehouseDashboard = () => {
  const { token } = useContext(AppContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({warehouses: 0, products: 0, totalValue: 0});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [whRes, prodRes, valRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/warehouses`, {headers: {'Authorization': `Bearer ${token}`}}),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/products`, {headers: {'Authorization': `Bearer ${token}`}}),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/reports/stock-valuation`, {headers: {'Authorization': `Bearer ${token}`}})
      ]);
      if (whRes.ok && prodRes.ok && valRes.ok) {
        const wh = await whRes.json();
        const prod = await prodRes.json();
        const val = await valRes.json();
        setStats({warehouses: wh.length, products: prod.length, totalValue: val.total_value});
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const modules = [
    {title: 'مستودعات', icon: '🏭', path: '/warehouse/warehouses', color: 'bg-blue-500', stat: `${stats.warehouses} مستودع`},
    {title: 'المنتجات', icon: '📦', path: '/warehouse/products', color: 'bg-green-500', stat: `${stats.products} منتج`},
    {title: 'رصيد المخزون', icon: '📊', path: '/warehouse/stock-balance', color: 'bg-purple-500'},
    {title: 'حركة المخزون', icon: '🔄', path: '/warehouse/stock-movements', color: 'bg-orange-500'},
    {title: 'أوامر الشراء', icon: '📋', path: '/warehouse/purchase-orders', color: 'bg-red-500'},
    {title: 'تسويات المخزون', icon: '⚖️', path: '/warehouse/adjustments', color: 'bg-pink-500'}
  ];

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">نظام إدارة المستودعات</h2>
        <p className="text-gray-600 mb-6">نظام متكامل لإدارة المخزون والمشتريات</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-r-4 border-blue-500">
            <div className="text-sm text-gray-600">إجمالي قيمة المخزون</div>
            <div className="text-2xl font-bold text-blue-700">{(stats.totalValue / 1000).toFixed(0)}K SAR</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m, i) => (
            <div key={i} onClick={() => navigate(m.path)} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-md hover:shadow-xl transition cursor-pointer transform hover:-translate-y-1">
              <div className={`${m.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg`}>{m.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{m.title}</h3>
              {m.stat && <div className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-700 inline-block">{m.stat}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WarehouseDashboard;