import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, Calendar, Store, BarChart, ArrowRight } from 'lucide-react';
import Layout from '../components/layout/Layout';
import db from '../config/database';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTransactions: 0,
    totalStudents: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's transactions
      const transactions = await db.transactions
        .where('transactionDate')
        .above(today)
        .toArray();

      const todaySales = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const todayTransactions = transactions.length;

      // Get total students
      const totalStudents = await db.students.count();

      // Get total products
      const totalProducts = await db.products.count();

      setStats({
        todaySales,
        todayTransactions,
        totalStudents,
        totalProducts,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Penjualan Hari Ini',
      value: formatCurrency(stats.todaySales),
      icon: DollarSign,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
    },
    {
      title: 'Transaksi',
      value: stats.todayTransactions,
      icon: ShoppingCart,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-700',
    },
    {
      title: 'Total Santri',
      value: stats.totalStudents,
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-700',
    },
    {
      title: 'Produk',
      value: stats.totalProducts,
      icon: Package,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-700',
    },
  ];

  const quickActions = [
    {
      title: 'Point of Sales',
      description: 'Kasir & transaksi penjualan',
      icon: ShoppingCart,
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      iconColor: 'text-blue-600',
      path: '/pos',
    },
    {
      title: 'Data Santri',
      description: 'Kelola data santri',
      icon: Users,
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      iconColor: 'text-green-600',
      path: '/students',
    },
    {
      title: 'Data Produk',
      description: 'Kelola produk & stok',
      icon: Package,
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      iconColor: 'text-purple-600',
      path: '/products',
    },
    {
      title: 'Laporan',
      description: 'Analisis & laporan',
      icon: BarChart,
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100',
      iconColor: 'text-orange-600',
      path: '/reports',
    },
  ];

  return (
    <Layout>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
            <Store size={32} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">Selamat Datang di Koperasi Senyummu!</h2>
            <p className="text-blue-100 flex items-center gap-2 flex-wrap">
              <Calendar size={16} />
              <span>
                {new Date().toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={28} className={stat.iconColor} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={24} className="text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Aksi Cepat</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`${action.bgColor} ${action.hoverColor} rounded-xl p-5 text-left transition-all duration-200 hover:shadow-lg group border-2 border-transparent hover:border-gray-200`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className={action.iconColor} />
                  </div>
                  <ArrowRight size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={24} className="text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Aktivitas Terbaru</h3>
        </div>
        <div className="text-center py-16 text-gray-400">
          <BarChart size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Belum ada aktivitas hari ini</p>
          <p className="text-sm mt-2">Mulai transaksi untuk melihat aktivitas di sini</p>
        </div>
      </div>
    </Layout>
  );
}