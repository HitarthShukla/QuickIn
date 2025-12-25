<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const email = ref('')
const isLoaded = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})

const isValidEmail = computed(() => {
  return email.value.includes('@') && email.value.includes('.')
})

const handleSubmit = async () => {
  if (!isValidEmail.value) return
  
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const { data } = await api.post('/auth/forgot-password', { email: email.value })
    
    if (data.success) {
      // Redirect to reset password page
      router.push({
        path: '/reset-password',
        query: { email: email.value.toLowerCase() }
      })
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Something went wrong. Please try again.'
  } finally {
    isSubmitting.value = false
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
        <!-- Logo -->
        <RouterLink to="/" class="inline-block mb-6">
          <h1 class="text-3xl font-bold gradient-text">QuickIn</h1>
        </RouterLink>

        <div class="auth-card">
          <div class="card-glow"></div>
          
          <div class="relative z-10">
            <!-- Header -->
            <div class="text-center mb-6">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
              <p class="text-gray-400 text-sm">
                Enter your email and we'll send you a code to reset your password.
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

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="space-y-4">
              <div class="input-group">
                <label for="email" class="input-label">Email Address</label>
                <div class="input-wrapper">
                  <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <input
                    id="email"
                    v-model="email"
                    type="email"
                    required
                    autocomplete="email"
                    placeholder="you@example.com"
                    class="input-field-styled"
                    :disabled="isSubmitting"
                  />
                </div>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="submit-btn group"
                :disabled="isSubmitting || !isValidEmail"
              >
                <span class="btn-bg"></span>
                <span class="btn-content">
                  <svg v-if="isSubmitting" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{{ isSubmitting ? 'Sending...' : 'Send Reset Code' }}</span>
                </span>
              </button>
            </form>

            <!-- Back to Login -->
            <p class="text-center text-gray-400 text-sm mt-6">
              Remember your password?
              <RouterLink to="/login" class="text-primary-400 hover:text-primary-300 font-medium ml-1">
                Sign in
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
  background: radial-gradient(circle, #f59e0b, transparent 70%);
  top: -100px;
  left: -100px;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #ea580c, transparent 70%);
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
    #f59e0b,
    transparent,
    #ea580c,
    transparent
  );
  animation: rotate-glow 8s linear infinite;
  opacity: 0.1;
}

@keyframes rotate-glow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Input Styles */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: #64748b;
  pointer-events: none;
}

.input-field-styled {
  width: 100%;
  padding: 12px 44px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input-field-styled::placeholder {
  color: #64748b;
}

.input-field-styled:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15);
  background: rgba(255, 255, 255, 0.08);
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
  background: linear-gradient(135deg, #f59e0b, #ea580c);
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
