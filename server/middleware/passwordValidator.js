import Joi from 'joi';

/**
 * Password Complexity Validator
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (optional but recommended)
 */
export const passwordComplexitySchema = Joi.string()
    .min(8)
    .max(100)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[0-9]/, 'number')
    .messages({
        'string.min': 'Password minimal 8 karakter',
        'string.max': 'Password maksimal 100 karakter',
        'string.pattern.name': 'Password harus mengandung minimal 1 huruf besar, 1 huruf kecil, dan 1 angka'
    });

/**
 * Validate password complexity
 * Returns { valid: boolean, error?: string }
 */
export const validatePasswordComplexity = (password) => {
    if (!password || password.length < 8) {
        return { valid: false, error: 'Password minimal 8 karakter' };
    }

    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'Password harus mengandung minimal 1 huruf besar (A-Z)' };
    }

    if (!/[a-z]/.test(password)) {
        return { valid: false, error: 'Password harus mengandung minimal 1 huruf kecil (a-z)' };
    }

    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Password harus mengandung minimal 1 angka (0-9)' };
    }

    // Optional: Check for special character
    // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    //     return { valid: false, error: 'Password harus mengandung minimal 1 karakter spesial' };
    // }

    // Optional: Check for common passwords
    const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
        return { valid: false, error: 'Password terlalu umum. Gunakan password yang lebih unik.' };
    }

    return { valid: true };
};

/**
 * Middleware to validate password on user creation/update
 */
export const validatePasswordMiddleware = (req, res, next) => {
    const { password, newPassword } = req.body;
    const passwordToCheck = newPassword || password;

    if (passwordToCheck) {
        const result = validatePasswordComplexity(passwordToCheck);
        if (!result.valid) {
            return res.status(400).json({ error: result.error });
        }
    }

    next();
};
