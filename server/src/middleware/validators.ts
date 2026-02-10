import { body, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'

// Password complexity regex
// At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Handle validation errors
export const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array(),
        })
        return
    }
    next()
}

// Registration validation
export const registerValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .escape(),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail()
        .toLowerCase(),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(passwordRegex)
        .withMessage('Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)'),

    body('confirmPassword')
        .notEmpty()
        .withMessage('Confirm password is required')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match')
            }
            return true
        }),

    handleValidationErrors,
]

// Login validation
export const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail()
        .toLowerCase(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors,
]

// OTP validation
export const verifyOtpValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail()
        .toLowerCase(),

    body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers'),

    handleValidationErrors,
]

// Resend OTP validation
export const resendOtpValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail()
        .toLowerCase(),

    handleValidationErrors,
]

// Activity validation
export const validateActivity = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),

    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),

    body('type')
        .notEmpty()
        .withMessage('Activity type is required')
        .isIn(['sport', 'movie', 'gaming', 'study', 'food', 'event', 'hangout', 'other'])
        .withMessage('Invalid activity type'),

    body('location.coordinates')
        .isArray({ min: 2, max: 2 })
        .withMessage('Location coordinates must be [longitude, latitude]'),

    body('location.coordinates.0')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),

    body('location.coordinates.1')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),

    body('dateTime')
        .notEmpty()
        .withMessage('Date and time is required')
        .isISO8601()
        .withMessage('Invalid date format')
        .custom((value) => {
            const date = new Date(value)
            if (date <= new Date()) {
                throw new Error('Activity date must be in the future')
            }
            return true
        }),

    body('maxParticipants')
        .notEmpty()
        .withMessage('Max participants is required')
        .isInt({ min: 2, max: 100 })
        .withMessage('Max participants must be between 2 and 100'),

    body('duration')
        .optional()
        .isInt({ min: 15, max: 1440 })
        .withMessage('Duration must be between 15 minutes and 24 hours'),

    handleValidationErrors,
]
