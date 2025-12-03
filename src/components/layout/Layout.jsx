import { useState } from 'react';
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
  LogOut,
  Landmark
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'view_dashboard' },
    { path: '/pos', icon: ShoppingCart, label: 'Kasir', permission: 'manage_pos' },
    { path: '/transactions', icon: Package, label: 'Transaksi', permission: 'manage_pos' },
    { path: '/students', icon: Users, label: 'Santri', permission: 'manage_students' },
    { path: '/liabilities', icon: CreditCard, label: 'Tanggungan', permission: 'manage_students' },
    { path: '/products', icon: Package, label: 'Produk', permission: 'manage_products' },
    { path: '/categories', icon: Tags, label: 'Kategori', permission: 'manage_products' },
    { path: '/suppliers', icon: Building2, label: 'Supplier', permission: 'manage_products' },
    { path: '/reports', icon: TrendingUp, label: 'Laporan', permission: 'manage_reports' },
    { path: '/payment-methods', icon: Landmark, label: 'Metode Bayar', permission: 'manage_pos' },
    { path: '/users', icon: UserCog, label: 'Pengguna', permission: 'manage_users' },
    { path: '/settings', icon: Settings, label: 'Pengaturan', permission: 'manage_settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-blue-600 to-blue-800 text-white transition-all duration-300 flex flex-col shadow-2xl relative z-20`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-6 h-6" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold truncate">Koperasi</h1>
                <p className="text-xs text-blue-200 truncate">POS System</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 [scrollbar-width:none] [-ms-overflow-style:none]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'hover:bg-white/10 text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="m-4 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}