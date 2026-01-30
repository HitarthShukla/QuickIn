<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()

const email = ref('')
const otp = ref(['', '', '', '', '', ''])
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoaded = ref(false)
const isSubmitting = ref(false)
const isResending = ref(false)
const resendCooldown = ref(0)
const errorMessage = ref('')
const successMessage = ref('')

onMounted(() => {
  email.value = (route.query.email as string) || ''
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
  const firstInput = document.querySelector('input[data-index="0"]') as HTMLInputElement
  firstInput?.focus()
})

const otpValue = computed(() => otp.value.join(''))
const isOtpComplete = computed(() => otpValue.value.length === 6)

const passwordsMatch = computed(() => password.value === confirmPassword.value)

const passwordStrength = computed(() => {
  const p = password.value
  if (p.length === 0) return { level: 0, text: '', color: '' }
  if (p.length < 8) return { level: 1, text: 'Weak', color: 'bg-red-500' }
  if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { level: 2, text: 'Fair', color: 'bg-yellow-500' }
  if (/[A-Z]/.test(p) && /[0-9]/.test(p) && /[@$!%*?&]/.test(p)) {
    return { level: 4, text: 'Strong', color: 'bg-green-500' }
  }
  return { level: 3, text: 'Good', color: 'bg-blue-500' }
})

const isFormValid = computed(() => 
  isOtpComplete.value && 
  password.value.length >= 8 && 
  passwordsMatch.value
)

const handleInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '')
  
  if (value.length > 1) {
    const digits = value.split('').slice(0, 6)
    digits.forEach((digit, i) => {
      if (i < 6) otp.value[i] = digit
    })
    const nextIndex = Math.min(digits.length, 5)
    const nextInput = document.querySelector(`input[data-index="${nextIndex}"]`) as HTMLInputElement
    nextInput?.focus()
  } else {
    otp.value[index] = value
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
  if (!isFormValid.value) return
  
  isSubmitting.value = true
  errorMessage.value = ''
  
  try {
    const { data } = await api.post('/auth/reset-password', {
      email: email.value,
      otp: otpValue.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
    })
    
    if (data.success) {
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      router.push('/dashboard')
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to reset password'
    otp.value = ['', '', '', '', '', '']
    const firstInput = document.querySelector('input[data-index="0"]') as HTMLInputElement
    firstInput?.focus()
  } finally {
    isSubmitting.value = false
  }
}

const handleResendOTP = async () => {
  if (resendCooldown.value > 0 || isResending.value) return
  
  isResending.value = true
  errorMessage.value = ''
  
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    successMessage.value = 'New reset code sent!'
    resendCooldown.value = 60
    
    const interval = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) clearInterval(interval)
    }, 1000)
  } catch {
    errorMessage.value = 'Failed to resend code.'
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

    <!-- Card -->
    <div class="relative z-10 w-full max-w-md px-4">
      <div :class="['', isLoaded ? 'animate-slide-up' : 'opacity-0']">
        <RouterLink to="/" class="inline-block mb-6">
          <h1 class="text-3xl font-bold gradient-text">QuickIn</h1>
        </RouterLink>

        <div class="auth-card">
          <div class="card-glow"></div>
          
          <div class="relative z-10">
            <!-- Header -->
            <div class="text-center mb-4">
              <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-white mb-1">Reset Password</h2>
              <p class="text-gray-400 text-sm">Enter the code sent to {{ email }}</p>
            </div>

            <!-- Messages -->
            <Transition name="slide-down">
              <div v-if="errorMessage" class="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ errorMessage }}
              </div>
            </Transition>

            <Transition name="slide-down">
              <div v-if="successMessage" class="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ successMessage }}
              </div>
            </Transition>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="space-y-3">
              <!-- OTP Input -->
              <div>
                <label class="input-label mb-2 block">Verification Code</label>
                <div class="flex justify-center gap-2">
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
              </div>

              <!-- New Password -->
              <div class="input-group">
                <label for="password" class="input-label">New Password</label>
                <div class="input-wrapper">
                  <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                    placeholder="••••••••"
                    class="input-field-styled"
                    :disabled="isSubmitting"
                  />
                  <button type="button" @click="showPassword = !showPassword" class="password-toggle">
                    <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                <div v-if="password" class="mt-1">
                  <div class="flex gap-1 mb-1">
                    <div v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full transition-colors" :class="i <= passwordStrength.level ? passwordStrength.color : 'bg-gray-700'"></div>
                  </div>
                  <p class="text-xs" :class="passwordStrength.color.replace('bg-', 'text-')">{{ passwordStrength.text }}</p>
                </div>
              </div>

              <!-- Confirm Password -->
              <div class="input-group">
                <label for="confirmPassword" class="input-label">Confirm Password</label>
                <div class="input-wrapper">
                  <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <input
                    id="confirmPassword"
                    v-model="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    required
                    placeholder="••••••••"
                    class="input-field-styled"
                    :class="{ 'border-red-500/50': confirmPassword && !passwordsMatch }"
                    :disabled="isSubmitting"
                  />
                  <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="password-toggle">
                    <svg v-if="showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                <p v-if="confirmPassword && !passwordsMatch" class="mt-1 text-xs text-red-400">Passwords do not match</p>
              </div>

              <!-- Submit -->
              <button type="submit" class="submit-btn" :disabled="isSubmitting || !isFormValid">
                <span class="btn-bg"></span>
                <span class="btn-content">
                  <svg v-if="isSubmitting" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{{ isSubmitting ? 'Resetting...' : 'Reset Password' }}</span>
                </span>
              </button>
            </form>

            <!-- Resend -->
            <div class="text-center mt-4">
              <button
                @click="handleResendOTP"
                :disabled="resendCooldown > 0 || isResending"
                class="text-primary-400 hover:text-primary-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; animation: float-orb 20s ease-in-out infinite; }
.orb-1 { width: 400px; height: 400px; background: radial-gradient(circle, #f59e0b, transparent 70%); top: -100px; left: -100px; }
.orb-2 { width: 300px; height: 300px; background: radial-gradient(circle, #ea580c, transparent 70%); bottom: -50px; right: -50px; animation-delay: -10s; }
@keyframes float-orb { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -30px) scale(1.1); } }

.grid-pattern { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 50px 50px; }

.auth-card { position: relative; padding: 24px; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; }
.card-glow { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: conic-gradient(from 0deg, transparent, #f59e0b, transparent, #ea580c, transparent); animation: rotate-glow 8s linear infinite; opacity: 0.1; }
@keyframes rotate-glow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.otp-input { width: 44px; height: 50px; text-align: center; font-size: 22px; font-weight: 600; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 10px; color: white; transition: all 0.3s ease; }
.otp-input:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2); }

.input-group { display: flex; flex-direction: column; gap: 4px; }
.input-label { font-size: 12px; font-weight: 500; color: #94a3b8; }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 12px; width: 16px; height: 16px; color: #64748b; pointer-events: none; }
.input-field-styled { width: 100%; padding: 10px 40px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; color: white; font-size: 13px; transition: all 0.3s ease; }
.input-field-styled::placeholder { color: #64748b; }
.input-field-styled:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
.password-toggle { position: absolute; right: 12px; color: #64748b; transition: color 0.2s; }
.password-toggle:hover { color: white; }

.submit-btn { position: relative; width: 100%; padding: 12px 24px; border-radius: 12px; font-weight: 600; overflow: hidden; transition: transform 0.3s ease; margin-top: 4px; }
.submit-btn:not(:disabled):hover { transform: translateY(-2px); }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #f59e0b, #ea580c); }
.btn-content { position: relative; display: flex; align-items: center; justify-content: center; gap: 8px; color: white; }

.animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
@keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
