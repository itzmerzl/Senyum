import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { printThermalReceipt } from '../../../utils/printHelper';
import { getStoreSettings } from '../../../services/settingService';

export default function StudentForm({ student, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'L', // Default to Laki-laki
    className: '',
    program: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    scholarshipPercent: 0,
    status: 'active',
    enrollmentDate: new Date().toISOString().split('T')[0],
    notes: '',
    photoUrl: ''
  });

  const [errors, setErrors] = useState({});
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (student) {
      setFormData({
        fullName: student.fullName || '',
        gender: student.gender || 'L',
        className: student.className || '',
        program: student.program || '',
        guardianName: student.guardianName || '',
        guardianPhone: student.guardianPhone || '',
        address: student.address || '',
        scholarshipPercent: student.scholarshipPercent || 0,
        status: student.status || 'active',
        enrollmentDate: student.enrollmentDate
          ? new Date(student.enrollmentDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        notes: student.notes || '',
        photoUrl: student.photoUrl || ''
      });
      if (student.photoUrl) {
        setImagePreview(student.photoUrl);
      }
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImagePreview(base64String);
        setFormData(prev => ({
          ...prev,
          photoUrl: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      photoUrl: ''
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nama lengkap wajib diisi';
    }

    if (!formData.className.trim()) {
      newErrors.className = 'Kelas wajib diisi';
    }

    if (formData.scholarshipPercent < 0 || formData.scholarshipPercent > 100) {
      newErrors.scholarshipPercent = 'Beasiswa harus antara 0-100%';
    }

    // Phone number validation (Indonesian format)
    if (formData.guardianPhone) {
      const phoneClean = formData.guardianPhone.replace(/\D/g, '');
      const phoneRegex = /^(08|628|\+628)[0-9]{8,12}$/;
      if (!phoneRegex.test(phoneClean) && phoneClean.length > 0) {
        newErrors.guardianPhone = 'Format nomor HP tidak valid (contoh: 08123456789)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      ...formData,
      scholarshipPercent: parseFloat(formData.scholarshipPercent),
      enrollmentDate: formData.enrollmentDate ? new Date(formData.enrollmentDate) : null
    };

    const result = await onSubmit(submitData);

    if (result && result.generatedPin && !student) {
      setGeneratedCredentials({
        registrationNumber: result.student.registrationNumber,
        pin: result.generatedPin
      });
    }
  };

  // Show generated credentials after creation
  if (generatedCredentials) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Santri Berhasil Ditambahkan!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Berikut adalah kredensial login untuk cek tagihan:</p>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4 shadow-sm">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nomor Registrasi</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                {generatedCredentials.registrationNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">PIN (6 Digit)</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono tracking-wider">
                {generatedCredentials.pin}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ <strong>PENTING:</strong> Catat PIN ini sekarang! PIN tidak akan ditampilkan lagi setelah halaman ini ditutup.
              Berikan kepada wali santri dalam amplop tertutup.
            </p>
          </div>

          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={async () => {
                const settings = await getStoreSettings();
                printThermalReceipt({
                  studentName: formData.fullName,
                  registrationNumber: generatedCredentials.registrationNumber,
                  pin: generatedCredentials.pin,
                  type: 'NEW',
                  storeSettings: settings
                });
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2-2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
              Cetak Struk
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Student Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Informasi Santri
        </h3>

        {/* Profile Picture Upload */}
        <div className="flex items-center gap-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foto Profil
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/40"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              PNG, JPG atau JPEG. Maksimal 2MB.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="Masukkan nama lengkap"
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kelas <span className="text-red-500">*</span>
            </label>
            <select
              name="className"
              value={formData.className}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.className ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
            >
              <option value="">Pilih Kelas</option>
              <optgroup label="Tingkat SMP" className="dark:text-gray-300">
                <option value="Kelas 7">Kelas 7</option>
                <option value="Kelas 8">Kelas 8</option>
                <option value="Kelas 9">Kelas 9</option>
              </optgroup>
              <optgroup label="Tingkat SMA" className="dark:text-gray-300">
                <option value="Kelas 10">Kelas 10</option>
                <option value="Kelas 11">Kelas 11</option>
                <option value="Kelas 12">Kelas 12</option>
              </optgroup>
            </select>
            {errors.className && (
              <p className="text-xs text-red-500 mt-1">{errors.className}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Jenis Kelamin
            </label>
            <select
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Program
            </label>
            <select
              name="program"
              value={formData.program}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Pilih Program</option>
              <option value="Reguler">Reguler</option>
              <option value="Boarding">Boarding</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="active">Aktif</option>
              <option value="graduated">Lulus</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tanggal Masuk
            </label>
            <input
              type="date"
              name="enrollmentDate"
              value={formData.enrollmentDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Beasiswa (%)
            </label>
            <input
              type="number"
              name="scholarshipPercent"
              value={formData.scholarshipPercent}
              onChange={handleChange}
              min="0"
              max="100"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.scholarshipPercent ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="0-100"
            />
            {errors.scholarshipPercent && (
              <p className="text-xs text-red-500 mt-1">{errors.scholarshipPercent}</p>
            )}
          </div>
        </div>
      </div>

      {/* Guardian Information */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Informasi Wali/Orang Tua
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nama Wali
            </label>
            <input
              type="text"
              name="guardianName"
              value={formData.guardianName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Nama ayah/ibu/wali"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              No. WhatsApp / HP (Wali)
            </label>
            <input
              type="tel"
              name="guardianPhone"
              value={formData.guardianPhone}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.guardianPhone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="Contoh: 08123456789"
            />
            {errors.guardianPhone && (
              <p className="text-xs text-red-500 mt-1">{errors.guardianPhone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address & Notes */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Informasi Tambahan
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Alamat
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Alamat lengkap santri"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Catatan
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Catatan internal (tidak ditampilkan ke wali)"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
          disabled={loading}
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={loading}
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          {student ? 'Simpan Perubahan' : 'Tambah Santri'}
        </button>
      </div>
    </form >
  );
}