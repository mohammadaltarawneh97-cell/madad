import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const ARInvoices = () => {
  const { token } = useContext(AppContext);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/ar-invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    partially_paid: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    overdue: 'bg-orange-100 text-orange-800'
  };

  const statusLabels = {
    draft: 'مسودة',
    sent: 'مرسلة',
    partially_paid: 'محصل جزئياً',
    paid: 'محصلة',
    cancelled: 'ملغية',
    overdue: 'متأخرة'
  };

  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">فواتير العملاء</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-right">رقم الفاتورة</th>
                <th className="p-3 text-right">العميل</th>
                <th className="p-3 text-right">التاريخ</th>
                <th className="p-3 text-right">تاريخ الاستحقاق</th>
                <th className="p-3 text-right">المبلغ الإجمالي</th>
                <th className="p-3 text-right">المبلغ المستحق</th>
                <th className="p-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{invoice.invoice_number}</td>
                  <td className="p-3">{invoice.customer_name}</td>
                  <td className="p-3">{new Date(invoice.invoice_date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-3">{new Date(invoice.due_date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-3 font-semibold">{invoice.total_amount?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3 font-semibold text-green-600">{invoice.amount_due?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[invoice.status]}`}>
                      {statusLabels[invoice.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              لا توجد فواتير عملاء
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ARInvoices;