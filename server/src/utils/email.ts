import nodemailer from 'nodemailer'

interface EmailOptions {
    to: string
    subject: string
    html: string
}

// Create transporter based on environment
const createTransporter = () => {
    // Use Gmail if credentials provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        console.log('Using Gmail SMTP for email')
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        })
    }

    // Production SMTP fallback
    if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })
    }

    // Development: use ethereal.email test account
    console.log('Using Ethereal Email for testing')
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: process.env.ETHEREAL_USER || '',
            pass: process.env.ETHEREAL_PASS || '',
        },
    })
}

// Generate 6-digit OTP
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send email
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    try {
        const transporter = createTransporter()

        const mailOptions = {
            from: process.env.EMAIL_USER || process.env.EMAIL_FROM || '"QuickIn" <noreply@quickin.app>',
            to: options.to,
            subject: options.subject,
            html: options.html,
        }

        const info = await transporter.sendMail(mailOptions)

        console.log('Email sent:', info.messageId)

        // In development, log the ethereal URL
        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
        }

        return true
    } catch (error) {
        console.error('Email send error:', error)
        return false
    }
}

// Send OTP verification email
export const sendOTPEmail = async (email: string, otp: string, name: string): Promise<boolean> => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px; }
                .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #38bdf8, #e879f9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; }
                .title { font-size: 24px; margin-bottom: 16px; color: #fff; }
                .text { color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
                .otp-box { background: #0f172a; border: 2px solid #38bdf8; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
                .otp { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #38bdf8; }
                .warning { font-size: 12px; color: #64748b; margin-top: 24px; }
                .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">QuickIn</div>
                <div class="title">Verify your email</div>
                <p class="text">Hi ${name},</p>
                <p class="text">Thanks for signing up! Use the verification code below to complete your registration:</p>
                <div class="otp-box">
                    <div class="otp">${otp}</div>
                </div>
                <p class="text">This code will expire in <strong>10 minutes</strong>.</p>
                <p class="warning">If you didn't create an account with QuickIn, you can safely ignore this email.</p>
                <div class="footer">
                    &copy; 2024 QuickIn. All rights reserved.
                </div>
            </div>
        </body>
        </html>
    `

    return sendEmail({
        to: email,
        subject: 'Verify your QuickIn account - OTP Code',
        html,
    })
}

// Send password reset email
export const sendPasswordResetEmail = async (email: string, otp: string, name: string): Promise<boolean> => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px; }
                .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #38bdf8, #e879f9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; }
                .title { font-size: 24px; margin-bottom: 16px; color: #fff; }
                .text { color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
                .otp-box { background: #0f172a; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
                .otp { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #f59e0b; }
                .warning { font-size: 12px; color: #64748b; margin-top: 24px; }
                .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">QuickIn</div>
                <div class="title">Reset your password</div>
                <p class="text">Hi ${name},</p>
                <p class="text">We received a request to reset your password. Use the code below to set a new password:</p>
                <div class="otp-box">
                    <div class="otp">${otp}</div>
                </div>
                <p class="text">This code will expire in <strong>10 minutes</strong>.</p>
                <p class="warning">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                <div class="footer">
                    &copy; 2024 QuickIn. All rights reserved.
                </div>
            </div>
        </body>
        </html>
    `

    return sendEmail({
        to: email,
        subject: 'Reset your QuickIn password - OTP Code',
        html,
    })
}
