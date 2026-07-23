import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async ({ amount, currency = 'INR', receipt = 'insta-bot-checkout' }) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount < 100) {
    const error = new Error('Amount must be at least 100 paise.');
    error.statusCode = 400;
    throw error;
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const error = new Error('Razorpay credentials are not configured.');
    error.statusCode = 500;
    throw error;
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(numericAmount),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    };
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      const authError = new Error('Razorpay authentication failed.');
      authError.statusCode = 401;
      throw authError;
    }

    const genericError = new Error('Unable to create Razorpay order.');
    genericError.statusCode = 500;
    throw genericError;
  }
};

export const createSubscription=async(result, userId)=>{
  try{



  }
  catch(err){
    console.error("Error creating subscription:", err);
    const error = new Error('Unable to create Razorpay subscription.');
    error.statusCode = 500;
    throw error;  
}
}

export const verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    const error = new Error('Missing payment verification data.');
    error.statusCode = 400;
    throw error;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    const error = new Error('Razorpay secret is not configured.');
    error.statusCode = 500;
    throw error;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const signatureBuffer = Buffer.from(razorpay_signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const isValidSignature = signatureBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!isValidSignature) {
    const error = new Error('Signature mismatch.');
    error.statusCode = 400;
    throw error;
  }

  return { success: true, message: 'Payment verified successfully.' };
};
