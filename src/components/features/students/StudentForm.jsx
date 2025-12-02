import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import ImageUploader from '../../common/ImageUploader';
import { generateRegistrationNumber } from '../../../services/studentService';
import { validateForm } from '../../../utils/validators';

export default function StudentForm({ 
  student = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) {
  const [formData, setFormData] = useState({
    registrationNumber: '',
    fullName: '',
    className: '',
    program: 'boarding',
    gender: 'male',
    address: '',
    phoneNumber: '',
    guardian: {
      name: '',
      phone: '',
      relation: 'Orang Tua'
    },
    photoUrl: '',
    status: 'active',
    enrollmentDate: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (student) {
      setFormData({
        ...student,
        enrollmentDate: new Date(student.enrollmentDate).toISOString().split('T')[0]
      });
    } else {
      // Generate registration number for new student
      generateRegistrationNumber().then(regNum => {
        setFormData(prev => ({ ...prev, registrationNumber: regNum }));
      });
    }
  }, [student]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('guardian.')) {
      const guardianField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        guardian: {
          ...prev.guardian,
          [guardianField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleImageChange = (imageUrl) => {
    setFormData(prev => ({ ...prev, photoUrl: imageUrl }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(formData, {
      registrationNumber: [
        { type: 'required', message: 'Nomor registrasi wajib diisi' }
      ],
      fullName: [
        { type: 'required', message: 'Nama lengkap wajib diisi' },
        { type: 'minLength', value: 3, message: 'Nama minimal 3 karakter' }
      ],
      className: [
        { type: 'required', message: 'Kelas wajib diisi' }
      ],
      address: [
        { type: 'required', message: 'Alamat wajib diisi' }
      ],
      phoneNumber: [
        { type: 'phone', message: 'Nomor telepon tidak valid' }
      ]
    });
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <div className="flex justify-center">
        <ImageUploader
          currentImage={formData.photoUrl}
          onImageChange={handleImageChange}
        />
      </div>
      
      {/* Registration Number & Status */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nomor Registrasi <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="registrationNumber"
          value={formData.registrationNumber}
          onChange={handleChange}
          disabled={true}
          className={`w-full px-4 py-2 border ${errors.registrationNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 cursor-not-allowed`}
          placeholder="S000001"
        />
        {errors.registrationNumber && (
          <p className="text-sm text-red-600 mt-1">{errors.registrationNumber}</p>
        )}
      </div>
              
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>
      </div>
    </div>
      
      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className={`w-full px-4 py-2 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="Masukkan nama lengkap"
        />
        {errors.fullName && (
          <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>
        )}
      </div>
      
      {/* Class, Program, Gender */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kelas <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="className"
            value={formData.className}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${errors.className ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="Masukkan kelas (VII, VIII, dst)"
          />
          {errors.className && (
            <p className="text-sm text-red-600 mt-1">{errors.className}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Program
          </label>
          <select
            name="program"
            value={formData.program}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="boarding">Boarding</option>
            <option value="non-boarding">Non-Boarding</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jenis Kelamin
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
          </select>
        </div>
      </div>
      
      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alamat <span className="text-red-500">*</span>
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows="3"
          className={`w-full px-4 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="Masukkan alamat lengkap"
        ></textarea>
        {errors.address && (
          <p className="text-sm text-red-600 mt-1">{errors.address}</p>
        )}
      </div>
      
      {/* Phone & Enrollment Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            No. Telepon
          </label>
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="08xxxxxxxxxx"
          />
          {errors.phoneNumber && (
            <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Masuk
          </label>
          <input
            type="date"
            name="enrollmentDate"
            value={formData.enrollmentDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Guardian Info */}
      <div className="border-t pt-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Data Wali</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Wali
            </label>
            <input
              type="text"
              name="guardian.name"
              value={formData.guardian.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nama wali"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No. Telepon Wali
            </label>
            <input
              type="text"
              name="guardian.phone"
              value={formData.guardian.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="08xxxxxxxxxx"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hubungan
            </label>
            <input
              type="text"
              name="guardian.relation"
              value={formData.guardian.relation}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Orang Tua"
            />
          </div>
        </div>
      </div>
      
      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <X size={18} />
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="spinner w-4 h-4 border-2"></div>
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={18} />
              Simpan
            </>
          )}
        </button>
      </div>
    </form>
  );
}