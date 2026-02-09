import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

export function encrypt(text: string, secret: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash("sha256").update(secret).digest();
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(encryptedBase64: string, secret: string) {
  const buf = Buffer.from(encryptedBase64, "base64");
  const iv = buf.slice(0, IV_LENGTH);
  const tag = buf.slice(IV_LENGTH, IV_LENGTH + 16); // 16 bytes tag
  const data = buf.slice(IV_LENGTH + 16);
  const key = crypto.createHash("sha256").update(secret).digest();

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}
