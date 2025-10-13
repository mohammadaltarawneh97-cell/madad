import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const StockBalance = () => {
  const { token } = useContext(AppContext);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/stock-balance`, {headers: {'Authorization': `Bearer ${token}`}});
      if (res.ok) setStock(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center" dir="rtl">جاري التحميل...</div>;

  const totalValue = stock.reduce((sum, s) => sum + (s.quantity_on_hand * s.unit_cost), 0);

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">رصيد المخزون</h2>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold">القيمة الإجمالية: {totalValue.toLocaleString('ar-SA')} SAR</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100"><tr><th className="p-3 text-right">رمز المنتج</th><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">المستودع</th><th className="p-3 text-right">الكمية المتاحة</th><th className="p-3 text-right">الكمية المحجوزة</th><th className="p-3 text-right">الكمية المتوفرة</th><th className="p-3 text-right">التكلفة</th><th className="p-3 text-right">القيمة</th></tr></thead>
            <tbody>
              {stock.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{s.product_code}</td>
                  <td className="p-3">{s.product_name}</td>
                  <td className="p-3">{s.warehouse_name}</td>
                  <td className="p-3 font-bold text-blue-600">{s.quantity_on_hand.toLocaleString('ar-SA')}</td>
                  <td className="p-3 text-red-600">{s.quantity_reserved.toLocaleString('ar-SA')}</td>
                  <td className="p-3 font-semibold text-green-600">{s.quantity_available.toLocaleString('ar-SA')}</td>
                  <td className="p-3">{s.unit_cost.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3 font-bold">{(s.quantity_on_hand * s.unit_cost).toLocaleString('ar-SA')} SAR</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-bold"><tr><td colSpan="7" className="p-3 text-left">الإجمالي:</td><td className="p-3">{totalValue.toLocaleString('ar-SA')} SAR</td></tr></tfoot>
          </table>
          {stock.length === 0 && <div className="text-center py-8 text-gray-500">لا يوجد رصيد في المخزون</div>}
        </div>
      </div>
    </div>
  );
};

export default StockBalance;