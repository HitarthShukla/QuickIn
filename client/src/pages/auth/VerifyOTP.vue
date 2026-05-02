<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/authService'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const otp = ref(['', '', '', '', '', ''])
const isLoaded = ref(false)
const isResending = ref(false)
const resendCooldown = ref(0)
const errorMessage = ref('')
const successMessage = ref('')

const isSetupMfaMode = ref(false)
const mfaSecret = ref('')
const mfaQrCodeUrl = ref('')

const isSubmitting = computed(() => authStore.loading)

onMounted(async () => {
  email.value = (route.query.email as string) || ''
  
  if (route.query.setupMfa === 'true' || authStore.requiresMfaSetup) {
    await initMfaSetup()
  } else {
    // Focus first input
    setTimeout(() => {
      const firstInput = document.querySelector('input[data-index="0"]') as HTMLInputElement
      firstInput?.focus()
    }, 200)
  }

  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})

const otpValue = computed(() => otp.value.join(''))
const isOtpComplete = computed(() => otpValue.value.length === 6)

const initMfaSetup = async () => {
  isSetupMfaMode.value = true
  try {
    const data = await authService.setupMFA(email.value)
    mfaSecret.value = data.secret
    mfaQrCodeUrl.value = data.qrCodeUrl
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to initialize MFA setup'
  }
}

const handleInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '')
  
  if (value.length > 1) {
    // Handle paste
    const digits = value.split('').slice(0, 6)
    digits.forEach((digit, i) => {
      if (i < 6) otp.value[i] = digit
    })
    // Focus last filled or next empty
    const nextIndex = Math.min(digits.length, 5)
    const nextInput = document.querySelector(`input[data-index="${nextIndex}"]`) as HTMLInputElement
    nextInput?.focus()
  } else {
    otp.value[index] = value
    // Move to next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement
      nextInput?.focus()
    }
  }
}

const handleKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !otp.value[index] && index > 0) {
    const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement
    prevInput?.focus()
  }
}

const handleSubmit = async () => {
  if (!isOtpComplete.value) return
  
  errorMessage.value = ''
  successMessage.value = ''
  
  const success = await authStore.verifyOTP({
    email: email.value,
    otp: otpValue.value,
  })

  if (success) {
    if (authStore.requiresMfaSetup) {
      // Clear OTP fields before showing MFA setup screen
      otp.value = ['', '', '', '', '', '']
      await initMfaSetup()
      // Focus first input for MFA
      setTimeout(() => {
        const firstInput = document.querySelector('input[data-index="0"]') as HTMLInputElement
        firstInput?.focus()
      }, 100)
    } else {
      router.push('/dashboard')
    }
  } else {
    errorMessage.value = authStore.error || 'Invalid verification code'
    // Clear OTP on error
    otp.value = ['', '', '', '', '', '']
    const firstInput = document.querySelector('input[data-index="0"]') as HTMLInputElement
    firstInput?.focus()
  }
}

const handleConfirmMfa = async () => {
  if (!isOtpComplete.value) return

  errorMessage.value = ''
  successMessage.value = ''

  const success = await authStore.verifyMfaSetup({
    email: email.value,
    token: otpValue.value,
  })

  if (success) {
    router.push('/dashboard')
  } else {
    errorMessage.value = authStore.error || 'Invalid MFA code'
    // Clear OTP on error
    otp.value = ['', '', '', '', '', '']
    const firstInput = document.querySelector('input[data-index="0"]') as HTMLInputElement
    firstInput?.focus()
  }
}

const handleResendOTP = async () => {
  if (resendCooldown.value > 0 || isResending.value) return
  
  isResending.value = true
  errorMessage.value = ''
  
  try {
    await authStore.resendOTP(email.value)
    successMessage.value = 'New verification code sent!'
    resendCooldown.value = 60
    
    const interval = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) {
        clearInterval(interval)
      }
    }, 1000)
  } catch {
    errorMessage.value = 'Failed to resend code. Please try again.'
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <div class="h-screen overflow-hidden relative flex items-center justify-center">
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="grid-pattern"></div>
    </div>

    <!-- Verification Card -->
    <div :class="['relative z-10 w-full px-4 transition-all duration-500', isSetupMfaMode ? 'max-w-3xl' : 'max-w-md']">
      <div :class="['', isLoaded ? 'animate-slide-up' : 'opacity-0']">
        <!-- Logo -->
        <RouterLink to="/" class="inline-block mb-6">
          <h1 class="text-3xl font-bold gradient-text">QuickIn</h1>
        </RouterLink>

        <div class="auth-card">
          <div class="card-glow"></div>
          
          <div class="relative z-10">
            <!-- Header -->
            <div class="text-center mb-6">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <svg v-if="isSetupMfaMode" class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <svg v-else class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-white mb-2">{{ isSetupMfaMode ? 'Set up Two-Factor Authentication' : 'Verify your email' }}</h2>
              <p class="text-gray-400 text-sm">
                <template v-if="isSetupMfaMode">
                  Secure your account by enabling two-factor authentication.
                </template>
                <template v-else>
                  We've sent a 6-digit code to<br />
                  <span class="text-white font-medium">{{ email }}</span>
                </template>
              </p>
            </div>

            <!-- Messages -->
            <Transition name="slide-down">
              <div v-if="errorMessage" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ errorMessage }}
              </div>
            </Transition>

            <Transition name="slide-down">
              <div v-if="successMessage" class="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ successMessage }}
              </div>
            </Transition>

            <!-- MFA Setup UI -->
            <div v-if="isSetupMfaMode" class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <!-- Left side: QR Code -->
              <div class="flex flex-col items-center bg-white/5 rounded-2xl p-6 border border-white/10 h-full justify-center">
                <div class="bg-white rounded-xl p-2 mb-4 shadow-xl" v-if="mfaQrCodeUrl">
                  <img :src="mfaQrCodeUrl" alt="MFA QR Code" class="w-40 h-40" />
                </div>
                <div class="text-center w-full">
                  <p class="text-xs text-gray-400 mb-2">Can't scan? Use this code manually:</p>
                  <div class="bg-gray-900/80 rounded border border-gray-700/50 p-2 overflow-x-auto">
                    <span class="text-emerald-400 font-mono text-sm tracking-wider whitespace-nowrap">{{ mfaSecret }}</span>
                  </div>
                </div>
              </div>

              <!-- Right side: Form -->
              <div class="flex flex-col h-full justify-center">
                <p class="text-gray-300 text-sm mb-6 text-center md:text-left">
                  Enter the 6-digit code generated by your Authenticator app.
                </p>

                <form @submit.prevent="handleConfirmMfa">
                  <div class="flex justify-center md:justify-start gap-2 mb-6">
                    <input
                      v-for="(digit, index) in otp"
                      :key="'mfa-'+index"
                      type="text"
                      inputmode="numeric"
                      maxlength="6"
                      :data-index="index"
                      :value="digit"
                      @input="handleInput(index, $event)"
                      @keydown="handleKeydown(index, $event)"
                      class="otp-input !w-10 sm:!w-12 !h-12 sm:!h-14 !text-xl"
                      :disabled="isSubmitting"
                    />
                  </div>

                  <button
                    type="submit"
                    class="submit-btn group cursor-pointer"
                    :disabled="isSubmitting || !isOtpComplete"
                  >
                    <span class="btn-bg"></span>
                    <span class="btn-content">
                      <svg v-if="isSubmitting" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{{ isSubmitting ? 'Verifying...' : 'Complete Setup' }}</span>
                    </span>
                  </button>
                </form>
              </div>
            </div>

            <!-- OTP Input -->
            <form @submit.prevent="handleSubmit" v-else>
              <div class="flex justify-center gap-2 mb-6">
                <input
                  v-for="(digit, index) in otp"
                  :key="index"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  :data-index="index"
                  :value="digit"
                  @input="handleInput(index, $event)"
                  @keydown="handleKeydown(index, $event)"
                  class="otp-input"
                  :disabled="isSubmitting"
                />
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="submit-btn group cursor-pointer"
                :disabled="isSubmitting || !isOtpComplete"
              >
                <span class="btn-bg"></span>
                <span class="btn-content">
                  <svg v-if="isSubmitting" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{{ isSubmitting ? 'Verifying...' : 'Verify Email' }}</span>
                </span>
              </button>
            </form>

            <!-- Resend OTP -->
            <div class="text-center mt-6" v-if="!isSetupMfaMode">
              <p class="text-gray-400 text-sm">
                Didn't receive the code?
                <button
                  @click="handleResendOTP"
                  :disabled="resendCooldown > 0 || isResending"
                  class="text-primary-400 hover:text-primary-300 font-medium ml-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend' }}
                </button>
              </p>
            </div>

            <!-- Back to Register -->
            <p class="text-center text-gray-400 text-sm mt-4">
              <RouterLink to="/register" class="text-gray-500 hover:text-gray-400 transition-colors">
                ← Back to registration
              </RouterLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Background Effects */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float-orb 20s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #10b981, transparent 70%);
  top: -100px;
  left: -100px;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--color-primary-500), transparent 70%);
  bottom: -50px;
  right: -50px;
  animation-delay: -10s;
}

@keyframes float-orb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -30px) scale(1.1); }
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 50px 50px;
}

/* Auth Card */
.auth-card {
  position: relative;
  padding: 32px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg,
    transparent,
    #10b981,
    transparent,
    var(--color-primary-500),
    transparent
  );
  animation: rotate-glow 8s linear infinite;
  opacity: 0.1;
}

@keyframes rotate-glow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* OTP Input */
.otp-input {
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  transition: all 0.3s ease;
}

.otp-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

.otp-input:disabled {
  opacity: 0.5;
}

/* Submit Button */
.submit-btn {
  position: relative;
  width: 100%;
  padding: 14px 24px;
  border-radius: 12px;
  font-weight: 600;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.submit-btn:not(:disabled):hover {
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #10b981, #14b8a6);
  transition: opacity 0.3s;
}

.btn-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
}

/* Animations */
.animate-slide-up {
  animation: slide-up 0.6s ease-out forwards;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
