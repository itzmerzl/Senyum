// Validate Email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate Phone Number (Indonesia)
export const isValidPhoneNumber = (phone) => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if starts with 0 or 62 and has 10-13 digits
  const phoneRegex = /^(0|62)\d{9,12}$/;
  return phoneRegex.test(cleaned);
};

// Validate Required Field
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

// Validate Minimum Length
export const minLength = (value, min) => {
  if (typeof value === 'string') {
    return value.length >= min;
  }
  return false;
};

// Validate Maximum Length
export const maxLength = (value, max) => {
  if (typeof value === 'string') {
    return value.length <= max;
  }
  return false;
};

// Validate Number Range
export const isInRange = (value, min, max) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

// Validate Positive Number
export const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

// Validate File Size (in bytes)
export const isValidFileSize = (file, maxSizeInMB = 5) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

// Validate File Type
export const isValidFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']) => {
  return allowedTypes.includes(file.type);
};

// Validate Date
export const isValidDate = (date) => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

// Validate Future Date
export const isFutureDate = (date) => {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj > today;
};

// Validate Past Date
export const isPastDate = (date) => {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj < today;
};

// Registration Number Validator
export const isValidRegistrationNumber = (regNumber) => {
  // Must be alphanumeric, 5-20 characters
  const regNumberRegex = /^[A-Za-z0-9]{5,20}$/;
  return regNumberRegex.test(regNumber);
};

// SKU Validator
export const isValidSKU = (sku) => {
  // Must be alphanumeric with optional dash/underscore, 3-30 characters
  const skuRegex = /^[A-Za-z0-9-_]{3,30}$/;
  return skuRegex.test(sku);
};

// Barcode Validator
export const isValidBarcode = (barcode) => {
  // Must be numeric, 8-13 digits
  const barcodeRegex = /^\d{8,13}$/;
  return barcodeRegex.test(barcode);
};

// Form Validation Helper
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];
    
    fieldRules.forEach(rule => {
      if (rule.type === 'required' && !isRequired(value)) {
        errors[field] = rule.message || `${field} wajib diisi`;
      }
      
      if (rule.type === 'email' && value && !isValidEmail(value)) {
        errors[field] = rule.message || 'Email tidak valid';
      }
      
      if (rule.type === 'phone' && value && !isValidPhoneNumber(value)) {
        errors[field] = rule.message || 'Nomor telepon tidak valid';
      }
      
      if (rule.type === 'minLength' && value && !minLength(value, rule.value)) {
        errors[field] = rule.message || `Minimal ${rule.value} karakter`;
      }
      
      if (rule.type === 'maxLength' && value && !maxLength(value, rule.value)) {
        errors[field] = rule.message || `Maksimal ${rule.value} karakter`;
      }
      
      if (rule.type === 'min' && value && !isInRange(value, rule.value, Infinity)) {
        errors[field] = rule.message || `Minimal ${rule.value}`;
      }
      
      if (rule.type === 'positive' && value && !isPositiveNumber(value)) {
        errors[field] = rule.message || 'Harus berupa angka positif';
      }
    });
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};