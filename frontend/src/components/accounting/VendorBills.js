import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const VendorBills = () => {
  const { token } = useContext(AppContext);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/vendor-bills`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBills(data);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    approved: 'bg-blue-100 text-blue-800',
    partially_paid: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    draft: 'مسودة',
    approved: 'معتمد',
    partially_paid: 'مدفوع جزئياً',
    paid: 'مدفوع',
    cancelled: 'ملغي'
  };

  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">فواتير الموردين</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-right">رقم الفاتورة</th>
                <th className="p-3 text-right">المورد</th>
                <th className="p-3 text-right">التاريخ</th>
                <th className="p-3 text-right">تاريخ الاستحقاق</th>
                <th className="p-3 text-right">المبلغ الإجمالي</th>
                <th className="p-3 text-right">المبلغ المستحق</th>
                <th className="p-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{bill.bill_number}</td>
                  <td className="p-3">{bill.vendor_name}</td>
                  <td className="p-3">{new Date(bill.bill_date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-3">{new Date(bill.due_date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-3 font-semibold">{bill.total_amount?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3 font-semibold text-red-600">{bill.amount_due?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[bill.status]}`}>
                      {statusLabels[bill.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bills.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              لا توجد فواتير موردين
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorBills;