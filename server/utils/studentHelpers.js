import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Generate sequential registration number for students
 * Format: REG-YYYY-XXXX
 * Example: REG-2024-0001, REG-2024-0002
 */
async function generateRegistrationNumber(year = new Date().getFullYear()) {
    const prefix = `REG-${year}-`;

    // Find the last student for this year
    const lastStudent = await prisma.student.findFirst({
        where: {
            registrationNumber: {
                startsWith: prefix
            }
        },
        orderBy: { registrationNumber: 'desc' }
    });

    let sequence = 1;
    if (lastStudent) {
        // Extract sequence number from last registration
        const lastSequence = parseInt(lastStudent.registrationNumber.split('-')[2]);
        sequence = lastSequence + 1;
    }

    // Format: REG-2024-0001
    return `${prefix}${sequence.toString().padStart(4, '0')}`;
}

/**
 * Get the last used sequence number for a given year
 */
async function getLastRegistrationSequence(year = new Date().getFullYear()) {
    const prefix = `REG-${year}-`;
    const lastStudent = await prisma.student.findFirst({
        where: { registrationNumber: { startsWith: prefix } },
        orderBy: { registrationNumber: 'desc' }
    });

    if (lastStudent) {
        return parseInt(lastStudent.registrationNumber.split('-')[2]);
    }
    return 0;
}

export { generateRegistrationNumber, getLastRegistrationSequence };
