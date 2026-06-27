import { supabase } from '../utils/supabaseClient';
import { generateAlphanumericPin, hashPin, verifyPin } from '../utils/pinHelpers';

const TABLE_NAME = 'students';

/**
 * Mapper: DB (snake_case) to Frontend (camelCase)
 */
const mapStudentFromDb = (s) => {
  if (!s) return null;
  return {
    id: s.id,
    registrationNumber: s.registration_number,
    billingPin: s.billing_pin,
    plainPin: s.plain_pin,
    pinSetAt: s.pin_set_at,
    fullName: s.full_name,
    name: s.full_name, // For compatibility with result.student.name in UI
    gender: s.gender,
    photoUrl: s.photo_url,
    className: s.class_name,
    program: s.program,
    guardianName: s.guardian_name,
    guardianPhone: s.guardian_phone,
    guardianWhatsapp: s.guardian_whatsapp,
    status: s.status,
    enrollmentDate: s.enrollment_date,
    graduationDate: s.graduation_date,
    scholarshipPercent: s.scholarship_percent,
    totalLiabilities: s.total_liabilities,
    totalPaid: s.total_paid,
    balance: s.balance,
    lastPaymentDate: s.last_payment_date,
    address: s.address,
    notes: s.notes,
    createdAt: s.created_at,
    updatedAt: s.updated_at
  };
};

/**
 * Mapper: Frontend (camelCase) to DB (snake_case)
 */
const mapStudentToDb = (s) => {
  if (!s) return null;
  const dbObj = {};
  if (s.registrationNumber !== undefined) dbObj.registration_number = s.registrationNumber;
  if (s.billingPin !== undefined) dbObj.billing_pin = s.billingPin;
  if (s.plainPin !== undefined) dbObj.plain_pin = s.plainPin;
  if (s.pinSetAt !== undefined) dbObj.pin_set_at = s.pinSetAt;
  if (s.fullName !== undefined) dbObj.full_name = s.fullName;
  if (s.gender !== undefined) dbObj.gender = s.gender;
  if (s.photoUrl !== undefined) dbObj.photo_url = s.photoUrl;
  if (s.className !== undefined) dbObj.class_name = s.className;
  if (s.program !== undefined) dbObj.program = s.program;
  if (s.guardianName !== undefined) dbObj.guardian_name = s.guardianName;
  if (s.guardianPhone !== undefined) dbObj.guardian_phone = s.guardianPhone;
  if (s.guardianWhatsapp !== undefined) dbObj.guardian_whatsapp = s.guardianWhatsapp;
  if (s.status !== undefined) dbObj.status = s.status;
  if (s.enrollmentDate !== undefined) dbObj.enrollment_date = s.enrollmentDate;
  if (s.graduationDate !== undefined) dbObj.graduation_date = s.graduationDate;
  if (s.scholarshipPercent !== undefined) dbObj.scholarship_percent = parseFloat(s.scholarshipPercent) || 0;
  if (s.totalLiabilities !== undefined) dbObj.total_liabilities = parseFloat(s.totalLiabilities) || 0;
  if (s.totalPaid !== undefined) dbObj.total_paid = parseFloat(s.totalPaid) || 0;
  if (s.balance !== undefined) dbObj.balance = parseFloat(s.balance) || 0;
  if (s.lastPaymentDate !== undefined) dbObj.last_payment_date = s.lastPaymentDate;
  if (s.address !== undefined) dbObj.address = s.address;
  if (s.notes !== undefined) dbObj.notes = s.notes;
  if (s.deletedAt !== undefined) dbObj.deleted_at = s.deletedAt;
  return dbObj;
};

/**
 * Generate Next Registration Number
 */
const generateRegNumber = async () => {
  const year = new Date().getFullYear();
  const { count, error } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true })
    .like('registration_number', `REG/${year}/%`);

  if (error) throw error;
  const nextNum = (count || 0) + 1;
  return `REG/${year}/${nextNum.toString().padStart(4, '0')}`;
};

/**
 * Log Student History
 */
export const logStudentHistory = async (studentId, action, description, details = null, performedBy = 'System') => {
  try {
    await supabase.from('student_history').insert({
      student_id: parseInt(studentId),
      action,
      description,
      details: details ? JSON.stringify(details) : null,
      performed_by: performedBy
    });
  } catch (error) {
    console.error('Failed to log student history:', error);
  }
};

/**
 * Get all students (Paginated)
 */
export const getAllStudents = async (params = {}) => {
  let query = supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact' });

  // Exclude deleted students
  query = query.is('deleted_at', null);

  // Search filter
  if (params.search) {
    const searchVal = `%${params.search}%`;
    query = query.or(`full_name.ilike.${searchVal},registration_number.ilike.${searchVal},guardian_name.ilike.${searchVal},guardian_phone.ilike.${searchVal}`);
  }

  // Exact matches
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.program) {
    query = query.eq('program', params.program);
  }
  if (params.className) {
    query = query.eq('class_name', params.className);
  }
  if (params.gender) {
    query = query.eq('gender', params.gender);
  }

  // Range filters
  if (params.balanceMin !== undefined && params.balanceMin !== '') {
    query = query.gte('balance', parseFloat(params.balanceMin));
  }
  if (params.balanceMax !== undefined && params.balanceMax !== '') {
    query = query.lte('balance', parseFloat(params.balanceMax));
  }

  if (params.enrollmentFrom) {
    query = query.gte('enrollment_date', params.enrollmentFrom);
  }
  if (params.enrollmentTo) {
    query = query.lte('enrollment_date', params.enrollmentTo);
  }

  // Sorting
  const sortBy = params.sortBy || 'newest';
  if (sortBy === 'newest') {
    query = query.order('registration_number', { ascending: false });
  } else if (sortBy === 'oldest') {
    query = query.order('registration_number', { ascending: true });
  } else if (sortBy === 'name-asc') {
    query = query.order('full_name', { ascending: true });
  } else if (sortBy === 'name-desc') {
    query = query.order('full_name', { ascending: false });
  } else if (sortBy === 'balance-highest') {
    query = query.order('balance', { ascending: false });
  } else if (sortBy === 'balance-lowest') {
    query = query.order('balance', { ascending: true });
  }

  // Pagination
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data: data.map(mapStudentFromDb),
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * Public Billing Check
 */
export const checkPublicBilling = async (data) => {
  const { registrationNumber, pin } = data;
  
  const { data: student, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('registration_number', registrationNumber)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!student) throw new Error('Santri tidak ditemukan');

  const isPinValid = await verifyPin(pin, student.billing_pin);
  if (!isPinValid) throw new Error('PIN salah');

  // Load liabilities
  const { data: liabilities, error: lError } = await supabase
    .from('liabilities')
    .select('*')
    .eq('student_id', student.id)
    .is('deleted_at', null);

  if (lError) throw lError;

  const mappedStudent = mapStudentFromDb(student);

  const mappedLiabilities = liabilities.map(l => ({
    id: l.id,
    studentId: l.student_id,
    templateId: l.template_id,
    title: l.title,
    description: l.description || l.title,
    items: l.items,
    originalAmount: l.original_amount,
    discountAmount: l.discount_amount,
    amount: l.amount,
    paidAmount: l.paid_amount,
    status: l.status,
    dueDate: l.due_date,
    isPaid: l.status === 'paid',
    createdAt: l.created_at,
    updatedAt: l.updated_at
  }));

  return {
    student: mappedStudent,
    billing: mappedStudent,
    liabilities: mappedLiabilities
  };
};

/**
 * Get student by ID
 */
export const getStudentById = async (id) => {
  const { data: student, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', parseInt(id))
    .maybeSingle();

  if (error) throw error;
  if (!student || student.deleted_at) {
    throw new Error('Student not found');
  }

  // Load liabilities
  const { data: liabilities } = await supabase
    .from('liabilities')
    .select('*')
    .eq('student_id', student.id)
    .order('due_date', { ascending: true });

  // Load payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', student.id)
    .order('payment_date', { ascending: false })
    .limit(20);

  const mappedStudent = mapStudentFromDb(student);
  mappedStudent.liabilities = liabilities || [];
  mappedStudent.payments = payments || [];

  return mappedStudent;
};

/**
 * Create new student
 */
export const createStudent = async (studentData) => {
  if (!studentData.registrationNumber) {
    studentData.registrationNumber = await generateRegNumber();
  }

  let plainPin = studentData.plainPin;
  let billingPin = studentData.billingPin;
  if (!plainPin) {
    plainPin = generateAlphanumericPin();
    billingPin = await hashPin(plainPin);
  } else if (!billingPin) {
    billingPin = await hashPin(plainPin);
  }

  const dbData = mapStudentToDb({
    ...studentData,
    plainPin,
    billingPin,
    pinSetAt: new Date().toISOString()
  });

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([dbData])
    .select()
    .single();

  if (error) throw error;

  await logStudentHistory(
    data.id,
    'created',
    `Student registered with Reg No: ${data.registration_number}`,
    { initialData: studentData }
  );

  return {
    student: mapStudentFromDb(data),
    generatedPin: plainPin,
    message: 'Student created. Please print student card with PIN immediately.'
  };
};

/**
 * Bulk create students
 */
export const bulkCreateStudents = async (studentsList) => {
  const year = new Date().getFullYear();
  
  const { count, error: countErr } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true })
    .like('registration_number', `REG/${year}/%`);

  if (countErr) throw countErr;
  let nextNum = (count || 0) + 1;

  const results = {
    success: [],
    failed: []
  };

  const dbList = [];
  const plainPinsMap = {};

  for (const s of studentsList) {
    try {
      let regNum = s.registrationNumber;
      if (!regNum) {
        regNum = `REG/${year}/${(nextNum++).toString().padStart(4, '0')}`;
      }

      let plainPin = s.plainPin;
      let billingPin = s.billingPin;
      if (!plainPin) {
        plainPin = generateAlphanumericPin();
        billingPin = await hashPin(plainPin);
      } else if (!billingPin) {
        billingPin = await hashPin(plainPin);
      }

      plainPinsMap[regNum] = plainPin;

      dbList.push(mapStudentToDb({
        ...s,
        registrationNumber: regNum,
        plainPin,
        billingPin,
        pinSetAt: new Date().toISOString()
      }));
    } catch (err) {
      results.failed.push({ data: s, error: err.message });
    }
  }

  if (dbList.length > 0) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(dbList)
      .select();

    if (error) throw error;

    data.forEach(student => {
      results.success.push({
        id: student.id,
        registrationNumber: student.registration_number,
        fullName: student.full_name,
        pin: plainPinsMap[student.registration_number]
      });
    });
  }

  return {
    success: true,
    message: `Imported ${results.success.length} students, ${results.failed.length} failed`,
    results
  };
};

/**
 * Reset student PIN
 */
export const resetStudentPin = async (id) => {
  const plainPin = generateAlphanumericPin();
  const billingPin = await hashPin(plainPin);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      billing_pin: billingPin,
      plain_pin: plainPin,
      pin_set_at: new Date().toISOString()
    })
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) throw error;

  await logStudentHistory(data.id, 'pin_reset', 'PIN was reset');

  return {
    success: true,
    studentId: data.id,
    newPin: plainPin,
    message: 'PIN successfully reset'
  };
};

export const resetPin = resetStudentPin;

/**
 * Update student
 */
export const updateStudent = async (id, data) => {
  // Prevent changing registrationNumber and billingPin via direct update
  delete data.billingPin;
  delete data.registrationNumber;
  delete data.pinSetAt;

  // Fetch old student data for diff logging
  const { data: oldStudent } = await supabase
    .from(TABLE_NAME)
    .select('status, class_name')
    .eq('id', parseInt(id))
    .single();

  const dbData = mapStudentToDb(data);
  dbData.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from(TABLE_NAME)
    .update(dbData)
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) throw error;

  const student = mapStudentFromDb(updated);

  if (oldStudent) {
    if (oldStudent.status !== student.status) {
      await logStudentHistory(id, 'status_changed', `Status changed from ${oldStudent.status} to ${student.status}`);
    }
    if (oldStudent.class_name !== student.className) {
      await logStudentHistory(id, 'info_updated', `Class changed from ${oldStudent.class_name} to ${student.className}`);
    }
    if (oldStudent.status === student.status && oldStudent.class_name === student.className) {
      await logStudentHistory(id, 'info_updated', 'Student information updated', { updatedFields: Object.keys(data) });
    }
  }

  return student;
};

/**
 * Soft delete student
 */
export const deleteStudent = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      deleted_at: new Date().toISOString(),
      status: 'inactive'
    })
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) throw error;

  await logStudentHistory(parseInt(id), 'status_changed', 'Student soft deleted (inactive)');

  return { message: 'Student deleted successfully' };
};

/**
 * Get student history/activity log
 */
export const getStudentHistory = async (id) => {
  const { data, error } = await supabase
    .from('student_history')
    .select('*')
    .eq('student_id', parseInt(id))
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return data.map(h => ({
    id: h.id,
    studentId: h.student_id,
    action: h.action,
    module: h.module,
    description: h.description,
    details: h.details ? JSON.parse(h.details) : null,
    performedBy: h.performed_by,
    createdAt: h.created_at
  }));
};

/**
 * Get student statistics
 */
export const getStudentStats = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('status, program, gender, scholarship_percent, balance, enrollment_date')
      .is('deleted_at', null);

    if (error) throw error;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const stats = {
      total: data.length,
      active: 0,
      inactive: 0,
      withBalance: 0,
      totalBalance: 0,
      programs: {},
      genders: { L: 0, P: 0 },
      withScholarship: 0,
      newStudents: 0
    };

    data.forEach(s => {
      // Status
      if (s.status === 'active') {
        stats.active++;
      } else {
        stats.inactive++;
      }

      // Balance
      if (s.balance > 0) {
        stats.withBalance++;
        stats.totalBalance += s.balance;
      }

      // Genders (only count active for gender stats)
      if (s.gender && s.status === 'active') {
        stats.genders[s.gender] = (stats.genders[s.gender] || 0) + 1;
      }

      // Programs
      if (s.program) {
        stats.programs[s.program] = (stats.programs[s.program] || 0) + 1;
      }

      // Scholarship (only count active for scholarship stats)
      if (s.scholarship_percent > 0 && s.status === 'active') {
        stats.withScholarship++;
      }

      // New Students
      if (s.enrollment_date && new Date(s.enrollment_date) >= startOfMonth) {
        stats.newStudents++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Failed to load stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      withBalance: 0,
      totalBalance: 0,
      programs: {},
      genders: { L: 0, P: 0 },
      withScholarship: 0,
      newStudents: 0
    };
  }
};

/**
 * Export students to Excel
 */
export const exportStudents = async (filters = {}) => {
  const response = await getAllStudents({ limit: 100000, ...filters });
  let students = response.data || response;

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
 */
export const bulkUpdateStudents = async (updates) => {
  const results = {
    success: [],
    failed: []
  };

  const needsLookup = updates.some(u => !u.id && u.registrationNumber);
  let studentMap = {};

  if (needsLookup) {
    try {
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
  const { studentIds, targetClass, targetStatus, newLiability } = data;

  const stats = {
    promoted: 0,
    graduated: 0,
    billed: 0,
    failed: 0
  };

  // 1. Update Student Class/Status
  const updateData = {};
  if (targetClass) updateData.class_name = targetClass;
  if (targetStatus) updateData.status = targetStatus;

  if (Object.keys(updateData).length > 0) {
    const { data: updatedStudents, error: uErr } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .in('id', studentIds)
      .select();

    if (uErr) throw uErr;

    if (targetStatus === 'graduated') {
      stats.graduated = updatedStudents.length;
    } else {
      stats.promoted = updatedStudents.length;
    }
  }

  // 2. Generate New Liability (Optional)
  if (newLiability && parseFloat(newLiability.amount) > 0) {
    const amountVal = parseFloat(newLiability.amount);
    const liabilityData = studentIds.map(id => ({
      student_id: id,
      title: newLiability.title || 'Tagihan Baru',
      description: newLiability.description || 'Auto-generated during class promotion',
      amount: amountVal,
      status: 'unpaid',
      paid_amount: 0
    }));

    const { data: createdLiabilities, error: lErr } = await supabase
      .from('liabilities')
      .insert(liabilityData)
      .select();

    if (lErr) throw lErr;

    // Fetch and update each student's total liabilities & balance
    const { data: studentsToUpdate, error: fErr } = await supabase
      .from(TABLE_NAME)
      .select('id, total_liabilities, balance')
      .in('id', studentIds);

    if (fErr) throw fErr;

    const upsertList = studentsToUpdate.map(s => ({
      id: s.id,
      total_liabilities: (s.total_liabilities || 0) + amountVal,
      balance: (s.balance || 0) + amountVal
    }));

    const { error: updErr } = await supabase
      .from(TABLE_NAME)
      .upsert(upsertList);

    if (updErr) throw updErr;

    stats.billed = createdLiabilities.length;
  }

  // 3. Log History for each student
  const historyData = studentIds.map(id => ({
    student_id: id,
    action: targetStatus === 'graduated' ? 'status_changed' : 'class_promoted',
    module: 'student',
    description: targetStatus === 'graduated'
      ? `Graduated (Status: ${targetStatus})`
      : `Promoted to ${targetClass}`,
    performed_by: 'System',
    details: JSON.stringify({
      targetClass,
      targetStatus,
      billed: newLiability ? newLiability.amount : 0
    })
  }));

  const { error: hErr } = await supabase
    .from('student_history')
    .insert(historyData);

  if (hErr) throw hErr;

  return {
    success: true,
    message: `Processed ${studentIds.length} students`,
    stats
  };
};
