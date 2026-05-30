import crypto from "crypto";

export const verifyMetaSignature = (req, res, next) => {
  console.log("type:", typeof req.body);
console.log("isBuffer:", Buffer.isBuffer(req.body));
  const signature = req.headers["x-hub-signature-256"];

  if (!signature) {
    return res.status(401).send("Missing signature");
  }

  const appSecret = process.env.INSTAGRAM_CLIENT_SECRET;

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", appSecret)
      .update(req.body)
      .digest("hex");

console.log(Buffer.isBuffer(req.body));
  if (signature !== expectedSignature) {
    console.error("Invalid webhook signature");
    return res.status(403).send("Invalid signature");
  }

  next();
};