import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const GeneralLedger = () => {
  const { token } = useContext(AppContext);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/journal-entries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const postEntry = async (entryId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/journal-entries/${entryId}/post`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchEntries();
      }
    } catch (error) {
      console.error('Error posting entry:', error);
    }
  };

  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    posted: 'bg-green-100 text-green-800',
    reversed: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    draft: 'مسودة',
    posted: 'مرحل',
    reversed: 'معكوس'
  };

  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">دفتر الأستاذ العام</h2>
        </div>

        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{entry.entry_number}</h3>
                  <p className="text-gray-600">{entry.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(entry.entry_date).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs ${statusColors[entry.status]}`}>
                    {statusLabels[entry.status]}
                  </span>
                  {entry.status === 'draft' && (
                    <button
                      onClick={() => postEntry(entry.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      ترحيل القيد
                    </button>
                  )}
                </div>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-right">الحساب</th>
                    <th className="p-2 text-right">الوصف</th>
                    <th className="p-2 text-right">مدين</th>
                    <th className="p-2 text-right">دائن</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.lines?.map((line, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{line.account_code} - {line.account_name}</td>
                      <td className="p-2">{line.description}</td>
                      <td className="p-2 text-green-600 font-semibold">
                        {line.entry_type === 'debit' ? line.amount.toLocaleString('ar-SA') : '-'}
                      </td>
                      <td className="p-2 text-red-600 font-semibold">
                        {line.entry_type === 'credit' ? line.amount.toLocaleString('ar-SA') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td colSpan="2" className="p-2 text-right">الإجمالي:</td>
                    <td className="p-2 text-green-700">{entry.total_debit?.toLocaleString('ar-SA')}</td>
                    <td className="p-2 text-red-700">{entry.total_credit?.toLocaleString('ar-SA')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>

        {entries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد قيود محاسبية
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralLedger;