import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const PurchaseOrders = () => {
  const { token } = useContext(AppContext);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);

  const statuses = {draft: 'مسودة', submitted: 'مقدم', approved: 'معتمد', partially_received: 'مستلم جزئياً', received: 'مستلم', cancelled: 'ملغي'};
  const statusColors = {draft: 'bg-gray-100 text-gray-800', submitted: 'bg-blue-100 text-blue-800', approved: 'bg-green-100 text-green-800', partially_received: 'bg-yellow-100 text-yellow-800', received: 'bg-purple-100 text-purple-800', cancelled: 'bg-red-100 text-red-800'};

  useEffect(() => {
    fetchPos();
  }, []);

  const fetchPos = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/warehouse/purchase-orders`, {headers: {'Authorization': `Bearer ${token}`}});
      if (res.ok) setPos(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center" dir="rtl">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">أوامر الشراء</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100"><tr><th className="p-3 text-right">رقم الأمر</th><th className="p-3 text-right">التاريخ</th><th className="p-3 text-right">المورد</th><th className="p-3 text-right">المستودع</th><th className="p-3 text-right">المبلغ الإجمالي</th><th className="p-3 text-right">الحالة</th></tr></thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{po.po_number}</td>
                  <td className="p-3">{new Date(po.po_date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-3">{po.vendor_name}</td>
                  <td className="p-3">{po.warehouse_name}</td>
                  <td className="p-3 font-bold text-green-600">{po.total_amount.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColors[po.status]}`}>{statuses[po.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {pos.length === 0 && <div className="text-center py-8 text-gray-500">لا توجد أوامر شراء</div>}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;