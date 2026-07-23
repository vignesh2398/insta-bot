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
    // const order = await razorpay.orders.create({
    //   amount: Math.round(numericAmount),
    //   currency,
    //   receipt: receipt || `receipt_${Date.now()}`,
    // });

    // return {
    //   order_id: order.id,
    //   amount: order.amount,
    //   currency: order.currency,
    //   key: process.env.RAZORPAY_KEY_ID,
    // };

const plan = await razorpay.plans.create({
  period: "monthly",
  interval: 1,
  item: {
    name: "Starter Plan",
    amount: 1900, // ₹19 in paise
    currency: "INR",
    description: "Monthly subscription"
  }
});

    const subscription = await razorpay.subscriptions.create({
  plan_id: plan.id,
  customer_notify: 1,
  total_count: 12
});

return {
  subscription_id: subscription.id,
  key: process.env.RAZORPAY_KEY_ID
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

export const createSubscription = async ({
  userId,
  amount,
  currency = 'INR',
  receipt = 'insta-bot-subscription',
  autoRenew = true,
  planId,
  customerId,
  customer,
}) => {
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
    const effectivePlanId = planId || process.env.RAZORPAY_PLAN_ID;

    if (!effectivePlanId) {
      return {
        subscriptionId: null,
        autoRenew,
        status: 'draft',
        amount: Math.round(numericAmount),
        currency: currency.toUpperCase(),
        planId: null,
        receipt,
        message: 'Auto-renewal enabled locally. Configure Razorpay plan ID to create a live recurring subscription.',
      };
    }

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && customer?.email) {
      const createdCustomer = await razorpay.customers.create({
        name: customer.name || 'Insta Bot User',
        email: customer.email,
        contact: customer.contact || '',
        notes: {
          userId: userId || '',
          autoRenew: String(autoRenew),
        },
      });
      resolvedCustomerId = createdCustomer.id;
    }

    const subscriptionPayload = {
      plan_id: effectivePlanId,
      customer_notify: 1,
      quantity: 1,
      total_count: 9999,
      notes: {
        userId: userId || '',
        autoRenew: String(autoRenew),
        receipt,
      },
    };

    if (resolvedCustomerId) {
      subscriptionPayload.customer_id = resolvedCustomerId;
    }

    const subscription = await razorpay.subscriptions.create(subscriptionPayload);

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      autoRenew,
      amount: subscription.amount || Math.round(numericAmount),
      currency: (subscription.currency || currency).toUpperCase(),
      planId: effectivePlanId,
      receipt,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    const subscriptionError = new Error('Unable to create Razorpay subscription.');
    subscriptionError.statusCode = 500;
    throw subscriptionError;
  }
};

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
