import api from './api'
import type { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types'

interface VerifyOTPCredentials {
    email: string
    otp: string
}

export const authService = {
    async register(credentials: RegisterCredentials): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/register', credentials)
        // Don't store token yet - requires OTP verification
        return data
    },

    async verifyOTP(credentials: VerifyOTPCredentials): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/verify-otp', credentials)
        if (data.token) {
            localStorage.setItem('token', data.token)
        }
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
        }
        return data
    },

    async resendOTP(email: string): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/resend-otp', { email })
        return data
    },

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/login', credentials)
        if (data.token) {
            localStorage.setItem('token', data.token)
        }
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
        }
        return data
    },

    async logout(): Promise<void> {
        try {
            await api.post('/auth/logout')
        } finally {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
        }
    },

    async setupMFA(email: string): Promise<{ secret: string; qrCodeUrl: string }> {
        const { data } = await api.post('/auth/mfa/setup', { email })
        return data
    },

    async verifyMfaSetup(credentials: { email: string; token: string }): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/mfa/verify-setup', credentials)
        if (data.token) {
            localStorage.setItem('token', data.token)
        }
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
        }
        return data
    },

    async loginWithMfa(credentials: { email: string; token: string }): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/login-mfa', credentials)
        if (data.token) {
            localStorage.setItem('token', data.token)
        }
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
        }
        return data
    },

    async disableMfa(): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/mfa/disable')
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
        }
        return data
    },

    async getCurrentUser(): Promise<AuthResponse> {
        const { data } = await api.get<AuthResponse>('/auth/me')
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
        }
        return data
    },

    getToken(): string | null {
        return localStorage.getItem('token')
    },

    getStoredUser() {
        const user = localStorage.getItem('user')
        return user ? JSON.parse(user) : null
    },

    isAuthenticated(): boolean {
        return !!this.getToken()
    },
}
