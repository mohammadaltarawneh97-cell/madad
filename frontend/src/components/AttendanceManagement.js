import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AttendanceManagement = () => {
  const [attendance, setAttendance] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [formData, setFormData] = useState({
    employee_name: '',
    date: new Date().toISOString().split('T')[0],
    check_in: '',
    check_out: '',
    hours_worked: 0,
    overtime_hours: 0,
    notes: ''
  });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await axios.get(`${API}/attendance`);
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    
    const start = new Date(`${formData.date}T${checkIn}`);
    const end = new Date(`${formData.date}T${checkOut}`);
    
    if (end <= start) return 0;
    
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 10) / 10; // Round to 1 decimal place
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        check_in: formData.check_in ? new Date(`${formData.date}T${formData.check_in}`).toISOString() : null,
        check_out: formData.check_out ? new Date(`${formData.date}T${formData.check_out}`).toISOString() : null,
        hours_worked: parseFloat(formData.hours_worked) || 0,
        overtime_hours: parseFloat(formData.overtime_hours) || 0
      };

      if (editingId) {
        await axios.put(`${API}/attendance/${editingId}`, submitData);
      } else {
        await axios.post(`${API}/attendance`, submitData);
      }

      resetForm();
      fetchAttendance();
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      employee_name: '',
      date: new Date().toISOString().split('T')[0],
      check_in: '',
      check_out: '',
      hours_worked: 0,
      overtime_hours: 0,
      notes: ''
    });
  };

  const handleEdit = (record) => {
    setFormData({
      employee_name: record.employee_name,
      date: new Date(record.date).toISOString().split('T')[0],
      check_in: record.check_in ? new Date(record.check_in).toTimeString().slice(0, 5) : '',
      check_out: record.check_out ? new Date(record.check_out).toTimeString().slice(0, 5) : '',
      hours_worked: record.hours_worked || 0,
      overtime_hours: record.overtime_hours || 0,
      notes: record.notes || ''
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate hours when check_in or check_out changes
      if (name === 'check_in' || name === 'check_out') {
        const hours = calculateHours(
          name === 'check_in' ? value : updated.check_in,
          name === 'check_out' ? value : updated.check_out
        );
        
        // Standard work day is 8 hours, anything beyond is overtime
        const standardHours = Math.min(hours, 8);
        const overtimeHours = Math.max(hours - 8, 0);
        
        updated.hours_worked = standardHours;
        updated.overtime_hours = overtimeHours;
      }
      
      return updated;
    });
  };

  const getFilteredAttendance = () => {
    let filtered = attendance;

    if (filterDate) {
      filtered = filtered.filter(record => 
        new Date(record.date).toISOString().split('T')[0] === filterDate
      );
    }

    if (filterEmployee) {
      filtered = filtered.filter(record => 
        record.employee_name.toLowerCase().includes(filterEmployee.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getUniqueEmployees = () => {
    const employees = [...new Set(attendance.map(record => record.employee_name))];
    return employees.sort();
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.filter(record => 
      new Date(record.date).toISOString().split('T')[0] === today
    );
  };

  const getTotalHoursToday = () => {
    return getTodayAttendance().reduce((sum, record) => 
      sum + (record.hours_worked || 0) + (record.overtime_hours || 0), 0
    );
  };

  const getTotalOvertimeThisWeek = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return attendance
      .filter(record => new Date(record.date) >= weekAgo)
      .reduce((sum, record) => sum + (record.overtime_hours || 0), 0);
  };

  if (loading) {
    return <div className="text-center py-8">جاري تحميل بيانات الحضور...</div>;
  }

  const filteredAttendance = getFilteredAttendance();
  const uniqueEmployees = getUniqueEmployees();
  const todayAttendance = getTodayAttendance();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">إدارة الحضور</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          {showForm ? 'إلغاء' : '+ إضافة سجل حضور'}
        </button>
      </div>

      {/* Attendance Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">الحاضرون اليوم</p>
              <p className="text-3xl font-bold text-gray-900">{todayAttendance.length}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">ساعات العمل اليوم</p>
              <p className="text-3xl font-bold text-gray-900">{getTotalHoursToday().toFixed(1)}</p>
            </div>
            <div className="text-4xl">⏰</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">ساعات إضافية (أسبوع)</p>
              <p className="text-3xl font-bold text-gray-900">{getTotalOvertimeThisWeek().toFixed(1)}</p>
            </div>
            <div className="text-4xl">⏱️</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">عدد الموظفين</p>
              <p className="text-3xl font-bold text-gray-900">{uniqueEmployees.length}</p>
            </div>
            <div className="text-4xl">👤</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'تعديل سجل الحضور' : 'إضافة سجل حضور جديد'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم الموظف</label>
              <input
                type="text"
                name="employee_name"
                value={formData.employee_name}
                onChange={handleChange}
                required
                list="employees"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل اسم الموظف"
              />
              <datalist id="employees">
                {uniqueEmployees.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">وقت الحضور</label>
              <input
                type="time"
                name="check_in"
                value={formData.check_in}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">وقت الانصراف</label>
              <input
                type="time"
                name="check_out"
                value={formData.check_out}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ساعات العمل</label>
              <input
                type="number"
                name="hours_worked"
                value={formData.hours_worked}
                onChange={handleChange}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="ساعات العمل العادية"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الساعات الإضافية</label>
              <input
                type="number"
                name="overtime_hours"
                value={formData.overtime_hours}
                onChange={handleChange}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="الساعات الإضافية"
              />
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
                {editingId ? 'تحديث السجل' : 'حفظ السجل'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">فلتر التاريخ</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">فلتر الموظف</label>
            <input
              type="text"
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              placeholder="ابحث عن موظف"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm text-gray-600">عدد السجلات المفلترة:</p>
            <p className="text-lg font-semibold text-blue-600">{filteredAttendance.length}</p>
          </div>
          <button
            onClick={() => {
              setFilterDate('');
              setFilterEmployee('');
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">سجل الحضور والانصراف</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم الموظف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وقت الحضور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وقت الانصراف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ساعات العمل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ساعات إضافية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAttendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.employee_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.check_in ? new Date(record.check_in).toLocaleTimeString('ar-SA', { 
                      hour: '2-digit', minute: '2-digit' 
                    }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.check_out ? new Date(record.check_out).toLocaleTimeString('ar-SA', { 
                      hour: '2-digit', minute: '2-digit' 
                    }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.hours_worked || 0} ساعة
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                    {record.overtime_hours || 0} ساعة
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(record)}
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
        
        {filteredAttendance.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filterDate || filterEmployee 
                ? 'لا توجد سجلات تطابق الفلتر المحدد' 
                : 'لا توجد سجلات حضور'}
            </h3>
            <p className="text-gray-600 mb-4">
              {filterDate || filterEmployee 
                ? 'جرب تغيير فلاتر البحث' 
                : 'ابدأ بإضافة أول سجل حضور'}
            </p>
            {!filterDate && !filterEmployee && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                إضافة سجل حضور جديد
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceManagement;