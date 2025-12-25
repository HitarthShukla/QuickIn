<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: '',
})

const showPassword = ref(false)
const isLoaded = ref(false)
const localError = ref('')
const isSubmitting = computed(() => authStore.loading)
const errorMessage = computed(() => localError.value || authStore.error)

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})

const handleSubmit = async () => {
  authStore.clearError()
  localError.value = ''
  
  if (!form.value.email || !form.value.password) {
    localError.value = 'Please enter email and password'
    return
  }

  const success = await authStore.login({
    email: form.value.email,
    password: form.value.password,
  })

  if (success) {
    const redirect = router.currentRoute.value.query.redirect as string
    router.push(redirect || '/dashboard')
  } else if (authStore.pendingVerificationEmail) {
    // User needs to verify email first
    router.push({
      path: '/verify-otp',
      query: { email: authStore.pendingVerificationEmail }
    })
  } else {
    // Set local error from store if not already set
    localError.value = authStore.error || 'Invalid email or password'
  }
}
</script>

<template>
  <div class="h-screen overflow-hidden relative flex">
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="grid-pattern"></div>
      <div class="particles">
        <div v-for="n in 15" :key="n" class="particle" :style="{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${5 + Math.random() * 10}s`
        }"></div>
      </div>
    </div>

    <!-- Left Side - Branding -->
    <div class="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center items-center p-12">
      <div :class="['max-w-md', isLoaded ? 'animate-slide-in-left' : 'opacity-0']">
        <!-- Logo -->
        <RouterLink to="/" class="inline-block mb-8">
          <h1 class="text-5xl font-bold gradient-text">QuickIn</h1>
        </RouterLink>
        
        <h2 class="text-3xl font-bold text-white mb-4">
          Welcome back to the future of collaboration
        </h2>
        <p class="text-gray-400 text-lg mb-8">
          Connect with your team in real-time. Chat, collaborate, and create amazing things together.
        </p>

        <!-- Features List -->
        <div class="space-y-4">
          <div class="flex items-center gap-4 text-gray-300">
            <div class="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>Secure end-to-end encryption</span>
          </div>
          <div class="flex items-center gap-4 text-gray-300">
            <div class="w-10 h-10 rounded-xl bg-secondary-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span>Lightning fast real-time sync</span>
          </div>
          <div class="flex items-center gap-4 text-gray-300">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span>Unlimited team members</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side - Login Form -->
    <div class="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-4 sm:p-8">
      <div :class="['w-full max-w-md', isLoaded ? 'animate-slide-in-right' : 'opacity-0']">
        <!-- Mobile Logo -->
        <RouterLink to="/" class="lg:hidden inline-block mb-8">
          <h1 class="text-3xl font-bold gradient-text">QuickIn</h1>
        </RouterLink>

        <!-- Login Card -->
        <div class="auth-card">
          <!-- Decorative Elements -->
          <div class="card-glow"></div>
          
          <div class="relative z-10">
            <!-- Header -->
            <div class="text-center mb-6">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-white mb-2">Sign In</h2>
              <p class="text-gray-400">Enter your credentials to continue</p>
            </div>

            <!-- Error Message -->
            <Transition name="slide-down">
              <div v-if="errorMessage" class="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-3">
                <svg class="w-5 h-5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-medium">{{ errorMessage }}</span>
              </div>
            </Transition>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="space-y-4">
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
                    autocomplete="current-password"
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
              </div>

              <!-- Remember Me & Forgot Password -->
              <div class="flex items-center justify-between text-sm">
                <label class="flex items-center gap-2 text-gray-400 cursor-pointer">
                  <input type="checkbox" class="checkbox-styled" />
                  <span>Remember me</span>
                </label>
                <RouterLink to="/forgot-password" class="text-primary-400 hover:text-primary-300 transition-colors">
                  Forgot password?
                </RouterLink>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="submit-btn group"
                :disabled="isSubmitting"
              >
                <span class="btn-bg"></span>
                <span class="btn-content">
                  <svg v-if="isSubmitting" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{{ isSubmitting ? 'Signing in...' : 'Sign In' }}</span>
                  <svg v-if="!isSubmitting" class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </form>

            <!-- Divider -->
            <div class="divider">
              <span>or continue with</span>
            </div>

            <!-- Social Login -->
            <div class="grid grid-cols-3 gap-3">
              <button class="social-btn">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
              <button class="social-btn">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>
              <button class="social-btn">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
            </div>

            <!-- Register Link -->
            <p class="text-center text-gray-400 mt-6">
              Don't have an account?
              <RouterLink to="/register" class="text-primary-400 hover:text-primary-300 font-medium ml-1 transition-colors">
                Create one
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
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--color-primary-500), transparent 70%);
  top: -150px;
  left: -150px;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--color-secondary-500), transparent 70%);
  bottom: -100px;
  right: -100px;
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

.particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  background: var(--color-primary-400);
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
    var(--color-primary-500),
    transparent,
    var(--color-secondary-500),
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
  gap: 8px;
}

.input-label {
  font-size: 14px;
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
  left: 16px;
  width: 20px;
  height: 20px;
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
  font-size: 15px;
  transition: all 0.3s ease;
}

.input-field-styled::placeholder {
  color: #64748b;
}

.input-field-styled:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

/* Override browser autofill styling */
.input-field-styled:-webkit-autofill,
.input-field-styled:-webkit-autofill:hover,
.input-field-styled:-webkit-autofill:focus,
.input-field-styled:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
  -webkit-text-fill-color: white !important;
  background-clip: content-box !important;
  transition: background-color 5000s ease-in-out 0s;
}

.password-toggle {
  position: absolute;
  right: 16px;
  color: #64748b;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: white;
}

/* Checkbox */
.checkbox-styled {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary-500);
  border-radius: 4px;
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
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
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

/* Divider */
.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: #64748b;
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.divider span {
  padding: 0 16px;
}

/* Social Buttons */
.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  transition: all 0.3s ease;
}

.social-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
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
</style>
