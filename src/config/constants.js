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
    'Bank Sinarmas',
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

/**
 * Supplier default values
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

export default {
    INDONESIA_BANKS,
    getSupplierDefaults
};
