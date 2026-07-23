import mongoose from "mongoose";

export const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      trim: true,
      index: true,
    },
    planName: {
      type: String,
      enum: ["free", "basic", "pro", "enterprise"],
      default: "free",
      trim: true,
    },
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "paused", "canceled", "expired"],
      default: "active",
      trim: true,
    },
    provider: {
      type: String,
      enum: ["razorpay", "manual"],
      default: "razorpay",
      trim: true,
    },
    razorpaySubscriptionId: {
      type: String,
      sparse: true,
      index: true,
    },
    razorpayCustomerId: {
      type: String,
      trim: true,
    },
    razorpayPlanId: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
    },
    cancelAt: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ userId: 1, status: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
