export const midtransConfig = {
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
  merchantId: process.env.MIDTRANS_MERCHANT_ID,
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  snapUrl: process.env.MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/v1/transactions',
};
