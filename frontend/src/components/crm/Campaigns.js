import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../MultiCompanyApp';

const Campaigns = () => {
  const { token } = useContext(AppContext);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ campaign_name: '', campaign_name_ar: '', campaign_type: 'email', start_date: '', end_date: '', budgeted_cost: 0, expected_revenue: 0 });

  const types = { email: 'بريد إلكتروني', webinar: 'ندوة عبر الإنترنت', conference: 'مؤتمر', trade_show: 'معرض تجاري', direct_mail: 'بريد مباشر', telemarketing: 'تسويق هاتفي', social_media: 'وسائل التواصل', other: 'أخرى' };
  const statuses = { planned: 'مخططة', in_progress: 'قيد التنفيذ', completed: 'مكتملة', aborted: 'ملغية' };
  const statusColors = { planned: 'bg-blue-100 text-blue-800', in_progress: 'bg-yellow-100 text-yellow-800', completed: 'bg-green-100 text-green-800', aborted: 'bg-red-100 text-red-800' };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crm/campaigns`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowForm(false);
        fetchCampaigns();
        setFormData({ campaign_name: '', campaign_name_ar: '', campaign_type: 'email', start_date: '', end_date: '', budgeted_cost: 0, expected_revenue: 0 });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const calculateROI = (campaign) => {
    if (campaign.actual_cost === 0) return 0;
    return ((campaign.actual_revenue - campaign.actual_cost) / campaign.actual_cost * 100).toFixed(1);
  };

  if (loading) return <div className="p-6 text-center" dir="rtl">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">إدارة الحملات التسويقية</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">{showForm ? 'إلغاء' : '+ حملة جديدة'}</button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">إضافة حملة تسويقية جديدة</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">اسم الحملة (English) *</label><input type="text" required value={formData.campaign_name} onChange={(e) => setFormData({...formData, campaign_name: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">اسم الحملة (عربي)</label><input type="text" value={formData.campaign_name_ar} onChange={(e) => setFormData({...formData, campaign_name_ar: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">نوع الحملة *</label><select value={formData.campaign_type} onChange={(e) => setFormData({...formData, campaign_type: e.target.value})} className="w-full p-2 border rounded-lg">{Object.keys(types).map(key => <option key={key} value={key}>{types[key]}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2">تاريخ البدء *</label><input type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">تاريخ الانتهاء</label><input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">الميزانية المخططة (SAR)</label><input type="number" value={formData.budgeted_cost} onChange={(e) => setFormData({...formData, budgeted_cost: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-2">الإيرادات المتوقعة (SAR)</label><input type="number" value={formData.expected_revenue} onChange={(e) => setFormData({...formData, expected_revenue: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" /></div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ الحملة</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100"><tr><th className="p-3 text-right">الرقم</th><th className="p-3 text-right">اسم الحملة</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">تاريخ البدء</th><th className="p-3 text-right">الميزانية</th><th className="p-3 text-right">التكلفة الفعلية</th><th className="p-3 text-right">ROI</th><th className="p-3 text-right">الحالة</th></tr></thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{campaign.campaign_number}</td>
                  <td className="p-3 font-semibold">{campaign.campaign_name_ar || campaign.campaign_name}</td>
                  <td className="p-3">{types[campaign.campaign_type]}</td>
                  <td className="p-3">{new Date(campaign.start_date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-3">{campaign.budgeted_cost?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3 font-semibold">{campaign.actual_cost?.toLocaleString('ar-SA')} SAR</td>
                  <td className="p-3 font-bold text-green-600">{calculateROI(campaign)}%</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColors[campaign.status]}`}>{statuses[campaign.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {campaigns.length === 0 && <div className="text-center py-8 text-gray-500">لا توجد حملات تسويقية</div>}
        </div>
      </div>
    </div>
  );
};

export default Campaigns;