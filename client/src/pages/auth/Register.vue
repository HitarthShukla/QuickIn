<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoaded = ref(false)
const agreedToTerms = ref(false)
const isSubmitting = computed(() => authStore.loading)
const errorMessage = computed(() => authStore.error)

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})

const passwordsMatch = computed(() => 
  form.value.password === form.value.confirmPassword
)

const passwordStrength = computed(() => {
  const password = form.value.password
  if (password.length === 0) return { level: 0, text: '', color: '' }
  if (password.length < 8) return { level: 1, text: 'Weak', color: 'bg-red-500' }
  
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[@$!%*?&]/.test(password)
  
  const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length
  
  if (strength === 4) {
    return { level: 4, text: 'Strong', color: 'bg-green-500' }
  }
  if (strength === 3) {
    return { level: 3, text: 'Good', color: 'bg-blue-500' }
  }
  return { level: 2, text: 'Fair', color: 'bg-yellow-500' }
})

const isFormValid = computed(() => {
  const password = form.value.password
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[@$!%*?&]/.test(password)
  
  return (
    form.value.name.length >= 2 &&
    form.value.email.includes('@') &&
    password.length >= 8 &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch.value &&
    agreedToTerms.value
  )
})

const handleSubmit = async () => {
  authStore.clearError()
  
  if (!isFormValid.value) {
    return
  }

  const success = await authStore.register({
    name: form.value.name,
    email: form.value.email,
    password: form.value.password,
    confirmPassword: form.value.confirmPassword,
  })

  if (success) {
    // Redirect to OTP verification page
    router.push({ 
      path: '/verify-otp', 
      query: { email: form.value.email.toLowerCase() } 
    })
  }
}
</script>

<template>
  <div class="h-screen overflow-hidden relative flex">
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="grid-pattern"></div>
      <div class="particles">
        <div v-for="n in 15" :key="n" class="particle" :style="{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${5 + Math.random() * 10}s`
        }"></div>
      </div>
    </div>

    <!-- Left Side - Register Form -->
    <div class="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-4 sm:p-6">
      <div :class="['w-full max-w-md', isLoaded ? 'animate-slide-in-left' : 'opacity-0']">
        <!-- Mobile Logo -->
        <RouterLink to="/" class="lg:hidden inline-block mb-4">
          <h1 class="text-3xl font-bold gradient-text">QuickIn</h1>
        </RouterLink>

        <!-- Register Card -->
        <div class="auth-card">
          <div class="card-glow"></div>
          
          <div class="relative z-10">
            <!-- Header -->
            <div class="text-center mb-4">
              <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center shadow-lg shadow-secondary-500/25">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-white mb-1">Create Account</h2>
              <p class="text-gray-400 text-sm">Join QuickIn and start collaborating</p>
            </div>

            <!-- Error Message -->
            <Transition name="slide-down">
              <div v-if="errorMessage" class="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ errorMessage }}
              </div>
            </Transition>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="space-y-3">
              <!-- Name -->
              <div class="input-group">
                <label for="name" class="input-label">Full Name</label>
                <div class="input-wrapper">
                  <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    required
                    autocomplete="name"
                    placeholder="John Doe"
                    class="input-field-styled"
                    :disabled="isSubmitting"
                  />
                </div>
              </div>

              <!-- Email -->
              <div class="input-group">
                <label for="email" class="input-label">Email Address</label>
                <div class="input-wrapper">
                  <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    required
                    autocomplete="email"
                    placeholder="you@example.com"
                    class="input-field-styled"
                    :disabled="isSubmitting"
                  />
                </div>
              </div>

              <!-- Password -->
              <div class="input-group">
                <label for="password" class="input-label">Password</label>
                <div class="input-wrapper">
                  <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                    autocomplete="new-password"
                    placeholder="••••••••"
                    class="input-field-styled"
                    :disabled="isSubmitting"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="password-toggle"
                  >
                    <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                <!-- Password Strength -->
                <div v-if="form.password" class="mt-2 space-y-2">
                  <div class="flex gap-1 mb-1">
                    <div v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full transition-colors" :class="i <= passwordStrength.level ? passwordStrength.color : 'bg-gray-700'"></div>
                  </div>
                  <p class="text-xs font-semibold" :class="passwordStrength.color.replace('bg-', 'text-')">Strength: {{ passwordStrength.text }}</p>
                  
                  <!-- Password Requirements Checklist -->
                  <div class="text-xs space-y-1 mt-2 p-2 bg-gray-800/30 rounded">
                    <div class="flex items-center gap-2" :class="form.password.length >= 8 ? 'text-green-400' : 'text-gray-500'">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span>At least 8 characters</span>
                    </div>
                    <div class="flex items-center gap-2" :class="/[A-Z]/.test(form.password) ? 'text-green-400' : 'text-gray-500'">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span>One uppercase letter (A-Z)</span>
                    </div>
                    <div class="flex items-center gap-2" :class="/[a-z]/.test(form.password) ? 'text-green-400' : 'text-gray-500'">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span>One lowercase letter (a-z)</span>
                    </div>
                    <div class="flex items-center gap-2" :class="/[0-9]/.test(form.password) ? 'text-green-400' : 'text-gray-500'">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span>One number (0-9)</span>
                    </div>
                    <div class="flex items-center gap-2" :class="/[@$!%*?&]/.test(form.password) ? 'text-green-400' : 'text-gray-500'">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span>One special character (@$!%*?&)</span>
                    </div>
                  </div>
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
                    v-model="form.confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    required
                    autocomplete="new-password"
                    placeholder="••••••••"
                    class="input-field-styled"
                    :class="{ 'border-red-500/50 focus:border-red-500': form.confirmPassword && !passwordsMatch }"
                    :disabled="isSubmitting"
                  />
                  <button
                    type="button"
                    @click="showConfirmPassword = !showConfirmPassword"
                    class="password-toggle"
                  >
                    <svg v-if="showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                <Transition name="fade">
                  <p v-if="form.confirmPassword && !passwordsMatch" class="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Passwords do not match
                  </p>
                </Transition>
              </div>

              <!-- Terms -->
              <label class="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" v-model="agreedToTerms" class="checkbox-styled mt-0.5" />
                <span class="text-sm text-gray-400">
                  I agree to the 
                  <a href="#" class="text-primary-400 hover:text-primary-300">Terms of Service</a>
                  and
                  <a href="#" class="text-primary-400 hover:text-primary-300">Privacy Policy</a>
                </span>
              </label>

              <!-- Submit Button -->
              <button
                type="submit"
                class="submit-btn group"
                :disabled="isSubmitting || !isFormValid"
              >
                <span class="btn-bg"></span>
                <span class="btn-content">
                  <svg v-if="isSubmitting" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{{ isSubmitting ? 'Creating account...' : 'Create Account' }}</span>
                  <svg v-if="!isSubmitting" class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </form>

            <!-- Login Link -->
            <p class="text-center text-gray-400 mt-6">
              Already have an account?
              <RouterLink to="/login" class="text-primary-400 hover:text-primary-300 font-medium ml-1 transition-colors cursor-pointer">
                Sign in
              </RouterLink>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side - Branding -->
    <div class="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center items-center p-12">
      <div :class="['max-w-md', isLoaded ? 'animate-slide-in-right' : 'opacity-0']">
        <!-- Logo -->
        <RouterLink to="/" class="inline-block mb-8">
          <h1 class="text-5xl font-bold gradient-text">QuickIn</h1>
        </RouterLink>
        
        <h2 class="text-3xl font-bold text-white mb-4">
          Start your journey with real-time collaboration
        </h2>
        <p class="text-gray-400 text-lg mb-8">
          Join thousands of teams who use QuickIn to communicate faster and work smarter.
        </p>


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
  background: radial-gradient(circle, var(--color-secondary-500), transparent 70%);
  top: -100px;
  right: -100px;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--color-primary-500), transparent 70%);
  bottom: -50px;
  left: -50px;
  animation-delay: -7s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, #10b981, transparent 70%);
  top: 50%;
  left: 40%;
  animation-delay: -14s;
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

.particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  background: var(--color-secondary-400);
  border-radius: 50%;
  opacity: 0.5;
  animation: float-particle linear infinite;
}

@keyframes float-particle {
  0% { transform: translateY(100vh); opacity: 0; }
  10% { opacity: 0.5; }
  90% { opacity: 0.5; }
  100% { transform: translateY(-100vh); opacity: 0; }
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
    var(--color-secondary-500),
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
  padding: 10px 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input-field-styled::placeholder {
  color: #64748b;
}

.input-field-styled:focus {
  outline: none;
  border-color: var(--color-secondary-500);
  box-shadow: 0 0 0 4px rgba(217, 70, 239, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.password-toggle {
  position: absolute;
  right: 14px;
  color: #64748b;
  transition: color 0.2s;
  cursor: pointer;
}

.password-toggle:hover {
  color: white;
}

/* Checkbox */
.checkbox-styled {
  width: 18px;
  height: 18px;
  accent-color: var(--color-secondary-500);
  border-radius: 4px;
  cursor: pointer;
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
  margin-top: 8px;
  cursor: pointer;
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
  background: linear-gradient(135deg, var(--color-secondary-500), var(--color-primary-500));
  transition: opacity 0.3s;
}

.submit-btn:hover .btn-bg {
  opacity: 0.9;
}

.btn-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
}

/* Stat Card */
.stat-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  text-align: center;
}

/* Testimonial */
.testimonial-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

/* Animations */
.animate-slide-in-left {
  animation: slide-in-left 0.6s ease-out forwards;
}

.animate-slide-in-right {
  animation: slide-in-right 0.6s ease-out 0.2s forwards;
  opacity: 0;
}

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
