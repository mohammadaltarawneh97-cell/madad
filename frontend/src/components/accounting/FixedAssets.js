import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const FixedAssets = () => {
  const { token } = useContext(AppContext);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/accounting/fixed-assets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryLabels = {
    land: 'أراضي',
    building: 'مباني',
    machinery: 'آلات',
    vehicles: 'مركبات',
    furniture: 'أثاث',
    computer_equipment: 'أجهزة حاسب',
    other: 'أخرى'
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    disposed: 'bg-red-100 text-red-800',
    under_maintenance: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-800'
  };

  const statusLabels = {
    active: 'نشط',
    disposed: 'محال',
    under_maintenance: 'تحت الصيانة',
    inactive: 'غير نشط'
  };

  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">سجل الأصول الثابتة</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-right">رمز الأصل</th>
                <th className="p-3 text-right">اسم الأصل</th>
                <th className="p-3 text-right">التصنيف</th>
                <th className="p-3 text-right">تكلفة الشراء</th>
                <th className="p-3 text-right">الاستهلاك المتراكم</th>
                <th className="p-3 text-right">القيمة الدفترية</th>
                <th className="p-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{asset.asset_code}</td>
                  <td className="p-3">{asset.asset_name_ar || asset.asset_name}</td>
                  <td className="p-3">{categoryLabels[asset.asset_category]}</td>
                  <td className="p-3 font-semibold">{asset.purchase_price?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3 text-red-600">{asset.accumulated_depreciation?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3 font-bold text-blue-600">{asset.net_book_value?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[asset.status]}`}>
                      {statusLabels[asset.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan="3" className="p-3 text-right">الإجمالي:</td>
                <td className="p-3">
                  {assets.reduce((sum, a) => sum + (a.purchase_price || 0), 0).toLocaleString('ar-SA')} SAR
                </td>
                <td className="p-3 text-red-600">
                  {assets.reduce((sum, a) => sum + (a.accumulated_depreciation || 0), 0).toLocaleString('ar-SA')} SAR
                </td>
                <td className="p-3 text-blue-600">
                  {assets.reduce((sum, a) => sum + (a.net_book_value || 0), 0).toLocaleString('ar-SA')} SAR
                </td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
          {assets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              لا توجد أصول ثابتة مسجلة
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedAssets;