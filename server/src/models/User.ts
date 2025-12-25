import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

// Badge types
export type BadgeType = 'GoodHost' | 'TeamPlayer' | 'Punctual' | 'Reliable' | 'Verified' | 'EarlyAdopter'

// Availability status
export type AvailabilityStatus = 'open' | 'busy' | 'away'

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId
    name: string
    email: string
    password: string
    avatar?: string
    coverPhoto?: string
    bio?: string
    activeZones: string[]
    trustScore: number
    attendanceRate: number
    totalActivities: number
    badges: BadgeType[]
    interests: string[]
    availabilityStatus: AvailabilityStatus
    languages: string[]
    isEmailVerified: boolean
    isVerifiedStudent: boolean
    emailVerificationOTP?: string
    emailVerificationExpires?: Date
    passwordResetOTP?: string
    passwordResetExpires?: Date
    failedLoginAttempts: number
    lockUntil?: Date
    createdAt: Date
    updatedAt: Date
    comparePassword(candidatePassword: string): Promise<boolean>
    isLocked(): boolean
    incrementLoginAttempts(): Promise<void>
    resetLoginAttempts(): Promise<void>
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false,
        },
        avatar: {
            type: String,
            default: '',
        },
        coverPhoto: {
            type: String,
            default: '',
        },
        bio: {
            type: String,
            maxlength: [200, 'Bio cannot exceed 200 characters'],
            default: '',
        },
        activeZones: [{
            type: String,
            trim: true,
        }],
        trustScore: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5,
        },
        attendanceRate: {
            type: Number,
            default: 100,
            min: 0,
            max: 100,
        },
        totalActivities: {
            type: Number,
            default: 0,
        },
        badges: [{
            type: String,
            enum: ['GoodHost', 'TeamPlayer', 'Punctual', 'Reliable', 'Verified', 'EarlyAdopter'],
        }],
        interests: [{
            type: String,
            trim: true,
        }],
        availabilityStatus: {
            type: String,
            enum: ['open', 'busy', 'away'],
            default: 'open',
        },
        languages: [{
            type: String,
            trim: true,
        }],
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isVerifiedStudent: {
            type: Boolean,
            default: false,
        },
        emailVerificationOTP: {
            type: String,
            select: false,
        },
        emailVerificationExpires: {
            type: Date,
            select: false,
        },
        passwordResetOTP: {
            type: String,
            select: false,
        },
        passwordResetExpires: {
            type: Date,
            select: false,
        },
        failedLoginAttempts: {
            type: Number,
            default: 0,
        },
        lockUntil: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
)

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next()
    }

    try {
        const salt = await bcrypt.genSalt(12)
        this.password = await bcrypt.hash(this.password, salt)
        next()
    } catch (error: any) {
        next(error)
    }
})

// Compare password method
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password)
}

// Check if account is locked
userSchema.methods.isLocked = function (): boolean {
    return !!(this.lockUntil && this.lockUntil > new Date())
}

// Increment failed login attempts
userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
    // If lock has expired, reset attempts
    if (this.lockUntil && this.lockUntil < new Date()) {
        await this.updateOne({
            $set: { failedLoginAttempts: 1 },
            $unset: { lockUntil: 1 },
        })
        return
    }

    const updates: any = { $inc: { failedLoginAttempts: 1 } }

    // Lock account after 5 failed attempts
    if (this.failedLoginAttempts + 1 >= 5) {
        updates.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) } // 15 minutes
    }

    await this.updateOne(updates)
}

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
    await this.updateOne({
        $set: { failedLoginAttempts: 0 },
        $unset: { lockUntil: 1 },
    })
}

const User = mongoose.model<IUser>('User', userSchema)

export default User
