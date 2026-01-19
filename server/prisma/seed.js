
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding (Advanced Schema)...');

    // 1. Roles
    const roleDev = await prisma.role.upsert({
        where: { name: 'developer' },
        update: {},
        create: { name: 'developer', displayName: 'Developer', description: 'System Creator / Super Admin', isSystem: true }
    });

    const roleAdmin = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: { name: 'admin', displayName: 'Admin', description: 'Store Manager', isSystem: true }
    });

    const roleHelper = await prisma.role.upsert({
        where: { name: 'helper' },
        update: {},
        create: { name: 'helper', displayName: 'Helper', description: 'Staff / Cashier / Stock', isSystem: true }
    });

    const roleUser = await prisma.role.upsert({
        where: { name: 'user' },
        update: {},
        create: { name: 'user', displayName: 'User', description: 'Standard User / Viewer', isSystem: true }
    });

    // Basic Permissions
    const permissionsData = [
        // Dashboard
        { code: 'dashboard.view', module: 'dashboard' },
        // POS & Transaction
        { code: 'transaction.create', module: 'transaction' },
        { code: 'transaction.view', module: 'transaction' },
        { code: 'transaction.refund', module: 'transaction' },
        // Product
        { code: 'product.view', module: 'product' },
        { code: 'product.manage', module: 'product' }, // Create/Edit/Delete
        // Reporting
        { code: 'report.view', module: 'report' },
        // Settings & Users
        { code: 'setting.manage', module: 'setting' },
        { code: 'user.manage', module: 'user' },
    ];

    // Create Permissions
    const dbPermissions = {};
    for (const perm of permissionsData) {
        const p = await prisma.permission.upsert({
            where: { code: perm.code },
            update: {},
            create: perm
        });
        dbPermissions[perm.code] = p.id;
    }

    // Assign Permissions to Roles

    // Helper: View Dashboard, Create Transaction, View Transaction, View Product
    const helperPerms = ['dashboard.view', 'transaction.create', 'transaction.view', 'product.view'];
    for (const code of helperPerms) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: roleHelper.id, permissionId: dbPermissions[code] } },
            update: {},
            create: { roleId: roleHelper.id, permissionId: dbPermissions[code] }
        });
    }

    // Admin: All Helper + Manage Product, View Reports, Manage Users (but restricts system settings ideally, but for now give all except dev stuff?)
    // Let's give Admin everything EXCEPT maybe dangerous system settings if we had them. 
    // For now, mapping Admin to "All except dev"? Or just All?
    // Let's give Admin ALL defined permissions for now.
    for (const p of Object.values(dbPermissions)) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: roleAdmin.id, permissionId: p } },
            update: {},
            create: { roleId: roleAdmin.id, permissionId: p }
        });
    }

    // Developer: ALL (Same as Admin for now in terms of DB perms, but semantically higher)
    for (const p of Object.values(dbPermissions)) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: roleDev.id, permissionId: p } },
            update: {},
            create: { roleId: roleDev.id, permissionId: p }
        });
    }

    // User: Maybe just View Products?
    await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleUser.id, permissionId: dbPermissions['product.view'] } },
        update: {},
        create: { roleId: roleUser.id, permissionId: dbPermissions['product.view'] }
    });

    // 2. Units - Comprehensive list with descriptions
    const unitsData = [
        { name: 'Pcs', description: 'Pieces - individual items' },
        { name: 'Box', description: 'Boxed items' },
        { name: 'Pack', description: 'Packaged items' },
        { name: 'Kg', description: 'Kilogram - weight measurement' },
        { name: 'Liter', description: 'Liter - volume measurement' },
        { name: 'Dozen', description: 'Dozen - 12 units' },
        { name: 'Lusin', description: 'Lusin - 12 units' },
        { name: 'Karton', description: 'Carton box' },
        { name: 'Roll', description: 'Roll - for rolled items' },
        { name: 'Botol', description: 'Bottle' },
        { name: 'Kaleng', description: 'Can/tin' },
        { name: 'Sachet', description: 'Sachet/small packet' }
    ];

    for (const unitData of unitsData) {
        await prisma.unit.upsert({
            where: { name: unitData.name },
            update: {},
            create: unitData
        });
    }

    // 3. Settings
    const settings = [
        { key: 'store_name', value: 'Koperasi Senyum Professional', category: 'general', dataType: 'string', isPublic: true },
        { key: 'store_address', value: 'Jl. Senyum No. 1', category: 'general', dataType: 'string', isPublic: true },
        { key: 'store_phone', value: '081234567890', category: 'general', dataType: 'string', isPublic: true },
        { key: 'tax_rate', value: '0', category: 'payment', dataType: 'number', isPublic: true },
    ];

    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        });
    }

    // 4. Payment Methods
    const paymentMethods = [
        { code: 'cash', name: 'Tunai', type: 'cash', isActive: true, displayOrder: 1 },
        { code: 'bank', name: 'Transfer Bank', type: 'bank_transfer', isActive: true, displayOrder: 2 },
        { code: 'qris', name: 'QRIS', type: 'qris', isActive: true, displayOrder: 3 },
    ];

    // Note: PaymentMethod code is unique in new schema
    for (const pm of paymentMethods) {
        await prisma.paymentMethod.upsert({
            where: { code: pm.code },
            update: {},
            create: pm,
        });
    }

    // 5. Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            passwordHash: hashedPassword,
            roleId: roleAdmin.id
        },
        create: {
            username: 'admin',
            passwordHash: hashedPassword,
            fullName: 'Super Administrator',
            roleId: roleAdmin.id,
            isActive: true
        }
    });

    console.log('✅ Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
