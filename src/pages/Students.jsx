import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Eye, Download, Filter, User, RefreshCw, Upload, Printer,
  Search, X, SlidersHorizontal, FileSpreadsheet, CheckCircle, AlertCircle,
  ChevronLeft, ChevronRight, MoreHorizontal, GraduationCap, MessageCircle
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StudentForm from '../components/features/students/StudentForm';
import StudentImportModal from '../components/features/students/StudentImportModal';
import StudentUpdateModal from '../components/features/students/StudentUpdateModal';
import StudentDetailModal from '../components/features/students/StudentDetailModal';
import ClassPromotionModal from '../components/features/students/ClassPromotionModal';
import DebouncedInput from '../components/common/DebouncedInput';
import StatsCarousel from '../components/common/StatsCarousel';
import {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  resetPin,
  getStudentStats,
  exportStudents,
  bulkUpdateStudents
} from '../services/studentService';
import { getStoreSettings } from '../services/settingService';
import { formatDate, formatPhoneNumber, formatCurrency } from '../utils/formatters';
import { printThermalReceipt } from '../utils/printHelper';
import { printPinLetters } from '../utils/PinLetterPrint';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  // const [filteredStudents, setFilteredStudents] = useState([]); // REMOVED: Derived state
  // const [paginatedStudents, setPaginatedStudents] = useState([]); // REMOVED: Derived state
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPromotionModal, setShowPromotionModal] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Bulk Action States
  const [selectedIds, setSelectedIds] = useState([]);

  // Enhanced Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    program: '',
    className: '',
    gender: '',
    balanceMin: '',
    balanceMax: '',
    enrollmentFrom: '',
    enrollmentTo: '',
    sortBy: 'newest'
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState('');
  const [showExcelDropdown, setShowExcelDropdown] = useState(false);
  const [showBulkActionsDropdown, setShowBulkActionsDropdown] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resetPinResult, setResetPinResult] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState(null);

  // Load params effect
  useEffect(() => {
    loadStudents();
  }, [currentPage, itemsPerPage, searchQuery, filters]);

  useEffect(() => {
    loadStats();
    loadSettings();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExcelDropdown || showBulkActionsDropdown) {
        const target = event.target;
        if (!target.closest('.excel-dropdown-container') && !target.closest('.bulk-actions-container')) {
          setShowExcelDropdown(false);
          setShowBulkActionsDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExcelDropdown, showBulkActionsDropdown]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        ...filters
      };

      const response = await getAllStudents(params);

      // Handle both new format (data, meta) and potential legacy fallback
      if (response.data && response.meta) {
        setStudents(response.data);
        setTotalPages(response.meta.totalPages);
        setTotalItems(response.meta.total);
      } else if (Array.isArray(response)) {
        // Fallback if backend rollout isn't complete or testing
        setStudents(response);
        setTotalPages(1);
        setTotalItems(response.length);
      }

    } catch (error) {
      toast.error('Gagal memuat data santri');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getStudentStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await getStoreSettings();
      setStoreSettings(settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };



  const handleAdd = async (formData) => {
    try {
      setFormLoading(true);
      await createStudent(formData);
      toast.success('Santri berhasil ditambahkan');
      setShowAddModal(false);
      loadStudents();
      loadStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal menambahkan santri');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    try {
      setFormLoading(true);
      await updateStudent(selectedStudent.id, formData);
      toast.success('Data santri berhasil diperbarui');
      setShowEditModal(false);
      setSelectedStudent(null);
      loadStudents();
      loadStats();
    } catch (error) {
      toast.error('Gagal memperbarui santri');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStudent(selectedStudent.id);
      toast.success('Santri berhasil dihapus');
      setShowDeleteDialog(false);
      setSelectedStudent(null);
      loadStudents();
      loadStats();
    } catch (error) {
      toast.error('Gagal menghapus santri');
    }
  };

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = students.map(s => s.id);
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    } else {
      const idsToRemove = new Set(students.map(s => s.id));
      setSelectedIds(prev => prev.filter(id => !idsToRemove.has(id)));
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectedCount = selectedIds.length;
  const isAllPageSelected = students.length > 0 && students.every(s => selectedIds.includes(s.id));

  const handleBulkDelete = async () => {
    try {
      // Implement bulk delete via loop for now
      for (const id of selectedIds) {
        await deleteStudent(id);
      }
      toast.success(`${selectedIds.length} santri berhasil dihapus`);
      setShowBulkDeleteConfirm(false);
      setSelectedIds([]);
      loadStudents();
      loadStats();
    } catch (error) {
      toast.error('Gagal menghapus beberapa data');
      loadStudents(); // Reload to see what's left
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatusTarget) return;

    try {
      setLoading(true); // create overlay loading feel
      // Loop update
      for (const id of selectedIds) {
        await updateStudent(id, { status: bulkStatusTarget });
      }
      toast.success(`${selectedIds.length} santri berhasil diperbarui statusnya`);
      setShowBulkStatusModal(false);
      setBulkStatusTarget('');
      setSelectedIds([]);
      loadStudents();
      loadStats();
    } catch (error) {
      toast.error('Gagal memperbarui status');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = () => {
    setShowResetConfirm(true);
  };

  const confirmResetPin = async () => {
    try {
      const result = await resetPin(selectedStudent.id);
      setResetPinResult(result);
      setShowResetConfirm(false);
      toast.success('PIN berhasil direset');
    } catch (error) {
      toast.error('Gagal mereset PIN');
    }
  };

  const handleExport = async () => {
    try {
      toast.loading('Mempersiapkan data export...');
      // Fetch ALL data matching current filters for export
      const params = {
        ...filters,
        search: searchQuery,
        limit: 100000 // Large limit for export
      };

      const response = await getAllStudents(params);
      // Handle both formats: direct array or { data, meta }
      const allData = response.data || response;

      if (!allData || allData.length === 0) {
        toast.dismiss();
        toast.error('Tidak ada data untuk diexport');
        return;
      }

      const studentsToExport = allData.map(s => ({
        'No. Registrasi': s.registrationNumber,
        'Nama Lengkap': s.fullName,
        'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : s.gender === 'P' ? 'Perempuan' : '-',
        'Kelas': s.className || '-',
        'Program': s.program || '-',
        'Status': s.status === 'active' ? 'Aktif' : s.status === 'graduated' ? 'Lulus' : 'Tidak Aktif',
        'Nama Wali': s.guardianName || '-',
        'Telp Wali': s.guardianPhone || '-',
        'WhatsApp Wali': s.guardianWhatsapp || '-',
        'Total Tagihan': s.totalLiabilities || 0,
        'Sudah Dibayar': s.totalPaid || 0,
        'Saldo': s.balance || 0,
        'Beasiswa %': s.scholarshipPercent || 0,
        'Alamat': s.address || '-',
        'Tanggal Masuk': s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString('id-ID') : '-'
      }));

      const ws = XLSX.utils.json_to_sheet(studentsToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Santri");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `Data_Santri_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`);

      toast.dismiss();
      toast.success(`${allData.length} data berhasil diexport`);
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss();
      toast.error('Gagal export data');
    }
  };

  const handleBulkPrintPin = () => {
    // Get selected students with their plain PINs
    // Note: Since we don't store plain PIN in DB, we can only print for newly created students
    // For existing students, admin needs to reset PIN first to get plain PIN
    const selectedStudentsData = students.filter(s => selectedIds.includes(s.id));

    if (selectedStudentsData.length === 0) {
      toast.error('Tidak ada data santri yang dipilih');
      return;
    }

    // Check if any student doesn't have plainPin (likely existing students)
    const studentsWithoutPin = selectedStudentsData.filter(s => !s.plainPin);

    if (studentsWithoutPin.length > 0) {
      toast.error(
        `${studentsWithoutPin.length} santri tidak memiliki PIN yang dapat dicetak. Mohon reset PIN terlebih dahulu.`,
        { duration: 5000 }
      );
      return;
    }

    // Pass website URL from settings or fallback to current origin
    const websiteUrl = storeSettings?.storeWebsite || window.location.origin;
    const schoolName = storeSettings?.storeName || 'Koperasi Senyum';

    printPinLetters(selectedStudentsData, schoolName, websiteUrl);
    toast.success(`PIN Letter untuk ${selectedStudentsData.length} santri siap dicetak`);
  };

  const handleBulkUpdate = async (updates) => {
    try {
      setLoading(true);
      const results = await bulkUpdateStudents(updates);

      if (results.success.length > 0) {
        toast.success(`${results.success.length} data berhasil diupdate`);
      }

      if (results.failed.length > 0) {
        toast.error(`${results.failed.length} data gagal diupdate`, { duration: 5000 });
        console.error('Failed updates:', results.failed);
      }

      setShowUpdateModal(false);
      loadStudents();
      loadStats();
    } catch (error) {
      toast.error('Gagal melakukan bulk update');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTable = async () => {
    try {
      toast.loading('Memuat data untuk print...');
      // Fetch ALL data matching current filters for print
      const params = {
        ...filters,
        search: searchQuery,
        limit: 10000 // Large limit for print
      };

      const response = await getAllStudents(params);
      const dataToPrint = response.data || response;

      toast.dismiss();

      if (!dataToPrint || dataToPrint.length === 0) {
        toast.error('Tidak ada data untuk diprint');
        return;
      }

      const printWindow = window.open('', '_blank');

      const tableRows = dataToPrint.map((student, index) => {
        return `
            <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: center;">${student.registrationNumber}</td>
            <td>
                <div style="font-weight: 600; font-size: 10px;">${student.fullName}</div>
            </td>
            <td style="text-align: center;">${student.className}</td>
            <td style="text-align: center;">${student.program || '-'}</td>
            <td style="text-align: center;">
                <span style="display: inline-block; padding: 2px 6px; border-radius: 9999px; font-size: 8px; font-weight: 500; ${student.status === 'active' ? 'background-color: #dcfce7; color: #166534;' :
            student.status === 'graduated' ? 'background-color: #e0e7ff; color: #3730a3;' :
              'background-color: #f3f4f6; color: #374151;'
          }">
                ${student.status === 'active' ? 'Aktif' : student.status === 'graduated' ? 'Lulus' : 'Tidak Aktif'}
                </span>
            </td>
            <td style="text-align: right; font-weight: bold; color: ${student.balance > 0 ? '#dc2626' : '#059669'};">
                ${formatCurrency(student.balance || 0)}
            </td>
            </tr>
        `;
      }).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
            <title>Laporan Data Santri - ${new Date().toLocaleDateString('id-ID')}</title>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Arial', sans-serif; padding: 0; font-size: 9px; color: #333; background: white; line-height: 1.2; }
                .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #2563eb; }
                .header h1 { font-size: 18px; color: #1e40af; margin-bottom: 5px; font-weight: 700; text-transform: uppercase; }
                .header-info { display: flex; justify-content: space-between; margin-top: 10px; font-size: 10px; color: #555; }
                .stats { display: flex; gap: 10px; margin-bottom: 20px; }
                .stat { flex: 1; border: 1px solid #e5e7eb; padding: 10px; border-radius: 6px; background-color: #f9fafb; }
                .stat-label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
                .stat-value { font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 2px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background-color: #f3f4f6; color: #1f2937; font-weight: 600; text-transform: uppercase; font-size: 8px; padding: 8px 6px; border-bottom: 1px solid #e5e7eb; border-top: 1px solid #e5e7eb; text-align: left; }
                td { padding: 6px 6px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
                tr:nth-child(even) { background-color: #fcfcfc; }
                .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
                @page { size: A4; margin: 10mm; }
            </style>
            </head>
            <body>
            <div class="header">
                <h1>Laporan Data Santri</h1>
                <div>Management System</div>
                <div class="header-info">
                <span>Tanggal: ${new Date().toLocaleDateString('id-ID')}</span>
                <span>Waktu: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                <span>Total Data: ${dataToPrint.length} Santri</span>
                </div>
            </div>
            <div class="stats">
                <div class="stat"><div class="stat-value">${stats?.total || 0}</div><div class="stat-label">Total Santri</div></div>
                <div class="stat"><div class="stat-value">${formatCurrency(stats?.totalBalance || 0)}</div><div class="stat-label">Total Tagihan</div></div>
                <div class="stat"><div class="stat-value">${stats?.programs?.['Reguler'] || 0}</div><div class="stat-label">Program Reguler</div></div>
                <div class="stat"><div class="stat-value">${stats?.programs?.['Boarding'] || 0}</div><div class="stat-label">Program Boarding</div></div>
            </div>
            <table>
                <thead>
                    <tr>
                    <th style="width: 30px; text-align: center;">#</th>
                    <th style="width: 100px; text-align: center;">No Registrasi</th>
                    <th style="width: 200px;">Nama Lengkap</th>
                    <th style="width: 80px; text-align: center;">Kelas</th>
                    <th style="width: 80px; text-align: center;">Program</th>
                    <th style="width: 80px; text-align: center;">Status</th>
                    <th style="width: 100px; text-align: right;">Tagihan</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
            <div class="footer">Dicetak oleh sistem • ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <script>setTimeout(() => window.print(), 500);</script>
            </body>
        </html>
        `);
      printWindow.document.close();
    } catch (error) {
      toast.dismiss();
      toast.error('Gagal memproses print');
      console.error(error);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      program: '',
      className: '',
      gender: '',
      balanceMin: '',
      balanceMax: '',
      enrollmentFrom: '',
      enrollmentTo: '',
      sortBy: 'newest'
    });
    setSearchQuery('');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.program) count++;
    if (filters.className) count++;
    if (filters.gender) count++;
    if (filters.balanceMin) count++;
    if (filters.balanceMax) count++;
    if (filters.enrollmentFrom) count++;
    if (filters.enrollmentTo) count++;
    if (filters.sortBy !== 'newest') count++;
    if (searchQuery) count++;
    return count;
  };

  // Extract unique options for filters
  // Extract unique options for filters
  const programOptions = stats?.programs ? Object.keys(stats.programs).sort() : ['Boarding', 'Reguler'];
  // Hardcoded standard classes + any others found in data
  const standardClasses = ['Kelas 7', 'Kelas 8', 'Kelas 9', 'Kelas 10', 'Kelas 11', 'Kelas 12'];
  const dataClasses = [...new Set(students.map(s => s.className).filter(Boolean))];
  const classOptions = [...new Set([...standardClasses, ...dataClasses])].sort();

  return (
    <Layout title="Manajemen Santri">
      <div className="space-y-6 print:hidden">
        {/* Stats Carousel */}
        {stats && (
          <StatsCarousel
            stats={[
              {
                label: 'Total Santri',
                value: stats.total,
                subtitle: <><span className="text-green-600 font-medium">{stats.active || 0} Aktif</span> • <span>{stats.inactive || 0} Tidak Aktif</span></>,
                icon: User,
                iconBg: 'bg-blue-50 dark:bg-blue-900/20',
                iconColor: 'text-blue-600 dark:text-blue-400',
                trendIcon: CheckCircle
              },
              {
                label: 'Total Tagihan (Piutang)',
                value: formatCurrency(stats.totalBalance || 0),
                valueColor: 'text-orange-600 dark:text-orange-400',
                subtitle: <><span className="text-red-500 font-medium">{stats.withBalance || 0} Siswa</span> menunggak pembayaran</>,
                icon: AlertCircle,
                iconBg: 'bg-orange-50 dark:bg-orange-900/20',
                iconColor: 'text-orange-600 dark:text-orange-400',
                trendIcon: AlertCircle
              },
              {
                label: 'Reguler',
                value: stats.programs?.['Reguler'] || 0,
                valueColor: 'text-indigo-600 dark:text-indigo-400',
                subtitle: `${stats.total > 0 ? ((stats.programs?.['Reguler'] || 0) / stats.total * 100).toFixed(0) : 0}% dari total santri`,
                icon: User,
                iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
                iconColor: 'text-indigo-600 dark:text-indigo-400',
                trendIcon: CheckCircle
              },
              {
                label: 'Boarding',
                value: stats.programs?.['Boarding'] || 0,
                valueColor: 'text-purple-600 dark:text-purple-400',
                subtitle: `${stats.total > 0 ? ((stats.programs?.['Boarding'] || 0) / stats.total * 100).toFixed(0) : 0}% dari total santri`,
                icon: User,
                iconBg: 'bg-purple-50 dark:bg-purple-900/20',
                iconColor: 'text-purple-600 dark:text-purple-400',
                trendIcon: CheckCircle
              },
              {
                label: 'Jenis Kelamin',
                value: <><span className="text-cyan-600">{stats.genders?.['L'] || 0}</span> <span className="text-gray-400 text-lg">/</span> <span className="text-pink-500">{stats.genders?.['P'] || 0}</span></>,
                subtitle: <><span className="text-cyan-600">Putra</span> / <span className="text-pink-500">Putri</span></>,
                icon: User,
                iconBg: 'bg-gradient-to-br from-cyan-50 to-pink-50 dark:from-cyan-900/20 dark:to-pink-900/20',
                iconColor: 'text-purple-600 dark:text-purple-400',
                trendIcon: User
              },
              {
                label: 'Penerima Beasiswa',
                value: stats.withScholarship || 0,
                valueColor: 'text-amber-600 dark:text-amber-400',
                subtitle: 'Santri dengan potongan beasiswa',
                icon: GraduationCap,
                iconBg: 'bg-amber-50 dark:bg-amber-900/20',
                iconColor: 'text-amber-600 dark:text-amber-400',
                trendIcon: GraduationCap
              },
              {
                label: 'Tagihan Lunas',
                value: (stats.active || 0) - (stats.withBalance || 0),
                valueColor: 'text-green-600 dark:text-green-400',
                subtitle: 'Santri tanpa tunggakan',
                icon: CheckCircle,
                iconBg: 'bg-green-50 dark:bg-green-900/20',
                iconColor: 'text-green-600 dark:text-green-400'
              }
            ]}
            autoPlayInterval={5000}
            visibleCards={4}
          />
        )}

        {/* Search & Filters Toolbar */}
        <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {/* Left: Search - Dynamic Width */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <DebouncedInput
                  type="text"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Cari nama santri, wali, no. HP, atau no. registrasi..."
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-2 flex-wrap lg:flex-nowrap">
              <button
                onClick={() => setShowPromotionModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap shadow-sm"
                title="Kenaikan Kelas / Kelulusan"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Kenaikan Kelas</span>
              </button>

              {/* Bulk Actions Dropdown - Only shows when items selected */}
              {selectedCount > 0 && (
                <div className="relative bulk-actions-container">
                  <button
                    onClick={() => setShowBulkActionsDropdown(!showBulkActionsDropdown)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all shadow-md whitespace-nowrap animate-in fade-in"
                    title="Aksi untuk item terpilih"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    <span>Aksi Massal ({selectedCount})</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showBulkActionsDropdown ? 'rotate-90' : ''}`} />
                  </button>
                  {showBulkActionsDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                      <button
                        onClick={() => {
                          setShowBulkDeleteConfirm(true);
                          setShowBulkActionsDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-left border-b border-gray-100 dark:border-gray-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Hapus {selectedCount} Data</div>
                          <div className="text-xs opacity-75">Hapus santri terpilih</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowBulkStatusModal(true);
                          setShowBulkActionsDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 transition-colors text-left border-b border-gray-100 dark:border-gray-700"
                      >
                        <Edit className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Ubah Status</div>
                          <div className="text-xs opacity-75">Aktif / Lulus / Tidak Aktif</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          handleBulkPrintPin();
                          setShowBulkActionsDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 transition-colors text-left"
                      >
                        <Printer className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Cetak PIN Letter</div>
                          <div className="text-xs opacity-75">Format surat resmi</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors relative whitespace-nowrap ${showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                title="Filter santri berdasarkan status, program, kelas"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
                {activeFilterCount() > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount()}
                  </span>
                )}
              </button>

              {/* Excel Actions Dropdown */}
              <div className="relative excel-dropdown-container">
                <button
                  onClick={() => setShowExcelDropdown(!showExcelDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                  title="Import, Export, atau Update Massal via Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Excel</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showExcelDropdown ? 'rotate-90' : ''}`} />
                </button>
                {showExcelDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setShowImportModal(true);
                        setShowExcelDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors text-left border-b border-gray-100 dark:border-gray-700"
                    >
                      <Upload className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Import Excel</div>
                        <div className="text-xs opacity-75">Tambah santri baru dari file</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        handleExport();
                        setShowExcelDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors text-left border-b border-gray-100 dark:border-gray-700"
                    >
                      <Download className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Export Excel ({totalItems})</div>
                        <div className="text-xs opacity-75">Download data hasil filter</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowUpdateModal(true);
                        setShowExcelDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 transition-colors text-left"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Update Massal</div>
                        <div className="text-xs opacity-75">Edit data dari file Excel</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handlePrintTable}
                className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                title="Print daftar santri"
              >
                <Printer className="w-5 h-5" />
              </button>

              {activeFilterCount() > 0 && (
                <button
                  onClick={resetFilters}
                  className="p-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors"
                  title="Reset Filter"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="graduated">Lulus</option>
                    <option value="inactive">Tidak Aktif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Program</label>
                  <select
                    value={filters.program}
                    onChange={(e) => setFilters(prev => ({ ...prev, program: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Semua Program</option>
                    {programOptions.map(prog => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Jenis Kelamin</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Semua Jenis Kelamin</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kelas</label>
                  <select
                    value={filters.className}
                    onChange={(e) => setFilters(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Semua Kelas</option>
                    {classOptions.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Urutkan</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="newest">Terbaru Ditambahkan</option>
                    <option value="name-asc">Nama (A-Z)</option>
                    <option value="name-desc">Nama (Z-A)</option>
                    <option value="class-asc">Kelas (Terendah)</option>
                    <option value="class-desc">Kelas (Tertinggi)</option>
                    <option value="balance-desc">Tagihan Tertinggi</option>
                  </select>
                </div>

                {/* Balance Range Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Rentang Tagihan (Min)
                  </label>
                  <input
                    type="number"
                    value={filters.balanceMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, balanceMin: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Rentang Tagihan (Max)
                  </label>
                  <input
                    type="number"
                    value={filters.balanceMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, balanceMax: e.target.value }))}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                {/* Enrollment Date Range */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Tanggal Masuk (Dari)
                  </label>
                  <input
                    type="date"
                    value={filters.enrollmentFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, enrollmentFrom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Tanggal Masuk (Sampai)
                  </label>
                  <input
                    type="date"
                    value={filters.enrollmentTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, enrollmentTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">Foto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">No Registrasi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kelas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tagihan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  // Skeleton Loading Rows
                  [...Array(10)].map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-28 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-600 rounded"></div>
                          <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded"></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                          <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Tidak ada data santri</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Silakan tambah santri baru untuk memulai</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User size={20} className="text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-300">{student.registrationNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{student.fullName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {student.gender === 'L' ? 'Laki-laki' : student.gender === 'P' ? 'Perempuan' : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{student.className}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                          {student.program || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(student.balance || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.status === 'active'
                          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800'
                          : student.status === 'graduated'
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                          }`}>
                          {student.status === 'active' ? 'Aktif' : student.status === 'graduated' ? 'Lulus' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowDeleteDialog(true);
                            }}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              // Navigate to Liabilities with student filter
                              navigate(`/liabilities?studentId=${student.id}`);
                            }}
                            className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 rounded transition-colors"
                            title="Tambah Pembayaran"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => {
                              const phone = student.guardianPhone || student.guardianWhatsapp;
                              if (phone) {
                                // Format phone number for WhatsApp
                                let formattedPhone = phone.replace(/\D/g, '');
                                if (formattedPhone.startsWith('0')) {
                                  formattedPhone = '62' + formattedPhone.slice(1);
                                }
                                window.open(`https://wa.me/${formattedPhone}`, '_blank');
                              }
                            }}
                            disabled={!student.guardianPhone && !student.guardianWhatsapp}
                            className={`p-1.5 rounded transition-colors ${student.guardianPhone || student.guardianWhatsapp
                              ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              }`}
                            title={student.guardianPhone || student.guardianWhatsapp ? 'Hubungi via WhatsApp' : 'Tidak ada nomor HP'}
                          >
                            <MessageCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <span className="hidden sm:inline">Tampilkan</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>dari {totalItems} santri</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Smart pagination logic for many pages could go here, for now simple slice
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${currentPage === pageNum
                          ? 'bg-blue-600 text-white font-medium'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                          }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Santri Baru"
        size="lg"
      >
        <StudentForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStudent(null);
        }}
        title="Edit Data Santri"
        size="lg"
      >
        <StudentForm
          student={selectedStudent}
          onSubmit={handleEdit}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedStudent(null);
          }}
          loading={formLoading}
        />
      </Modal>

      {/* Import Modal */}
      <StudentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false);
          loadStudents();
          loadStats();
        }}
      />

      {/* Update Modal */}
      <StudentUpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSuccess={handleBulkUpdate}
      />

      {/* Detail Modal */}
      {showDetailModal && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedStudent(null);
            setResetPinResult(null);
          }}
        />
      )}


      {/* Reset PIN Confirmation */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmResetPin}
        title="Reset PIN & Password"
        message={`Apakah Anda yakin ingin mereset PIN untuk ${selectedStudent?.fullName}? PIN lama tidak akan bisa digunakan lagi.`}
        confirmText="Reset PIN"
        cancelText="Batal"
        type="warning"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Hapus Santri"
        message={`Apakah Anda yakin ingin menghapus data santri ${selectedStudent?.fullName}? Data yang dihapus tidak dapat dikembalikan.`}
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Hapus Santri Massal"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} data santri terpilih? Data yang dihapus tidak dapat dikembalikan.`}
        confirmText={`Hapus ${selectedIds.length} Data`}
        cancelText="Batal"
        type="danger"
      />

      {/* Class Promotion Modal */}
      {showPromotionModal && (
        <ClassPromotionModal
          onClose={() => setShowPromotionModal(false)}
          onSuccess={() => {
            loadStudents();
            loadStats();
          }}
        />
      )}

      {/* Bulk Status Update Modal */}
      {showBulkStatusModal && (
        <Modal
          isOpen={showBulkStatusModal}
          onClose={() => setShowBulkStatusModal(false)}
          title="Ubah Status Massal"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Pilih status baru untuk <strong>{selectedIds.length} data santri</strong> yang dipilih:
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status Baru</label>
              <select
                value={bulkStatusTarget}
                onChange={(e) => setBulkStatusTarget(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">-- Pilih Status --</option>
                <option value="active">Aktif</option>
                <option value="graduated">Lulus</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowBulkStatusModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatusTarget}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </Modal>
      )}

    </Layout>
  );
}
