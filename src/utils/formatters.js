// Currency Formatter
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'Rp 0';
  return 'Rp' + new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatReceiptCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper untuk format Rupiah tanpa "Rp" di depan
export const formatRp = (amount) => {
  if (amount === undefined || amount === null) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Date Formatter
export const formatDate = (date, format = 'long') => {
  if (!date) return '-';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  if (format === 'medium') {
    return dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  
  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Time Formatter
export const formatTime = (date) => {
  if (!date) return '-';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return dateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// DateTime Formatter
export const formatDateTimes = (date) => {
  if (!date) return '-';
  
  return `${formatDate(date, 'medium')} ${formatTime(date)}`;
};

// Number Formatter
export const formatNumber = (number) => {
  return new Intl.NumberFormat('id-ID').format(number || 0);
};

// Phone Number Formatter
export const formatPhoneNumber = (phone) => {
  if (!phone) return '-';
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format: 0812-3456-7890
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3');
  }
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{4})(\d{4})(\d{3})/, '$1-$2-$3');
  }
  
  if (cleaned.length === 12) {
    return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  
  return phone;
};

// Registration Number Formatter
export const formatRegistrationNumber = (number) => {
  if (!number) return '-';
  return number.toString().padStart(6, '0');
};

// Capitalize First Letter
export const capitalizeFirst = (str) => {
  if (!str) return '';
  
  // Special cases for certain words
  const specialCases = {
    'bri': 'BRI',
    'bni': 'BNI',
    'mandiri': 'Mandiri',
    'muamalat': 'Muamalat',
    'bsi': 'BSI',
    'qris': 'QRIS',
    'gopay': 'GoPay',
    'shopeepay': 'ShopeePay',
    'dana': 'DANA',
    'ovo': 'OVO',
    'linkaja': 'LinkAja'
  };
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Check for special cases
      const lowerWord = word.toLowerCase();
      if (specialCases[lowerWord]) {
        return specialCases[lowerWord];
      }
      // Normal capitalization
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

// Truncate Text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// File Size Formatter
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const formatStock = (stock, unit = 'pcs') => {
  return `${stock} ${unit}`;
};

// Format date with time
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format currency with compact notation
export const formatCurrencyCompact = (amount) => {
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}jt`;
  } else if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(1)}rb`;
  }
  return formatCurrency(amount);
};