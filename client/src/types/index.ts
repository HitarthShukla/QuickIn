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

// Activity types
export type ActivityType = 'sport' | 'movie' | 'gaming' | 'study' | 'food' | 'event' | 'hangout' | 'other'
export type ActivityStatus = 'open' | 'in-progress' | 'completed' | 'cancelled'

export interface ActivityLocation {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
    address?: string
    placeName?: string
}

export interface Activity {
    _id: string
    creator: User
    title: string
    description: string
    type: ActivityType
    status: ActivityStatus
    location: ActivityLocation
    dateTime: string
    duration?: number
    maxParticipants: number
    participants: User[]
    interests?: string[]
    requirements?: string
    image?: string
    createdAt: string
    updatedAt: string
}

export interface CreateActivityPayload {
    title: string
    description: string
    type: ActivityType
    location: {
        type: 'Point'
        coordinates: [number, number]
        address?: string
        placeName?: string
    }
    dateTime: string
    duration?: number
    maxParticipants: number
    interests?: string[]
    requirements?: string
    image?: string
}

export interface ActivitiesResponse {
    success: boolean
    count: number
    pagination?: {
        page: number
        pages: number
        total: number
    }
    activities: Activity[]
}

export interface ActivityResponse {
    success: boolean
    message?: string
    activity: Activity
}

