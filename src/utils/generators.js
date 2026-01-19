import api from './apiClient';

// Helper to fetch and filter locally (temporary until backend supports better filtering)
async function getItems(endpoint) {
  try {
    return await api.get(endpoint);
  } catch (error) {
    console.error(`Error fetching items for generator (${endpoint}):`, error);
    return [];
  }
}

// Generate invoice number: INV/YYYYMMDD/0001
export async function generateInvoiceNumber(prefix = 'INV') {
  try {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get all transactions and filter
    const transactions = await getItems('transactions');
    const todayTransactions = transactions.filter(t =>
      t.invoiceNumber && t.invoiceNumber.startsWith(`${prefix}/${dateStr}/`)
    );

    const nextNumber = todayTransactions.length + 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');

    return `${prefix}/${dateStr}/${paddedNumber}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return `${prefix}/${Date.now()}`;
  }
}

// Generate receipt number: RCP/YYYYMMDD/0001
export async function generateReceiptNumber(prefix = 'RCP') {
  try {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // RCP is often used for liabilities payment
    const payments = await getItems('payments');
    const todayPayments = payments.filter(p =>
      p.receiptNumber && p.receiptNumber.startsWith(`${prefix}/${dateStr}/`)
    );

    const nextNumber = todayPayments.length + 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');

    return `${prefix}/${dateStr}/${paddedNumber}`;
  } catch (error) {
    console.error('Error generating receipt number:', error);
    return `${prefix}/${Date.now()}`;
  }
}

// Generate SKU: PRD-YYYYMMDD-XXXX
export async function generateSKU() {
  try {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const products = await getItems('products');
    const todayProducts = products.filter(p =>
      p.sku && p.sku.startsWith(`PRD-${dateStr}`)
    );

    const nextNumber = todayProducts.length + 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');

    return `PRD-${dateStr}-${paddedNumber}`;
  } catch (error) {
    console.error('Error generating SKU:', error);
    return `PRD-${Date.now()}`;
  }
}

// Generate category code: CAT-XXX
export async function generateCategoryCode() {
  try {
    const categories = await getItems('categories');
    const nextNumber = categories.length + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');

    return `CAT-${paddedNumber}`;
  } catch (error) {
    console.error('Error generating category code:', error);
    return `CAT-${Date.now()}`;
  }
}

// Generate supplier code: SUP-XXX
export async function generateSupplierCode() {
  try {
    const suppliers = await getItems('suppliers');
    const nextNumber = suppliers.length + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');

    return `SUP-${paddedNumber}`;
  } catch (error) {
    console.error('Error generating supplier code:', error);
    return `SUP-${Date.now()}`;
  }
}

// Generate student registration number: REG/YYYY/XXXX
export async function generateRegistrationNumber() {
  try {
    const year = new Date().getFullYear();

    const students = await getItems('students');
    const yearStudents = students.filter(s =>
      s.registrationNumber && s.registrationNumber.startsWith(`REG/${year}/`)
    );

    const nextNumber = yearStudents.length + 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');

    return `REG/${year}/${paddedNumber}`;
  } catch (error) {
    console.error('Error generating registration number:', error);
    return `REG/${new Date().getFullYear()}/${Date.now()}`;
  }
}

// Generate cash drawer session ID: CDS-YYYYMMDD-XXXX
export async function generateCashDrawerSessionId() {
  try {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const sessions = await getItems('cashDrawer');
    const todaySessions = sessions.filter(s =>
      s.sessionId && s.sessionId.startsWith(`CDS-${dateStr}`)
    );

    const nextNumber = todaySessions.length + 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');

    return `CDS-${dateStr}-${paddedNumber}`;
  } catch (error) {
    console.error('Error generating cash drawer session ID:', error);
    return `CDS-${Date.now()}`;
  }
}

// Generate random barcode (EAN-13 format)
export function generateRandomBarcode() {
  const prefix = '890'; // Indonesia country code
  const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  const code = prefix + random;

  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return code + checkDigit;
}

// Format number with leading zeros
export function padNumber(number, length = 4) {
  return number.toString().padStart(length, '0');
}

// Generate unique ID
export function generateUniqueId(prefix = '') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}${random}`;
}

export default {
  generateInvoiceNumber,
  generateReceiptNumber,
  generateSKU,
  generateCategoryCode,
  generateSupplierCode,
  generateRegistrationNumber,
  generateCashDrawerSessionId,
  generateRandomBarcode,
  padNumber,
  generateUniqueId
};
