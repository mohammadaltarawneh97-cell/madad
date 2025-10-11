import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductionManagement = () => {
  const [production, setProduction] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activity_type: 'SCREENING',
    actual_qty: 0,
    contract_qty: 0,
    equipment_ids: [],
    notes: ''
  });

  const activityTypes = {
    'SCREENING': 'غربلة',
    'CRUSHING': 'كسارة',
    'HAULING': 'نقل',
    'FEEDING': 'تغذية',
    'WASHING': 'غسيل',
    'OTHER': 'أخرى'
  };

  const equipmentTypes = {
    'DT': 'شاحنة قلاب',
    'PC': 'حفارة',
    'WL': 'محمل',
    'GR': 'جريدر',
    'RL': 'رولر',
    'PLANT': 'معدات المصنع'
  };

  useEffect(() => {
    fetchProduction();
    fetchEquipment();
  }, []);

  const fetchProduction = async () => {
    try {
      const response = await axios.get(`${API}/production`);
      setProduction(response.data);
    } catch (error) {
      console.error('Error fetching production:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await axios.get(`${API}/equipment`);
      setEquipment(response.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        actual_qty: parseFloat(formData.actual_qty),
        contract_qty: parseFloat(formData.contract_qty)
      };

      if (editingId) {
        await axios.put(`${API}/production/${editingId}`, submitData);
      } else {
        await axios.post(`${API}/production`, submitData);
      }

      resetForm();
      fetchProduction();
    } catch (error) {
      console.error('Error saving production:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      activity_type: 'SCREENING',
      actual_qty: 0,
      contract_qty: 0,
      equipment_ids: [],
      notes: ''
    });
  };

  const handleEdit = (item) => {
    setFormData({
      date: new Date(item.date).toISOString().split('T')[0],
      activity_type: item.activity_type,
      actual_qty: item.actual_qty,
      contract_qty: item.contract_qty,
      equipment_ids: item.equipment_ids || [],
      notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'equipment_ids') {
      const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
      setFormData(prev => ({ ...prev, [name]: selectedOptions }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateCompletionRate = (actual, contract) => {
    if (contract === 0) return 0;
    return ((actual / contract) * 100).toFixed(1);
  };

  const getCompletionColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSelectedEquipmentNames = (equipmentIds) => {
    return equipment
      .filter(eq => equipmentIds.includes(eq.id))
      .map(eq => eq.name)
      .join('، ');
  };

  if (loading) {
    return <div className="text-center py-8">جاري تحميل بيانات الإنتاج...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">إدارة الإنتاج</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          {showForm ? 'إلغاء' : '+ إضافة إنتاج جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'تعديل بيانات الإنتاج' : 'إضافة إنتاج جديد'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع النشاط</label>
              <select
                name="activity_type"
                value={formData.activity_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(activityTypes).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الكمية الفعلية</label>
              <input
                type="number"
                name="actual_qty"
                value={formData.actual_qty}
                onChange={handleChange}
                step="0.1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="الكمية المنتجة فعلياً"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الكمية المتعاقد عليها</label>
              <input
                type="number"
                name="contract_qty"
                value={formData.contract_qty}
                onChange={handleChange}
                step="0.1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="الكمية المطلوبة حسب العقد"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">المعدات المستخدمة</label>
              <select
                multiple
                name="equipment_ids"
                value={formData.equipment_ids}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                size="4"
              >
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({equipmentTypes[eq.type]})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">اضغط Ctrl/Cmd لتحديد أكثر من معدة</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل أي ملاحظات (اختياري)"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                {editingId ? 'تحديث البيانات' : 'حفظ الإنتاج'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Production Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">إجمالي الإنتاج اليوم</p>
              <p className="text-3xl font-bold text-gray-900">
                {production
                  .filter(p => new Date(p.date).toDateString() === new Date().toDateString())
                  .reduce((sum, p) => sum + p.actual_qty, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="text-4xl">⚡</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">متوسط معدل الإنجاز</p>
              <p className="text-3xl font-bold text-gray-900">
                {production.length > 0
                  ? (production.reduce((sum, p) => sum + p.completion_rate, 0) / production.length).toFixed(1)
                  : '0'}%
              </p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">عدد العمليات</p>
              <p className="text-3xl font-bold text-gray-900">{production.length}</p>
            </div>
            <div className="text-4xl">🔢</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">أعلى إنجاز</p>
              <p className="text-3xl font-bold text-gray-900">
                {production.length > 0
                  ? Math.max(...production.map(p => p.completion_rate)).toFixed(1)
                  : '0'}%
              </p>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        </div>
      </div>

      {/* Production Data Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">سجل الإنتاج</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نوع النشاط
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكمية الفعلية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكمية المتعاقد عليها
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  معدل الإنجاز
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المعدات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {production.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activityTypes[item.activity_type]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.actual_qty.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.contract_qty.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${getCompletionColor(item.completion_rate)}`}>
                      {item.completion_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {getSelectedEquipmentNames(item.equipment_ids || [])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 ml-3"
                    >
                      تعديل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {production.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد بيانات إنتاج</h3>
            <p className="text-gray-600 mb-4">ابدأ بإضافة أول عملية إنتاج</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              إضافة إنتاج جديد
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionManagement;