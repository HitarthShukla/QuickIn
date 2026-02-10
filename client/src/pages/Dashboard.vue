<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LeftSidebar from '@/components/dashboard/LeftSidebar.vue'
import ActivityFeedSection from '@/components/dashboard/ActivityFeedSection.vue'
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
const activeView = ref<'activities' | 'map'>('activities')

// Data from API (empty by default)

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

const initials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})



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
          <h1 class="text-3xl font-bold text-white mb-2">Feed</h1>
          <p class="text-gray-400">Discover and join activities</p>
        </div>

        <!-- 3-Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          
          <!-- Left Sidebar (Services) -->
          <div class="hidden lg:block lg:col-span-1">
            <div class="sticky top-24">
              <LeftSidebar @logout="confirmLogout" />
            </div>
          </div>

          <!-- Center Feed -->
          <div class="lg:col-span-2 xl:col-span-3">
            <!-- View Tabs -->
            <div class="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-2 mb-4 flex gap-2">
              <button
                @click="activeView = 'activities'"
                :class="[
                  'flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200',
                  activeView === 'activities'
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                ]"
              >
                <div class="flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Activities
                </div>
              </button>
              <button
                @click="activeView = 'map'"
                :class="[
                  'flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200',
                  activeView === 'map'
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                ]"
              >
                <div class="flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Map View
                </div>
              </button>
            </div>

            <!-- Activities View -->
            <div v-if="activeView === 'activities'">
              <ActivityFeedSection :key="activityKey" />
            </div>

            <!-- Map View (Empty for now) -->
            <div v-else-if="activeView === 'map'" class="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
              <div class="text-center">
                <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30 flex items-center justify-center">
                  <svg class="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Map View Coming Soon</h3>
                <p class="text-gray-400">Interactive map with nearby activities will be available here</p>
              </div>
            </div>
          </div>

          <!-- Right Sidebar (Widgets) -->
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
  bottom: 100px;
  left: -50px;
  animation-delay: -12s;
}

@keyframes float-orb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -20px) scale(1.05); }
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px);
  background-size: 60px 60px;
}

.stat-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.widget-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.empty-state .empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state h4 {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: #64748b;
  max-width: 280px;
  margin: 0 auto 16px;
}

.empty-state .empty-action {
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
  color: white;
  border-radius: 12px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
}

.empty-state .empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3);
}

.empty-state-sm {
  text-align: center;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
