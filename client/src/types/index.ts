// Badge types
export type BadgeType = 'GoodHost' | 'TeamPlayer' | 'Punctual' | 'Reliable' | 'Verified' | 'EarlyAdopter'

// Availability status
export type AvailabilityStatus = 'open' | 'busy' | 'away'

export interface User {
    _id: string
    name: string
    email: string
    avatar?: string
    coverPhoto?: string
    bio?: string
    activeZones?: string[]
    trustScore?: number
    attendanceRate?: number
    totalActivities?: number
    badges?: BadgeType[]
    interests?: string[]
    availabilityStatus?: AvailabilityStatus
    languages?: string[]
    isEmailVerified?: boolean
    isVerifiedStudent?: boolean
    createdAt: string
    updatedAt: string
}

export interface AuthResponse {
    success: boolean
    message: string
    token?: string
    user?: User
    requiresVerification?: boolean
    email?: string
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterCredentials {
    name: string
    email: string
    password: string
    confirmPassword: string
}

export interface ApiError {
    message: string
    errors?: Record<string, string[]>
}

// Profile update payload
export interface ProfileUpdatePayload {
    name?: string
    avatar?: string
    coverPhoto?: string
    bio?: string
    activeZones?: string[]
    interests?: string[]
    availabilityStatus?: AvailabilityStatus
    languages?: string[]
}
