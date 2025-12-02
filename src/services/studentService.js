import db from '../config/database';

// Get all students
export const getAllStudents = async (filters = {}) => {
  try {
    let query = db.students;
    
    // Filter by status
    if (filters.status) {
      query = query.where('status').equals(filters.status);
    }
    
    // Filter by program
    if (filters.program) {
      query = query.where('program').equals(filters.program);
    }
    
    // Filter by gender
    if (filters.gender) {
      query = query.where('gender').equals(filters.gender);
    }
    
    // Filter by class
    if (filters.className) {
      query = query.where('className').equals(filters.className);
    }
    
    const students = await query.toArray();
    
    // Search by name or registration number
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return students.filter(student => 
        student.fullName.toLowerCase().includes(searchLower) ||
        student.registrationNumber.toLowerCase().includes(searchLower)
      );
    }
    
    return students;
  } catch (error) {
    console.error('Error getting students:', error);
    throw error;
  }
};

// Get student by ID
export const getStudentById = async (id) => {
  try {
    return await db.students.get(id);
  } catch (error) {
    console.error('Error getting student:', error);
    throw error;
  }
};

// Get student by registration number
export const getStudentByRegistrationNumber = async (registrationNumber) => {
  try {
    return await db.students
      .where('registrationNumber')
      .equals(registrationNumber)
      .first();
  } catch (error) {
    console.error('Error getting student by registration number:', error);
    throw error;
  }
};

// Create new student
export const createStudent = async (studentData) => {
  try {
    // Generate registration number based on class
    const registrationNumber = await generateRegistrationNumber(studentData.className);
    
    // Check if registration number already exists (safety check)
    const existing = await getStudentByRegistrationNumber(registrationNumber);
    if (existing) {
      // Regenerate if somehow duplicate
      const newRegNumber = await generateRegistrationNumber(studentData.className);
      studentData.registrationNumber = newRegNumber;
    } else {
      studentData.registrationNumber = registrationNumber;
    }
    
    const newStudent = {
      ...studentData,
      status: studentData.status || 'active',
      enrollmentDate: studentData.enrollmentDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const id = await db.students.add(newStudent);
    return { id, ...newStudent };
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

// Update student
export const updateStudent = async (id, studentData) => {
  try {
    const updated = {
      ...studentData,
      updatedAt: new Date(),
    };
    
    await db.students.update(id, updated);
    return await getStudentById(id);
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

// Delete student
export const deleteStudent = async (id) => {
  try {
    // Check if student has liabilities
    const liabilities = await db.liabilities
      .where('studentId')
      .equals(id)
      .count();
    
    if (liabilities > 0) {
      throw new Error('Tidak dapat menghapus santri yang memiliki tanggungan');
    }
    
    await db.students.delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

// Get student statistics
export const getStudentStats = async () => {
  try {
    const allStudents = await db.students.toArray();
    
    return {
      total: allStudents.length,
      active: allStudents.filter(s => s.status === 'active').length,
      inactive: allStudents.filter(s => s.status === 'inactive').length,
      boarding: allStudents.filter(s => s.program === 'boarding').length,
      nonBoarding: allStudents.filter(s => s.program === 'non-boarding').length,
      male: allStudents.filter(s => s.gender === 'male').length,
      female: allStudents.filter(s => s.gender === 'female').length,
    };
  } catch (error) {
    console.error('Error getting student stats:', error);
    throw error;
  }
};

// Generate next registration number with format: YYYY/CLASS/XXX
export const generateRegistrationNumber = async (className, academicYear, program) => {
  try {
    // Format tahun ajaran
    const yearFormat = academicYear || `${new Date().getFullYear() + 1}`;
    
    // Format kelas-program
    const classCode = className ? className.replace(/\s+/g, '-').toUpperCase() : 'REG';
    const programCode = program ? program.toUpperCase() : '';
    const classProgram = programCode ? `${classCode}-${programCode}` : classCode;
    
    // Get all students
    const students = await db.students.toArray();
    
    // Filter students dengan pattern yang sama
    const samePattern = students.filter(s => 
      s.registrationNumber && 
      s.registrationNumber.startsWith(`${yearFormat}/${classProgram}/`)
    );
    
    // Ambil semua nomor urut dan cari yang tertinggi
    const sequences = samePattern.map(s => {
      const parts = s.registrationNumber.split('/');
      return parseInt(parts[2]) || 0;
    });
    
    const maxSequence = sequences.length > 0 ? Math.max(...sequences) : 0;
    const nextSequence = (maxSequence + 1).toString().padStart(4, '0');
    
    return `${yearFormat}/${classProgram}/${nextSequence}`;
  } catch (error) {
    console.error('Error generating registration number:', error);
    throw error;
  }
};

// Bulk import students
export const bulkImportStudents = async (studentsData) => {
  try {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const studentData of studentsData) {
      try {
        await createStudent(studentData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          data: studentData,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error bulk importing students:', error);
    throw error;
  }
};

// Export students to array
export const exportStudents = async (filters = {}) => {
  try {
    const students = await getAllStudents(filters);
    
    return students.map(student => ({
      'Nomor Registrasi': student.registrationNumber,
      'Nama Lengkap': student.fullName,
      'Kelas': student.className,
      'Program': student.program === 'boarding' ? 'Boarding' : 'Non-Boarding',
      'Jenis Kelamin': student.gender === 'male' ? 'Laki-laki' : 'Perempuan',
      'Alamat': student.address,
      'No. Telepon': student.phoneNumber,
      'Wali': student.guardian?.name || '-',
      'No. Telepon Wali': student.guardian?.phone || '-',
      'Status': student.status === 'active' ? 'Aktif' : 'Tidak Aktif',
      'Tanggal Masuk': new Date(student.enrollmentDate).toLocaleDateString('id-ID'),
    }));
  } catch (error) {
    console.error('Error exporting students:', error);
    throw error;
  }
};