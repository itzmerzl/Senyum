import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Download, Filter, User } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import SearchBar from '../components/common/SearchBar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StudentForm from '../components/features/students/StudentForm';
import { 
  getAllStudents, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  getStudentStats,
  exportStudents
} from '../services/studentService';
import { formatDate, formatPhoneNumber } from '../utils/formatters';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    program: '',
    gender: '',
    className: ''
  });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  useEffect(() => {
    loadStudents();
    loadStats();
  }, []);
  
  useEffect(() => {
    filterStudents();
  }, [searchQuery, filters, students]);
  
  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await getAllStudents();
      setStudents(data);
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
      console.error(error);
    }
  };
  
  const filterStudents = () => {
    let result = [...students];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.fullName.toLowerCase().includes(query) ||
        s.registrationNumber.toLowerCase().includes(query) ||
        s.className.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (filters.status) {
      result = result.filter(s => s.status === filters.status);
    }
    
    // Program filter
    if (filters.program) {
      result = result.filter(s => s.program === filters.program);
    }
    
    // Gender filter
    if (filters.gender) {
      result = result.filter(s => s.gender === filters.gender);
    }
    
    // Class filter
    if (filters.className) {
      result = result.filter(s => 
        s.className.toLowerCase().includes(filters.className.toLowerCase())
      );
    }
    
    setFilteredStudents(result);
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
      toast.error(error.message || 'Gagal menambahkan santri');
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
      toast.error(error.message || 'Gagal memperbarui data santri');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDelete = async () => {
    try {
      setFormLoading(true);
      await deleteStudent(selectedStudent.id);
      toast.success('Santri berhasil dihapus');
      setShowDeleteDialog(false);
      setSelectedStudent(null);
      loadStudents();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus santri');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleExport = async () => {
    try {
      const data = await exportStudents(filters);
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Santri');
      XLSX.writeFile(wb, `data-santri-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Data berhasil diexport');
    } catch (error) {
      toast.error('Gagal export data');
      console.error(error);
    }
  };
  
  const resetFilters = () => {
    setFilters({
      status: '',
      program: '',
      gender: '',
      className: ''
    });
    setSearchQuery('');
  };
  
  return (
    <Layout>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Santri</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Aktif</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Boarding</p>
            <p className="text-2xl font-bold text-purple-600">{stats.boarding}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Non-Boarding</p>
            <p className="text-2xl font-bold text-orange-600">{stats.nonBoarding}</p>
          </div>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder="Cari nama, no. registrasi, atau kelas..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Tambah Santri</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
          
          <select
            value={filters.program}
            onChange={(e) => setFilters(prev => ({ ...prev, program: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Program</option>
            <option value="boarding">Boarding</option>
            <option value="non-boarding">Non-Boarding</option>
          </select>
          
          <select
            value={filters.gender}
            onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Jenis Kelamin</option>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
          </select>
          
          <input
            type="text"
            value={filters.className}
            onChange={(e) => setFilters(prev => ({ ...prev, className: e.target.value }))}
            placeholder="Filter Kelas"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            <Filter size={16} />
            Reset
          </button>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Foto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">No Registrasi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Kelas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Program</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Jenis Kelamin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="spinner"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                    <User size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Tidak ada data santri</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User size={20} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.registrationNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{student.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.className}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.program === 'boarding' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {student.program === 'boarding' ? 'Boarding' : 'Non-Boarding'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {student.gender === 'male' ? 'L' : 'P'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowDetailModal(true);
                          }}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-yellow-50 text-yellow-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowDeleteDialog(true);
                          }}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Info */}
        {filteredStudents.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Menampilkan {filteredStudents.length} dari {students.length} santri
            </p>
          </div>
        )}
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
      
      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedStudent(null);
        }}
        title="Detail Santri"
        size="md"
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                {selectedStudent.photoUrl ? (
                  <img src={selectedStudent.photoUrl} alt={selectedStudent.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={40} className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">No Registrasi</p>
                <p className="font-medium text-gray-900">{selectedStudent.registrationNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  selectedStudent.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedStudent.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Nama Lengkap</p>
                <p className="font-medium text-gray-900">{selectedStudent.fullName}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Kelas</p>
                <p className="font-medium text-gray-900">{selectedStudent.className}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Program</p>
                <p className="font-medium text-gray-900">
                  {selectedStudent.program === 'boarding' ? 'Boarding' : 'Non-Boarding'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Jenis Kelamin</p>
                <p className="font-medium text-gray-900">
                  {selectedStudent.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">No. Telepon</p>
                <p className="font-medium text-gray-900">{formatPhoneNumber(selectedStudent.phoneNumber)}</p>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Alamat</p>
                <p className="font-medium text-gray-900">{selectedStudent.address}</p>
              </div>
              
              <div className="col-span-2 border-t pt-3">
                <p className="text-sm font-semibold text-gray-900 mb-2">Data Wali</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Nama Wali</p>
                    <p className="font-medium text-gray-900">{selectedStudent.guardian?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">No. Telepon</p>
                    <p className="font-medium text-gray-900">{formatPhoneNumber(selectedStudent.guardian?.phone) || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Tanggal Masuk</p>
                <p className="font-medium text-gray-900">{formatDate(selectedStudent.enrollmentDate)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Santri"
        message={`Apakah Anda yakin ingin menghapus data santri "${selectedStudent?.fullName}"? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Hapus"
        loading={formLoading}
      />
    </Layout>
  );
}