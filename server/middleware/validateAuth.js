import Joi from 'joi';

/**
 * Validate login input to prevent SQL injection, XSS, and other attacks
 * - Username: alphanumeric only, 3-50 chars
 * - Password: 6-100 chars (reasonable limits to prevent DoS)
 */
export const validateLoginInput = (req, res, next) => {
    const schema = Joi.object({
        username: Joi.string()
            .alphanum()
            .min(3)
            .max(50)
            .required()
            .messages({
                'string.base': 'Username harus berupa text',
                'string.alphanum': 'Username hanya boleh mengandung huruf dan angka',
                'string.min': 'Username minimal 3 karakter',
                'string.max': 'Username maksimal 50 karakter',
                'any.required': 'Username wajib diisi'
            }),
        password: Joi.string()
            .min(6)
            .max(100)
            .required()
            .messages({
                'string.base': 'Password harus berupa text',
                'string.min': 'Password minimal 6 karakter',
                'string.max': 'Password maksimal 100 karakter',
                'any.required': 'Password wajib diisi'
            })
    });

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        // Generic error message to prevent information disclosure
        return res.status(400).json({
            error: 'Data login tidak valid. Periksa username dan password Anda.'
        });
    }

    next();
};
