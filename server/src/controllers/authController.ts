import { Request, Response } from 'express'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import User from '../models/User.js'
import { generateToken } from '../utils/jwt.js'
import { generateOTP, sendOTPEmail } from '../utils/email.js'

// @desc    Register new user (sends OTP)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() })
        if (existingUser) {
            // If exists but not verified, allow re-registration
            if (!existingUser.isEmailVerified) {
                // Generate new OTP
                const otp = generateOTP()
                const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

                // Update user with new OTP
                existingUser.emailVerificationOTP = otp
                existingUser.emailVerificationExpires = otpExpires
                existingUser.password = password // Will be hashed by pre-save hook
                existingUser.name = name
                await existingUser.save()

                // Send OTP email
                const emailSent = await sendOTPEmail(email, otp, name)

                if (!emailSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Failed to send verification email. Please try again.',
                    })
                    return
                }

                res.status(200).json({
                    success: true,
                    message: 'Verification code sent to your email',
                    requiresVerification: true,
                    email: email.toLowerCase(),
                })
                return
            }

            res.status(400).json({
                success: false,
                message: 'User with this email already exists',
            })
            return
        }

        // Generate OTP
        const otp = generateOTP()
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Create user (unverified)
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            isEmailVerified: false,
            emailVerificationOTP: otp,
            emailVerificationExpires: otpExpires,
        })

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp, name)

        if (!emailSent) {
            // Clean up user if email fails
            await User.findByIdAndDelete(user._id)
            res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please try again.',
            })
            return
        }

        res.status(201).json({
            success: true,
            message: 'Verification code sent to your email',
            requiresVerification: true,
            email: email.toLowerCase(),
        })
    } catch (error: any) {
        console.error('Register error:', error)

        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: 'Email already in use',
            })
            return
        }

        res.status(500).json({
            success: false,
            message: 'Server error during registration',
        })
    }
}

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body

        // Find user with OTP fields
        const user = await User.findOne({ email: email.toLowerCase() })
            .select('+emailVerificationOTP +emailVerificationExpires')

        if (!user) {
            res.status(400).json({
                success: false,
                message: 'User not found. Please register again.',
            })
            return
        }

        if (user.isEmailVerified) {
            res.status(400).json({
                success: false,
                message: 'Email is already verified. Please login.',
            })
            return
        }

        // Check if OTP is expired
        if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
            res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.',
            })
            return
        }

        // Verify OTP
        if (user.emailVerificationOTP !== otp) {
            res.status(400).json({
                success: false,
                message: 'Invalid verification code. Please try again.',
            })
            return
        }

        // Mark email as verified
        user.isEmailVerified = true
        user.emailVerificationOTP = undefined
        user.emailVerificationExpires = undefined
        await user.save()

        res.json({
            success: true,
            message: 'Email verified successfully. Please set up MFA.',
            requiresMfaSetup: true,
            email: user.email,
        })
    } catch (error) {
        console.error('Verify OTP error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error during verification',
        })
    }
}

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body

        const user = await User.findOne({ email: email.toLowerCase() })

        if (!user) {
            res.status(400).json({
                success: false,
                message: 'User not found. Please register first.',
            })
            return
        }

        if (user.isEmailVerified) {
            res.status(400).json({
                success: false,
                message: 'Email is already verified. Please login.',
            })
            return
        }

        // Generate new OTP
        const otp = generateOTP()
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        user.emailVerificationOTP = otp
        user.emailVerificationExpires = otpExpires
        await user.save()

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp, user.name)

        if (!emailSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please try again.',
            })
            return
        }

        res.json({
            success: true,
            message: 'New verification code sent to your email',
        })
    } catch (error) {
        console.error('Resend OTP error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
        })
    }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body

        // Find user with password and lockout fields
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            })
            return
        }

        // Check if account is locked
        if (user.isLocked()) {
            const lockTimeRemaining = Math.ceil((user.lockUntil!.getTime() - Date.now()) / 60000)
            res.status(423).json({
                success: false,
                message: `Account is locked. Try again in ${lockTimeRemaining} minutes.`,
            })
            return
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in',
                requiresVerification: true,
                email: user.email,
            })
            return
        }

        // Check password
        const isMatch = await user.comparePassword(password)

        if (!isMatch) {
            // Increment failed attempts
            await user.incrementLoginAttempts()

            const attemptsLeft = 5 - (user.failedLoginAttempts + 1)
            const message = attemptsLeft > 0
                ? `Invalid email or password. ${attemptsLeft} attempts remaining.`
                : 'Account locked due to too many failed attempts. Try again in 15 minutes.'

            res.status(401).json({
                success: false,
                message,
            })
            return
        }

        // Reset failed attempts on successful login
        await user.resetLoginAttempts()

        // Check if MFA is required
        if (user.isMfaSetupComplete) {
            res.json({
                success: true,
                message: 'MFA required. Please enter your authenticator code.',
                requiresMfa: true,
                email: user.email,
            })
            return
        } else {
            // Generate token and login user
            const token = generateToken(user)

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified,
                    isMfaSetupComplete: user.isMfaSetupComplete,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                }
            })
            return
        }
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error during login',
        })
    }
}

// @desc    Setup MFA
// @route   POST /api/auth/mfa/setup
// @access  Public
export const setupMfa = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email: email.toLowerCase() })

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' })
            return
        }
        
        if (user.isMfaSetupComplete) {
            res.status(400).json({ success: false, message: 'MFA is already set up' })
            return
        }

        // Generate secret
        const secret = speakeasy.generateSecret({ name: `QuickIn (${user.email})` })
        
        user.mfaSecret = secret.base32
        await user.save()

        // Generate robust otpauth URL
        const authUrl = speakeasy.otpauthURL({
            secret: secret.base32,
            label: user.email,
            issuer: 'QuickIn',
            encoding: 'base32'
        })

        // Generate QR code
        QRCode.toDataURL(authUrl, (err, data_url) => {
            if (err) {
                res.status(500).json({ success: false, message: 'Could not generate QR code' })
                return
            }
            res.json({
                success: true,
                qrCodeUrl: data_url,
                secret: secret.base32
            })
        })
    } catch (error) {
        console.error('Setup MFA error:', error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

// @desc    Verify MFA setup
// @route   POST /api/auth/mfa/verify-setup
// @access  Public
export const verifyMfaSetup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, code, token: bodyToken } = req.body
        const mfaCode = code || bodyToken
        const user = await User.findOne({ email: email.toLowerCase() }).select('+mfaSecret')

        if (!user || (!user.mfaSecret && user.isMfaSetupComplete)) {
            res.status(404).json({ success: false, message: 'User or secret not found' })
            return
        }

        console.log('MFA Verification attempt:', { email, mfaCode, secret: user.mfaSecret });

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret!,
            encoding: 'base32',
            token: String(mfaCode).trim(),
            window: 4
        })

        console.log('MFA Verification result:', verified);

        if (!verified) {
            res.status(400).json({ success: false, message: 'Invalid verification code' })
            return
        }

        user.isMfaSetupComplete = true
        await user.save()

        // Generate token and login user
        const token = generateToken(user)

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })

        res.json({
            success: true,
            message: 'MFA setup complete and mapped. Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified,
                isMfaSetupComplete: user.isMfaSetupComplete,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        })

    } catch (error) {
        console.error('Verify MFA Setup error:', error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

// @desc    Login with MFA Code
// @route   POST /api/auth/login-mfa
// @access  Public
export const loginWithMfa = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, code, token: bodyToken } = req.body
        const mfaCode = code || bodyToken
        const user = await User.findOne({ email: email.toLowerCase() }).select('+mfaSecret')

        if (!user || (!user.isMfaSetupComplete)) {
            res.status(400).json({ success: false, message: 'Invalid request' })
            return
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret!,
            encoding: 'base32',
            token: String(mfaCode).trim(),
            window: 4
        })

        if (!verified) {
            res.status(401).json({ success: false, message: 'Invalid verification code' })
            return
        }

        // Generate token and login user
        const token = generateToken(user)

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified,
                isMfaSetupComplete: user.isMfaSetupComplete,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
        })
    } catch (error) {
        console.error('MFA Login error:', error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

// @desc    Disable MFA
// @route   POST /api/auth/mfa/disable
// @access  Private
export const disableMfa = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user?._id)

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' })
            return
        }

        user.isMfaSetupComplete = false
        user.mfaSecret = undefined
        await user.save()

        res.json({
            success: true,
            message: 'MFA has been disabled successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified,
                isMfaSetupComplete: user.isMfaSetupComplete,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
        })
    } catch (error) {
        console.error('Disable MFA error:', error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            })
            return
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                coverPhoto: user.coverPhoto,
                bio: user.bio,
                activeZones: user.activeZones,
                trustScore: user.trustScore,
                attendanceRate: user.attendanceRate,
                totalActivities: user.totalActivities,
                badges: user.badges,
                interests: user.interests,
                availabilityStatus: user.availabilityStatus,
                languages: user.languages,
                isEmailVerified: user.isEmailVerified,
                isVerifiedStudent: user.isVerifiedStudent,
                isMfaSetupComplete: user.isMfaSetupComplete,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        })
    } catch (error) {
        console.error('Get me error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
        })
    }
}

// @desc    Get user profile by ID (public profile for authenticated users)
// @route   GET /api/auth/users/:id
// @access  Private
export const getUserProfileById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id)

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            })
            return
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                avatar: user.avatar,
                coverPhoto: user.coverPhoto,
                bio: user.bio,
                activeZones: user.activeZones,
                trustScore: user.trustScore,
                attendanceRate: user.attendanceRate,
                totalActivities: user.totalActivities,
                badges: user.badges,
                interests: user.interests,
                availabilityStatus: user.availabilityStatus,
                languages: user.languages,
                isEmailVerified: user.isEmailVerified,
                isVerifiedStudent: user.isVerifiedStudent,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        })
    } catch (error) {
        console.error('Get user profile by ID error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
        })
    }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user
        const {
            name,
            avatar,
            coverPhoto,
            bio,
            activeZones,
            interests,
            availabilityStatus,
            languages
        } = req.body

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            })
            return
        }

        // Validate name
        if (name && (name.length < 2 || name.length > 50)) {
            res.status(400).json({
                success: false,
                message: 'Name must be between 2 and 50 characters',
            })
            return
        }

        // Validate bio
        if (bio && bio.length > 200) {
            res.status(400).json({
                success: false,
                message: 'Bio cannot exceed 200 characters',
            })
            return
        }

        // Update fields
        if (name) user.name = name.trim()
        if (avatar !== undefined) user.avatar = avatar
        if (coverPhoto !== undefined) user.coverPhoto = coverPhoto
        if (bio !== undefined) user.bio = bio.trim()
        if (activeZones !== undefined) user.activeZones = activeZones
        if (interests !== undefined) user.interests = interests
        if (availabilityStatus !== undefined) user.availabilityStatus = availabilityStatus
        if (languages !== undefined) user.languages = languages

        await user.save()

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                coverPhoto: user.coverPhoto,
                bio: user.bio,
                activeZones: user.activeZones,
                trustScore: user.trustScore,
                attendanceRate: user.attendanceRate,
                totalActivities: user.totalActivities,
                badges: user.badges,
                interests: user.interests,
                availabilityStatus: user.availabilityStatus,
                languages: user.languages,
                isEmailVerified: user.isEmailVerified,
                isVerifiedStudent: user.isVerifiedStudent,
                isMfaSetupComplete: user.isMfaSetupComplete,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        })
    } catch (error) {
        console.error('Update profile error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
        })
    }
}

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (_req: Request, res: Response): Promise<void> => {
    // Clear HTTP-only cookie
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
    })

    res.json({
        success: true,
        message: 'Logged out successfully',
    })
}

// @desc    Forgot password - send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body

        const user = await User.findOne({ email: email.toLowerCase() })

        if (!user) {
            // Don't reveal if user exists or not for security
            res.json({
                success: true,
                message: 'If an account with that email exists, a reset code has been sent.',
            })
            return
        }

        // Generate OTP
        const otp = generateOTP()
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Save OTP to user
        user.passwordResetOTP = otp
        user.passwordResetExpires = otpExpires
        await user.save()

        // Send email
        const { sendPasswordResetEmail } = await import('../utils/email.js')
        const emailSent = await sendPasswordResetEmail(email, otp, user.name)

        if (!emailSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to send reset email. Please try again.',
            })
            return
        }

        res.json({
            success: true,
            message: 'Password reset code sent to your email',
            email: email.toLowerCase(),
        })
    } catch (error) {
        console.error('Forgot password error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
        })
    }
}

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp, password, confirmPassword } = req.body

        // Validate passwords
        if (password !== confirmPassword) {
            res.status(400).json({
                success: false,
                message: 'Passwords do not match',
            })
            return
        }

        if (password.length < 8) {
            res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters',
            })
            return
        }

        // Find user with OTP fields and password (need password field for pre-save hash)
        const user = await User.findOne({ email: email.toLowerCase() })
            .select('+passwordResetOTP +passwordResetExpires +password')

        if (!user) {
            res.status(400).json({
                success: false,
                message: 'Invalid request. Please request a new reset code.',
            })
            return
        }

        // Check if OTP exists and is not expired
        if (!user.passwordResetOTP || !user.passwordResetExpires) {
            res.status(400).json({
                success: false,
                message: 'No reset code found. Please request a new one.',
            })
            return
        }

        if (user.passwordResetExpires < new Date()) {
            res.status(400).json({
                success: false,
                message: 'Reset code has expired. Please request a new one.',
            })
            return
        }

        // Verify OTP
        if (user.passwordResetOTP !== otp) {
            res.status(400).json({
                success: false,
                message: 'Invalid reset code. Please try again.',
            })
            return
        }

        // Update password
        user.password = password
        user.passwordResetOTP = undefined
        user.passwordResetExpires = undefined
        await user.save()

        // Generate new token
        const token = generateToken(user)

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        res.json({
            success: true,
            message: 'Password reset successfully',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        })
    } catch (error) {
        console.error('Reset password error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error',
        })
    }
}
