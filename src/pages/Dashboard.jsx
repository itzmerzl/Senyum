import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown,
  Calendar, Store, BarChart, ArrowRight, AlertTriangle, Clock,
  CheckCircle, XCircle, Award, Zap
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import db from '../config/database';
import { formatCurrency } from '../utils/formatters';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Area } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // ===== STATES =====
  const [stats, setStats] = useState({
    todaySales: 0,
    yesterdaySales: 0,
    salesChange: 0,
    todayTransactions: 0,
    totalStudents: 0,
    totalProducts: 0,
    pendingTransactions: 0,
    pendingAmount: 0
  });
  
  const [topProductsPeriod, setTopProductsPeriod] = useState('today');
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [salesChart, setSalesChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesChartPeriod, setSalesChartPeriod] = useState('7days'); // 7days, 14days, 30days, 90days

  // ===== LOAD DATA ON MOUNT =====
  useEffect(() => {
    loadAllData();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      loadAllData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // ===== FUNCTION: Load All Data =====
  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadLowStockProducts(),
        loadTopProducts(),
        loadRecentTransactions(),
        loadSalesChart()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== FUNCTION: Load Stats with Comparison =====
  const loadStats = async () => {
    try {
      // Today's range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Yesterday's range
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get today's transactions
      const todayTransactions = await db.transactions
        .where('transactionDate')
        .between(today, tomorrow, true, false)
        .toArray();

      // Get yesterday's transactions
      const yesterdayTransactions = await db.transactions
        .where('transactionDate')
        .between(yesterday, today, true, false)
        .toArray();

      // Calculate today's sales (only completed)
      const todaySales = todayTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.total || 0), 0);

      // Calculate yesterday's sales
      const yesterdaySales = yesterdayTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.total || 0), 0);

      // Calculate percentage change
      const salesChange = yesterdaySales > 0 
        ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
        : 0;

      // Get pending transactions
      const pendingTransactions = await db.transactions
        .where('status')
        .equals('pending')
        .toArray();

      const pendingAmount = pendingTransactions.reduce((sum, t) => sum + (t.total || 0), 0);

      // Get total students
      const totalStudents = await db.students.count();

      // Get total products
      const totalProducts = await db.products.count();

      setStats({
        todaySales,
        yesterdaySales,
        salesChange,
        todayTransactions: todayTransactions.filter(t => t.status === 'completed').length,
        totalStudents,
        totalProducts,
        pendingTransactions: pendingTransactions.length,
        pendingAmount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // ===== FUNCTION: Load Low Stock Products =====
  const loadLowStockProducts = async () => {
    try {
      const LOW_STOCK_THRESHOLD = 10;
      
      const products = await db.products
        .where('stock')
        .below(LOW_STOCK_THRESHOLD)
        .and(item => item.isActive === true)
        .toArray();
      
      // Sort by stock ascending (paling sedikit dulu)
      const sorted = products.sort((a, b) => a.stock - b.stock);
      
      setLowStockProducts(sorted);
    } catch (error) {
      console.error('Error loading low stock products:', error);
    }
  };

  const loadTopProducts = async (period = 'today') => {
  try {
    let startDate = new Date();
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Set start date based on period
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    const transactions = await db.transactions
      .where('transactionDate')
      .between(startDate, endDate, true, true)
      .and(t => t.status === 'completed')
      .toArray();

    // Aggregate product sales
    const productSales = {};
    
    transactions.forEach(transaction => {
      transaction.items?.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            name: item.productName,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      });
    });

    // Convert to array and sort by quantity
    const sorted = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    setTopProducts(sorted);
  } catch (error) {
    console.error('Error loading top products:', error);
  }
};

  // ===== FUNCTION: Load Recent Transactions =====
  const loadRecentTransactions = async () => {
    try {
      const transactions = await db.transactions
        .orderBy('transactionDate')
        .reverse()
        .limit(5)
        .toArray();

      setRecentTransactions(transactions);
    } catch (error) {
      console.error('Error loading recent transactions:', error);
    }
  };

  // ===== FUNCTION: Load Sales Chart (Last 7 Days) =====
  const loadSalesChart = async (period = '7days') => {
  try {
    const chartData = [];
    let daysCount = 7;
    
    // Set days count based on period
    switch (period) {
      case '7days':
        daysCount = 7;
        break;
      case '14days':
        daysCount = 14;
        break;
      case '30days':
        daysCount = 30;
        break;
      case '90days':
        daysCount = 90;
        break;
      default:
        daysCount = 7;
    }
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const transactions = await db.transactions
        .where('transactionDate')
        .between(date, nextDay, true, false)
        .and(t => t.status === 'completed')
        .toArray();
      
      const total = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
      
      chartData.push({
        date: date.toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'short',
          ...(daysCount > 30 ? {} : { weekday: 'short' }) // Show weekday only for <= 30 days
        }),
        fullDate: date.toLocaleDateString('id-ID', { 
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }),
        sales: total,
        transactions: transactions.length
      });
    }
    
    setSalesChart(chartData);
  } catch (error) {
    console.error('Error loading sales chart:', error);
  }
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-xs font-semibold text-gray-600 mb-2">{data.fullDate}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-gray-600">Penjualan:</span>{' '}
            <span className="font-bold text-blue-600">{formatCurrency(data.sales)}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Transaksi:</span>{' '}
            <span className="font-bold text-green-600">{data.transactions}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

  // ===== HELPER: Get Status Badge =====
  const getStatusBadge = (status) => {
    const badges = {
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Selesai' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
      cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Batal' }
    };
    return badges[status] || badges.completed;
  };

  // ===== STATS CARDS DATA =====
  const statsCards = [
    {
      title: 'Penjualan Hari Ini',
      value: formatCurrency(stats.todaySales),
      change: stats.salesChange,
      comparison: `vs kemarin ${formatCurrency(stats.yesterdaySales)}`,
      icon: DollarSign,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
    },
    {
      title: 'Transaksi Selesai',
      value: stats.todayTransactions,
      subtitle: 'Hari ini',
      icon: ShoppingCart,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-700',
    },
    {
      title: 'Total Santri',
      value: stats.totalStudents,
      subtitle: 'Santri aktif',
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-700',
    },
    {
      title: 'Total Produk',
      value: stats.totalProducts,
      subtitle: 'Produk tersedia',
      icon: Package,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-700',
    },
  ];

  // ===== QUICK ACTIONS DATA =====
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

  // ===== RENDER =====
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className={stat.iconColor} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor} mb-1`}>{stat.value}</p>
                
                {/* Sales Change Indicator */}
                {stat.change !== undefined && (
                  <div className="flex items-center gap-1 mt-2">
                    {stat.change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-xs font-semibold ${
                      stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(stat.change).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">{stat.comparison}</span>
                  </div>
                )}
                
                {/* Subtitle */}
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {lowStockProducts.length} Produk Stok Menipis!
                </h4>
                <div className="space-y-1.5 mb-3">
                  {lowStockProducts.slice(0, 3).map(product => (
                    <div key={product.id} className="flex justify-between items-center text-sm bg-white/50 rounded px-2 py-1">
                      <span className="text-red-700 font-medium truncate flex-1">
                        {product.name}
                      </span>
                      <span className="font-bold text-red-900 ml-2">
                        {product.stock} {product.unit}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/products')}
                  className="text-sm text-red-700 hover:text-red-800 font-semibold flex items-center gap-1"
                >
                  {lowStockProducts.length > 3 ? `Lihat ${lowStockProducts.length - 3} lainnya` : 'Kelola Stok'} 
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Payment Alert */}
        {stats.pendingTransactions > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-yellow-800 mb-2">
                  {stats.pendingTransactions} Pembayaran Menunggu Konfirmasi
                </h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Total: <span className="font-bold">{formatCurrency(stats.pendingAmount)}</span>
                </p>
                <button
                  onClick={() => navigate('/transactions?status=pending')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  Lihat & Konfirmasi
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top 5 Products dengan Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">Top 5 Produk Terlaris</h3>
            </div>
          </div>
          
          {/* Period Filter Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[
              { value: 'today', label: 'Hari Ini' },
              { value: 'week', label: 'Minggu Ini' },
              { value: 'month', label: 'Bulan Ini' },
              { value: 'year', label: 'Tahun Ini' }
            ].map(period => (
              <button
                key={period.value}
                onClick={() => setTopProductsPeriod(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  topProductsPeriod === period.value
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          
          {topProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Belum ada penjualan</p>
              <p className="text-xs text-gray-400 mt-1">
                untuk periode {
                  topProductsPeriod === 'today' ? 'hari ini' :
                  topProductsPeriod === 'week' ? 'minggu ini' :
                  topProductsPeriod === 'month' ? 'bulan ini' :
                  'tahun ini'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div 
                  key={product.productId} 
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:from-gray-100 hover:to-gray-50 transition-all border border-gray-100 hover:border-gray-200 hover:shadow-md group"
                >
                  {/* Ranking Badge */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition-transform group-hover:scale-110 ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-md' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md' :
                    'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}>
                    {`${index + 1}`}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {product.quantity} terjual
                      </span>
                      {/* Tambahan: show percentage dari total */}
                      {topProducts.length > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          ({((product.quantity / topProducts.reduce((sum, p) => sum + p.quantity, 0)) * 100).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Revenue */}
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-sm">
                      {formatCurrency(product.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      @{formatCurrency(product.revenue / product.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Summary Footer */}
          {topProducts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Total Terjual:</span>
                <span className="font-bold text-gray-900">
                  {topProducts.reduce((sum, p) => sum + p.quantity, 0)} item
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600 font-medium">Total Revenue:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(topProducts.reduce((sum, p) => sum + p.revenue, 0))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Tren Penjualan</h3>
            </div>
          </div>
          
          {/* Period Filter Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[
              { value: '7days', label: '7 Hari' },
              { value: '14days', label: '14 Hari' },
              { value: '30days', label: '30 Hari' },
              { value: '90days', label: '90 Hari' }
            ].map(period => (
              <button
                key={period.value}
                onClick={() => setSalesChartPeriod(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  salesChartPeriod === period.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          
          {salesChart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BarChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Belum ada data penjualan</p>
            </div>
          ) : (
            <>
              {/* Chart */}
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart 
                    data={salesChart}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      stroke="#999"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      stroke="#999"
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                        return value;
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#3B82F6"
                      fill="url(#colorSales)"
                      name="Penjualan (Rp)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Penjualan (Rp)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Chart Summary */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Penjualan</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(salesChart.reduce((sum, d) => sum + d.sales, 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Rata-rata/Hari</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(salesChart.reduce((sum, d) => sum + d.sales, 0) / salesChart.length)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Transaksi</p>
                  <p className="text-lg font-bold text-purple-600">
                    {salesChart.reduce((sum, d) => sum + d.transactions, 0)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-blue-600" />
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
                  <div className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
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

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Aktivitas Terbaru</h3>
          </div>
          {recentTransactions.length > 0 && (
            <button
              onClick={() => navigate('/transactions')}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              Lihat Semua
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Belum ada aktivitas hari ini</p>
            <p className="text-sm mt-2">Mulai transaksi untuk melihat aktivitas di sini</p>
            <button
              onClick={() => navigate('/pos')}
              className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Buka POS
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map(transaction => {
              const statusBadge = getStatusBadge(transaction.status);
              const StatusIcon = statusBadge.icon;
              
              return (
                <div 
                  key={transaction.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                  onClick={() => navigate('/transactions')}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    transaction.status === 'completed' ? 'bg-green-100' :
                    transaction.status === 'pending' ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    <StatusIcon className={`w-6 h-6 ${
                      transaction.status === 'completed' ? 'text-green-600' :
                      transaction.status === 'pending' ? 'text-yellow-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {transaction.customerName || 'Customer'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.transactionDate).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} • {transaction.invoiceNumber}
                    </p>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 mb-1">
                      {formatCurrency(transaction.total)}
                    </p>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}