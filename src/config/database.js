import Dexie from 'dexie';

// Initialize Database
export const db = new Dexie('Senyum');

db.version(2).stores({
  students: '++id, registrationNumber, fullName, className, program, gender, status',
  liabilities: '++id, studentId, liabilityType, category, status, dueDate',
  products: '++id, sku, barcode, name, categoryId, supplierId, isActive',
  categories: '++id, code, name, isActive',
  suppliers: '++id, code, name, isActive',
  transactions: '++id, invoiceNumber, transactionDate, customerId, customerType, status, cashierId, paymentMethod',
  payments: '++id, receiptNumber, studentId, liabilityId, paymentDate, cashierId',
  stockMovements: '++id, productId, movementType, createdAt',
  users: '++id, username, role, isActive',
  settings: '++id, key, category',
  activityLogs: '++id, userId, action, module, createdAt',
  bankAccounts: '++id, bankName, bankCode, accountNumber, accountHolder, isActive',
  paymentMethods: '++id, code, name, type, isActive, displayOrder, balance'
}).upgrade(async tx => {
  // Set initial balance to 0 for all existing payment methods
  const methods = await tx.table('paymentMethods').toArray();
  for (const method of methods) {
    if (method.balance === undefined) {
      await tx.table('paymentMethods').update(method.id, { balance: 0 });
    }
  }
});

// Seed Initial Data
export async function seedInitialData() {
  const userCount = await db.users.count();
  
  if (userCount === 0) {
    // Default Admin User
    await db.users.add({
      username: 'Atmin',
      passwordHash: 'AtminGanteng', // In production, use proper hashing!
      fullName: 'Administrator',
      email: 'admin@senyummu.com',
      role: 'admin',
      permissions: [
        'view_dashboard',
        'manage_pos',
        'manage_students',
        'manage_products',
        'manage_reports',
        'manage_users',
        'manage_settings',
        'manage_liabilities',
        'manage_suppliers',
        'manage_categories',
        'manage_bank_accounts',
        'manage_payment_methods'
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Default Settings
    const settings = [
      { key: 'school_name', value: 'Koperasi Senyummu', category: 'general', dataType: 'string', isPublic: true, updatedAt: new Date() },
      { key: 'school_address', value: 'Jln. Pemandian No. 88', category: 'general', dataType: 'string', isPublic: true, updatedAt: new Date() },
      { key: 'school_phone', value: '085183079329', category: 'general', dataType: 'string', isPublic: true, updatedAt: new Date() },
      { key: 'school_email', value: 'senyummu2024@gmail.com', category: 'general', dataType: 'string', isPublic: true, updatedAt: new Date() },
      { key: 'tax_percentage', value: 0, category: 'pos', dataType: 'number', isPublic: false, updatedAt: new Date() },
      { key: 'receipt_footer', value: 'Terima kasih atas kunjungan Anda!', category: 'printer', dataType: 'string', isPublic: false, updatedAt: new Date() },
      { key: 'bank_transfer_enabled', value: true, category: 'payment', dataType: 'boolean', isPublic: false, updatedAt: new Date() },
      { key: 'bank_transfer_confirmation_required', value: true, category: 'payment', dataType: 'boolean', isPublic: false, updatedAt: new Date() },
      { key: 'midtrans_enabled', value: true, category: 'payment', dataType: 'boolean', isPublic: false, updatedAt: new Date() },
      { key: 'midtrans_client_key', value: '', category: 'payment', dataType: 'string', isPublic: false, updatedAt: new Date() },
      { key: 'midtrans_server_key', value: '', category: 'payment', dataType: 'string', isPublic: false, updatedAt: new Date() },
      { key: 'midtrans_environment', value: 'sandbox', category: 'payment', dataType: 'string', isPublic: false, updatedAt: new Date() },
    ];
    await db.settings.bulkAdd(settings);

    // Default Payment Methods
    const paymentMethods = [
      {
        code: 'cash',
        name: 'Tunai',
        type: 'cash',
        icon: 'Landmark',
        color: 'bg-green-100 text-green-800',
        description: 'Pembayaran tunai langsung',
        balance: 0,
        isActive: true,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'bank',
        name: 'Bank BRI',
        type: 'bank',
        icon: 'Building2',
        color: 'bg-blue-100 text-blue-800',
        description: 'Transfer ke rekening bank koperasi',
        balance: 0,
        isActive: true,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'bank',
        name: 'Bank BNI',
        type: 'bank',
        icon: 'Building2',
        color: 'bg-orange-100 text-orange-800',
        description: 'Transfer ke rekening bank koperasi',
        balance: 0,
        isActive: true,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'bank',
        name: 'Bank Muamalat',
        type: 'bank',
        icon: 'Building2',
        color: 'bg-purple-100 text-purple-800',
        description: 'Transfer ke rekening bank koperasi',
        balance: 0,
        isActive: true,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'bank',
        name: 'Bank Mandiri',
        type: 'bank',
        icon: 'Building2',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Transfer ke rekening bank koperasi',
        balance: 0,
        isActive: true,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'qris',
        name: 'QRIS',
        type: 'digital',
        icon: 'QrCode',
        color: 'bg-blue-100 text-blue-800',
        description: 'Scan QR dengan e-wallet atau mobile banking',
        provider: 'midtrans',
        requiresMidtrans: true,
        balance: 0,
        isActive: false,
        displayOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'gopay',
        name: 'GoPay',
        type: 'ewallet',
        icon: 'Smartphone',
        color: 'bg-green-100 text-green-800',
        description: 'Bayar dengan GoPay',
        provider: 'midtrans',
        requiresMidtrans: true,
        balance: 0,
        isActive: false,
        displayOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'shopeepay',
        name: 'ShopeePay',
        type: 'ewallet',
        icon: 'Wallet',
        color: 'bg-orange-100 text-orange-800',
        description: 'Bayar dengan ShopeePay',
        provider: 'midtrans',
        requiresMidtrans: true,
        balance: 0,
        isActive: false,
        displayOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await db.paymentMethods.bulkAdd(paymentMethods);

    // Default Bank Accounts
    const bankAccounts = [
      {
        bankName: 'Bank BRI',
        bankCode: 'BRI',
        accountNumber: '1234567890',
        accountHolder: 'Koperasi Senyummu',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        bankName: 'Bank BNI',
        bankCode: 'BNI',
        accountNumber: '0987654321',
        accountHolder: 'Koperasi Senyummu',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        bankName: 'Bank Mandiri',
        bankCode: 'Mandiri',
        accountNumber: '1122334455',
        accountHolder: 'Koperasi Senyummu',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        bankName: 'Bank Muamalat',
        bankCode: 'Muamalat',
        accountNumber: '5566778899',
        accountHolder: 'Koperasi Senyummu',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await db.bankAccounts.bulkAdd(bankAccounts);

    console.log('✅ Initial data seeded successfully!');
  }
}

// Initialize Database
export async function initDatabase() {
  try {
    await db.open();
    await seedInitialData();
    console.log('✅ Database initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    return false;
  }
}

// Export database instance
export default db;