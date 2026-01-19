import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  CreditCard,
  Package,
  Tags,
  Building2,
  TrendingUp,
  UserCog,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  Landmark,
  FileText,
  ClipboardList,
  ScrollText,
  Shield,
  History,
  Bell, // New
  Check // New
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import ThemeToggle from '../common/ThemeSelector';
import { getNotifications, markAsRead } from '../../services/notificationService';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({
    masterData: true,
    transaksi: true,
    laporan: false,
    manajemen: false,
    logs: false
  });

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotif, setLoadingNotif] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Auto-expand group based on current route
  const pathToGroup = {
    '/students': 'masterData', '/products': 'masterData', '/categories': 'masterData', '/suppliers': 'masterData', '/item-bundles': 'masterData',
    '/pos': 'transaksi', '/transactions': 'transaksi', '/liabilities': 'transaksi',
    '/reports': 'laporan',
    '/payment-methods': 'manajemen', '/stock-opname': 'manajemen', '/users': 'manajemen', '/settings': 'manajemen',
    '/audit/logs': 'logs', '/audit/login-history': 'logs', '/audit/security': 'logs'
  };

  // Keep group expanded when on its route
  useEffect(() => {
    const groupId = pathToGroup[location.pathname];
    if (groupId) {
      setExpandedGroups(prev => ({ ...prev, [groupId]: true }));
    }
  }, [location.pathname]);

  // Load Notifications
  const loadNotifications = async () => {
    try {
      const data = await getNotifications(5); // Get latest 5
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
      loadNotifications(); // Refresh
    }
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAsRead('all');
    loadNotifications();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const menuGroups = [
    {
      id: 'dashboard',
      type: 'single',
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      permission: null
    },
    {
      id: 'masterData',
      type: 'group',
      label: 'Master Data',
      icon: Package,
      items: [
        { path: '/students', icon: Users, label: 'Santri', permission: 'manage_students' },
        { path: '/billing-templates', icon: FileText, label: 'Tagihan', permission: 'manage_liabilities' },
        { path: '/item-bundles', icon: Package, label: 'Paket Barang', permission: 'manage_products' },
        { path: '/products', icon: Package, label: 'Produk', permission: 'manage_products' },
        { path: '/categories', icon: Tags, label: 'Kategori', permission: 'manage_products' },
        { path: '/suppliers', icon: Building2, label: 'Supplier', permission: 'manage_products' },
      ]
    },
    {
      id: 'transaksi',
      type: 'group',
      label: 'Transaksi',
      icon: ShoppingCart,
      items: [
        { path: '/pos', icon: ShoppingCart, label: 'Point of Sales', permission: 'manage_pos' },
        { path: '/transactions', icon: FileText, label: 'Riwayat Transaksi', permission: 'view_transactions' },
        { path: '/liabilities', icon: CreditCard, label: 'Tanggungan', permission: 'manage_liabilities' },
      ]
    },
    {
      id: 'laporan',
      type: 'group',
      label: 'Laporan',
      icon: TrendingUp,
      items: [
        { path: '/reports', icon: TrendingUp, label: 'Laporan', permission: 'view_reports' },
      ]
    },
    {
      id: 'manajemen',
      type: 'group',
      label: 'Manajemen',
      icon: Settings,
      items: [
        { path: '/payment-methods', icon: Landmark, label: 'Metode Bayar', permission: 'manage_pos' },
        { path: '/stock-opname', icon: ClipboardList, label: 'Stock Opname', permission: 'manage_products' },
        { path: '/users', icon: UserCog, label: 'Pengguna', permission: 'manage_users' },
        { path: '/settings', icon: Settings, label: 'Pengaturan', permission: 'manage_settings' },
      ]
    },
    {
      id: 'logs',
      type: 'group',
      label: 'Logs & Audit',
      icon: ScrollText,
      adminOnly: true, // Only visible to admin role
      items: [
        { path: '/audit/logs', icon: ScrollText, label: 'Audit Logs', permission: 'manage_settings' },
        { path: '/audit/login-history', icon: History, label: 'Login History', permission: 'manage_settings' },
        { path: '/audit/security', icon: Shield, label: 'Security Logs', permission: 'manage_settings' },
      ]
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col shadow-sm relative z-20`}
      >
        {/* Logo/Brand */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">Koperasi</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">POS System</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {menuGroups
            .filter(group => !group.adminOnly || user?.role === 'admin')
            .map((group) => {
              if (group.type === 'single') {
                const Icon = group.icon;
                return (
                  <Link
                    key={group.id}
                    to={group.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive(group.path)
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span className="font-medium truncate">{group.label}</span>}
                  </Link>
                );
              }

              // Group menu
              const GroupIcon = group.icon;
              const isExpanded = expandedGroups[group.id];

              return (
                <div key={group.id} className="space-y-1">
                  {/* Group Header */}
                  <button
                    onClick={() => sidebarOpen && toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <GroupIcon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && <span className="font-semibold text-sm tracking-wide">{group.label}</span>}
                    </div>
                    {sidebarOpen && (
                      isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Group Items */}
                  {sidebarOpen && isExpanded && (
                    <div className="ml-2 space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive(item.path)
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                              : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                              }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="m-4 p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2).replace('-', ' ')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifikasi</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Tandai semua dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                              <div>
                                <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          Tidak ada notifikasi baru
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Lihat Semua
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.fullName}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}