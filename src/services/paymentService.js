// services/paymentService.js
export const paymentService = {
  // Simulasi TapCash payment
  async processTapCash(amount, cardNumber) {
    // API call ke sistem TapCash
    // Dalam implementasi nyata, ini akan connect ke hardware TapCash reader
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulasi response sukses
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
          resolve({
            success: true,
            transactionId: `TAP-${Date.now()}`,
            amount: amount,
            timestamp: new Date().toISOString()
          });
        } else {
          reject(new Error('Gagal memproses pembayaran TapCash'));
        }
      }, 2000);
    });
  },
  
  // Simulasi QRIS payment
  async generateQRIS(amount) {
    // Generate QRIS payload
    const qrPayload = {
      amount: amount,
      merchantName: "Koperasi Senyummu",
      merchantCity: "Jember",
      transactionId: `QRIS-${Date.now()}`,
      qrString: `00020101021126610014ID.LINKAJA.WWW01189360091100201222520209000000303UME51440014ID.CO.QRIS.WWW0215ID10234567890120303UME520454995802ID5922KOPERASI SENYUMMU JEMBER6010JEMBER61066816462070703A016304${this.generateCRC(amount)}`,
      timestamp: new Date().toISOString()
    };
    
    return qrPayload;
  },
  
  async checkQRISPayment(qrId) {
    // Polling untuk cek status pembayaran QRIS
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        // Simulasi cek status
        const paid = Math.random() > 0.7; // 30% chance paid setelah polling
        
        if (paid) {
          clearInterval(checkInterval);
          resolve({
            success: true,
            transactionId: qrId,
            paidAt: new Date().toISOString()
          });
        }
      }, 2000);
      
      // Timeout setelah 30 detik
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve({
          success: false,
          error: 'Timeout - Pembayaran belum diterima'
        });
      }, 30000);
    });
  },
  
  // Helper untuk generate CRC QRIS
  generateCRC(amount) {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
};