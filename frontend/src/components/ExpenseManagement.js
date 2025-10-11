import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [costingCenters, setCostingCenters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterDateRange, setFilterDateRange] = useState('ALL');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'FUEL',
    subcategory: '',
    amount: 0,
    description: '',
    equipment_id: '',
    costing_center_id: '',
    receipt_number: ''
  });

  const expenseCategories = {
    'FUEL': 'وقود',
    'MAINTENANCE': 'صيانة',
    'LABOR': 'عمالة',
    'MATERIALS': 'مواد',
    'OTHER': 'أخرى'
  };

  const subcategories = {
    'FUEL': ['ديزل', 'بنزين', 'زيت محرك', 'زيت هيدروليك'],
    'MAINTENANCE': ['قطع غيار', 'إطارات', 'فلاتر', 'بطاريات', 'صيانة دورية'],
    'LABOR': ['رواتب', 'بدلات', 'مكافآت', 'تأمينات'],
    'MATERIALS': ['رمل', 'حصى', 'أسمنت', 'حديد', 'مواد بناء'],
    'OTHER': ['مصاريف إدارية', 'اتصالات', 'مياه', 'كهرباء', 'متنوعة']
  };

  const equipmentTypes = {
    'DT': 'شاحنة قلاب',
    'PC': 'حفارة',
    'WL': 'محمل',
    'GR': 'جريدر',
    'RL': 'رولر',
    'PLANT': 'معدات المصنع'
  };

  const costingCenterNames = {
    'SCREENING': 'غربلة',
    'CRUSHING': 'كسارة',
    'HAULING': 'نقل',
    'FEEDING': 'تغذية',
    'WASHING': 'غسيل',
    'OTHER': 'أخرى'
  };

  useEffect(() => {
    fetchExpenses();
    fetchEquipment();
    fetchCostingCenters();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API}/expenses`);
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
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

  const fetchCostingCenters = async () => {
    try {
      const response = await axios.get(`${API}/costing-centers`);
      setCostingCenters(response.data);
    } catch (error) {
      console.error('Error fetching costing centers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        amount: parseFloat(formData.amount),
        equipment_id: formData.equipment_id || null,
        costing_center_id: formData.costing_center_id || null
      };

      if (editingId) {
        await axios.put(`${API}/expenses/${editingId}`, submitData);
      } else {
        await axios.post(`${API}/expenses`, submitData);
      }

      resetForm();
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'FUEL',
      subcategory: '',
      amount: 0,
      description: '',
      equipment_id: '',
      costing_center_id: '',
      receipt_number: ''
    });
  };

  const handleEdit = (expense) => {
    setFormData({
      date: new Date(expense.date).toISOString().split('T')[0],
      category: expense.category,
      subcategory: expense.subcategory || '',
      amount: expense.amount,
      description: expense.description,
      equipment_id: expense.equipment_id || '',
      costing_center_id: expense.costing_center_id || '',
      receipt_number: expense.receipt_number || ''
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset subcategory when category changes
      ...(name === 'category' ? { subcategory: '' } : {})
    }));
  };

  const getEquipmentName = (equipmentId) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? eq.name : '-';
  };

  const getCostingCenterName = (centerId) => {
    const center = costingCenters.find(c => c.id === centerId);
    return center ? costingCenterNames[center.name] : '-';
  };

  const getFilteredExpenses = () => {
    let filtered = expenses;

    if (filterCategory !== 'ALL') {
      filtered = filtered.filter(expense => expense.category === filterCategory);
    }

    if (filterDateRange !== 'ALL') {
      const today = new Date();
      const filterDate = new Date(today);
      
      switch (filterDateRange) {
        case 'TODAY':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(expense => 
            new Date(expense.date) >= filterDate
          );
          break;
        case 'WEEK':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(expense => 
            new Date(expense.date) >= filterDate
          );
          break;
        case 'MONTH':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(expense => 
            new Date(expense.date) >= filterDate
          );
          break;
      }
    }

    return filtered;
  };

  const getTotalExpenses = (filtered = false) => {
    const expensesToSum = filtered ? getFilteredExpenses() : expenses;
    return expensesToSum.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getExpensesByCategory = () => {
    const categoryTotals = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    return categoryTotals;
  };

  if (loading) {
    return <div className="text-center py-8">جاري تحميل بيانات المصروفات...</div>;
  }

  const filteredExpenses = getFilteredExpenses();
  const categoryTotals = getExpensesByCategory();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">إدارة المصروفات</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          {showForm ? 'إلغاء' : '+ إضافة مصروف جديد'}
        </button>
      </div>

      {/* Expense Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">إجمالي المصروفات</p>
              <p className="text-3xl font-bold text-gray-900">{getTotalExpenses().toLocaleString()} ر.س</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">مصروفات الوقود</p>
              <p className="text-3xl font-bold text-gray-900">{(categoryTotals['FUEL'] || 0).toLocaleString()} ر.س</p>
            </div>
            <div className="text-4xl">⛽</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">مصروفات الصيانة</p>
              <p className="text-3xl font-bold text-gray-900">{(categoryTotals['MAINTENANCE'] || 0).toLocaleString()} ر.س</p>
            </div>
            <div className="text-4xl">🔧</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">عدد المصروفات</p>
              <p className="text-3xl font-bold text-gray-900">{expenses.length}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(expenseCategories).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف الفرعي</label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر التصنيف الفرعي</option>
                {subcategories[formData.category]?.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ (ريال سعودي)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل المبلغ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المعدة (اختياري)</label>
              <select
                name="equipment_id"
                value={formData.equipment_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">غير محدد</option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({equipmentTypes[eq.type]})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">مركز التكلفة (اختياري)</label>
              <select
                name="costing_center_id"
                value={formData.costing_center_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">غير محدد</option>
                {costingCenters.map((center) => (
                  <option key={center.id} value={center.id}>
                    {costingCenterNames[center.name]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رقم الإيصال</label>
              <input
                type="text"
                name="receipt_number"
                value={formData.receipt_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="رقم الإيصال (اختياري)"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="وصف تفصيلي للمصروف"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                {editingId ? 'تحديث المصروف' : 'حفظ المصروف'}
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">فلتر التصنيف</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">جميع التصنيفات</option>
              {Object.entries(expenseCategories).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">فلتر التاريخ</label>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">جميع التواريخ</option>
              <option value="TODAY">اليوم</option>
              <option value="WEEK">الأسبوع الماضي</option>
              <option value="MONTH">الشهر الماضي</option>
            </select>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm text-gray-600">إجمالي المصروفات المفلترة:</p>
            <p className="text-lg font-semibold text-blue-600">{getTotalExpenses(true).toLocaleString()} ر.س</p>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">سجل المصروفات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التصنيف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوصف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المعدة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الإيصال
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(expense.date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {expenseCategories[expense.category]}
                    </span>
                    {expense.subcategory && (
                      <div className="text-xs text-gray-500 mt-1">{expense.subcategory}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                    {expense.amount.toLocaleString()} ر.س
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getEquipmentName(expense.equipment_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.receipt_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      تعديل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filterCategory !== 'ALL' || filterDateRange !== 'ALL' 
                ? 'لا توجد مصروفات تطابق الفلتر المحدد' 
                : 'لا توجد مصروفات مسجلة'}
            </h3>
            <p className="text-gray-600 mb-4">
              {filterCategory !== 'ALL' || filterDateRange !== 'ALL' 
                ? 'جرب تغيير فلاتر البحث' 
                : 'ابدأ بإضافة أول مصروف'}
            </p>
            {filterCategory === 'ALL' && filterDateRange === 'ALL' && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                إضافة مصروف جديد
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseManagement;