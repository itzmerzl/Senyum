import Dexie from 'dexie';

export const db = new Dexie('Senyum');

db.version(6).stores({
  students: '++id, registrationNumber, fullName, className, program, gender, status',
  liabilities: '++id, studentId, liabilityType, category, status, dueDate',
  products: '++id, sku, barcode, name, categoryId, supplierId, stock, isActive',
  categories: '++id, code, name, isActive',
  
  // 🎯 SUPPLIERS - Simplified with Bank Details
  suppliers: '++id, code, name, phone, email, address, bankName, isActive, lastOrderDate, createdAt',
  
  transactions: '++id, invoiceNumber, transactionDate, customerId, customerType, status, cashierId, paymentMethod',
  payments: '++id, receiptNumber, studentId, liabilityId, paymentDate, cashierId',
  stockMovements: '++id, productId, movementType, createdAt',
  users: '++id, username, role, isActive',
  settings: '++id, key, category',
  activityLogs: '++id, userId, action, module, createdAt',
  bankAccounts: '++id, bankName, bankCode, accountNumber, accountHolder, isActive',
  paymentMethods: '++id, code, name, type, isActive, displayOrder, balance'
  
}).upgrade(async tx => {
  console.log('🔄 Upgrading to simplified supplier schema...');
  
  try {
    const suppliers = await tx.table('suppliers').toArray();
    console.log(`📦 Migrating ${suppliers.length} suppliers to simplified schema...`);
    
    for (const supplier of suppliers) {
      const updates = {};
      
      // Keep only essential fields
      if (!supplier.code) updates.code = `SUP/${String(supplier.id).padStart(3, '0')}`;
      if (!supplier.name) updates.name = 'Supplier';
      if (supplier.phone === undefined) updates.phone = '';
      if (supplier.email === undefined) updates.email = '';
      if (supplier.address === undefined) updates.address = '';
      if (supplier.bankName === undefined) updates.bankName = '';
      if (supplier.bankAccount === undefined) updates.bankAccount = '';
      if (supplier.bankAccountName === undefined) updates.bankAccountName = '';
      if (supplier.isActive === undefined) updates.isActive = true;
      if (supplier.notes === undefined) updates.notes = '';
      if (supplier.totalOrders === undefined) updates.totalOrders = 0;
      if (supplier.totalAmount === undefined) updates.totalAmount = 0;
      if (supplier.lastOrderDate === undefined) updates.lastOrderDate = null;
      if (!supplier.createdAt) updates.createdAt = new Date().toISOString();
      if (!supplier.updatedAt) updates.updatedAt = new Date().toISOString();
      
      if (Object.keys(updates).length > 0) {
        await tx.table('suppliers').update(supplier.id, updates);
      }
    }
    
    console.log('✅ Suppliers simplified successfully');
  } catch (error) {
    console.error('❌ Supplier migration failed:', error);
  }
});

/**
 * Supplier default values - SIMPLIFIED WITH BANK DETAILS
 */
export const getSupplierDefaults = (overrides = {}) => ({
  code: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  bankName: '',
  bankAccount: '',
  bankAccountName: '',
  notes: '',
  isActive: true,
  totalOrders: 0,
  totalAmount: 0,
  lastOrderDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

/**
 * Bank list for Indonesia
 */
export const INDONESIA_BANKS = [
  'Bank Mandiri',
  'Bank BCA',
  'Bank BNI',
  'Bank BRI',
  'Bank BTN',
  'Bank CIMB Niaga',
  'Bank Danamon',
  'Bank Permata',
  'Bank Maybank',
  'Bank OCBC NISP',
  'Bank Panin',
  'Bank Sinarmas',
  'Bank UOB',
  'Bank Mega',
  'Bank BII',
  'Bank BTPN',
  'Bank Bukopin',
  'Bank Syariah Indonesia (BSI)',
  'Bank Muamalat',
  'Bank Jago',
  'Bank Neo Commerce',
  'Jenius (BTPN)',
  'Lainnya'
];

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
        displayOrder: 3,
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
        displayOrder: 4,
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