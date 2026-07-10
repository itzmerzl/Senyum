import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown,
  Calendar, Store, BarChart, ArrowRight, AlertTriangle, Clock,
  CheckCircle, XCircle, Award, Zap, RefreshCw
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import StatsCarousel from '../components/common/StatsCarousel';
import SectionCard from '../components/common/SectionCard';
import EmptyState from '../components/common/EmptyState';
import IconBox from '../components/common/IconBox';
import { getDashboardStats, getLiabilitiesSummary, getCashFlow, getPerformanceMetrics } from '../services/dashboardService';
import { formatCurrency } from '../utils/formatters';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Area } from 'recharts';

// ─── Small local helper: filter pill row (period tabs) ───────────────────────
function PeriodTabs({ options, value, onChange, activeColor = 'blue' }) {
  const activeClasses = {
    blue: 'bg-blue-600 text-white shadow-md',
    green: 'bg-green-600 text-white shadow-md'
  };
  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${value === opt.value
            ? activeClasses[activeColor]
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

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
  const [salesChartPeriod, setSalesChartPeriod] = useState('7days');
  const [liabilitiesStats, setLiabilitiesStats] = useState({ totalOutstanding: 0, studentsCount: 0, overdueCount: 0, overdueAmount: 0 });
  const [cashFlow, setCashFlow] = useState({ todayIncome: 0, currentCash: 0, openingBalance: 0, cashInDrawer: false });
  const [performanceMetrics, setPerformanceMetrics] = useState({ avgTransactionValue: 0, topMarginProducts: [], peakHours: [] });
  const [lastUpdated, setLastUpdated] = useState(null);

  // ===== LOAD DATA ON MOUNT =====
  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      loadAllData();
    }, 60000);
    return () => clearInterval(interval);
  }, [salesChartPeriod, topProductsPeriod]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [dashboardData, liabilitiesData, cashFlowData, metricsData] = await Promise.all([
        getDashboardStats({ period: salesChartPeriod, topPeriod: topProductsPeriod }),
        getLiabilitiesSummary(),
        getCashFlow(),
        getPerformanceMetrics()
      ]);

      setStats(dashboardData.stats);
      setLowStockProducts(dashboardData.lowStockProducts);
      setTopProducts(dashboardData.topProducts);
      setRecentTransactions(dashboardData.recentTransactions);
      setSalesChart(dashboardData.salesChart);
      setLiabilitiesStats(liabilitiesData);
      setCashFlow(cashFlowData);
      setPerformanceMetrics(metricsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status) => {
    const badges = {
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Selesai' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
      cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Batal' }
    };
    return badges[status] || badges.completed;
  };

  const quickActions = [
    { title: 'Point of Sales', description: 'Kasir & transaksi penjualan', icon: ShoppingCart, color: 'blue', path: '/pos' },
    { title: 'Data Santri', description: 'Kelola data santri', icon: Users, color: 'green', path: '/students' },
    { title: 'Data Produk', description: 'Kelola produk & stok', icon: Package, color: 'purple', path: '/products' },
    { title: 'Laporan', description: 'Analisis & laporan', icon: BarChart, color: 'orange', path: '/reports' },
  ];

  const topProductsPeriodLabel = {
    today: 'hari ini', week: 'minggu ini', month: 'bulan ini', year: 'tahun ini'
  }[topProductsPeriod];

  // ===== RENDER =====
  return (
    <Layout>
      {/* Welcome Banner — the one intentional "hero" element on this page */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
            <Store size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold mb-1">Selamat Datang di Koperasi Senyummu!</h2>
            {lastUpdated && (
              <p className="text-sm text-blue-100 flex items-center gap-2">
                <Clock size={14} />
                Last updated: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
          </div>
          <button
            onClick={() => { setLoading(true); loadAllData(); }}
            disabled={loading}
            className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Carousel */}
      <StatsCarousel
        stats={[
          {
            label: 'Penjualan Hari Ini',
            value: formatCurrency(stats.todaySales),
            valueColor: 'text-blue-600 dark:text-blue-400',
            subtitle: <>
              {stats.salesChange >= 0 ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +{stats.salesChange?.toFixed(1) || 0}%
                </span>
              ) : (
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> {stats.salesChange?.toFixed(1) || 0}%
                </span>
              )} vs kemarin
            </>,
            icon: DollarSign,
            iconBg: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-600 dark:text-blue-400'
          },
          {
            label: 'Transaksi Hari Ini',
            value: stats.todayTransactions || 0,
            valueColor: 'text-green-600 dark:text-green-400',
            subtitle: 'Transaksi selesai',
            icon: ShoppingCart,
            iconBg: 'bg-green-50 dark:bg-green-900/20',
            iconColor: 'text-green-600 dark:text-green-400'
          },
          {
            label: 'Total Santri',
            value: stats.totalStudents || 0,
            valueColor: 'text-purple-600 dark:text-purple-400',
            subtitle: 'Santri aktif terdaftar',
            icon: Users,
            iconBg: 'bg-purple-50 dark:bg-purple-900/20',
            iconColor: 'text-purple-600 dark:text-purple-400'
          },
          {
            label: 'Total Produk',
            value: stats.totalProducts || 0,
            valueColor: 'text-orange-600 dark:text-orange-400',
            subtitle: 'Produk tersedia',
            icon: Package,
            iconBg: 'bg-orange-50 dark:bg-orange-900/20',
            iconColor: 'text-orange-600 dark:text-orange-400'
          },
          {
            label: 'Total Tunggakan',
            value: formatCurrency(liabilitiesStats.totalOutstanding || 0),
            valueColor: 'text-red-600 dark:text-red-400',
            subtitle: <><span className="font-medium">{liabilitiesStats.studentsCount || 0}</span> santri belum lunas</>,
            icon: AlertTriangle,
            iconBg: 'bg-red-50 dark:bg-red-900/20',
            iconColor: 'text-red-600 dark:text-red-400'
          },
          {
            label: 'Kas Hari Ini',
            value: formatCurrency(cashFlow.todayIncome || 0),
            valueColor: 'text-emerald-600 dark:text-emerald-400',
            subtitle: cashFlow.drawerStatus === 'open' ? 'Drawer terbuka' : 'Drawer tertutup',
            icon: DollarSign,
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400'
          },
          {
            label: 'Pending',
            value: stats.pendingTransactions || 0,
            valueColor: 'text-yellow-600 dark:text-yellow-400',
            subtitle: stats.pendingAmount ? formatCurrency(stats.pendingAmount) : 'Transaksi menunggu',
            icon: Clock,
            iconBg: 'bg-yellow-50 dark:bg-yellow-900/20',
            iconColor: 'text-yellow-600 dark:text-yellow-400'
          },
          {
            label: 'Stok Rendah',
            value: lowStockProducts.length || 0,
            valueColor: lowStockProducts.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
            subtitle: lowStockProducts.length > 0 ? 'Perlu restock!' : 'Stok aman',
            icon: Package,
            iconBg: lowStockProducts.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20',
            iconColor: lowStockProducts.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }
        ]}
        autoPlayInterval={6000}
        visibleCards={4}
      />

      {/* Liabilities / Cash Flow / Goal Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tanggungan/Liabilities Widget */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-sm border-2 border-purple-200 dark:border-purple-800 p-5 flex flex-col h-full">
          <div className="flex items-center gap-2.5 mb-4">
            <IconBox icon={Users} color="purple" variant="solid" size="lg" />
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Tanggungan Santri</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Status pembayaran</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Outstanding</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(liabilitiesStats.totalOutstanding)}</p>
            </div>
            <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Santri Berhutang</p>
              <p className="text-lg font-bold text-purple-600">{liabilitiesStats.studentsCount}</p>
            </div>
          </div>

          {liabilitiesStats.overdueCount > 0 && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-bold text-red-800">{liabilitiesStats.overdueCount} Jatuh Tempo!</span>
              </div>
              <p className="text-xs text-red-700">Total: {formatCurrency(liabilitiesStats.overdueAmount)}</p>
            </div>
          )}

          <div className="flex-1" />

          <button
            onClick={() => navigate('/liabilities')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-auto"
          >
            Kelola Tanggungan
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Cash Flow Widget */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-sm border-2 border-green-200 dark:border-green-800 p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <IconBox icon={DollarSign} color="green" variant="solid" size="lg" />
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Cash Flow</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Arus kas hari ini</p>
              </div>
            </div>
            <span className={`text-xs font-medium ${cashFlow.drawerStatus === 'open' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
              {cashFlow.drawerStatus === 'open' ? 'Drawer Open' : 'Drawer Closed'}
            </span>
          </div>

          <div className="space-y-2.5 mb-4">
            <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pemasukan Hari Ini</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(cashFlow.todayIncome)}</span>
              </div>
            </div>

            {cashFlow.cashInDrawer && (
              <>
                <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Kas di Drawer</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(cashFlow.currentCash)}</span>
                  </div>
                </div>
                <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg p-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Saldo Awal</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cashFlow.openingBalance)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex-1" />

          <button
            onClick={() => navigate('/pos')}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-auto"
          >
            Buka POS
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>

        {/* Goal Progress Widget */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl shadow-sm border-2 border-blue-200 dark:border-blue-800 p-5 flex flex-col h-full">
          <div className="flex items-center gap-2.5 mb-4">
            <IconBox icon={Award} color="blue" variant="solid" size="lg" />
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Target Penjualan</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Monitoring target</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Daily Goal */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Harian</span>
                <span className="text-xs text-gray-500">{formatCurrency(stats.targets?.daily || 5000000)}</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-3.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-3.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(((stats.todaySales || 0) / (stats.targets?.daily || 5000000)) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{formatCurrency(stats.todaySales || 0)}</span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                  {((stats.todaySales || 0) / (stats.targets?.daily || 5000000) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Period Goal */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Periode ({salesChart.length} Hari)</span>
                <span className="text-xs text-gray-500">
                  {formatCurrency((stats.targets?.daily || 5000000) * salesChart.length)}
                </span>
              </div>
              <div className="w-full bg-cyan-200 dark:bg-cyan-900 rounded-full h-3.5 overflow-hidden">
                {(() => {
                  const periodSales = salesChart.reduce((sum, d) => sum + (d.sales || 0), 0);
                  const periodTarget = (stats.targets?.daily || 5000000) * salesChart.length;
                  const percent = Math.min((periodSales / periodTarget) * 100, 100);
                  return (
                    <div
                      className="bg-cyan-600 h-3.5 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percent}%` }}
                    />
                  );
                })()}
              </div>
              <div className="flex justify-between items-center mt-1">
                {(() => {
                  const periodSales = salesChart.reduce((sum, d) => sum + (d.sales || 0), 0);
                  const periodTarget = (stats.targets?.daily || 5000000) * salesChart.length;
                  const percent = (periodSales / periodTarget) * 100;
                  return (
                    <>
                      <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">{formatCurrency(periodSales)}</span>
                      <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">{percent.toFixed(1)}%</span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(lowStockProducts.length > 0 || stats.pendingTransactions > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {lowStockProducts.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <IconBox icon={AlertTriangle} color="red" variant="soft" size="md" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Peringatan Stok!
                  </h4>
                  <div className="flex gap-2 mb-3">
                    <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-bold rounded">
                      {lowStockProducts.filter(p => p.stock === 0).length} Habis
                    </span>
                    <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded">
                      {lowStockProducts.filter(p => p.stock > 0 && p.stock <= p.minStock).length} Rendah
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {lowStockProducts.slice(0, 3).map(product => (
                      <div key={product.id} className="flex justify-between items-center text-sm bg-white/50 rounded px-2 py-1">
                        <span className={`font-medium truncate flex-1 ${product.stock === 0 ? 'text-red-700' : 'text-yellow-700'}`}>
                          {product.stock === 0 && '⚠️ '}{product.name}
                        </span>
                        <span className={`font-bold ml-2 ${product.stock === 0 ? 'text-red-900' : 'text-yellow-900'}`}>
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

          {stats.pendingTransactions > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <IconBox icon={Clock} color="yellow" variant="soft" size="md" />
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
      )}

      {/* Top Products + Sales Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Top 5 Produk Terlaris" icon={Award} iconColor="green">
          <PeriodTabs
            activeColor="green"
            value={topProductsPeriod}
            onChange={setTopProductsPeriod}
            options={[
              { value: 'today', label: 'Hari Ini' },
              { value: 'week', label: 'Minggu Ini' },
              { value: 'month', label: 'Bulan Ini' },
              { value: 'year', label: 'Tahun Ini' }
            ]}
          />

          {topProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Belum ada penjualan"
              subtitle={`untuk periode ${topProductsPeriodLabel}`}
              size="sm"
            />
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-lg hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all border border-gray-100 dark:border-gray-600 hover:border-gray-200 dark:hover:border-gray-500 hover:shadow-md group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition-transform group-hover:scale-110 ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-md' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md' :
                        'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {product.quantity} terjual
                      </span>
                      {topProducts.length > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          ({((product.quantity / topProducts.reduce((sum, p) => sum + p.quantity, 0)) * 100).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-green-600 text-sm">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-gray-500">@{formatCurrency(product.revenue / product.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {topProducts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Total Terjual:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {topProducts.reduce((sum, p) => sum + p.quantity, 0)} item
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Total Revenue:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(topProducts.reduce((sum, p) => sum + p.revenue, 0))}
                </span>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Tren Penjualan" icon={TrendingUp} iconColor="blue">
          <PeriodTabs
            activeColor="blue"
            value={salesChartPeriod}
            onChange={setSalesChartPeriod}
            options={[
              { value: '7days', label: '7 Hari' },
              { value: '14days', label: '14 Hari' },
              { value: '30days', label: '30 Hari' },
              { value: '90days', label: '90 Hari' }
            ]}
          />

          {salesChart.length === 0 ? (
            <EmptyState icon={BarChart} title="Belum ada data penjualan" size="sm" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={salesChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#999" />
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
                  <Area type="monotone" dataKey="sales" stroke="#3B82F6" fill="url(#colorSales)" name="Penjualan (Rp)" />
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

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Penjualan</p>
                  <p className="text-base font-bold text-blue-600">
                    {formatCurrency(salesChart.reduce((sum, d) => sum + d.sales, 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rata-rata/Hari</p>
                  <p className="text-base font-bold text-green-600">
                    {formatCurrency(salesChart.reduce((sum, d) => sum + d.sales, 0) / salesChart.length)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Transaksi</p>
                  <p className="text-base font-bold text-purple-600">
                    {salesChart.reduce((sum, d) => sum + d.transactions, 0)}
                  </p>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Performance Metrics */}
      <SectionCard
        title="Performance Metrics"
        icon={BarChart}
        iconColor="orange"
        action={lastUpdated && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Updated: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2.5 mb-3">
              <IconBox icon={DollarSign} color="blue" variant="solid" size="md" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Transaksi</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">30 hari terakhir</p>
              </div>
            </div>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(performanceMetrics.avgTransactionValue || 0)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2.5 mb-3">
              <IconBox icon={TrendingUp} color="green" variant="solid" size="md" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Produk Margin Tertinggi</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Top 3 produk</p>
              </div>
            </div>
            <div className="space-y-2">
              {performanceMetrics.topMarginProducts?.length > 0 ? (
                performanceMetrics.topMarginProducts.slice(0, 3).map((product, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-white/70 dark:bg-gray-600/70 rounded px-2 py-1">
                    <span className="truncate flex-1 font-medium text-gray-700 dark:text-gray-200">{product.name}</span>
                    <span className="font-bold text-green-600 ml-2">{product.margin.toFixed(1)}%</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">Belum ada data</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2.5 mb-3">
              <IconBox icon={Clock} color="orange" variant="solid" size="md" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Jam Tersibuk</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Peak hours</p>
              </div>
            </div>
            <div className="space-y-2">
              {performanceMetrics.peakHours?.length > 0 ? (
                performanceMetrics.peakHours.slice(0, 3).map((hour, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-white/70 dark:bg-gray-600/70 rounded px-2 py-1">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{hour.hour}</span>
                    <span className="font-bold text-orange-600">{hour.transactions} trx</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">Belum ada data</p>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Aksi Cepat" icon={Zap} iconColor="blue">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`bg-${action.color}-50 dark:bg-gray-700 hover:bg-${action.color}-100 dark:hover:bg-gray-600 rounded-xl p-4 text-left transition-all duration-200 hover:shadow-lg group border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-500`}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <Icon size={20} className={`text-${action.color}-600`} />
                  </div>
                  <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">{action.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">{action.description}</p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Recent Transactions */}
      <SectionCard
        title="Aktivitas Terbaru"
        icon={Calendar}
        iconColor="blue"
        action={recentTransactions.length > 0 && (
          <button
            onClick={() => navigate('/transactions')}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      >
        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Belum ada aktivitas hari ini"
            subtitle="Mulai transaksi untuk melihat aktivitas di sini"
            action={
              <button
                onClick={() => navigate('/pos')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2 text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Buka POS
              </button>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {recentTransactions.map(transaction => {
              const statusBadge = getStatusBadge(transaction.status);
              const StatusIcon = statusBadge.icon;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer group"
                  onClick={() => navigate('/transactions')}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${transaction.status === 'completed' ? 'bg-green-100' :
                    transaction.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                    <StatusIcon className={`w-5 h-5 ${transaction.status === 'completed' ? 'text-green-600' :
                      transaction.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {transaction.customerName || 'Customer'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.transactionDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      {' • '}{transaction.invoiceNumber}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 dark:text-white mb-1">{formatCurrency(transaction.total)}</p>
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
      </SectionCard>
    </Layout>
  );
}