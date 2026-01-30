<script setup lang="ts">
import { ref, onMounted } from 'vue'

const permissionGranted = ref<boolean | null>(null)
const isLoading = ref(true)
const error = ref('')

const checkLocation = () => {
  // Optimistic check: if we have a session flag, assume yes and load immediately
  // while checking in background
  const cachedPermission = sessionStorage.getItem('location_granted')
  if (cachedPermission === 'true') {
    permissionGranted.value = true
    isLoading.value = false
  } else {
    // Only show loading if we don't have a cached permission
    isLoading.value = true
    error.value = ''
  }

  if (!('geolocation' in navigator)) {
    error.value = 'Geolocation is not supported by your browser'
    permissionGranted.value = false
    isLoading.value = false
    return
  }

  navigator.geolocation.getCurrentPosition(
    () => {
      permissionGranted.value = true
      isLoading.value = false
      sessionStorage.setItem('location_granted', 'true')
    },
    (err) => {
      // If we optimistically allowed access but now failed, we must revert
      permissionGranted.value = false 
      isLoading.value = false
      sessionStorage.removeItem('location_granted')
      
      if (err.code === err.PERMISSION_DENIED) {
        error.value = 'Location access is required to use the dashboard'
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        error.value = 'Location information is unavailable'
      } else if (err.code === err.TIMEOUT) {
        error.value = 'Location request timed out'
      } else {
        error.value = 'An unknown error occurred'
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

onMounted(() => {
  checkLocation()
})
</script>

<template>
  <div v-if="isLoading" class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
  </div>

  <div v-else-if="permissionGranted" class="h-full">
    <slot></slot>
  </div>

  <div v-else class="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="grid-pattern"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 max-w-md w-full text-center p-8 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      <div class="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
        <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      
      <h2 class="text-2xl font-bold text-white mb-3">Location Access Required</h2>
      <p class="text-gray-400 mb-8">
        {{ error || 'Please enable location services to access the dashboard. This ensures you can discover nearby activities and connect with local groups.' }}
      </p>

      <button 
        @click="checkLocation" 
        class="w-full py-3 px-6 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-500/25"
      >
        Enable Location & Retry
      </button>
    </div>
  </div>
</template>

<style scoped>
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--color-primary-500), transparent 70%);
  top: -50px;
  left: -50px;
  animation: float-orb 15s ease-in-out infinite;
}

.orb-2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, var(--color-secondary-500), transparent 70%);
  bottom: -50px;
  right: -50px;
  animation: float-orb 18s ease-in-out infinite reverse;
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
}

@keyframes float-orb {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, 30px); }
}
</style>
