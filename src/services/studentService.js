import api from '../utils/apiClient';

const API_URL = 'students';

/**
 * Get all students (Paginated)
 * @param {Object} params - { page, limit, search, status, program, ... }
 */
export const getAllStudents = async (params = {}) => {
  // Convert params to query string
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`${API_URL}?${query}`);
  return response;
};

/**
 * Public Billing Check
 */
export const checkPublicBilling = async (data) => {
  // data = { registrationNumber, pin }
  const response = await api.post('public/check-billing', data);
  return response;
};

/**
 * Get student by ID
 */
export const getStudentById = async (id) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response;
};

/**
 * Create new student
 * Backend will auto-generate registrationNumber and PIN
 */
export const createStudent = async (data) => {
  const response = await api.post(API_URL, data);
  return response;
};

/**
 * Bulk create students (faster than one-by-one)
 * @param {Array} students - Array of student data objects
 */
export const bulkCreateStudents = async (students) => {
  const response = await api.post(`${API_URL}/bulk`, { students });
  return response;
};

export const resetStudentPin = async (id) => {
  const response = await api.post(`${API_URL}/${id}/reset-pin`);
  return response;
};

// Alias for backward compatibility
export const resetPin = resetStudentPin;

/**
 * Update student
 */
export const updateStudent = async (id, data) => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response;
};

/**
 * Soft delete student
 */
export const deleteStudent = async (id) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response;
};

/**
 * Get student history/activity log
 */
export const getStudentHistory = async (id) => {
  const response = await api.get(`${API_URL}/${id}/history`);
  return response;
};

/**
 * Get student statistics (Efficient Server-side)
 */
export const getStudentStats = async () => {
  try {
    const response = await api.get(`${API_URL}/stats`);
    return response;
  } catch (error) {
    console.error('Failed to load stats:', error);
    return { total: 0, active: 0, inactive: 0, withBalance: 0, programs: {} };
  }
};

/**
 * Export students to Excel
 */
export const exportStudents = async (filters = {}) => {
  // Fetch all students with large limit to ensure complete export
  const response = await getAllStudents({ limit: 100000, ...filters });
  const students = response.data || response;

  // Apply filters if provided
  if (filters.status) {
    students = students.filter(s => s.status === filters.status);
  }
  if (filters.program) {
    students = students.filter(s => s.program === filters.program);
  }
  if (filters.className) {
    students = students.filter(s =>
      s.className?.toLowerCase().includes(filters.className.toLowerCase())
    );
  }

  // Format for export
  return students.map(s => ({
    'No. Registrasi': s.registrationNumber,
    'Nama Lengkap': s.fullName,
    'Kelas': s.className || '-',
    'Program': s.program || '-',
    'Status': s.status === 'active' ? 'Aktif' : 'Tidak Aktif',
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
};

/**
 * Bulk update students
 * @param {Array} updates - Array of {id OR registrationNumber, ...fields}
 */
export const bulkUpdateStudents = async (updates) => {
  const results = {
    success: [],
    failed: []
  };
  // Pre-fetch all students to build a lookup map if we have registration numbers but no IDs
  const needsLookup = updates.some(u => !u.id && u.registrationNumber);
  let studentMap = {};

  if (needsLookup) {
    try {
      // Fetch all students with large limit to ensure we find matches
      // Only needing id and registrationNumber theoretically, but API returns full object
      const response = await getAllStudents({ limit: 100000 });
      const allData = response.data || response;

      allData.forEach(s => {
        studentMap[s.registrationNumber] = s.id;
      });
    } catch (err) {
      console.error('Failed to load students for bulk update lookup', err);
    }
  }

  for (const update of updates) {
    try {
      // Find by ID or registrationNumber
      let studentId = update.id;

      if (!studentId && update.registrationNumber) {
        studentId = studentMap[update.registrationNumber];
      }

      if (!studentId) {
        results.failed.push({
          data: update,
          error: 'Student not found'
        });
        continue;
      }

      // Remove id and registrationNumber from update payload
      const { id, registrationNumber, ...updateData } = update;

      await updateStudent(studentId, updateData);
      results.success.push(studentId);
    } catch (error) {
      results.failed.push({
        data: update,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Bulk promote students
 */
export const bulkPromoteStudents = async (data) => {
  const response = await api.post(`${API_URL}/promote`, data);
  return response;
};
