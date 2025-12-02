import { Construction, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';

export default function ComingSoon() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get page title from pathname
  const getPageInfo = () => {
    const path = location.pathname.replace('/', '');
    const pages = {
      'pos': { 
        title: 'Point of Sales', 
        desc: 'Sistem kasir untuk transaksi penjualan produk'
      },
      'liabilities': { 
        title: 'Tanggungan', 
        desc: 'Kelola tanggungan dan pembayaran santri',
      },
      'products': { 
        title: 'Produk', 
        desc: 'Manajemen produk dan stok barang',
      },
      'categories': { 
        title: 'Kategori', 
        desc: 'Kelola kategori produk',
      },
      'suppliers': { 
        title: 'Supplier', 
        desc: 'Manajemen data supplier dan vendor',
      },
      'reports': { 
        title: 'Laporan', 
        desc: 'Laporan penjualan, keuangan, dan statistik',
      },
      'users': { 
        title: 'Pengguna', 
        desc: 'Manajemen user dan role akses',
      },
      'settings': { 
        title: 'Pengaturan', 
        desc: 'Konfigurasi sistem dan preferensi aplikasi',
      }
    };
    return pages[path] || { title: 'Halaman', desc: 'Fitur ini', icon: '🚀' };
  };

  const pageInfo = getPageInfo();

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center max-w-lg">
          {/* Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl shadow-lg">
            <Construction className="w-16 h-16 text-blue-600 animate-pulse" />
          </div>
          
          {/* Emoji & Title */}
          <div className="text-6xl mb-4">{pageInfo.icon}</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {pageInfo.title}
          </h1>
          
          {/* Description */}
          <p className="text-lg text-gray-600 mb-2">
            {pageInfo.desc}
          </p>
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-8">
            <Clock className="w-4 h-4" />
            Sedang Dalam Pengembangan
          </div>
          
          {/* Message */}
          <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
            Fitur ini akan segera tersedia. Kami sedang bekerja keras untuk memberikan pengalaman terbaik untuk Anda! 🚀
          </p>
          
          {/* Back Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </Layout>
  );
}