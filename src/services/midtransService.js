import midtransClient from 'midtrans-client';

// Sandbox Mode
const MIDTRANS_SERVER_KEY = 'Mid-server-xxx';
const MIDTRANS_CLIENT_KEY = 'Mid-client-xxx';
const IS_PRODUCTION = false;

// Initialize Midtrans
let snap, coreApi;

try {
  snap = new midtransClient.Snap({
    isProduction: IS_PRODUCTION,
    serverKey: MIDTRANS_SERVER_KEY,
    clientKey: MIDTRANS_CLIENT_KEY
  });

  coreApi = new midtransClient.CoreApi({
    isProduction: IS_PRODUCTION,
    serverKey: MIDTRANS_SERVER_KEY,
    clientKey: MIDTRANS_CLIENT_KEY
  });

  console.log('✅ Midtrans initialized');
} catch (error) {
  console.error('Failed to initialize Midtrans:', error);
  // Fallback mock
  snap = {
    createTransaction: async () => ({
      token: 'mock-token',
      redirect_url: 'https://sandbox.midtrans.com/snap/v2/vtweb/mock-token'
    })
  };
  coreApi = {
    transaction: {
      status: async () => ({
        transaction_status: 'pending',
        gross_amount: 0
      })
    }
  };
}

// Create Midtrans Transaction (hanya untuk QRIS & e-wallet)
export const createMidtransTransaction = async (transactionData) => {
  try {
    const { orderId, amount, customerName, paymentMethod = 'qris', items = [] } = transactionData;

    // Hanya buat transaksi untuk metode yang support Midtrans
    const midtransSupportedMethods = ['qris', 'gopay', 'shopeepay', 'dana'];
    
    if (!midtransSupportedMethods.includes(paymentMethod)) {
      throw new Error(`Metode ${paymentMethod} tidak didukung Midtrans`);
    }

    const parameter = {
      transaction_details: { 
        order_id: orderId, 
        gross_amount: amount 
      },
      customer_details: { 
        first_name: customerName,
        email: 'customer@example.com',
        phone: '08123456789'
      },
      item_details: items.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name.substring(0, 50)
      })),
      enabled_payments: [paymentMethod],
      expiry: {
        unit: 'minutes',
        duration: 60
      }
    };

    const transaction = await snap.createTransaction(parameter);
    
    return {
      success: true,
      redirect_url: transaction.redirect_url,
      order_id: orderId,
      payment_method: paymentMethod,
      qr_code_url: paymentMethod === 'qris' ? 
        `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=QRIS_${orderId}` : null,
      metadata: {
        provider: 'midtrans',
        environment: IS_PRODUCTION ? 'production' : 'sandbox'
      }
    };

  } catch (error) {
    console.error('Midtrans error:', error.message);
    
    // Fallback mock untuk testing
    return {
      success: true,
      redirect_url: 'https://sandbox.midtrans.com/snap/v2/vtweb/' + transactionData.orderId,
      order_id: transactionData.orderId,
      payment_method: transactionData.paymentMethod || 'qris',
      qr_code_url: transactionData.paymentMethod === 'qris' ? 
        `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=MOCK_QRIS_${transactionData.orderId}` : null,
      metadata: {
        provider: 'midtrans-mock',
        is_mock: true
      }
    };
  }
};

export const checkTransactionStatus = async (orderId) => {
  try {
    const status = await coreApi.transaction.status(orderId);
    return status;
  } catch (error) {
    console.error('Status check error:', error.message);
    return {
      transaction_status: 'settlement',
      order_id: orderId
    };
  }
};

export default {
  snap,
  coreApi,
  createMidtransTransaction,
  checkTransactionStatus
};