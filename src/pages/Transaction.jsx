import { useState, useEffect } from 'react';
import { 
  Receipt, Search, Download, Eye, X, Calendar, 
  CreditCard, Banknote, Smartphone, Filter, 
  ChevronDown, ChevronUp, ShoppingCart, RefreshCw,
  TrendingUp, DollarSign, RotateCcw, Printer,
  CircleCheck, CircleX, Clock, CheckCircle,
  Building2, Upload, AlertCircle
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import { 
  getAllTransactions, 
  getTransactionStats,
  exportTransactions,
  refundTransaction,
  updateTransaction,
  cancelTransaction
} from '../services/transactionService';
import { formatCurrency, capitalizeFirst } from '../utils/formatters';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function Transaction() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: '',
    customerType: '',
    status: '',
    itemsPerPage: 25
  });
  
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState({
    refundAmount: 0,
    reason: '',
    refundMethod: 'cash'
  });

  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState(false);
  const [confirmPaymentData, setConfirmPaymentData] = useState({
    proofImage: null,
    proofImagePreview: null,
    notes: '',
    confirmedAmount: 0
  });
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  
  // Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, []);
  
  useEffect(() => {
    filterTransactions();
  }, [searchQuery, filters, transactions]);
  
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getAllTransactions();
      setTransactions(data);
    } catch (error) {
      toast.error('Gagal memuat data transaksi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadStats = async () => {
    try {
      const data = await getTransactionStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };
  
  const filterTransactions = () => {
    let result = [...transactions];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.invoiceNumber.toLowerCase().includes(query) ||
        t.customerName.toLowerCase().includes(query) ||
        (t.cashierName && t.cashierName.toLowerCase().includes(query))
      );
    }
    
    // Date range filter
    if (filters.startDate) {
      result = result.filter(t => 
        new Date(t.transactionDate) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(t => 
        new Date(t.transactionDate) <= endDate
      );
    }
    
    // Payment method filter
    if (filters.paymentMethod) {
      result = result.filter(t => t.paymentMethod === filters.paymentMethod);
    }
    
    // Customer type filter
    if (filters.customerType) {
      result = result.filter(t => t.customerType === filters.customerType);
    }
    
    // Status filter
    if (filters.status) {
      result = result.filter(t => t.status === filters.status);
    }
    
    // Limit items
    if (filters.itemsPerPage < 1000) {
      result = result.slice(0, filters.itemsPerPage);
    }
    
    setFilteredTransactions(result);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CircleCheck className="w-4 h-4" />,
          color: 'bg-green-100 text-green-800',
          label: 'Selesai'
        };
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'bg-yellow-100 text-yellow-800',
          label: 'Menunggu'
        };
      case 'cancelled':
        return {
          icon: <CircleX className="w-4 h-4" />,
          color: 'bg-red-100 text-red-800',
          label: 'Dibatalkan'
        };
      case 'refunded':
        return {
          icon: <RefreshCw className="w-4 h-4" />,
          color: 'bg-purple-100 text-purple-800',
          label: 'Refund'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'bg-gray-100 dark:bg-gray-700 text-gray-800',
          label: status
        };
    }
  };

  const enhancedStats = stats ? {
    ...stats,
    pendingTransactions: transactions.filter(t => t.status === 'pending').length,
    pendingAmount: transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.total, 0)
  } : null;

  const handleConfirmPayment = async () => {
    if (!selectedTransaction) return;
    
    try {
      setConfirmingPayment(true);
      
      // 1. Prepare update data
      const updateData = {
        status: 'completed',
        paymentConfirmedAt: new Date().toISOString(),
        paymentConfirmedBy: 'Admin',
        confirmationNotes: confirmPaymentData.notes,
        confirmedAmount: confirmPaymentData.confirmedAmount || selectedTransaction.total
      };
      
      // 2. Add proof image if exists
      if (confirmPaymentData.proofImage) {
        updateData.paymentProofImageBase64 = confirmPaymentData.proofImageBase64;
      }
      
      // 3. Update transaction
      await updateTransaction(selectedTransaction.id, updateData);
      
      // 4. Update payment method balance (optional, bisa error tapi ga masalah)
      try {
        const method = paymentMethods.find(m => m.code === selectedTransaction.paymentMethod);
        if (method) {
          await updatePaymentMethodBalance(method.id, {
            balance: (method.balance || 0) + selectedTransaction.total,
            amount: selectedTransaction.total,
            adjustmentType: 'payment_confirmed',
            notes: `Konfirmasi pembayaran ${selectedTransaction.invoiceNumber}`
          });
        }
      } catch (error) {
        console.error('Error updating payment method balance:', error);
        // Tidak throw error, karena transaksi tetap berhasil
      }
      
      toast.success('Pembayaran berhasil dikonfirmasi!', {
        duration: 4000,
      });
      
      // 5. Reset states
      setShowConfirmPaymentModal(false);
      setShowDetailModal(false);
      setConfirmPaymentData({
        proofImage: null,
        proofImagePreview: null,
        proofImageBase64: null, // ← Tambah ini juga
        notes: '',
        confirmedAmount: 0
      });
      
      // 6. Reload data
      await Promise.all([
        loadTransactions(),
        loadStats()
      ]);
      
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error(error.message || 'Gagal mengkonfirmasi pembayaran');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setConfirmPaymentData(prev => ({
        ...prev,
        proofImage: file,
        proofImagePreview: reader.result,
        proofImageBase64: reader.result // ← PENTING: Simpan ini!
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRefund = async () => {
    try {
      const refundTransaction = await refundTransaction(selectedTransaction.id, {
        type: 'refund',
        originalTransactionId: selectedTransaction.id,
        items: refundData.items,
        total: refundData.totalRefund,
        reason: refundData.reason,
        refundMethod: refundData.refundMethod,
        status: 'completed'
      });
      
      refundData.items.forEach(item => {
        updateProductStock(item.productId, item.quantity);
      });
      
      if (refundData.refundMethod === 'cash') {
        const cashMethod = await getPaymentMethodByCode('cash');
        await updatePaymentMethodBalance(cashMethod.id, {
          balance: cashMethod.balance - refundData.totalRefund,
          amount: refundData.totalRefund,
          adjustmentType: 'refund',
          notes: `Refund transaksi ${selectedTransaction.invoiceNumber}`
        });
      }
      
      await updateTransaction(selectedTransaction.id, {
        status: 'refunded',
        refundAmount: refundData.totalRefund
      });
      
      toast.success('Refund berhasil diproses');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCancelTransaction = async () => {
    try {
      await cancelTransaction(selectedTransaction.id, cancelReason);
      toast.success('Transaksi berhasil dibatalkan');
      setShowCancelModal(false);
      setCancelReason('');
      loadTransactions();
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  const handleExport = async () => {
    try {
      const data = await exportTransactions({
        startDate: filters.startDate,
        endDate: filters.endDate,
        paymentMethod: filters.paymentMethod,
        status: filters.status
      });
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
      XLSX.writeFile(wb, `transaksi-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Data berhasil diexport');
    } catch (error) {
      toast.error('Gagal export data');
      console.error(error);
    }
  };
  
  // Helper untuk format Rupiah tanpa "Rp" di depan
  const formatRp = (amount) => {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Fungsi untuk membuka preview struk
  const openReceiptPreview = (transaction) => {
    setReceiptToPrint(transaction);
    setShowReceiptPreview(true);
  };
  
  // Print function to generate and print receipt
  const handlePrintReceipt = (transaction) => {
    const printWindow = window.open('', '_blank', 'width=302,height=500');
    
    // Tambah fungsi ini bareng padRight & padLeft
    const padCenter = (text, width) => {
      const str = String(text);
      const totalPadding = Math.max(0, width - str.length);
      const leftPadding = Math.floor(totalPadding / 2);
      const rightPadding = totalPadding - leftPadding;
      return ' '.repeat(leftPadding) + str + ' '.repeat(rightPadding);
    };

    // FUNGSI PADDING YANG BENAR untuk printer thermal
    const padRight = (text, width) => {
      const str = String(text);
      return str + ' '.repeat(Math.max(0, width - str.length));
    };
    
    const padLeft = (text, width) => {
      const str = String(text);
      return ' '.repeat(Math.max(0, width - str.length)) + str;
    };
    
    // Fungsi buat baris dengan alignment yang benar
    const createRow = (label, value, isBoldValue = false, labelWidth = 15) => {
      const TOTAL_WIDTH = 32; // Lebar thermal 58mm = sekitar 32 karakter
      const valueStyle = isBoldValue ? 'font-weight: bold;' : '';
      
      // Potong label kalau kepanjangan
      const trimmedLabel = label.length > labelWidth ? label.substring(0, labelWidth) : label;
      const paddedLabel = padRight(trimmedLabel, labelWidth);
      
      // Value di kanan
      const valueWidth = TOTAL_WIDTH - labelWidth;
      const paddedValue = padLeft(value || '', valueWidth);
      
      return `<div style="font-size: 9pt; line-height: 1.3; font-family: 'Courier New', Courier, monospace; margin: 0; padding: 0;">${paddedLabel}${paddedValue}</div>`;
    };
    
    // Items formatting
    const itemsHtml = transaction.items.map(item => {
      const TOTAL_WIDTH = 32;
      
      // Nama produk (bold, baris sendiri)
      const itemNameRow = `<div style="font-size: 9pt; font-weight: bold; line-height: 1.3; font-family: 'Courier New', Courier, monospace; margin: 1px 0 0 0; padding: 0;">${item.productName}</div>`;
      
      // Detail: "1 x Rp16.000" (kiri) dan "Rp16.000" (kanan)
      const leftText = `${item.quantity} x Rp${formatRp(item.price)}`;
      const rightText = `Rp${formatRp(item.subtotal)}`;
      
      // Hitung padding
      const paddingNeeded = TOTAL_WIDTH - leftText.length - rightText.length;
      const padding = ' '.repeat(Math.max(0, paddingNeeded));
      
      const itemDetailRow = `<div style="font-size: 8pt; line-height: 1.3; font-family: 'Courier New', Courier, monospace; margin: 0 0 2px 0; padding: 0;">${leftText}${padding}<span style="font-weight: bold;">${rightText}</span></div>`;
      
      return itemNameRow + itemDetailRow;
    }).join('');
    
    const formattedDate = new Date(transaction.transactionDate).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Struk - ${transaction.invoiceNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            width: 58mm;
            margin: 0 auto;
            padding: 2mm 1mm;
            background: white;
            color: black;
            font-family: 'Courier New', Courier, monospace;
            font-size: 9pt;
            line-height: 1.3;
          }
          
          .receipt {
            width: 100%;
          }
          
          .store-header {
            text-align: center;
            margin-bottom: 2mm;
          }
          
          .store-name {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 0.5mm;
          }
          
          .store-address {
            font-size: 8pt;
            line-height: 1.2;
          }
          
          .divider {
            text-align: center;
            margin: 1mm 0;
            font-size: 8pt;
            letter-spacing: -0.5px;
          }
          
          .content-area {
            font-family: 'Courier New', Courier, monospace;
            white-space: pre;
          }
          
          .footer {
            text-align: center;
            margin-top: 2mm;
            margin-bottom: 5mm;
            font-size: 8pt;
          }

          .bottom-spacer {
            height: 10mm; /* Spacing buat trigger printer cut */
            font-size: 1pt;
            line-height: 1;
          }
          
          .thank-you {
            font-weight: bold;
          }
          
          @media print {
            @page {
              size: 58mm auto;
              margin: 0;
            }
            
            body {
              width: 58mm;
              padding: 2mm 1mm 5mm 1mm; /* Tambah padding bawah */
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
        <div class="bottom-spacer">
            &nbsp;
          </div>
          <div class="content-area">
${padCenter('KOPERASI SENYUMMU', 32)}
${padCenter('Jln. Pemandian No. 88', 32)}
${padCenter('Telp: 085183079329', 32)}
</div>
          
          <div class="divider">--------------------------------</div>
          
          <div class="content-area">
${createRow('No Invoice', transaction.invoiceNumber, true)}
${createRow('Tanggal', formattedDate)}
${createRow('Kasir', transaction.cashierName || 'Admin')}
${createRow('Pelanggan', transaction.customerName || 'Umum')}
</div>
          
          <div class="divider">--------------------------------</div>
          
          <div class="content-area">
${itemsHtml}
</div>
          
          <div class="divider">--------------------------------</div>
          
          <div class="content-area">
${createRow('Sub Total', `Rp${formatRp(transaction.subtotal)}`)}
${transaction.tax > 0 ? createRow('Pajak', `Rp${formatRp(transaction.tax)}`) : ''}
${transaction.discount > 0 ? createRow('Diskon', `-Rp${formatRp(transaction.discount)}`) : ''}
${createRow('Total', `Rp${formatRp(transaction.total)}`)}
</div>
          
          <div class="divider">--------------------------------</div>
          
          <div class="content-area">
${createRow('Metode Bayar', capitalizeFirst(transaction.paymentMethodName || transaction.paymentMethod), true)}
${createRow('Dibayar', `Rp${formatRp(transaction.paidAmount)}`)}
${transaction.changeAmount > 0 ? createRow('Kembali', `Rp${formatRp(transaction.changeAmount)}`) : ''}
</div>
          
          <div class="divider">--------------------------------</div>
          
          <div class="footer">
            <div class="thank-you">Terima kasih atas kunjungan Anda</div>  
          </div>

          <div class="bottom-spacer">
            &nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>
          </div>

        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
          
          window.onafterprint = function() {
            setTimeout(function() {
              window.close();
            }, 500);
          };

          setTimeout(function() {
            if (!window.closed) {
              window.close();
            }
          }, 5000);
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintPendingInvoice = (transaction) => {
      const printWindow = window.open('', '_blank', 'width=302,height=500');
      
      if (!printWindow) {
        toast.error('Pop-up diblokir! Izinkan pop-up untuk print.');
        return;
      }
      
      // Helper functions
      const padCenter = (text, width) => {
        const str = String(text);
        const totalPadding = Math.max(0, width - str.length);
        const leftPadding = Math.floor(totalPadding / 2);
        const rightPadding = totalPadding - leftPadding;
        return ' '.repeat(leftPadding) + str + ' '.repeat(rightPadding);
      };
  
      const padRight = (text, width) => {
        const str = String(text);
        return str + ' '.repeat(Math.max(0, width - str.length));
      };
      
      const padLeft = (text, width) => {
        const str = String(text);
        return ' '.repeat(Math.max(0, width - str.length)) + str;
      };
      
      const createRow = (label, value, isBoldValue = false, labelWidth = 15) => {
        const TOTAL_WIDTH = 32;
        const valueStyle = isBoldValue ? 'font-weight: bold;' : '';
        
        const trimmedLabel = label.length > labelWidth ? label.substring(0, labelWidth) : label;
        const paddedLabel = padRight(trimmedLabel, labelWidth);
        
        const valueWidth = TOTAL_WIDTH - labelWidth;
        const paddedValue = padLeft(value || '', valueWidth);
        
        return `<div style="font-size: 9pt; line-height: 1.3; font-family: 'Courier New', Courier, monospace; margin: 0; padding: 0; ${valueStyle}">${paddedLabel}${paddedValue}</div>`;
      };
      
      // Content builder functions
      const buildHeader = () => {
        const lines = [];
        lines.push(padCenter('KOPERASI SENYUMMU', 32));
        lines.push(padCenter('Jln. Pemandian No. 88', 32));
        lines.push(padCenter('Telp: 085183079329', 32));
        return lines.join('\n');
      };
  
      const buildTransactionInfo = (transaction, formattedDate) => {
        const lines = [];
        lines.push(padCenter('INVOICE PENDING', 32));
        lines.push(createRow('No Invoice', transaction.invoiceNumber, true));
        lines.push(createRow('Tanggal', formattedDate));
        lines.push(createRow('Kasir', transaction.cashierName || 'Admin'));
        lines.push(createRow('Pelanggan', transaction.customerName || 'Umum'));
        return lines.join('\n');
      };
  
      const buildTotals = (transaction) => {
        const lines = [];
        lines.push(createRow('Sub Total', `Rp${formatRp(transaction.subtotal)}`));
        if (transaction.tax > 0) {
          lines.push(createRow('Pajak', `Rp${formatRp(transaction.tax)}`));
        }
        if (transaction.discount > 0) {
          lines.push(createRow('Diskon', `-Rp${formatRp(transaction.discount)}`));
        }
        lines.push(createRow('Total Tagihan', `Rp${formatRp(transaction.total)}`, true));
        return lines.join('\n');
      };
  
      const buildPaymentInstructions = (transaction) => {
        if (transaction.paymentMethod === 'bank') {
          const lines = [];
          lines.push(`Transfer ke ${transaction.paymentMethodName || transaction.paymentMethod}`);
          lines.push(`No. Rek: ${transaction.bankAccount || '-'}`);
          lines.push(`a.n. ${transaction.accountName || 'Koperasi SenyumMu'}`);
          lines.push(`Sejumlah: Rp${formatRp(transaction.total)}`);
          return lines.join('\n'); // Gunakan \n untuk baris baru, bukan spasi
        }
        return '';
      };
  
      const buildItemsHtml = (transaction) => {
        return transaction.items.map(item => {
          const TOTAL_WIDTH = 32;
          
          const itemNameRow = `<div style="font-size: 9pt; font-weight: bold; line-height: 1.3; font-family: 'Courier New', Courier, monospace; margin: 1px 0 0 0; padding: 0;">${item.productName}</div>`;
          
          const leftText = `${item.quantity} x Rp${formatRp(item.price)}`;
          const rightText = `Rp${formatRp(item.subtotal)}`;
          
          const paddingNeeded = TOTAL_WIDTH - leftText.length - rightText.length;
          const padding = ' '.repeat(Math.max(0, paddingNeeded));
          
          const itemDetailRow = `<div style="font-size: 8pt; line-height: 1.3; font-family: 'Courier New', Courier, monospace; margin: 0 0 2px 0; padding: 0;">${leftText}${padding}<span style="font-weight: bold;">${rightText}</span></div>`;
          
          return itemNameRow + itemDetailRow;
        }).join('');
      };
      
      const formattedDate = new Date(transaction.transactionDate).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
  
      const paymentMethodName = transaction.paymentMethodName || capitalizeFirst(transaction.paymentMethod);
      const itemsHtml = buildItemsHtml(transaction);
  
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice Pending - ${transaction.invoiceNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              width: 58mm;
              margin: 0 auto;
              padding: 2mm 1mm;
              background: white;
              color: black;
              font-family: 'Courier New', Courier, monospace;
              font-size: 9pt;
              line-height: 1.3;
            }
            
            .invoice {
              width: 100%;
            }
            
            .divider {
              text-align: center;
              margin: 1mm 0;
              font-size: 8pt;
              letter-spacing: -0.5px;
            }
            
            .content-area {
              font-family: 'Courier New', Courier, monospace;
              white-space: pre;
            }
            
            .footer {
              text-align: center;
              margin-top: 2mm;
              margin-bottom: 5mm;
              font-size: 8pt;
            }
  
            .bottom-spacer {
              height: 10mm;
              font-size: 1pt;
              line-height: 1;
            }
            
            .status-pending {
              background: #fef3c7;
              border: 2px dashed #f59e0b;
              padding: 2mm;
              margin: 2mm 0;
              text-align: center;
              font-weight: bold;
              font-size: 10pt;
              color: #92400e;
            }
  
            .payment-instructions {
              background: #dbeafe;
              border: 1px solid #3b82f6;
              padding: 2mm;
              margin: 2mm 0;
              font-size: 8pt;
            }
  
            .payment-instructions-title {
              font-weight: bold;
              font-size: 9pt;
              margin-bottom: 1mm;
              color: #1e40af;
            }
            
            @media print {
              @page {
                size: 58mm auto;
                margin: 0;
              }
              
              body {
                width: 58mm;
                padding: 2mm 1mm 5mm 1mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="bottom-spacer">&nbsp;</div>
            
            <div class="content-area">${buildHeader()}</div>
            
            <div class="divider">--------------------------------</div>
            
            <div class="content-area">${buildTransactionInfo(transaction, formattedDate)}</div>
            
            <div class="divider">--------------------------------</div>
            
            <div class="content-area">${itemsHtml}</div>
            
            <div class="divider">--------------------------------</div>
            
            <div class="content-area">${buildTotals(transaction)}</div>
            
            <div class="divider">--------------------------------</div>
            
            <div class="content-area">Cara Pembayaran :</div>
            
            <div class="payment-instructions">${buildPaymentInstructions(transaction)}</div>
            
            <div class="divider">--------------------------------</div>
            
            <div class="footer">
              Invoice ini belum lunas<br>
              Simpan invoice ini sebagai bukti pembayaran.
            </div>
  
            <div class="bottom-spacer">
              &nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
            
            window.onafterprint = function() {
              setTimeout(function() {
                window.close();
              }, 500);
            };
  
            setTimeout(function() {
              if (!window.closed) {
                window.close();
              }
            }, 5000);
          </script>
        </body>
        </html>
          `;
        
        printWindow.document.write(htmlContent);
        printWindow.document.close();
  };
  
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      paymentMethod: '',
      customerType: '',
      status: '',
      itemsPerPage: 25
    });
    setSearchQuery('');
  };
  
  const activeFilterCount = () => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.paymentMethod) count++;
    if (filters.customerType) count++;
    if (filters.status !== '') count++;
    if (searchQuery) count++;
    return count;
  };
  
  const getPaymentIcon = (method) => {
    switch (method) {
      case 'cash': return <DollarSign className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'qris': return <Smartphone className="w-4 h-4" />;
      default: return <Banknote className="w-4 h-4" />;
    }
  };
  
  const getPaymentColor = (method) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'qris': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800';
    }
  };

  const getStatusIcon = (method) => {
    switch (method) {
      case 'completed': return <CircleCheck className="w-4 h-4" />;
      default: return <CircleX className="w-4 h-4" />;
    }
  };
  
  return (
    <Layout>
      {/* Stats Cards */}
      {enhancedStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Transaksi</p>
                <p className="text-2xl font-bold text-blue-600">{enhancedStats.totalTransactions}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Pendapatan</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(enhancedStats.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{enhancedStats.pendingTransactions}</p>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{formatCurrency(enhancedStats.pendingAmount)}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Rata-rata Transaksi</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(enhancedStats.averageTransaction)}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Dibatalkan</p>
                <p className="text-2xl font-bold text-red-600">{enhancedStats.cancelledTransactions}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <X className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Cari no invoice, pelanggan, atau kasir..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors relative ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount()}
                </span>
              )}
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Metode Bayar</label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Semua</option>
                  <option value="cash">Tunai</option>
                  <option value="card">Kartu</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipe Pelanggan</label>
                <select
                  value={filters.customerType}
                  onChange={(e) => setFilters(prev => ({ ...prev, customerType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Semua</option>
                  <option value="general">Umum</option>
                  <option value="student">Santri</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Semua Status</option>
                  <option value="completed">Selesai</option>
                  <option value="pending">Menunggu Pembayaran</option>
                  <option value="cancelled">Dibatalkan</option>
                  <option value="refunded">Refund</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tampilkan</label>
                <select
                  value={filters.itemsPerPage}
                  onChange={(e) => setFilters(prev => ({ ...prev, itemsPerPage: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value={25}>25 item</option>
                  <option value={50}>50 item</option>
                  <option value={100}>100 item</option>
                  <option value={1000}>Semua</option>
                </select>
              </div>
            </div>
            
            {activeFilterCount() > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 rounded-lg text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Reset Filter ({activeFilterCount()})
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">No Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Pelanggan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Pembayaran</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="spinner"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <Receipt className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-300">Tidak ada transaksi</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => {
                  const isExpanded = expandedTransaction === transaction.id;
                  const statusInfo = getStatusBadge(transaction.status);

                  return (
                    <>
                      <tr key={transaction.id} className={`hover:bg-gray-50 dark:bg-gray-700 ${
                        transaction.status === 'pending' ? 'bg-yellow-50/30' : ''
                      }`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-blue-600">{transaction.invoiceNumber}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-300">
                            {transaction.items?.length || 0} item
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {new Date(transaction.transactionDate).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{transaction.customerName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-300">
                            {transaction.customerType === 'student' ? 'Santri' : 'Umum'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(transaction.total)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentColor(transaction.paymentMethod)}`}>
                            {getPaymentIcon(transaction.paymentMethod)}
                            {capitalizeFirst(transaction.paymentMethodName || transaction.paymentMethod)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowDetailModal(true);
                              }}
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                              title="Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {transaction.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setShowConfirmPaymentModal(true);
                                  }}
                                  className="p-2 hover:bg-green-50 text-green-600 rounded-lg"
                                  title="Konfirmasi Pembayaran"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setShowCancelModal(true);
                                  }}
                                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                                  title="Batalkan"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {transaction.status === 'completed' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setShowCancelModal(true);
                                  }}
                                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                                  title="Batalkan"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setShowRefundModal(true);
                                  }}
                                  className="p-2 hover:bg-orange-50 text-orange-600 rounded-lg"
                                  title="Refund"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {(transaction.status === 'completed' || transaction.status === 'pending') && (
                              <button
                                onClick={() => openReceiptPreview(transaction)}
                                className="p-2 hover:bg-green-50 text-green-600 rounded-lg"
                                title="Preview & Cetak Struk"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setExpandedTransaction(isExpanded ? null : transaction.id)}
                              className="p-2 hover:bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50 dark:bg-gray-700">
                          <td colSpan="7" className="px-4 py-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 dark:text-gray-300 mb-2 font-medium">Items:</p>
                                {transaction.items?.map((item, idx) => (
                                  <div key={idx} className="flex justify-between py-1">
                                    <span>{item.productName} x{item.quantity}</span>
                                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-500 dark:text-gray-300">Kasir:</span>
                                  <span className="font-medium">{transaction.cashierName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500 dark:text-gray-300">Dibayar:</span>
                                  <span className="font-medium">{formatCurrency(transaction.paidAmount)}</span>
                                </div>
                                {transaction.changeAmount > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-300">Kembalian:</span>
                                    <span className="font-medium text-green-600">{formatCurrency(transaction.changeAmount)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
            </p>
          </div>
        )}
      </div>
      
      {/* Modal Preview Struk */}
      <Modal
        isOpen={showReceiptPreview}
        onClose={() => setShowReceiptPreview(false)}
        title={receiptToPrint?.status === 'pending' ? 'Preview Invoice Pending' : 'Preview Struk'}
        size="sm"
      >
        {receiptToPrint && (() => {
          const formattedDate = new Date(receiptToPrint.transactionDate).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          const isPending = receiptToPrint.status === 'pending';
          
          return (
            <div className="space-y-4">
              {/* Preview Struk */}
              <div className="bg-white border-2 border-gray-800 rounded-none p-4 font-mono max-h-[525px] overflow-y-auto">
                {/* Header */}
                <div className="text-center mb-3">
                  <h2 className="text-lg font-bold uppercase tracking-wider mb-1">KOPERASI SENYUMMU</h2>
                  <p className="text-xs">Jln. Pemandian No. 88</p>
                  <p className="text-xs">Telp: 085183079329</p>
                </div>
                
                {/* Divider */}
                <div className="text-center text-xs mb-1">-----------------------------------------------------</div>
                
                {/* Status Badge untuk Pending */}
                {isPending && (
                  <div className="text-center">
                    <span className="text-xs font-bold">INVOICE PENDING</span>
                  </div>
                )}
                
                {/* Transaction Info */}
                
                <div className="text-xs space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span>No Invoice</span>
                    <span className="font-bold">{receiptToPrint.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal</span>
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir</span>
                    <span>{receiptToPrint.cashierName || 'Admin'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan</span>
                    <span>{receiptToPrint.customerName || 'Umum'}</span>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="text-center text-xs mb-3">-----------------------------------------------------</div>
                
                {/* Items */}
                <div className="mb-3">
                  {receiptToPrint.items?.map((item, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="font-bold text-sm">{item.productName}</div>
                      <div className="flex justify-between text-xs">
                        <span>{item.quantity} x Rp{formatRp(item.price)}</span>
                        <span className="font-bold">Rp{formatRp(item.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Divider */}
                <div className="text-center text-xs mb-3">-----------------------------------------------------</div>
                
                {/* Summary */}
                <div className="text-xs space-y-1 mb-2">
                  <div className="flex justify-between">
                    <span>Sub Total</span>
                    <span>Rp{formatRp(receiptToPrint.subtotal)}</span>
                  </div>
                  {receiptToPrint.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Pajak</span>
                      <span>Rp{formatRp(receiptToPrint.tax)}</span>
                    </div>
                  )}
                  {receiptToPrint.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Diskon</span>
                      <span>-Rp{formatRp(receiptToPrint.discount)}</span>
                    </div>
                  )}
                </div>
                
                {/* Total */}
                <div className="flex justify-between text-xs mb-2">
                  <span>{isPending ? 'Total Tagihan' : 'Total'}</span>
                  <span className="font-bold">Rp{formatRp(receiptToPrint.total)}</span>
                </div>
                
                {/* Divider */}
                <div className="text-center text-xs mb-2">-----------------------------------------------------</div>
                
                {/* Payment Info - Berbeda untuk Pending vs Completed */}
                {isPending ? (
                  // Instruksi Pembayaran untuk Pending
                  <div className="text-xs mb-3">
                    <div className="text-center font-bold mb-2">Cara Pembayaran :</div>
                    <div className="mb-1">
                      Transfer ke {receiptToPrint.paymentMethodName || receiptToPrint.paymentMethod}
                    </div>
                    {receiptToPrint.paymentDetails && (
                      <>
                        {receiptToPrint.paymentDetails.bankAccount && (
                          <div>No. Rek: {receiptToPrint.bankAccount}</div>
                        )}
                        {receiptToPrint.paymentDetails.accountName && (
                          <div>a.n. {receiptToPrint.accountName || "Koperasi SenyumMu"}</div>
                        )}
                      </>
                    )}
                    <div>Sejumlah: Rp{formatRp(receiptToPrint.total)}</div>
                  </div>
                ) : (
                  // Info Pembayaran untuk Completed
                  <div className="text-xs space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span>Metode Bayar</span>
                      <span className="font-bold">{capitalizeFirst(receiptToPrint.paymentMethodName || receiptToPrint.paymentMethod)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dibayar</span>
                      <span>Rp{formatRp(receiptToPrint.paidAmount)}</span>
                    </div>
                    {receiptToPrint.changeAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Kembali</span>
                        <span className="font-bold">Rp{formatRp(receiptToPrint.changeAmount)}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Divider */}
                <div className="text-center text-xs mb-3">-----------------------------------------------------</div>
                
                {/* Footer - Berbeda untuk Pending vs Completed */}
                <div className="text-center text-xs">
                  {isPending ? (
                    <>
                      <div className="font-bold mb-1">Invoice ini belum lunas</div>
                      <div className="text-[10px]">Simpan invoice ini sebagai bukti pembayaran</div>
                    </>
                  ) : (
                    <div className="font-bold mb-1">Terima kasih atas kunjungan Anda</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReceiptPreview(false)}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowReceiptPreview(false);
                    setTimeout(() => {
                      if (receiptToPrint.status === 'pending') {
                        handlePrintPendingInvoice(receiptToPrint);
                      } else {
                        handlePrintReceipt(receiptToPrint);
                      }
                    }, 100);
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  {isPending ? 'Cetak Invoice' : 'Cetak Struk'}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
      
      {/* Detail Transaction Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detail Transaksi"
        size="lg"
      >
        {selectedTransaction && (() => {
          const statusInfo = getStatusBadge(selectedTransaction.status);
          const isPending = selectedTransaction.status === 'pending';
          const isCompleted = selectedTransaction.status === 'completed';
          const isCancelled = selectedTransaction.status === 'cancelled';
          const isRefunded = selectedTransaction.status === 'refunded';
          
          return (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className={`rounded-lg p-4 border-2 ${
                isPending ? 'bg-yellow-50 border-yellow-300' :
                isCompleted ? 'bg-green-50 border-green-300' :
                isCancelled ? 'bg-red-50 border-red-300' :
                isRefunded ? 'bg-purple-50 border-purple-300' :
                'bg-gray-50 dark:bg-gray-700 border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${
                      isPending ? 'bg-yellow-100' :
                      isCompleted ? 'bg-green-100' :
                      isCancelled ? 'bg-red-100' :
                      'bg-purple-100'
                    }`}>
                      {statusInfo.icon}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Status Transaksi</p>
                      <p className={`text-xl font-bold ${
                        isPending ? 'text-yellow-700' :
                        isCompleted ? 'text-green-700' :
                        isCancelled ? 'text-red-700' :
                        'text-purple-700'
                      }`}>
                        {statusInfo.label}
                      </p>
                      {isPending && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Menunggu konfirmasi pembayaran
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {isPending && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setShowConfirmPaymentModal(true);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Konfirmasi
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setShowCancelModal(true);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Batalkan
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Header Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-300 uppercase font-medium mb-1">No Invoice</p>
                    <p className="font-bold text-lg text-blue-600">{selectedTransaction.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-300 uppercase font-medium mb-1">Tanggal & Waktu</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedTransaction.transactionDate).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {new Date(selectedTransaction.transactionDate).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })} WIB
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-300 uppercase font-medium mb-1">Pelanggan</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedTransaction.customerName}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedTransaction.customerType === 'student' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700'
                    }`}>
                      {selectedTransaction.customerType === 'student' ? 'Santri' : 'Umum'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-300 uppercase font-medium mb-1">Kasir</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedTransaction.cashierName || 'Admin'}</p>
                  </div>
                </div>
              </div>
              
              {/* Payment Method & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-300 uppercase font-medium mb-2">Metode Pembayaran</p>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getPaymentColor(selectedTransaction.paymentMethod)}`}>
                      {getPaymentIcon(selectedTransaction.paymentMethod)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {selectedTransaction.paymentMethodName || capitalizeFirst(selectedTransaction.paymentMethod)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        {capitalizeFirst(selectedTransaction.paymentMethod)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-300 uppercase font-medium mb-2">Status Pembayaran</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${statusInfo.color}`}>
                    {statusInfo.icon}
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {/* Payment Details for Bank Transfer */}
              {(isPending || isCompleted) && selectedTransaction.paymentDetails && (
                <div className={`rounded-lg border-2 p-4 ${
                  isPending ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isPending ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <Building2 className={`w-5 h-5 ${
                        isPending ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold mb-2 ${
                        isPending ? 'text-yellow-800' : 'text-blue-800'
                      }`}>
                        Informasi Transfer Bank
                      </p>
                      <div className="space-y-1.5">
                        {selectedTransaction.paymentDetails.bankAccount && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${
                              isPending ? 'text-yellow-600' : 'text-blue-600'
                            }`}>
                              No. Rekening:
                            </span>
                            <span className={`text-sm font-bold ${
                              isPending ? 'text-yellow-900' : 'text-blue-900'
                            }`}>
                              {selectedTransaction.paymentDetails.bankAccount}
                            </span>
                          </div>
                        )}
                        {selectedTransaction.paymentDetails.accountName && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${
                              isPending ? 'text-yellow-600' : 'text-blue-600'
                            }`}>
                              Nama Pemilik:
                            </span>
                            <span className={`text-sm font-bold ${
                              isPending ? 'text-yellow-900' : 'text-blue-900'
                            }`}>
                              {selectedTransaction.paymentDetails.accountName}
                            </span>
                          </div>
                        )}
                        {selectedTransaction.paymentDetails.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${
                              isPending ? 'text-yellow-600' : 'text-blue-600'
                            }`}>
                              No. HP:
                            </span>
                            <span className={`text-sm font-bold ${
                              isPending ? 'text-yellow-900' : 'text-blue-900'
                            }`}>
                              {selectedTransaction.paymentDetails.phoneNumber}
                            </span>
                          </div>
                        )}
                      </div>
                      {isPending && (
                        <p className="text-xs text-yellow-600 mt-2 italic">
                          💡 Harap verifikasi informasi di atas sebelum konfirmasi
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation/Refund Info */}
              {(isCancelled || isRefunded) && (
                <div className={`rounded-lg border-2 p-4 ${
                  isCancelled ? 'bg-red-50 border-red-300' : 'bg-purple-50 border-purple-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isCancelled ? 'bg-red-100' : 'bg-purple-100'
                    }`}>
                      {isCancelled ? (
                        <X className="w-5 h-5 text-red-600" />
                      ) : (
                        <RefreshCw className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold mb-1 ${
                        isCancelled ? 'text-red-800' : 'text-purple-800'
                      }`}>
                        {isCancelled ? 'Transaksi Dibatalkan' : 'Transaksi Di-refund'}
                      </p>
                      {selectedTransaction.cancellationReason && (
                        <p className={`text-sm ${
                          isCancelled ? 'text-red-700' : 'text-purple-700'
                        }`}>
                          Alasan: {selectedTransaction.cancellationReason}
                        </p>
                      )}
                      {selectedTransaction.cancelledAt && (
                        <p className={`text-xs mt-1 ${
                          isCancelled ? 'text-red-600' : 'text-purple-600'
                        }`}>
                          {new Date(selectedTransaction.cancelledAt).toLocaleString('id-ID')}
                        </p>
                      )}
                      {isRefunded && selectedTransaction.refundAmount && (
                        <p className="text-sm font-bold text-purple-700 mt-2">
                          Jumlah Refund: {formatCurrency(selectedTransaction.refundAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Items Table */}
              <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-800 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Daftar Item ({selectedTransaction.items?.length || 0})
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Total Items: {selectedTransaction.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {selectedTransaction.items?.map((item, idx) => (
                    <div key={idx} className="px-4 py-3 hover:bg-gray-50 dark:bg-gray-700 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 dark:text-white">{item.productName}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {item.quantity} × {formatCurrency(item.price)}
                            </span>
                            {item.sku && (
                              <span className="text-xs text-gray-400">
                                SKU: {item.sku}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-blue-600">{formatCurrency(item.subtotal)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-300 uppercase font-bold mb-3">Ringkasan Pembayaran</p>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Sub Total</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(selectedTransaction.subtotal)}</span>
                  </div>
                  {selectedTransaction.tax > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Pajak</span>
                      <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(selectedTransaction.tax)}</span>
                    </div>
                  )}
                  {selectedTransaction.discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Diskon</span>
                      <span className="font-bold text-green-600">-{formatCurrency(selectedTransaction.discount)}</span>
                    </div>
                  )}
                  
                  <div className="border-t-2 border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">TOTAL</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(selectedTransaction.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Amount Details */}
              {(isCompleted || isPending) && (
                <div className={`rounded-lg p-4 border-2 ${
                  isPending ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <p className="text-xs text-gray-500 dark:text-gray-300 uppercase font-bold mb-3">Detail Pembayaran</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={isPending ? 'text-yellow-700' : 'text-gray-900 dark:text-white'}>
                        Jumlah yang Harus Dibayar
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(selectedTransaction.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isPending ? 'text-yellow-700' : 'text-gray-900 dark:text-white'}>
                        Jumlah Dibayar
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(selectedTransaction.paidAmount)}</span>
                    </div>
                    {selectedTransaction.changeAmount > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                        <span className="font-medium text-green-700">Kembalian</span>
                        <span className="font-bold text-xl text-green-600">
                          {formatCurrency(selectedTransaction.changeAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transaction Timeline */}
              {selectedTransaction.timeline && selectedTransaction.timeline.length > 0 && (
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-300 uppercase font-bold mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Riwayat Transaksi
                  </p>
                  <div className="space-y-3">
                    {selectedTransaction.timeline.map((event, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{event.action}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-300">
                            {new Date(event.timestamp).toLocaleString('id-ID')} • {event.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                {isCompleted && (
                  <>
                    <button
                      onClick={() => openReceiptPreview(selectedTransaction)}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      Cetak Struk
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowRefundModal(true);
                      }}
                      className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Refund
                    </button>
                  </>
                )}
                
                {isPending && (
                  <>
                    <button
                      onClick={() => openReceiptPreview(selectedTransaction)}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      Print Invoice
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowConfirmPaymentModal(true);
                      }}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Konfirmasi Pembayaran
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Cancel Transaction Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Batalkan Transaksi"
        size="sm"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Anda akan membatalkan transaksi
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Invoice: <span className="font-medium">{selectedTransaction.invoiceNumber}</span>
                  </p>
                  <p className="text-sm text-red-600">
                    Total: <span className="font-medium">{formatCurrency(selectedTransaction.total)}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Pembatalan *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Masukkan alasan pembatalan transaksi..."
                required
              />
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleCancelTransaction}
                disabled={!cancelReason.trim()}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batalkan Transaksi
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Payment Modal */}
      <Modal
        isOpen={showConfirmPaymentModal}
        onClose={() => !confirmingPayment && setShowConfirmPaymentModal(false)}
        title="Konfirmasi Pembayaran"
        size="md"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            {/* Header Alert */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800 mb-1">
                    Konfirmasi Penerimaan Pembayaran
                  </p>
                  <div className="space-y-1 text-sm text-green-700">
                    <p>
                      <span className="font-medium">Invoice:</span> {selectedTransaction.invoiceNumber}
                    </p>
                    <p>
                      <span className="font-medium">Pelanggan:</span> {selectedTransaction.customerName}
                    </p>
                    <p>
                      <span className="font-medium">Metode:</span> {selectedTransaction.paymentMethodName || selectedTransaction.paymentMethod}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount to Confirm */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-600 uppercase font-bold mb-2">Jumlah yang Harus Dibayar</p>
              <p className="text-3xl font-bold text-blue-700">
                {formatCurrency(selectedTransaction.total)}
              </p>
            </div>

            {/* Payment Details from Customer */}
            {selectedTransaction.paymentDetails && (
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Informasi Transfer dari Customer
                </p>
                <div className="space-y-2 text-sm">
                  {selectedTransaction.paymentDetails.bankAccount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">No. Rekening :</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {selectedTransaction.paymentDetails.bankAccount}
                      </span>
                    </div>
                  )}
                  {selectedTransaction.paymentDetails.accountName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Nama Rekening :</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {selectedTransaction.paymentDetails.accountName}
                      </span>
                    </div>
                  )}
                  {selectedTransaction.paymentDetails.phoneNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">No. HP:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {selectedTransaction.paymentDetails.phoneNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confirmed Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah yang Diterima <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 font-medium">
                  Rp
                </span>
                <input
                  type="number"
                  value={confirmPaymentData.confirmedAmount ?? selectedTransaction.total}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                    setConfirmPaymentData({
                      ...confirmPaymentData,
                      confirmedAmount: value
                    });
                  }}
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-bold transition-colors ${
                    (() => {
                      const confirmed = parseFloat(confirmPaymentData.confirmedAmount) || 0;
                      const expected = parseFloat(selectedTransaction.total) || 0;
                      const diff = Math.abs(confirmed - expected);
                      
                      if (diff < 0.01) return 'border-green-300 bg-green-50';
                      if (diff > 0) return 'border-orange-300 bg-orange-50';
                      return 'border-gray-300';
                    })()
                  }`}
                  placeholder="0"
                  step="0.01"
                  min="0"
                />
              </div>
              
              {/* Smart Feedback */}
              {(() => {
                const confirmedAmount = parseFloat(confirmPaymentData.confirmedAmount) || 0;
                const expectedAmount = parseFloat(selectedTransaction.total) || 0;
                const difference = confirmedAmount - expectedAmount;
                
                if (Math.abs(difference) < 0.01) {
                  return (
                    <div className="flex items-center gap-2 text-green-600 text-sm mt-2 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      <span>Jumlah pembayaran sesuai</span>
                    </div>
                  );
                } else if (difference > 0) {
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800">
                            Kelebihan Pembayaran
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Customer bayar lebih {formatCurrency(difference)}. 
                            Kembalikan selisih atau catat sebagai deposit.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                } else if (difference < 0) {
                  return (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-800">
                            Pembayaran Kurang
                          </p>
                          <p className="text-xs text-orange-600 mt-1">
                            Masih kurang {formatCurrency(Math.abs(difference))}. 
                            Pastikan customer melunasi atau buat catatan piutang.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
            
            {/* Upload Proof of Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bukti Transfer <span className="text-gray-500 dark:text-gray-300">(Opsional)</span>
              </label>
              
              {confirmPaymentData.proofImagePreview ? (
                <div className="relative">
                  <img
                    src={confirmPaymentData.proofImagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    onClick={() => setConfirmPaymentData(prev => ({
                      ...prev,
                      proofImage: null,
                      proofImagePreview: null
                    }))}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:bg-gray-700 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">Click to upload</span> atau drag & drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">PNG, JPG, JPEG (Max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            {/* Confirmation Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan Konfirmasi <span className="text-gray-500 dark:text-gray-300">(Opsional)</span>
              </label>
              <textarea
                value={confirmPaymentData.notes}
                onChange={(e) => setConfirmPaymentData({
                  ...confirmPaymentData,
                  notes: e.target.value
                })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Transfer diterima pukul 14:00 WIB, nominal sesuai"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700 leading-relaxed">
                <strong>Informasi:</strong><br />
                • Stok produk sudah dikurangi saat transaksi dibuat<br />
                • Saldo metode pembayaran akan ditambahkan setelah konfirmasi<br />
                • Status transaksi akan berubah menjadi "Selesai"
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowConfirmPaymentModal(false)}
                disabled={confirmingPayment}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={confirmingPayment || !confirmPaymentData.confirmedAmount}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {confirmingPayment ? (
                  <>
                    <div className="spinner w-5 h-5 border-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Konfirmasi Pembayaran
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Refund */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        title="Proses Refund"
        size="md"
      >
      {selectedTransaction && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Refund Transaksi</p>
                <p className="text-sm text-yellow-600">
                  Invoice: {selectedTransaction?.invoiceNumber}
                </p>
                <p className="text-sm text-yellow-600">
                  Total: {formatCurrency(selectedTransaction?.total)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Refund *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">Rp</span>
              <input
                type="number"
                value={refundData.refundAmount}
                onChange={(e) => setRefundData({...refundData, refundAmount: parseFloat(e.target.value)})}
                max={selectedTransaction?.total}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              Maksimal: {formatCurrency(selectedTransaction?.total)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metode Refund *
            </label>
            <select
              value={refundData.refundMethod}
              onChange={(e) => setRefundData({...refundData, refundMethod: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="cash">Tunai</option>
              <option value="bank_transfer">Transfer Kembali</option>
              <option value="store_credit">Kredit Toko</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alasan Refund *
            </label>
            <textarea
              value={refundData.reason}
              onChange={(e) => setRefundData({...refundData, reason: e.target.value})}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Contoh: Barang rusak, tidak sesuai, dll."
              required
            />
          </div>

          {refundData.refundMethod === 'store_credit' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                Kredit akan ditambahkan ke akun pelanggan untuk pembelian berikutnya
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setShowRefundModal(false)}
              className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleRefund}
              disabled={!refundData.reason.trim() || refundData.refundAmount <= 0}
              className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              Proses Refund
            </button>
          </div>
        </div>
      )}
      </Modal>
    </Layout>
  );
}