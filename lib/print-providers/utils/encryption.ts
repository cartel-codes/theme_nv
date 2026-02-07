import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; // Must be 32 characters
const IV_LENGTH = 16; // AES block size

export function encrypt(text: string): string {
    if (!ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY is not set');
    }
    if (ENCRYPTION_KEY.length !== 32) {
        // For development, we might not have a 32 char key, so we can pad or truncate, 
        // but in production this should be strict.
        // throw new Error('ENCRYPTION_KEY must be 32 characters');
        console.warn('Warning: ENCRYPTION_KEY should be 32 characters for AES-256');
    }

    // Ensure key is 32 bytes
    const keyBuffer = Buffer.alloc(32);
    Buffer.from(ENCRYPTION_KEY).copy(keyBuffer);

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    if (!ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY is not set');
    }

    const keyBuffer = Buffer.alloc(32);
    Buffer.from(ENCRYPTION_KEY).copy(keyBuffer);

    const textParts = text.split(':');
    const ivHex = textParts.shift();
    if (!ivHex) throw new Error('Invalid encrypted text format');

    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
