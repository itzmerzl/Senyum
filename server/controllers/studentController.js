import { PrismaClient } from '@prisma/client';
import { generateRegistrationNumber, getLastRegistrationSequence } from '../utils/studentHelpers.js';
import { generateAlphanumericPin, hashPin } from '../utils/pinHelpers.js';

const prisma = new PrismaClient();

/**
 * GET /api/students/stats
 * Get student statistics (Efficient Aggregation)
 */
export const getStudentStats = async (req, res) => {
    try {
        // Get start of current month for "new students" count
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [
            total,
            active,
            inactive,
            withBalance,
            totalBalanceResult,
            programGroups,
            genderGroups,
            withScholarship,
            newStudents
        ] = await Promise.all([
            prisma.student.count({ where: { deletedAt: null } }),
            prisma.student.count({ where: { status: 'active', deletedAt: null } }),
            prisma.student.count({ where: { status: { not: 'active' }, deletedAt: null } }),
            prisma.student.count({ where: { balance: { gt: 0 }, deletedAt: null } }),
            prisma.student.aggregate({
                where: { deletedAt: null },
                _sum: { balance: true }
            }),
            prisma.student.groupBy({
                by: ['program'],
                where: { deletedAt: null },
                _count: { program: true }
            }),
            prisma.student.groupBy({
                by: ['gender'],
                where: { deletedAt: null, status: 'active' },
                _count: { gender: true }
            }),
            prisma.student.count({
                where: {
                    scholarshipPercent: { gt: 0 },
                    status: 'active',
                    deletedAt: null
                }
            }),
            prisma.student.count({
                where: {
                    enrollmentDate: { gte: startOfMonth },
                    deletedAt: null
                }
            })
        ]);

        const programs = {};
        programGroups.forEach(g => {
            if (g.program) programs[g.program] = g._count.program;
        });

        const genders = {};
        genderGroups.forEach(g => {
            if (g.gender) genders[g.gender] = g._count.gender;
        });

        res.json({
            total,
            active,
            inactive,
            withBalance,
            totalBalance: totalBalanceResult._sum.balance || 0,
            programs,
            genders,
            withScholarship,
            newStudents
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

/**
 * GET /api/students
 * Get all students (Paginated & Filtered)
 */
export const getAllStudents = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status,
            program,
            className,
            gender,
            balanceMin,
            balanceMax,
            enrollmentFrom,
            enrollmentTo,
            sortBy = 'newest'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Build Where Clause
        const where = { deletedAt: null };

        if (search) {
            where.OR = [
                { fullName: { contains: search } }, // Case insensitive usually handled by DB collation or mode: 'insensitive' in Postgres, MySQL varies
                { registrationNumber: { contains: search } },
                { guardianName: { contains: search } },
                { guardianPhone: { contains: search } }
            ];
        }

        if (status) where.status = status;
        if (program) where.program = program;
        if (className) where.className = className;
        if (gender) where.gender = gender;

        // Balance range filter
        if (balanceMin || balanceMax) {
            where.balance = {};
            if (balanceMin) where.balance.gte = parseFloat(balanceMin);
            if (balanceMax) where.balance.lte = parseFloat(balanceMax);
        }

        // Enrollment date range filter
        if (enrollmentFrom || enrollmentTo) {
            where.enrollmentDate = {};
            if (enrollmentFrom) where.enrollmentDate.gte = new Date(enrollmentFrom);
            if (enrollmentTo) where.enrollmentDate.lte = new Date(enrollmentTo);
        }

        // Build Sort Info
        let orderBy = {};
        switch (sortBy) {
            case 'oldest': orderBy = { registrationNumber: 'asc' }; break;
            case 'name-asc': orderBy = { fullName: 'asc' }; break;
            case 'name-desc': orderBy = { fullName: 'desc' }; break;
            case 'balance-highest': orderBy = { balance: 'desc' }; break;
            case 'balance-lowest': orderBy = { balance: 'asc' }; break;
            case 'newest':
            default: orderBy = { registrationNumber: 'desc' }; break;
        }

        // Execute Transaction for consistent count + data
        const [total, students] = await prisma.$transaction([
            prisma.student.count({ where }),
            prisma.student.findMany({
                where,
                skip,
                take,
                orderBy,
                select: {
                    id: true,
                    registrationNumber: true,
                    fullName: true,
                    gender: true,
                    className: true,
                    program: true,
                    status: true,
                    guardianName: true,
                    guardianPhone: true,
                    guardianWhatsapp: true,
                    address: true,
                    scholarshipPercent: true,
                    notes: true,
                    photoUrl: true,
                    balance: true,
                    totalLiabilities: true,
                    totalPaid: true,
                    enrollmentDate: true,
                    plainPin: true,
                    _count: {
                        select: {
                            liabilities: true,
                            payments: true
                        }
                    }
                }
            })
        ]);

        res.json({
            data: students,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / take)
            }
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
};

/**
 * GET /api/students/:id
 * Get student by ID with full details
 */
export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await prisma.student.findUnique({
            where: { id: parseInt(id) },
            include: {
                liabilities: {
                    orderBy: { dueDate: 'asc' }
                },
                payments: {
                    orderBy: { paymentDate: 'desc' },
                    take: 20
                }
            }
        });

        if (!student || student.deletedAt) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Don't send PIN to client (security)
        const { billingPin, ...studentData } = student;

        res.json(studentData);
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
};

/**
 * POST /api/students
 * Create new student with auto-generated reg number & PIN
 */
export const createStudent = async (req, res) => {
    try {
        const data = req.body;

        // Auto-generate registration number
        const registrationNumber = await generateRegistrationNumber();

        // Auto-generate alphanumeric PIN
        const plainPin = generateAlphanumericPin();
        const hashedPin = await hashPin(plainPin);


        const student = await prisma.student.create({
            data: {
                ...data,
                registrationNumber,
                billingPin: hashedPin,
                plainPin: plainPin, // Store plain PIN for printing
                pinSetAt: new Date()
            }
        });

        // Log creation
        await logStudentHistory(
            student.id,
            'created',
            `Student registered with Reg No: ${registrationNumber}`,
            { initialData: data },
            req.user?.username || 'System'
        );

        // Return student with plain PIN (ONLY ONCE - for printing on card)
        res.status(201).json({
            student,
            generatedPin: plainPin, // IMPORTANT: Only returned on creation
            message: 'Student created. Please print student card with PIN immediately.'
        });

    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ error: 'Failed to create student' });
    }
};

/**
 * POST /api/students/bulk
 * Bulk create students - much faster than one-by-one
 */
export const bulkCreateStudents = async (req, res) => {
    try {
        const { students: studentsData } = req.body;

        if (!studentsData || !Array.isArray(studentsData) || studentsData.length === 0) {
            return res.status(400).json({ error: 'No students data provided' });
        }

        const results = {
            success: [],
            failed: []
        };

        // Process in batches of 50 for better performance
        const batchSize = 50;
        const batches = [];
        for (let i = 0; i < studentsData.length; i += batchSize) {
            batches.push(studentsData.slice(i, i + batchSize));
        }

        for (const batch of batches) {
            // Get the LAST used sequence from DB for this batch start
            let currentSequence = await getLastRegistrationSequence();
            const year = new Date().getFullYear();
            const prefix = `REG-${year}-`;

            // Prepare all students
            const preparedStudents = await Promise.all(
                batch.map(async (studentData, index) => {
                    try {
                        // Increment sequence locally
                        // Note: currentSequence is base. We need to increment it for each item.
                        // Since map is parallel, we need to be careful.
                        // Actually, we should map sequentially or calculate offset.
                        // But wait, if we use map index, we can do it.

                        // However, strictly safely:
                        // We really should loop or use index offset from base.

                        // Let's use index offset inside the map
                        const sequence = currentSequence + index + 1;
                        const registrationNumber = `${prefix}${sequence.toString().padStart(4, '0')}`;

                        const plainPin = generateAlphanumericPin();
                        const hashedPin = await hashPin(plainPin);

                        return {
                            data: {
                                ...studentData,
                                registrationNumber,
                                billingPin: hashedPin,
                                plainPin: plainPin,
                                pinSetAt: new Date()
                            },
                            plainPin,
                            originalData: studentData
                        };
                    } catch (err) {
                        return { error: err.message, originalData: studentData };
                    }
                })
            );

            // Insert valid ones in a transaction
            const validStudents = preparedStudents.filter(s => !s.error);
            const failedStudents = preparedStudents.filter(s => s.error);

            failedStudents.forEach(f => {
                results.failed.push({ data: f.originalData, error: f.error });
            });

            if (validStudents.length > 0) {
                try {
                    const created = await prisma.$transaction(
                        validStudents.map(s =>
                            prisma.student.create({ data: s.data })
                        )
                    );

                    created.forEach((student, idx) => {
                        results.success.push({
                            id: student.id,
                            registrationNumber: student.registrationNumber,
                            fullName: student.fullName,
                            pin: validStudents[idx].plainPin
                        });
                    });
                } catch (txError) {
                    console.error('Batch transaction error:', txError);
                    validStudents.forEach(s => {
                        results.failed.push({ data: s.originalData, error: txError.message });
                    });
                }
            }
        }

        res.status(201).json({
            success: true,
            message: `Imported ${results.success.length} students, ${results.failed.length} failed`,
            results
        });

    } catch (error) {
        console.error('Bulk create students error:', error);
        res.status(500).json({ error: 'Failed to bulk create students' });
    }
};

/**
 * PUT /api/students/:id
 * Update student (cannot change PIN or reg number)
 */
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Prevent changing sensitive fields
        delete data.billingPin;
        delete data.registrationNumber;
        delete data.pinSetAt;

        // Get old data for diff logging
        const oldStudent = await prisma.student.findUnique({
            where: { id: parseInt(id) },
            select: { status: true, className: true, program: true }
        });

        const student = await prisma.student.update({
            where: { id: parseInt(id) },
            data
        });

        // Log specific changes
        if (oldStudent.status !== student.status) {
            await logStudentHistory(id, 'status_changed', `Status changed from ${oldStudent.status} to ${student.status}`, null, req.user?.username || 'System');
        }
        if (oldStudent.className !== student.className) {
            await logStudentHistory(id, 'info_updated', `Class changed from ${oldStudent.className} to ${student.className}`, null, req.user?.username || 'System');
        }

        // Generic update log if no specific major change detected above but update happened
        if (oldStudent.status === student.status && oldStudent.className === student.className) {
            await logStudentHistory(id, 'info_updated', 'Student information updated', { updatedFields: Object.keys(data) }, req.user?.username || 'System');
        }

        res.json(student);
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ error: 'Failed to update student' });
    }
};

/**
 * DELETE /api/students/:id
 * Soft delete student
 */
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.student.update({
            where: { id: parseInt(id) },
            data: {
                deletedAt: new Date(),
                status: 'inactive'
            }
        });

        await logStudentHistory(parseInt(id), 'status_changed', 'Student soft deleted (inactive)', null, req.user?.username || 'System');

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Failed to delete student' });
    }
};
/**
 * POST /api/students/:id/reset-pin
 * Reset student PIN (generate new one)
 */
export const resetStudentPin = async (req, res) => {
    try {
        const { id } = req.params;

        // Auto-generate new alphanumeric PIN
        const plainPin = generateAlphanumericPin();
        const hashedPin = await hashPin(plainPin);

        const student = await prisma.student.update({
            where: { id: parseInt(id) },
            data: {
                billingPin: hashedPin,
                plainPin: plainPin, // Update plain PIN for printing
                pinSetAt: new Date()
            }
        });

        await logStudentHistory(parseInt(id), 'pin_reset', 'PIN was reset', null, req.user?.username || 'System');

        res.json({
            success: true,
            studentId: student.id,
            newPin: plainPin, // Returned ONLY ONCE
            message: 'PIN successfully reset'
        });
    } catch (error) {
        console.error('Reset PIN error:', error);
        res.status(500).json({ error: 'Failed to reset PIN' });
    }
};

/**
 * GET /api/students/:id/history
 * Get student activity history
 */
export const getStudentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await prisma.studentHistory.findMany({
            where: { studentId: parseInt(id) },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(history);
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};

/**
 * POST /api/students/promote
 * Bulk promote students to next class or graduate
 */
export const bulkPromoteStudents = async (req, res) => {
    try {
        const { studentIds, targetClass, targetStatus, newLiability } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ error: 'No students selected' });
        }

        const stats = {
            promoted: 0,
            graduated: 0,
            billed: 0,
            failed: 0
        };

        await prisma.$transaction(async (tx) => {
            // 1. Update Student Class/Status
            const updateData = {};
            if (targetClass) updateData.className = targetClass;
            if (targetStatus) updateData.status = targetStatus;

            // Only update if there are changes
            if (Object.keys(updateData).length > 0) {
                const updateResult = await tx.student.updateMany({
                    where: { id: { in: studentIds } },
                    data: updateData
                });

                if (targetStatus === 'graduated') {
                    stats.graduated = updateResult.count;
                } else {
                    stats.promoted = updateResult.count;
                }
            }

            // 2. Generate New Liability (Optional)
            if (newLiability && newLiability.amount > 0) {
                const liabilityData = studentIds.map(id => ({
                    studentId: id,
                    title: newLiability.title || 'Tagihan Baru',
                    description: newLiability.description || 'Auto-generated during class promotion',
                    amount: parseFloat(newLiability.amount),
                    status: 'unpaid',
                    paidAmount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }));

                const liabilityResult = await tx.liability.createMany({
                    data: liabilityData
                });

                // Update student total liabilities (Need to fetch and update or increment? 
                // Creating liability doesn't auto-update student totals in schema unless triggered. 
                // Simple approach: Increment totalLiabilities for these students.
                await tx.student.updateMany({
                    where: { id: { in: studentIds } },
                    data: {
                        totalLiabilities: { increment: parseFloat(newLiability.amount) },
                        balance: { increment: parseFloat(newLiability.amount) }
                    }
                });

                stats.billed = liabilityResult.count;
            }

            // 3. Log History for each student (This might be slow for massive bulk, but acceptable for class size)
            // Creating many history records
            const historyData = studentIds.map(id => ({
                studentId: id,
                action: targetStatus === 'graduated' ? 'status_changed' : 'class_promoted',
                module: 'student',
                description: targetStatus === 'graduated'
                    ? `Graduated (Status: ${targetStatus})`
                    : `Promoted to ${targetClass}`,
                performedBy: req.user?.username || 'System',
                details: JSON.stringify({
                    targetClass,
                    targetStatus,
                    billed: newLiability ? newLiability.amount : 0
                }),
                createdAt: new Date()
            }));

            await tx.studentHistory.createMany({
                data: historyData
            });
        });

        res.json({
            success: true,
            message: `Processed ${studentIds.length} students`,
            stats
        });

    } catch (error) {
        console.error('Bulk promote error:', error);
        res.status(500).json({ error: 'Failed to promote students' });
    }
};
const logStudentHistory = async (studentId, action, description, details = null, performedBy = 'System') => {
    try {
        await prisma.studentHistory.create({
            data: {
                studentId: parseInt(studentId),
                action,
                description,
                details: details ? JSON.stringify(details) : undefined, // Ensure JSON format if needed, though Prisma handles Json type
                performedBy
            }
        });
    } catch (error) {
        console.error('Failed to log student history:', error);
        // Don't throw, just log error so main flow isn't interrupted
    }
};
