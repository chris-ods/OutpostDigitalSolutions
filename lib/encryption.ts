/**
 * AES-256-GCM field-level encryption for PII/secrets.
 *
 * The encryption key is read from the environment variable ATX_ENCRYPTION_KEY.
 * In production, set this via Google Cloud Secret Manager → Cloud Run env.
 * Locally, add to .env.local: ATX_ENCRYPTION_KEY=<64-char hex string>
 *
 * Generate a key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ATX_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("ATX_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string → base64 string (iv:ciphertext:tag)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Pack as: iv(12) + ciphertext + tag(16) → base64
  return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

/**
 * Decrypt a base64 string → plaintext string
 */
export function decrypt(encoded: string): string {
  const key = getKey();
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(buf.length - TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final("utf8");
}

/**
 * Encrypt specific fields in an object. Returns a new object with encrypted values
 * and an `_encrypted: true` marker.
 */
export function encryptFields(
  data: Record<string, unknown>,
  fieldsToEncrypt: string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data, _encrypted: true };
  for (const field of fieldsToEncrypt) {
    const val = data[field];
    if (val && typeof val === "string" && val.length > 0) {
      result[field] = encrypt(val);
    }
  }
  return result;
}

/**
 * Decrypt specific fields in an object. Returns a new object with decrypted values.
 * If `_encrypted` marker is missing, returns data as-is (backward compat with unencrypted docs).
 */
export function decryptFields(
  data: Record<string, unknown>,
  fieldsToDecrypt: string[],
): Record<string, unknown> {
  if (!data._encrypted) return data; // legacy unencrypted doc
  const result = { ...data };
  delete result._encrypted;
  for (const field of fieldsToDecrypt) {
    const val = data[field];
    if (val && typeof val === "string" && val.length > 0) {
      try {
        result[field] = decrypt(val);
      } catch {
        // If decryption fails, leave as-is (may be plaintext legacy)
        result[field] = val;
      }
    }
  }
  return result;
}

/**
 * Mask a string, showing only the last N characters.
 */
export function mask(value: string | undefined | null, showLast = 4): string {
  if (!value) return "—";
  if (value.length <= showLast) return value;
  return "•".repeat(value.length - showLast) + value.slice(-showLast);
}

/** Fields that should be encrypted in the identity secrets doc */
export const IDENTITY_FIELDS = ["ssn", "dob", "address", "city", "zip"];

/** Fields that should be encrypted in the banking secrets doc */
export const BANKING_FIELDS = ["routingNumber", "accountNumber", "bankName"];
