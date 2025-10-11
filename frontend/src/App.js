import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

// Context for authentication
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios interceptor for auth
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      axios.get(`${API}/me`)
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/login`, { username, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Get user info
      const userResponse = await axios.get(`${API}/me`);
      setUser(userResponse.data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      await axios.post(`${API}/register`, userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Login Component
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    full_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } else {
      const result = await register(formData);
      if (result.success) {
        setIsLogin(true);
        setFormData(prev => ({ ...prev, email: '', full_name: '' }));
        setError('');
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h2>
            <p className="mt-2 text-gray-600">نظام إدارة عمليات خيرات الأرض</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المستخدم
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل اسم المستخدم"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل كلمة المرور"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'جاري التحميل...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ username: '', password: '', email: '', full_name: '' });
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب؟ تسجيل الدخول'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Layout Component
const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', label: 'لوحة التحكم', icon: '📊' },
    { path: '/equipment', label: 'المعدات', icon: '🚛' },
    { path: '/production', label: 'الإنتاج', icon: '⚡' },
    { path: '/expenses', label: 'المصروفات', icon: '💰' },
    { path: '/invoices', label: 'الفواتير', icon: '📄' },
    { path: '/attendance', label: 'الحضور', icon: '👥' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="text-2xl">🏭</div>
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-gray-900">خيرات الأرض</h1>
                <p className="text-sm text-gray-600">نظام إدارة العمليات</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 text-right rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors mb-2"
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div>
                <p className="font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-sm text-gray-600">{user?.username}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 space-x-reverse px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span>🚪</span>
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              ☰
            </button>
            <div className="text-sm text-gray-600">
              مرحباً، {user?.full_name}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Dashboard Stats Component
const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API}/dashboard/stats`);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8">جاري تحميل الإحصائيات...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8 text-red-600">خطأ في تحميل الإحصائيات</div>;
  }

  const StatCard = ({ title, value, icon, color = "blue" }) => (
    <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  const completionRate = stats.production?.avg_completion || 0;
  const totalExpenses = stats.expenses?.reduce((sum, exp) => sum + (exp.total_amount || 0), 0) || 0;
  const totalInvoices = stats.invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
        <p className="text-gray-600">{stats.month} - إحصائيات الشهر الحالي</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="معدل الإنجاز"
          value={`${completionRate.toFixed(1)}%`}
          icon="⚡"
          color="green"
        />
        <StatCard
          title="إجمالي المصروفات"
          value={`${totalExpenses.toLocaleString()} ر.س`}
          icon="💰"
          color="red"
        />
        <StatCard
          title="إجمالي الفواتير"
          value={`${totalInvoices.toLocaleString()} ر.س`}
          icon="📄"
          color="blue"
        />
        <StatCard
          title="عدد المعدات"
          value={stats.equipment_count}
          icon="🚛"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الإنتاج هذا الشهر</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>الكمية الفعلية</span>
                <span>{(stats.production?.total_actual || 0).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>الكمية المتعاقد عليها</span>
                <span>{(stats.production?.total_contract || 0).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع المصروفات</h3>
          <div className="space-y-3">
            {stats.expenses?.map((expense, index) => (
              <div key={expense._id} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{expense._id}</span>
                <span className="font-semibold">{expense.total_amount.toLocaleString()} ر.س</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Equipment Management Component
const EquipmentManagement = () => {
  const [equipment, setEquipment] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    type: 'DT',
    model: '',
    serial_number: '',
    hours_operated: 0,
    maintenance_notes: ''
  });

  const equipmentTypes = {
    'DT': 'شاحنة قلاب',
    'PC': 'حفارة',
    'WL': 'محمل',
    'GR': 'جريدر',
    'RL': 'رولر',
    'PLANT': 'معدات المصنع'
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await axios.get(`${API}/equipment`);
      setEquipment(response.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/equipment`, formData);
      setShowForm(false);
      setFormData({
        name: '',
        type: 'DT',
        model: '',
        serial_number: '',
        hours_operated: 0,
        maintenance_notes: ''
      });
      fetchEquipment();
    } catch (error) {
      console.error('Error creating equipment:', error);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  if (loading) {
    return <div className="text-center py-8">جاري تحميل المعدات...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">إدارة المعدات</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          {showForm ? 'إلغاء' : '+ إضافة معدة جديدة'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">إضافة معدة جديدة</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم المعدة</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل اسم المعدة"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع المعدة</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(equipmentTypes).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الموديل</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل موديل المعدة"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الرقم التسلسلي</label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل الرقم التسلسلي (اختياري)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ساعات التشغيل</label>
              <input
                type="number"
                name="hours_operated"
                value={formData.hours_operated}
                onChange={handleChange}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الصيانة</label>
              <textarea
                name="maintenance_notes"
                value={formData.maintenance_notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل ملاحظات الصيانة (اختياري)"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                حفظ المعدة
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">{equipmentTypes[item.type]}</p>
              </div>
              <div className="text-3xl">
                {item.type === 'DT' ? '🚛' : item.type === 'PC' ? '🏗️' : item.type === 'WL' ? '🚜' : 
                 item.type === 'GR' ? '🛤️' : item.type === 'RL' ? '🏗️' : '🏭'}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">الموديل:</span>
                <span className="font-medium">{item.model}</span>
              </div>
              {item.serial_number && (
                <div className="flex justify-between">
                  <span className="text-gray-600">الرقم التسلسلي:</span>
                  <span className="font-medium">{item.serial_number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">ساعات التشغيل:</span>
                <span className="font-medium">{item.hours_operated} ساعة</span>
              </div>
            </div>
            {item.maintenance_notes && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>ملاحظات الصيانة:</strong> {item.maintenance_notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {equipment.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚛</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد معدات مضافة</h3>
          <p className="text-gray-600 mb-4">ابدأ بإضافة أول معدة إلى النظام</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            إضافة معدة جديدة
          </button>
        </div>
      )}
    </div>
  );
};

// Import comprehensive management components
import ProductionManagement from './components/ProductionManagement';
import ExpenseManagement from './components/ExpenseManagement';
import InvoiceManagement from './components/InvoiceManagement';
import AttendanceManagement from './components/AttendanceManagement';

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardStats />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/equipment" element={
            <ProtectedRoute>
              <DashboardLayout>
                <EquipmentManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/production" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProductionManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ExpenseManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute>
              <DashboardLayout>
                <InvoiceManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={
            <ProtectedRoute>
              <DashboardLayout>
                <AttendanceManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;