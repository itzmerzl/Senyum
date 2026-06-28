import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Tags,
  Building2,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  Landmark,
  ClipboardList,
  UserCog,
  Settings,
  ScrollText,
  History,
  Shield
} from 'lucide-react';

export const menuGroups = [
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
    adminOnly: true,
    items: [
      { path: '/audit/logs', icon: ScrollText, label: 'Audit Logs', permission: 'manage_settings' },
      { path: '/audit/login-history', icon: History, label: 'Login History', permission: 'manage_settings' },
      { path: '/audit/security', icon: Shield, label: 'Security Logs', permission: 'manage_settings' },
    ]
  },
];

// ─── Flat searchable pages (derived from menuGroups — single source of truth) ─
// desc bisa di-override per item kalau perlu copy yang lebih deskriptif
const descOverrides = {
  '/dashboard': 'Halaman dashboard utama',
  '/students': 'Daftar dan manajemen data santri',
  '/billing-templates': 'Atur template tagihan santri',
  '/item-bundles': 'Manajemen paket bundling produk',
  '/products': 'Manajemen data barang & stok',
  '/categories': 'Kelompok kategori produk koperasi',
  '/suppliers': 'Daftar supplier pemasok barang',
  '/pos': 'Menu kasir transaksi penjualan',
  '/transactions': 'Laporan histori penjualan kasir',
  '/liabilities': 'Daftar piutang / tanggungan pembayaran',
  '/reports': 'Laporan performa dan finansial',
  '/payment-methods': 'Kelola metode bayar tunai/non-tunai',
  '/stock-opname': 'Penyesuaian stok fisik barang',
  '/users': 'Pengaturan staff / admin sistem',
  '/settings': 'Konfigurasi koperasi dan database',
  '/audit/logs': 'Log aktivitas pengguna di sistem',
  '/audit/login-history': 'Riwayat masuk akun pengguna',
  '/audit/security': 'Catatan log keamanan sistem',
};

export const searchablePages = menuGroups.flatMap((group) => {
  if (group.type === 'single') {
    return [{
      label: group.label,
      path: group.path,
      icon: group.icon,
      desc: descOverrides[group.path] || '',
      group: 'Utama',
    }];
  }
  return group.items.map((item) => ({
    label: item.label,
    path: item.path,
    icon: item.icon,
    desc: descOverrides[item.path] || '',
    group: group.label,
  }));
});

// ─── Breadcrumb helper ────────────────────────────────────────────────────────
// Returns array of { label, path } from root → current
export function getBreadcrumb(pathname) {
  const crumbs = [{ label: 'Dashboard', path: '/dashboard' }];

  if (pathname === '/dashboard') return crumbs;

  for (const group of menuGroups) {
    if (group.type === 'single') {
      if (pathname === group.path) {
        if (group.path !== '/dashboard') crumbs.push({ label: group.label, path: group.path });
        return crumbs;
      }
      continue;
    }

    for (const item of group.items) {
      // exact match or sub-path (e.g. /students/123)
      if (pathname === item.path || pathname.startsWith(item.path + '/')) {
        crumbs.push({ label: group.label, path: null }); // group label tanpa link
        crumbs.push({ label: item.label, path: item.path });
        return crumbs;
      }
    }
  }

  // Fallback: capitalise last segment
  const last = pathname.split('/').filter(Boolean).at(-1) ?? '';
  crumbs.push({ label: last.charAt(0).toUpperCase() + last.slice(1), path: pathname });
  return crumbs;
}

// ─── Nav badge counts (plug in dari store/context lo sendiri) ────────────────
// Export ini biar tiap komponen bisa subscribe ke badge count tanpa coupling
// Usage: import { NAV_BADGE_PATHS } from './menuGroups'
// Lalu subscribe ke store yang relevan dan pass count ke Sidebar/BottomNav
export const NAV_BADGE_PATHS = {
  '/liabilities': 'liabilities_overdue',   // key → store selector
  '/transactions': 'transactions_pending',
};