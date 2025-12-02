import Dexie from 'dexie';

// Initialize Database
export const db = new Dexie('Senyum');

db.version(1).stores({
  students: '++id, registrationNumber, fullName, className, program, gender, status',
  liabilities: '++id, studentId, liabilityType, category, status, dueDate',
  products: '++id, sku, barcode, name, categoryId, supplierId, isActive',
  categories: '++id, code, name, isActive',
  suppliers: '++id, code, name, isActive',
  transactions: '++id, invoiceNumber, transactionDate, customerId, customerType, status, cashierId',
  payments: '++id, receiptNumber, studentId, liabilityId, paymentDate, cashierId',
  stockMovements: '++id, productId, movementType, createdAt',
  users: '++id, username, role, isActive',
  settings: '++id, key, category',
  activityLogs: '++id, userId, action, module, createdAt',
  cashDrawer: '++id, sessionId, cashierId, status, openedAt',
  bankAccounts: '++id, bankName, bankCode, accountNumber, accountHolder, isActive'
});

db.version(2).stores({
  students: '++id, registrationNumber, fullName, className, program, gender, status',
  liabilities: '++id, studentId, liabilityType, category, status, dueDate',
  products: '++id, sku, barcode, name, categoryId, supplierId, isActive',
  categories: '++id, code, name, isActive',
  suppliers: '++id, code, name, isActive',
  transactions: '++id, invoiceNumber, transactionDate, customerId, customerType, status, cashierId',
  payments: '++id, receiptNumber, studentId, liabilityId, paymentDate, cashierId',
  stockMovements: '++id, productId, movementType, createdAt',
  users: '++id, username, role, isActive',
  settings: '++id, key, category',
  activityLogs: '++id, userId, action, module, createdAt',
  cashDrawer: '++id, sessionId, cashierId, status, openedAt',
  bankAccounts: '++id, bankName, bankCode, accountNumber, accountHolder, isActive',
  paymentMethods: '++id, code, name, type, isActive, displayOrder'
}).upgrade(tx => {
  // Seed payment methods on upgrade
  return tx.table('paymentMethods').bulkAdd([
    {
      code: 'cash',
      name: 'Tunai',
      type: 'cash',
      icon: 'Banknote',
      color: 'bg-green-100 text-green-800',
      description: 'Pembayaran tunai langsung',
      isActive: true,
      displayOrder: 1,
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
      isActive: true,
      displayOrder: 2,
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
      isActive: true,
      displayOrder: 3,
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
      isActive: true,
      displayOrder: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      code: 'dana',
      name: 'DANA',
      type: 'ewallet',
      icon: 'CreditCard',
      color: 'bg-blue-100 text-blue-800',
      description: 'Bayar dengan DANA',
      provider: 'midtrans',
      isActive: false,
      displayOrder: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      code: 'ovo',
      name: 'OVO',
      type: 'ewallet',
      icon: 'Smartphone',
      color: 'bg-purple-100 text-purple-800',
      description: 'Bayar dengan OVO',
      provider: 'midtrans',
      isActive: false,
      displayOrder: 6,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      code: 'bank_transfer',
      name: 'Transfer Bank',
      type: 'bank_transfer',
      icon: 'Building2',
      color: 'bg-indigo-100 text-indigo-800',
      description: 'Transfer ke rekening bank koperasi',
      isActive: true,
      displayOrder: 7,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
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
      { key: 'midtrans_client_key', value: '', category: 'payment', dataType: 'string', isPublic: false, updatedAt: new Date() },
      { key: 'midtrans_server_key', value: '', category: 'payment', dataType: 'string', isPublic: false, updatedAt: new Date() },
    ];
    await db.settings.bulkAdd(settings);

    // Default Bank Accounts
    const bankAccounts = [
      {
        bankName: 'Bank BRI',
        bankCode: 'BRI',
        accountNumber: '1234567890',
        accountHolder: 'Koperasi Senyummu',
        branch: 'Jember',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        bankName: 'Bank BNI',
        bankCode: 'BNI',
        accountNumber: '0987654321',
        accountHolder: 'Koperasi Senyummu',
        branch: 'Jember',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        bankName: 'Bank Mandiri',
        bankCode: 'MANDIRI',
        accountNumber: '1122334455',
        accountHolder: 'Koperasi Senyummu',
        branch: 'Jember',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        bankName: 'Bank Muamalat',
        bankCode: 'MUAMALAT',
        accountNumber: '5544332211',
        accountHolder: 'Koperasi Senyummu',
        branch: 'Jember',
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