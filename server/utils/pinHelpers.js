import bcrypt from 'bcrypt';

/**
 * Generate random 6-character alphanumeric PIN
 * Characters: A-Z, 0-9 (excluding confusing chars like O, 0, I, 1)
 * Example: ABC123, XY7Z89, P3Q4R5
 */
function generateAlphanumericPin() {
    // Exclude confusing characters: O, I, 0, 1
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pin = '';

    for (let i = 0; i < 6; i++) {
        pin += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return pin;
}

/**
 * Hash PIN using bcrypt
 * @param {string} pin - Plain text PIN (6 chars)
 * @returns {Promise<string>} Hashed PIN
 */
async function hashPin(pin) {
    const saltRounds = 10;
    return await bcrypt.hash(pin.toUpperCase(), saltRounds);
}

/**
 * Verify PIN against hashed version
 * @param {string} inputPin - User input PIN
 * @param {string} hashedPin - Stored hashed PIN
 * @returns {Promise<boolean>} True if match
 */
async function verifyPin(inputPin, hashedPin) {
    return await bcrypt.compare(inputPin.toUpperCase(), hashedPin);
}

export {
    generateAlphanumericPin,
    hashPin,
    verifyPin
};
