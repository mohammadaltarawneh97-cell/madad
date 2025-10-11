import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    type: 'SCREENING',
    client_name: '',
    amount: 0,
    quantity: 0,
    unit_price: 0,
    status: 'PENDING',
    notes: ''
  });

  const invoiceTypes = {
    'SCREENING': 'غربلة',
    'FEEDING': 'تغذية',
    'CRUSHING': 'كسارة',
    'HAULING': 'نقل'
  };

  const invoiceStatuses = {
    'PENDING': 'معلقة',
    'PAID': 'مدفوعة',
    'CANCELLED': 'ملغاة'
  };

  const statusColors = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'PAID': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API}/invoices`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        amount: parseFloat(formData.amount),
        quantity: parseFloat(formData.quantity) || null,
        unit_price: parseFloat(formData.unit_price) || null
      };

      if (editingId) {
        await axios.put(`${API}/invoices/${editingId}`, submitData);
      } else {
        await axios.post(`${API}/invoices`, submitData);
      }

      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      invoice_number: '',
      type: 'SCREENING',
      client_name: '',
      amount: 0,
      quantity: 0,
      unit_price: 0,
      status: 'PENDING',
      notes: ''
    });
  };

  const handleEdit = (invoice) => {
    setFormData({
      date: new Date(invoice.date).toISOString().split('T')[0],
      invoice_number: invoice.invoice_number,
      type: invoice.type,
      client_name: invoice.client_name,
      amount: invoice.amount,
      quantity: invoice.quantity || 0,
      unit_price: invoice.unit_price || 0,
      status: invoice.status,
      notes: invoice.notes || ''
    });
    setEditingId(invoice.id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate amount when quantity or unit_price changes
      if (name === 'quantity' || name === 'unit_price') {
        const qty = parseFloat(name === 'quantity' ? value : updated.quantity) || 0;
        const price = parseFloat(name === 'unit_price' ? value : updated.unit_price) || 0;
        updated.amount = qty * price;
      }
      
      return updated;
    });
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  const getFilteredInvoices = () => {
    let filtered = invoices;

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(invoice => invoice.status === filterStatus);
    }

    if (filterType !== 'ALL') {
      filtered = filtered.filter(invoice => invoice.type === filterType);
    }

    return filtered;
  };

  const getTotalByStatus = (status) => {
    return invoices
      .filter(invoice => status === 'ALL' ? true : invoice.status === status)
      .reduce((sum, invoice) => sum + invoice.amount, 0);
  };

  const getInvoicesByType = () => {
    const typeTotals = {};
    invoices.forEach(invoice => {
      typeTotals[invoice.type] = (typeTotals[invoice.type] || 0) + invoice.amount;
    });
    return typeTotals;
  };

  if (loading) {
    return <div className="text-center py-8">جاري تحميل بيانات الفواتير...</div>;
  }

  const filteredInvoices = getFilteredInvoices();
  const typeTotals = getInvoicesByType();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">إدارة الفواتير</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          {showForm ? 'إلغاء' : '+ إضافة فاتورة جديدة'}
        </button>
      </div>

      {/* Invoice Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">إجمالي الفواتير</p>
              <p className="text-3xl font-bold text-gray-900">{getTotalByStatus('ALL').toLocaleString()} ر.س</p>
            </div>
            <div className="text-4xl">📄</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">فواتير مدفوعة</p>
              <p className="text-3xl font-bold text-green-600">{getTotalByStatus('PAID').toLocaleString()} ر.س</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">فواتير معلقة</p>
              <p className="text-3xl font-bold text-yellow-600">{getTotalByStatus('PENDING').toLocaleArray()} ر.س</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">عدد الفواتير</p>
              <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
            </div>
            <div className="text-4xl">🔢</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'تعديل الفاتورة' : 'إضافة فاتورة جديدة'}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">رقم الفاتورة</label>
              <div className="flex">
                <input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleChange}
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل رقم الفاتورة"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, invoice_number: generateInvoiceNumber() }))}
                  className="bg-gray-100 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 text-sm"
                >
                  توليد
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع النشاط</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(invoiceTypes).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم العميل</label>
              <input
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل اسم العميل"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الكمية (اختياري)</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="الكمية"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">سعر الوحدة (اختياري)</label>
              <input
                type="number"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="سعر الوحدة"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ الإجمالي (ريال سعودي)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="المبلغ الإجمالي"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">حالة الفاتورة</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(invoiceStatuses).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
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
                {editingId ? 'تحديث الفاتورة' : 'حفظ الفاتورة'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">فلتر الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">جميع الحالات</option>
              {Object.entries(invoiceStatuses).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">فلتر النوع</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">جميع الأنواع</option>
              {Object.entries(invoiceTypes).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm text-gray-600">إجمالي الفواتير المفلترة:</p>
            <p className="text-lg font-semibold text-blue-600">
              {filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()} ر.س
            </p>
          </div>
        </div>
      </div>

      {/* Revenue by Type Chart */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">الإيرادات حسب نوع النشاط</h3>
        <div className="space-y-3">
          {Object.entries(typeTotals).map(([type, amount]) => (
            <div key={type} className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">{invoiceTypes[type]}</span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm font-semibold">{amount.toLocaleString()} ر.س</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(amount / Math.max(...Object.values(typeTotals))) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">سجل الفواتير</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الفاتورة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العميل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(invoice.date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoiceTypes[invoice.type]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {invoice.amount.toLocaleString()} ر.س
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}>
                      {invoiceStatuses[invoice.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(invoice)}
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
        
        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filterStatus !== 'ALL' || filterType !== 'ALL' 
                ? 'لا توجد فواتير تطابق الفلتر المحدد' 
                : 'لا توجد فواتير مسجلة'}
            </h3>
            <p className="text-gray-600 mb-4">
              {filterStatus !== 'ALL' || filterType !== 'ALL' 
                ? 'جرب تغيير فلاتر البحث' 
                : 'ابدأ بإضافة أول فاتورة'}
            </p>
            {filterStatus === 'ALL' && filterType === 'ALL' && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                إضافة فاتورة جديدة
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceManagement;