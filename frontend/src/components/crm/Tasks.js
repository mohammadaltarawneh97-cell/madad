import React, { useState, useEffect } from 'react';
import { useApp } from '../MultiCompanyApp';

const Tasks = () => {
  const { apiCall } = useApp();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [newTask, setNewTask] = useState({
    subject: '',
    description: '',
    assigned_to: '',
    related_to_type: '',
    related_to_id: '',
    due_date: '',
    priority: 'normal'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/crm/tasks');
      setTasks(response || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
    setLoading(false);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/crm/tasks', {
        method: 'POST',
        data: newTask
      });
      alert('تم إنشاء المهمة بنجاح');
      setNewTask({
        subject: '',
        description: '',
        assigned_to: '',
        related_to_type: '',
        related_to_id: '',
        due_date: '',
        priority: 'normal'
      });
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      alert('خطأ في إنشاء المهمة: ' + (error.message || 'حدث خطأ'));
    }
  };

  const handleCompleteTask = async (taskId) => {
    const notes = prompt('ملاحظات الإكمال (اختياري):');
    try {
      await apiCall(`/api/crm/tasks/${taskId}/complete${notes ? `?completion_notes=${encodeURIComponent(notes)}` : ''}`, {
        method: 'POST'
      });
      alert('تم إكمال المهمة');
      fetchTasks();
    } catch (error) {
      alert('خطأ في إكمال المهمة: ' + (error.message || 'حدث خطأ'));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      not_started: 'bg-gray-200 text-gray-700',
      in_progress: 'bg-blue-200 text-blue-700',
      completed: 'bg-green-200 text-green-700',
      deferred: 'bg-yellow-200 text-yellow-700',
      cancelled: 'bg-red-200 text-red-700'
    };
    const labels = {
      not_started: 'لم تبدأ',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتملة',
      deferred: 'مؤجلة',
      cancelled: 'ملغاة'
    };
    return <span className={`px-2 py-1 rounded text-sm font-semibold ${badges[status]}`}>{labels[status]}</span>;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'bg-gray-100 text-gray-600',
      normal: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    };
    const labels = { low: 'منخفضة', normal: 'عادية', high: 'عالية', urgent: 'عاجلة' };
    return <span className={`px-2 py-1 rounded text-sm font-semibold ${badges[priority]}`}>{labels[priority]}</span>;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-xl">جاري التحميل...</div></div>;
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة المهام</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          {showForm ? 'إخفاء النموذج' : 'مهمة جديدة'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">مهمة جديدة</h2>
          <form onSubmit={handleCreateTask} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">الموضوع *</label>
              <input type="text" required value={newTask.subject} onChange={(e) => setNewTask({...newTask, subject: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">الوصف</label>
              <textarea value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} className="w-full border rounded px-3 py-2" rows="3" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">معرف المكلف *</label>
              <input type="text" required value={newTask.assigned_to} onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="معرف المستخدم" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ الاستحقاق</label>
              <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({...newTask, due_date: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الأولوية</label>
              <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})} className="w-full border rounded px-3 py-2">
                <option value="low">منخفضة</option>
                <option value="normal">عادية</option>
                <option value="high">عالية</option>
                <option value="urgent">عاجلة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نوع السجل المرتبط</label>
              <select value={newTask.related_to_type} onChange={(e) => setNewTask({...newTask, related_to_type: e.target.value})} className="w-full border rounded px-3 py-2">
                <option value="">-- اختر --</option>
                <option value="lead">عميل محتمل</option>
                <option value="account">حساب</option>
                <option value="contact">جهة اتصال</option>
                <option value="opportunity">فرصة</option>
                <option value="case">حالة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">معرف السجل المرتبط</label>
              <input type="text" value={newTask.related_to_id} onChange={(e) => setNewTask({...newTask, related_to_id: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="معرف السجل" />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">حفظ المهمة</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">المهام</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-right">رقم المهمة</th>
                <th className="px-4 py-2 text-right">الموضوع</th>
                <th className="px-4 py-2 text-right">المكلف</th>
                <th className="px-4 py-2 text-right">تاريخ الاستحقاق</th>
                <th className="px-4 py-2 text-right">الأولوية</th>
                <th className="px-4 py-2 text-right">الحالة</th>
                <th className="px-4 py-2 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{task.task_number}</td>
                  <td className="px-4 py-2">{task.subject}</td>
                  <td className="px-4 py-2">{task.assigned_to_name}</td>
                  <td className="px-4 py-2">{task.due_date ? new Date(task.due_date).toLocaleDateString('ar-EG') : '-'}</td>
                  <td className="px-4 py-2">{getPriorityBadge(task.priority)}</td>
                  <td className="px-4 py-2">{getStatusBadge(task.status)}</td>
                  <td className="px-4 py-2">
                    {task.status !== 'completed' && task.status !== 'cancelled' && (
                      <button onClick={() => handleCompleteTask(task.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">إكمال</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && <p className="text-center py-4 text-gray-500">لا توجد مهام</p>}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
