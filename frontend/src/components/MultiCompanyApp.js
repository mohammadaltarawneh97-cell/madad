import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

// Context for authentication and company management
const AppContext = createContext();

// Role display names in Arabic
const RoleDisplayNames = {
  'superadmin': 'مدير النظام',
  'owner': 'المالك',
  'manager': 'مدير',
  'accountant': 'محاسب',
  'foreman': 'مشرف',
  'driver': 'سائق',
  'guard': 'حارس',
};

// Get role badge color
const getRoleBadgeColor = (role) => {
  const colors = {
    'superadmin': 'bg-purple-100 text-purple-800 border-purple-300',
    'owner': 'bg-blue-100 text-blue-800 border-blue-300',
    'manager': 'bg-green-100 text-green-800 border-green-300',
    'accountant': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'foreman': 'bg-orange-100 text-orange-800 border-orange-300',
    'driver': 'bg-gray-100 text-gray-800 border-gray-300',
    'guard': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  };
  return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300';
};

// Get role display name
const getRoleDisplayName = (role) => {
  return RoleDisplayNames[role] || role;
};

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
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

// App Provider Component (handles multi-company state)
const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`${API}/me`);
      setUser(response.data.user);
      setCurrentCompany(response.data.company);
      setPermissions(response.data.permissions || {});
      setUserRole(response.data.role);
      
      // Fetch available companies
      const companiesResponse = await axios.get(`${API}/companies`);
      setCompanies(companiesResponse.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/login`, { username, password });
      const { access_token, user: userData, company } = response.data;
      
      localStorage.setItem('token', access_token);
      setUser(userData);
      setCurrentCompany(company);
      
      // Fetch user permissions
      const meResponse = await axios.get(`${API}/me`);
      setPermissions(meResponse.data.permissions || {});
      setUserRole(meResponse.data.role);
      
      // Fetch available companies
      const companiesResponse = await axios.get(`${API}/companies`);
      setCompanies(companiesResponse.data);
      
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

  const switchCompany = async (companyId) => {
    try {
      const response = await axios.post(`${API}/switch-company`, { company_id: companyId });
      const { access_token, company } = response.data;
      
      localStorage.setItem('token', access_token);
      setCurrentCompany(company);
      
      // Re-fetch permissions after switching
      const meResponse = await axios.get(`${API}/me`);
      setPermissions(meResponse.data.permissions || {});
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to switch company' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentCompany(null);
    setCompanies([]);
    setPermissions({});
    setUserRole(null);
  };

  const value = {
    user,
    currentCompany,
    companies,
    permissions,
    userRole,
    login,
    register,
    logout,
    switchCompany,
    loading,
    refreshUserInfo: fetchUserInfo
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Company Selection Component
const CompanySelector = () => {
  const { currentCompany, companies, switchCompany } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleCompanySwitch = async (companyId) => {
    if (companyId === currentCompany?.id) return;
    
    setSwitching(true);
    const result = await switchCompany(companyId);
    if (result.success) {
      window.location.reload(); // Refresh to update all data
    } else {
      alert('فشل في تغيير الشركة: ' + result.error);
    }
    setSwitching(false);
    setShowDropdown(false);
  };

  if (!currentCompany || companies.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
        disabled={switching}
      >
        <div className="text-right">
          <div className="font-semibold text-gray-900">{currentCompany.name}</div>
          <div className="text-xs text-gray-500">انقر للتغيير</div>
        </div>
        <div className="text-xl">{switching ? '⏳' : '🏢'}</div>
      </button>
      
      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-sm font-medium text-gray-700 mb-2 px-3 py-2">اختر الشركة:</div>
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanySwitch(company.id)}
                className={`w-full text-right px-3 py-2 rounded hover:bg-gray-100 transition-colors ${
                  company.id === currentCompany.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{company.name}</div>
                    {company.name_en && (
                      <div className="text-xs text-gray-500">{company.name_en}</div>
                    )}
                  </div>
                  {company.id === currentCompany.id && (
                    <div className="text-blue-600">✓</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Login Component (Enhanced for multi-company)
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
    company_id: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, companies } = useApp();
  const navigate = useNavigate();

  // Fetch companies for registration
  useEffect(() => {
    if (!isLogin) {
      fetchPublicCompanies();
    }
  }, [isLogin]);

  const fetchPublicCompanies = async () => {
    try {
      // This would be a public endpoint for company selection during registration
      // For now, we'll use the regular companies endpoint
      const response = await axios.get(`${API}/companies`);
      // setPublicCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

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
        setFormData(prev => ({ ...prev, email: '', full_name: '', company_id: '' }));
        setError('');
        alert('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
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
            <div className="text-4xl mb-4">🏭</div>
            <h2 className="text-3xl font-bold text-gray-900">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h2>
            <p className="mt-2 text-gray-600">منصة إدارة عمليات المحاجر والإنشاءات</p>
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
                setFormData({ username: '', password: '', email: '', full_name: '', company_id: '' });
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب؟ تسجيل الدخول'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              منصة متعددة الشركات لإدارة العمليات
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Dashboard Layout with Company Context
const DashboardLayout = ({ children }) => {
  const { user, currentCompany, companies, permissions, userRole, logout, switchCompany } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCompanySwitcher, setShowCompanySwitcher] = useState(false);
  const navigate = useNavigate();

  // Close company switcher when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCompanySwitcher && !event.target.closest('.company-switcher-container')) {
        setShowCompanySwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCompanySwitcher]);

  // Define all menu items with their required permissions
  const allMenuItems = [
    { path: '/dashboard', label: 'لوحة التحكم', icon: '📊', resource: 'dashboard', action: 'read' },
    { path: '/org-chart', label: 'الهيكل التنظيمي', icon: '🏛️', resource: 'org_chart', action: 'read' },
    { path: '/projects', label: 'المشاريع', icon: '🏗️', resource: 'projects', action: 'read' },
    { path: '/feasibility-studies', label: 'دراسات الجدوى', icon: '📋', resource: 'feasibility_studies', action: 'read' },
    { path: '/investments', label: 'الاستثمارات', icon: '💼', resource: 'investments', action: 'read' },
    { path: '/financial-projections', label: 'التوقعات المالية', icon: '📈', resource: 'financial_projections', action: 'read' },
    { path: '/accounting', label: 'المحاسبة', icon: '🧮', resource: 'chart_of_accounts', action: 'read' },
    { path: '/equipment', label: 'المعدات', icon: '🚛', resource: 'equipment', action: 'read' },
    { path: '/production', label: 'الإنتاج', icon: '⚡', resource: 'production', action: 'read' },
    { path: '/expenses', label: 'المصروفات', icon: '💰', resource: 'expenses', action: 'read' },
    { path: '/invoices', label: 'الفواتير', icon: '📄', resource: 'invoices', action: 'read' },
    { path: '/attendance', label: 'الحضور', icon: '👥', resource: 'attendance', action: 'read' },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    const resourcePermissions = permissions[item.resource] || [];
    return resourcePermissions.includes(item.action);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchCompany = async (companyId) => {
    const result = await switchCompany(companyId);
    if (result.success) {
      setShowCompanySwitcher(false);
      window.location.reload(); // Refresh to load new company data
    } else {
      alert(result.error || 'Failed to switch company');
    }
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
                <h1 className="text-xl font-bold text-gray-900">
                  {currentCompany ? currentCompany.name : 'منصة المحاجر'}
                </h1>
                <p className="text-sm text-gray-600">نظام إدارة العمليات</p>
              </div>
            )}
          </div>
        </div>

        {/* Company Selector */}
        {sidebarOpen && currentCompany && (
          <div className="p-4 border-b">
            <CompanySelector />
          </div>
        )}

        <nav className="flex-1 p-4">
          {menuItems.map((item) => {
            // Hide admin-only items for non-admins
            if (item.adminOnly && !user?.is_super_admin && !user?.is_company_admin) {
              return null;
            }
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 text-right rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors mb-2"
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-sm text-gray-600">{user?.username}</p>
                {userRole && (
                  <span className={`inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(userRole)}`}>
                    {getRoleDisplayName(userRole)}
                  </span>
                )}
              </div>
            )}
          </div>
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
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  مرحباً، {user?.full_name}
                </div>
                {currentCompany && (
                  <div className="text-xs text-gray-500">
                    {currentCompany.name}
                  </div>
                )}
              </div>
              
              {/* Company Switcher - Only show if user has multiple companies */}
              {companies && companies.length > 1 && (
                <div className="relative company-switcher-container">
                  <button
                    onClick={() => setShowCompanySwitcher(!showCompanySwitcher)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    title="تغيير الشركة"
                  >
                    <span>🏢</span>
                    <span className="text-sm font-medium">تغيير الشركة</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showCompanySwitcher && (
                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-700">اختر الشركة</p>
                      </div>
                      <div className="py-2">
                        {companies.map((company) => (
                          <button
                            key={company.id}
                            onClick={() => handleSwitchCompany(company.id)}
                            className={`w-full text-right px-4 py-3 hover:bg-blue-50 transition-colors ${
                              currentCompany?.id === company.id ? 'bg-blue-100 border-r-4 border-blue-600' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {company.name}
                                </p>
                                {company.name_en && (
                                  <p className="text-xs text-gray-600">{company.name_en}</p>
                                )}
                                {company.city && (
                                  <p className="text-xs text-gray-500 mt-1">📍 {company.city}</p>
                                )}
                              </div>
                              {currentCompany?.id === company.id && (
                                <span className="text-green-600 text-lg">✓</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                title="تسجيل الخروج"
              >
                <span>🚪</span>
                <span className="text-sm font-medium">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {currentCompany ? children : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد شركة محددة</h3>
              <p className="text-gray-600">يرجى اختيار شركة أو الاتصال بمدير النظام</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Simple placeholder for company management
const CompanyManagement = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🏢</div>
    <h2 className="text-2xl font-semibold text-gray-900 mb-2">إدارة الشركات</h2>
    <p className="text-gray-600">ستتم إضافة إدارة الشركات قريباً</p>
  </div>
);

export { AppProvider, ProtectedRoute, DashboardLayout, Login, CompanyManagement, useApp };