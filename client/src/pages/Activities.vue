<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LeftSidebar from '@/components/dashboard/LeftSidebar.vue'
import MyActivitiesSection from '@/components/dashboard/MyActivitiesSection.vue'
import RightSidebar from '@/components/dashboard/RightSidebar.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LocationBlocker from '@/components/common/LocationBlocker.vue'
import CreateActivityModal from '@/components/modals/CreateActivityModal.vue'
import activityService from '@/services/activityService'
import type { CreateActivityPayload } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const isLoaded = ref(false)
const showLogoutDialog = ref(false)
const showCreateActivityModal = ref(false)
const activityKey = ref(0)
const isCreatingActivity = ref(false)

const user = computed(() => authStore.user)

onMounted(async () => {
  await authStore.checkAuth()
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})

const confirmLogout = () => {
  showLogoutDialog.value = true
}

const handleLogout = async () => {
  showLogoutDialog.value = false
  await authStore.logout()
  router.push('/')
}

const handleCreateActivity = async (payload: CreateActivityPayload) => {
  try {
    isCreatingActivity.value = true
    await activityService.createActivity(payload)
    
    // Refresh activity feed
    activityKey.value++
    showCreateActivityModal.value = false
  } catch (error: any) {
    console.error('Failed to create activity:', error)
    alert(error.response?.data?.message || 'Failed to create activity')
  } finally {
    isCreatingActivity.value = false
  }
}
</script>

<template>
  <LocationBlocker>
    <div class="min-h-screen bg-slate-950 relative">
      <!-- Animated Background -->
      <div class="fixed inset-0 pointer-events-none overflow-hidden">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="grid-pattern"></div>
      </div>

      <!-- Main Content -->
      <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div :class="['', isLoaded ? 'animate-fade-in' : 'opacity-0']">
          <!-- Page Header -->
          <div class="mb-6">
            <h1 class="text-3xl font-bold text-white mb-2">My Activities</h1>
            <p class="text-gray-400">Manage your created activities</p>
          </div>

          <!-- 3-Column Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            
            <!-- Left Sidebar -->
            <div class="hidden lg:block lg:col-span-1">
              <div class="sticky top-24">
                <LeftSidebar @logout="confirmLogout" />
              </div>
            </div>

            <!-- Center Content -->
            <div class="lg:col-span-2 xl:col-span-3">
              <!-- Create Activity Button -->
              <button
                @click="showCreateActivityModal = true"
                class="w-full mb-4 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create New Activity
              </button>

              <!-- My Activities Feed -->
              <MyActivitiesSection :key="activityKey" />
            </div>

            <!-- Right Sidebar -->
            <div class="hidden xl:block xl:col-span-1">
              <div class="sticky top-24">
                <RightSidebar />
              </div>
            </div>

          </div>
        </div>
      </main>

      <!-- Logout Confirmation Dialog -->
      <ConfirmDialog
        :show="showLogoutDialog"
        title="Logout"
        message="Are you sure you want to logout? You'll need to sign in again to access your account."
        confirm-text="Logout"
        cancel-text="Cancel"
        type="danger"
        @confirm="handleLogout"
        @cancel="showLogoutDialog = false"
      />

      <!-- Create Activity Modal -->
      <CreateActivityModal
        :show="showCreateActivityModal"
        :is-creating="isCreatingActivity"
        @close="showCreateActivityModal = false"
        @create="handleCreateActivity"
      />
    </div>
  </LocationBlocker>
</template>

<style scoped>
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  animation: float-orb 25s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--color-primary-500), transparent 70%);
  top: -100px;
  right: -100px;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--color-secondary-500), transparent 70%);
  bottom: -150px;
  left: -150px;
  animation-delay: 5s;
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
}

@keyframes float-orb {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}
</style>
