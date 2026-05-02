import { Router } from 'express'
import {
    register,
    verifyOTP,
    resendOTP,
    login,
    setupMfa,
    verifyMfaSetup,
    loginWithMfa,
    disableMfa,
    getMe,
    getUserProfileById,
    updateProfile,
    logout,
    forgotPassword,
    resetPassword
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import {
    loginLimiter,
    registerLimiter,
    otpLimiter
} from '../middleware/rateLimiter.js'
import {
    registerValidation,
    loginValidation,
    verifyOtpValidation,
    resendOtpValidation
} from '../middleware/validators.js'

const router = Router()

// Public routes with rate limiting and validation
router.post('/register', registerLimiter, ...registerValidation, register)
router.post('/verify-otp', otpLimiter, ...verifyOtpValidation, verifyOTP)
router.post('/resend-otp', otpLimiter, ...resendOtpValidation, resendOTP)
router.post('/login', loginLimiter, ...loginValidation, login)
router.post('/mfa/setup', setupMfa)
router.post('/mfa/verify-setup', verifyMfaSetup)
router.post('/login-mfa', loginWithMfa)
router.post('/mfa/disable', protect, disableMfa)
router.post('/forgot-password', otpLimiter, ...resendOtpValidation, forgotPassword)
router.post('/reset-password', otpLimiter, resetPassword)

// Protected routes
router.get('/me', protect, getMe)
router.get('/users/:id', protect, getUserProfileById)
router.put('/profile', protect, updateProfile)
router.post('/logout', protect, logout)

export default router

