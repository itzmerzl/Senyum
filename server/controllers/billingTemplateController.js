import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all billing templates
export const getAllTemplates = async (req, res) => {
    try {
        const { category, academicYear, semester, isActive } = req.query;

        const where = {};
        if (category) where.category = category;
        if (academicYear) where.academicYear = academicYear;
        if (semester) where.semester = semester;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const templates = await prisma.billingTemplate.findMany({
            where,
            include: {
                variants: true,
                _count: { select: { liabilities: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(templates);
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Gagal mengambil data tagihan' });
    }
};

// Get single template
export const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;

        const template = await prisma.billingTemplate.findUnique({
            where: { id: parseInt(id) },
            include: {
                variants: true,
                _count: { select: { liabilities: true } }
            }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template tidak ditemukan' });
        }

        res.json(template);
    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({ error: 'Gagal mengambil data tagihan' });
    }
};

// Create new template with variants
export const createTemplate = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            academicYear,
            semester,
            dueDate,
            applyScholarship,
            allowInstallment,
            minInstallment,
            maxInstallments,
            isRecurring,
            recurringType,
            variants, // [{ classNames: "7,8,9", amount: 120000 }]
            items // [{ name: "Seragam", price: 100000 }]
        } = req.body;

        if (!name || !category) {
            return res.status(400).json({ error: 'Nama dan kategori wajib diisi' });
        }

        if (!variants || variants.length === 0) {
            return res.status(400).json({ error: 'Minimal satu variant harga diperlukan' });
        }

        const template = await prisma.billingTemplate.create({
            data: {
                name,
                description,
                category,
                academicYear: academicYear || null,
                semester: semester || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                applyScholarship: applyScholarship || false,
                allowInstallment: allowInstallment !== false,
                minInstallment: minInstallment || null,
                maxInstallments: maxInstallments || null,
                isRecurring: isRecurring || false,
                recurringType: recurringType || null,
                items: items || null,
                variants: {
                    create: variants.map(v => ({
                        classNames: v.classNames,
                        programs: v.programs,
                        genders: v.genders,
                        amount: parseFloat(v.amount)
                    }))
                }
            },
            include: { variants: true }
        });

        res.status(201).json(template);
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ error: 'Gagal membuat tagihan' });
    }
};

// Update template
export const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            category,
            academicYear,
            semester,
            dueDate,
            applyScholarship,
            allowInstallment,
            minInstallment,
            maxInstallments,
            isRecurring,
            recurringType,
            isActive,
            variants,
            items
        } = req.body;

        // Update template
        const template = await prisma.billingTemplate.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                category,
                academicYear,
                semester,
                dueDate: dueDate ? new Date(dueDate) : null,
                applyScholarship,
                allowInstallment,
                minInstallment,
                maxInstallments,
                isRecurring,
                recurringType,
                isActive,
                items
            }
        });

        // If variants provided, replace all
        if (variants) {
            await prisma.billingVariant.deleteMany({
                where: { templateId: parseInt(id) }
            });

            await prisma.billingVariant.createMany({
                data: variants.map(v => ({
                    templateId: parseInt(id),
                    classNames: v.classNames,
                    programs: v.programs,
                    genders: v.genders,
                    amount: parseFloat(v.amount)
                }))
            });
        }

        const updated = await prisma.billingTemplate.findUnique({
            where: { id: parseInt(id) },
            include: { variants: true }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Gagal update tagihan' });
    }
};

// Delete template
export const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if has liabilities
        const count = await prisma.liability.count({
            where: { templateId: parseInt(id) }
        });

        if (count > 0) {
            return res.status(400).json({
                error: `Template sudah digunakan oleh ${count} tanggungan. Nonaktifkan saja.`
            });
        }

        await prisma.billingTemplate.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Template berhasil dihapus' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Gagal menghapus tagihan' });
    }
};

// Preview students for generation
export const previewGenerate = async (req, res) => {
    try {
        const { id } = req.params;
        const { classNames } = req.body; // ["Kelas 7", "Kelas 8"]

        const template = await prisma.billingTemplate.findUnique({
            where: { id: parseInt(id) },
            include: { variants: true }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template tidak ditemukan' });
        }

        // Get students in selected classes
        const students = await prisma.student.findMany({
            where: {
                className: { in: classNames },
                status: 'active',
                deletedAt: null
            },
            select: {
                id: true,
                fullName: true,
                className: true,
                program: true,
                gender: true,
                scholarshipPercent: true
            },
            orderBy: [{ className: 'asc' }, { fullName: 'asc' }]
        });

        // Calculate amount for each student
        const preview = students.map(student => {
            // Find matching variant
            // Find matching variant
            const variant = template.variants.find(v => {
                const classes = v.classNames.split(',').map(c => c.trim());
                const variantPrograms = v.programs ? v.programs.split(',').map(p => p.trim()) : [];
                const variantGenders = v.genders ? v.genders.split(',').map(g => g.trim()) : [];

                // Check class match
                const classMatch = classes.some(c =>
                    student.className?.includes(c) ||
                    student.className === c ||
                    c === '*'
                );

                if (!classMatch) return false;

                // Check program match (if variant has specific programs)
                if (variantPrograms.length > 0) {
                    if (!student.program || !variantPrograms.includes(student.program)) {
                        return false;
                    }
                }

                // Check gender match (if variant has specific genders)
                if (variantGenders.length > 0) {
                    if (!student.gender || !variantGenders.includes(student.gender)) {
                        return false;
                    }
                }

                return true;
            });

            const originalAmount = variant?.amount || 0;
            let discountAmount = 0;
            let finalAmount = originalAmount;

            if (template.applyScholarship && student.scholarshipPercent > 0) {
                discountAmount = originalAmount * (student.scholarshipPercent / 100);
                finalAmount = originalAmount - discountAmount;
            }

            return {
                studentId: student.id,
                studentName: student.fullName,
                className: student.className,
                scholarshipPercent: student.scholarshipPercent,
                originalAmount,
                discountAmount,
                finalAmount
            };
        });

        // Summary
        const summary = {
            totalStudents: preview.length,
            studentsWithScholarship: preview.filter(p => p.discountAmount > 0).length,
            totalOriginal: preview.reduce((sum, p) => sum + p.originalAmount, 0),
            totalDiscount: preview.reduce((sum, p) => sum + p.discountAmount, 0),
            totalFinal: preview.reduce((sum, p) => sum + p.finalAmount, 0)
        };

        res.json({ template, preview, summary });
    } catch (error) {
        console.error('Preview generate error:', error);
        res.status(500).json({ error: 'Gagal preview tagihan' });
    }
};

// Generate liabilities for students
export const generateLiabilities = async (req, res) => {
    try {
        const { id } = req.params;
        const { classNames, excludeStudentIds = [] } = req.body;

        const template = await prisma.billingTemplate.findUnique({
            where: { id: parseInt(id) },
            include: { variants: true }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template tidak ditemukan' });
        }

        // Get students
        const students = await prisma.student.findMany({
            where: {
                className: { in: classNames },
                status: 'active',
                deletedAt: null,
                id: { notIn: excludeStudentIds }
            }
        });

        // Check for existing liabilities with same template
        const existingStudentIds = await prisma.liability.findMany({
            where: {
                templateId: parseInt(id),
                studentId: { in: students.map(s => s.id) },
                deletedAt: null
            },
            select: { studentId: true }
        });

        const existingIds = new Set(existingStudentIds.map(e => e.studentId));
        const newStudents = students.filter(s => !existingIds.has(s.id));

        if (newStudents.length === 0) {
            return res.status(400).json({
                error: 'Semua santri di kelas ini sudah memiliki tagihan ini',
                skipped: existingStudentIds.length
            });
        }

        // Create liabilities
        const liabilities = [];

        for (const student of newStudents) {
            // Find variant
            const variant = template.variants.find(v => {
                const classes = v.classNames.split(',').map(c => c.trim());
                const variantPrograms = v.programs ? v.programs.split(',').map(p => p.trim()) : [];
                const variantGenders = v.genders ? v.genders.split(',').map(g => g.trim()) : [];

                // Check class match
                const classMatch = classes.some(c =>
                    student.className?.includes(c) ||
                    student.className === c ||
                    c === '*'
                );

                if (!classMatch) return false;

                // Check program match (if variant has specific programs)
                if (variantPrograms.length > 0) {
                    if (!student.program || !variantPrograms.includes(student.program)) {
                        return false;
                    }
                }

                // Check gender match (if variant has specific genders)
                if (variantGenders.length > 0) {
                    if (!student.gender || !variantGenders.includes(student.gender)) {
                        return false;
                    }
                }

                return true;
            });

            if (!variant) continue;

            const originalAmount = variant.amount;
            let discountAmount = 0;
            let finalAmount = originalAmount;

            if (template.applyScholarship && student.scholarshipPercent > 0) {
                discountAmount = originalAmount * (student.scholarshipPercent / 100);
                finalAmount = originalAmount - discountAmount;
            }

            liabilities.push({
                studentId: student.id,
                templateId: parseInt(id),
                title: template.name,
                description: template.description,
                originalAmount,
                discountAmount,
                amount: finalAmount,
                paidAmount: 0,
                status: 'unpaid',
                status: 'unpaid',
                dueDate: template.dueDate,
                // Add items with default status
                items: template.items ? template.items.map(item => ({
                    ...item,
                    status: 'pending',
                    deliveredAt: null,
                    deliveredBy: null
                })) : null
            });
        }

        // Batch create
        const result = await prisma.liability.createMany({
            data: liabilities
        });

        // Update student balances
        for (const liability of liabilities) {
            await prisma.student.update({
                where: { id: liability.studentId },
                data: {
                    totalLiabilities: { increment: liability.amount },
                    balance: { increment: liability.amount }
                }
            });
        }

        res.json({
            message: `Berhasil membuat ${result.count} tagihan`,
            created: result.count,
            skipped: existingIds.size
        });
    } catch (error) {
        console.error('Generate liabilities error:', error);
        res.status(500).json({ error: 'Gagal generate tagihan' });
    }
};

// Get available categories
export const getCategories = (req, res) => {
    const categories = [
        'Buku LKS',
        'Buku Ismuba',
        'Kitab Pondok',
        'Seragam',
        'Lainnya'
    ];
    res.json(categories);
};

export default {
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    previewGenerate,
    generateLiabilities,
    getCategories
};
