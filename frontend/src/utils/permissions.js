// Role-based permissions utility
export const UserRole = {
  SUPERADMIN: 'superadmin',
  OWNER: 'owner',
  MANAGER: 'manager',
  ACCOUNTANT: 'accountant',
  FOREMAN: 'foreman',
  DRIVER: 'driver',
  GUARD: 'guard',
};

// Role display names in Arabic
export const RoleDisplayNames = {
  [UserRole.SUPERADMIN]: 'مسؤول النظام',
  [UserRole.OWNER]: 'المالك',
  [UserRole.MANAGER]: 'مدير',
  [UserRole.ACCOUNTANT]: 'محاسب',
  [UserRole.FOREMAN]: 'مشرف',
  [UserRole.DRIVER]: 'سائق',
  [UserRole.GUARD]: 'حارس',
};

// Navigation items based on role
export const getNavItemsForRole = (role, permissions = {}) => {
  const allNavItems = [
    {
      name: 'لوحة التحكم',
      path: '/dashboard',
      icon: '📊',
      resource: 'dashboard',
      action: 'read',
    },
    {
      name: 'المعدات',
      path: '/equipment',
      icon: '🚜',
      resource: 'equipment',
      action: 'read',
    },
    {
      name: 'الإنتاج',
      path: '/production',
      icon: '📈',
      resource: 'production',
      action: 'read',
    },
    {
      name: 'المصروفات',
      path: '/expenses',
      icon: '💰',
      resource: 'expenses',
      action: 'read',
    },
    {
      name: 'الفواتير',
      path: '/invoices',
      icon: '📄',
      resource: 'invoices',
      action: 'read',
    },
    {
      name: 'الحضور',
      path: '/attendance',
      icon: '👥',
      resource: 'attendance',
      action: 'read',
    },
    {
      name: 'المستخدمون',
      path: '/users',
      icon: '👤',
      resource: 'users',
      action: 'read',
      adminOnly: true,
    },
  ];

  // Filter based on permissions
  return allNavItems.filter(item => {
    // Check if user has permission for this resource
    const resourcePermissions = permissions[item.resource] || [];
    return resourcePermissions.includes(item.action);
  });
};

// Check if user can perform an action on a resource
export const hasPermission = (permissions, resource, action) => {
  const resourcePermissions = permissions[resource] || [];
  return resourcePermissions.includes(action);
};

// Get role badge color
export const getRoleBadgeColor = (role) => {
  const colors = {
    [UserRole.SUPERADMIN]: 'bg-purple-100 text-purple-800 border-purple-300',
    [UserRole.OWNER]: 'bg-blue-100 text-blue-800 border-blue-300',
    [UserRole.MANAGER]: 'bg-green-100 text-green-800 border-green-300',
    [UserRole.ACCOUNTANT]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [UserRole.FOREMAN]: 'bg-orange-100 text-orange-800 border-orange-300',
    [UserRole.DRIVER]: 'bg-gray-100 text-gray-800 border-gray-300',
    [UserRole.GUARD]: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  };
  return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300';
};

// Dashboard widgets based on role
export const getDashboardWidgetsForRole = (role, permissions = {}) => {
  const allWidgets = [
    {
      id: 'production',
      title: 'الإنتاج',
      resource: 'production',
      action: 'read',
    },
    {
      id: 'equipment',
      title: 'المعدات',
      resource: 'equipment',
      action: 'read',
    },
    {
      id: 'expenses',
      title: 'المصروفات',
      resource: 'expenses',
      action: 'read',
    },
    {
      id: 'invoices',
      title: 'الفواتير',
      resource: 'invoices',
      action: 'read',
    },
    {
      id: 'attendance',
      title: 'الحضور',
      resource: 'attendance',
      action: 'read',
    },
  ];

  return allWidgets.filter(widget => {
    const resourcePermissions = permissions[widget.resource] || [];
    return resourcePermissions.includes(widget.action);
  });
};
