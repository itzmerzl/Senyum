import bcrypt from 'bcryptjs';

/**
 * Generate random 6-character alphanumeric PIN
 * Characters: A-Z, 0-9 (excluding confusing chars like O, 0, I, 1)
 */
export function generateAlphanumericPin() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pin = '';
  for (let i = 0; i < 6; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

/**
 * Hash PIN using bcryptjs
 * @param {string} pin - Plain text PIN (6 chars)
 */
export async function hashPin(pin) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(pin.toUpperCase(), salt);
}

/**
 * Verify PIN against hashed version
 * @param {string} inputPin - User input PIN
 * @param {string} hashedPin - Stored hashed PIN
 */
export async function verifyPin(inputPin, hashedPin) {
  return bcrypt.compareSync(inputPin.toUpperCase(), hashedPin);
}
