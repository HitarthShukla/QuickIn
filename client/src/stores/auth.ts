import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'
import type { User, LoginCredentials, RegisterCredentials } from '@/types'

interface VerifyOTPCredentials {
    email: string
    otp: string
}

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref<User | null>(authService.getStoredUser())
    const token = ref<string | null>(authService.getToken())
    const loading = ref(false)
    const error = ref<string | null>(null)
    const pendingVerificationEmail = ref<string | null>(null)

    // Getters
    const isAuthenticated = computed(() => !!token.value)
    const userName = computed(() => user.value?.name ?? '')
    const userEmail = computed(() => user.value?.email ?? '')

    // Actions
    async function login(credentials: LoginCredentials): Promise<boolean> {
        loading.value = true
        error.value = null

        try {
            const response = await authService.login(credentials)
            if (response.success && response.token && response.user) {
                token.value = response.token
                user.value = response.user
                return true
            } else if (response.requiresVerification) {
                pendingVerificationEmail.value = response.email || credentials.email
                error.value = response.message || 'Please verify your email'
                return false
            } else {
                error.value = response.message || 'Login failed'
                return false
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || 'An error occurred during login'
            if (err.response?.data?.requiresVerification) {
                pendingVerificationEmail.value = err.response?.data?.email || credentials.email
            }
            return false
        } finally {
            loading.value = false
        }
    }

    async function register(credentials: RegisterCredentials): Promise<boolean> {
        loading.value = true
        error.value = null

        try {
            const response = await authService.register(credentials)
            if (response.success && response.requiresVerification) {
                pendingVerificationEmail.value = response.email || credentials.email
                return true
            } else if (response.success && response.token && response.user) {
                // Direct registration without OTP (fallback)
                token.value = response.token
                user.value = response.user
                return true
            } else {
                error.value = response.message || 'Registration failed'
                return false
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || 'An error occurred during registration'
            return false
        } finally {
            loading.value = false
        }
    }

    async function verifyOTP(credentials: VerifyOTPCredentials): Promise<boolean> {
        loading.value = true
        error.value = null

        try {
            const response = await authService.verifyOTP(credentials)
            if (response.success && response.token && response.user) {
                token.value = response.token
                user.value = response.user
                pendingVerificationEmail.value = null
                return true
            } else {
                error.value = response.message || 'Verification failed'
                return false
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || 'An error occurred during verification'
            return false
        } finally {
            loading.value = false
        }
    }

    async function resendOTP(email: string): Promise<boolean> {
        loading.value = true
        error.value = null

        try {
            const response = await authService.resendOTP(email)
            return response.success
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to resend OTP'
            return false
        } finally {
            loading.value = false
        }
    }

    async function logout(): Promise<void> {
        try {
            await authService.logout()
        } finally {
            token.value = null
            user.value = null
            error.value = null
            pendingVerificationEmail.value = null
        }
    }

    async function checkAuth(): Promise<boolean> {
        if (!token.value) return false

        try {
            const response = await authService.getCurrentUser()
            if (response.success && response.user) {
                user.value = response.user
                return true
            }
            return false
        } catch {
            token.value = null
            user.value = null
            return false
        }
    }

    function clearError() {
        error.value = null
    }

    function setPendingEmail(email: string) {
        pendingVerificationEmail.value = email
    }

    return {
        // State
        user,
        token,
        loading,
        error,
        pendingVerificationEmail,
        // Getters
        isAuthenticated,
        userName,
        userEmail,
        // Actions
        login,
        register,
        verifyOTP,
        resendOTP,
        logout,
        checkAuth,
        clearError,
        setPendingEmail,
    }
})
