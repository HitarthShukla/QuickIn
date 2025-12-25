<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const authStore = useAuthStore()

const isLoaded = ref(false)
const showLogoutDialog = ref(false)
const viewMode = ref<'feed' | 'map'>('feed')

// Data from API (empty by default)
const upcomingSchedule = ref<{ id: number; title: string; time: string; location: string; type: string }[]>([])
const pendingRequests = ref<{ id: number; name: string; avatar: string; activity: string; type: 'join' | 'invite' }[]>([])
const hostedActivities = ref<{ id: number; title: string; time: string; location: string; participants: number }[]>([])
const nearbyMatches = ref<{ tag: string; count: number }[]>([])
const activeGroups = ref<{ id: number; name: string; members: number; role: string; type: 'project' | 'squad'; progress?: number; deadline?: string }[]>([])
const ratePeers = ref<{ id: number; name: string; activity: string; date: string }[]>([])
const reconnectSuggestions = ref<{ id: number; name: string; event: string }[]>([])

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

const initials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

// Computed stats from user data
const stats = computed(() => ({
  activities: user.value?.totalActivities || 0,
  trustScore: user.value?.trustScore?.toFixed(1) || '5.0',
  attendanceRate: user.value?.attendanceRate || 100,
  groups: activeGroups.value.length,
}))
</script>

<template>
  <div class="min-h-screen bg-slate-950 relative">
    <!-- Animated Background -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="grid-pattern"></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <RouterLink to="/" class="text-2xl font-bold gradient-text">QuickIn</RouterLink>

          <!-- View Toggle -->
          <div class="hidden md:flex items-center gap-2 bg-slate-800/50 rounded-xl p-1">
            <button
              @click="viewMode = 'feed'"
              :class="['px-4 py-2 rounded-lg font-medium text-sm transition-all', viewMode === 'feed' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white']"
            >
              📋 Feed
            </button>
            <button
              @click="viewMode = 'map'"
              :class="['px-4 py-2 rounded-lg font-medium text-sm transition-all', viewMode === 'map' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white']"
            >
              🗺️ Map
            </button>
          </div>

          <!-- User Menu -->
          <div class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-medium text-white">{{ user?.name }}</p>
              <p class="text-xs text-gray-400">{{ user?.email }}</p>
            </div>
            
            <!-- Avatar (Link to Profile) -->
            <RouterLink
              to="/profile"
              class="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center font-semibold text-white hover:scale-105 transition-transform overflow-hidden"
              title="View Profile"
            >
              <img v-if="user?.avatar" :src="user.avatar" :alt="user?.name" class="w-full h-full object-cover" />
              <span v-else>{{ initials }}</span>
              <!-- Availability dot -->
              <div :class="['absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900', 
                user?.availabilityStatus === 'open' ? 'bg-emerald-500' : 
                user?.availabilityStatus === 'busy' ? 'bg-amber-500' : 'bg-gray-500']">
              </div>
            </RouterLink>

            <!-- Logout Button -->
            <button
              @click="confirmLogout"
              class="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Logout"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div :class="['', isLoaded ? 'animate-fade-in' : 'opacity-0']">
        
        <!-- Welcome Section -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">
            {{ greeting }}, {{ user?.name?.split(' ')[0] }}! 👋
          </h1>
          <p class="text-gray-400">Your command center for activities, groups, and connections.</p>
        </div>

        <!-- Stats Row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="stat-card">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <span class="text-2xl">🎯</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-white">{{ stats.activities }}</p>
                <p class="text-sm text-gray-400">Activities</p>
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <span class="text-2xl">⭐</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-white">{{ stats.trustScore }}</p>
                <p class="text-sm text-gray-400">Trust Score</p>
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <span class="text-2xl">📊</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-white">{{ stats.attendanceRate }}%</p>
                <p class="text-sm text-gray-400">Attendance</p>
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-secondary-500/20 flex items-center justify-center">
                <span class="text-2xl">👥</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-white">{{ stats.groups }}</p>
                <p class="text-sm text-gray-400">Groups</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Grid -->
        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Left Column -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Upcoming Schedule -->
            <div class="widget-card">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                  <span>📅</span> Upcoming Schedule
                </h3>
                <button class="text-primary-400 text-sm hover:underline">View All</button>
              </div>
              <div v-if="!upcomingSchedule.length" class="empty-state">
                <div class="empty-icon bg-primary-500/10">
                  <span class="text-3xl">📅</span>
                </div>
                <h4>No Upcoming Activities</h4>
                <p>Your schedule is clear! Create or join an activity to get started.</p>
                <button class="empty-action">+ Create Activity</button>
              </div>
              <div v-else class="space-y-3">
                <div v-for="item in upcomingSchedule" :key="item.id" class="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div class="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center text-xl">
                    {{ item.type === 'sports' ? '⚽' : item.type === 'study' ? '📚' : '🎯' }}
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-white">{{ item.title }}</p>
                    <p class="text-sm text-gray-400">{{ item.time }} @ {{ item.location }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- My Hosted Activities -->
            <div class="widget-card">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                  <span>🎪</span> My Hosted Activities
                </h3>
                <button class="text-primary-400 text-sm hover:underline">Manage</button>
              </div>
              <div v-if="!hostedActivities.length" class="empty-state">
                <div class="empty-icon bg-amber-500/10">
                  <span class="text-3xl">🎪</span>
                </div>
                <h4>No Hosted Activities</h4>
                <p>You haven't created any activities yet. Host one to bring people together!</p>
                <button class="empty-action">+ Host Activity</button>
              </div>
              <div v-else class="space-y-3">
                <div v-for="item in hostedActivities" :key="item.id" class="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">🎯</div>
                    <div>
                      <p class="font-medium text-white">{{ item.title }}</p>
                      <p class="text-xs text-gray-400">{{ item.participants }} participants</p>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button class="px-3 py-1 text-xs bg-white/10 text-white rounded-lg hover:bg-white/20">Edit</button>
                    <button class="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">Cancel</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Groups -->
            <div class="widget-card">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                  <span>👥</span> Active Squads & Groups
                </h3>
                <button class="text-primary-400 text-sm hover:underline">View All</button>
              </div>
              <div v-if="!activeGroups.length" class="empty-state">
                <div class="empty-icon bg-secondary-500/10">
                  <span class="text-3xl">👥</span>
                </div>
                <h4>No Groups Yet</h4>
                <p>Create or join a squad to collaborate on projects and activities!</p>
                <button class="empty-action">+ Create Group</button>
              </div>
              <div v-else class="grid sm:grid-cols-2 gap-3">
                <div v-for="group in activeGroups" :key="group.id" class="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div class="flex items-center gap-3 mb-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center text-xl">
                      {{ group.type === 'project' ? '📁' : '🏃' }}
                    </div>
                    <div class="flex-1">
                      <p class="font-semibold text-white">{{ group.name }}</p>
                      <p class="text-xs text-gray-400">{{ group.members }} members</p>
                    </div>
                    <span :class="['px-2 py-0.5 text-xs rounded-full', group.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-primary-500/20 text-primary-400']">
                      {{ group.role }}
                    </span>
                  </div>
                  <!-- Project Progress -->
                  <div v-if="group.type === 'project' && group.progress !== undefined" class="mt-2">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-gray-400">Progress</span>
                      <span class="text-white">{{ group.progress }}%</span>
                    </div>
                    <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full" :style="{ width: group.progress + '%' }"></div>
                    </div>
                    <p v-if="group.deadline" class="text-xs text-amber-400 mt-2">⏰ {{ group.deadline }}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            
            <!-- Pending Requests -->
            <div class="widget-card">
              <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>🔔</span> Pending Requests
              </h3>
              <div v-if="!pendingRequests.length" class="empty-state-sm">
                <span class="text-2xl">✅</span>
                <p class="text-gray-500 text-sm">No pending requests</p>
              </div>
              <div v-else class="space-y-3">
                <div v-for="req in pendingRequests" :key="req.id" class="p-3 bg-white/5 rounded-xl">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                      {{ req.name.charAt(0) }}
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-white">{{ req.name }}</p>
                      <p class="text-xs text-gray-400">{{ req.type === 'join' ? 'wants to join' : 'invited you to' }} {{ req.activity }}</p>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button class="flex-1 py-2 bg-emerald-500/20 text-emerald-400 text-sm rounded-lg hover:bg-emerald-500/30">Accept</button>
                    <button class="flex-1 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30">Decline</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Nearby Radar -->
            <div class="widget-card">
              <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>📡</span> Nearby Radar
              </h3>
              <div v-if="!nearbyMatches.length" class="empty-state-sm">
                <span class="text-2xl">🔍</span>
                <p class="text-gray-500 text-sm text-center">Add interests to discover nearby activities</p>
              </div>
              <div v-else class="space-y-2">
                <div v-for="match in nearbyMatches" :key="match.tag" class="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors">
                  <span class="text-primary-400">#{{ match.tag }}</span>
                  <span class="text-sm text-emerald-400">{{ match.count }} nearby</span>
                </div>
              </div>
            </div>

            <!-- Rate Past Peers -->
            <div class="widget-card">
              <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>⭐</span> Rate Your Experience
              </h3>
              <div v-if="!ratePeers.length" class="empty-state-sm">
                <span class="text-2xl">👍</span>
                <p class="text-gray-500 text-sm text-center">Complete activities to rate peers</p>
              </div>
              <div v-else class="space-y-3">
                <div v-for="peer in ratePeers" :key="peer.id" class="p-3 bg-white/5 rounded-xl">
                  <p class="text-sm text-white mb-1">You met <span class="font-semibold text-primary-400">{{ peer.name }}</span> at {{ peer.activity }}</p>
                  <p class="text-xs text-gray-400 mb-2">{{ peer.date }}</p>
                  <button class="w-full py-2 bg-amber-500/20 text-amber-400 text-sm rounded-lg hover:bg-amber-500/30">Rate Experience</button>
                </div>
              </div>
            </div>

            <!-- Reconnect Suggestions -->
            <div class="widget-card">
              <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>🤝</span> Reconnect
              </h3>
              <div v-if="!reconnectSuggestions.length" class="empty-state-sm">
                <span class="text-2xl">👋</span>
                <p class="text-gray-500 text-sm text-center">Join activities to meet new people</p>
              </div>
              <div v-else class="space-y-2">
                <div v-for="person in reconnectSuggestions" :key="person.id" class="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div>
                    <p class="text-sm font-medium text-white">{{ person.name }}</p>
                    <p class="text-xs text-gray-400">Met at {{ person.event }}</p>
                  </div>
                  <button class="px-3 py-1 bg-primary-500/20 text-primary-400 text-sm rounded-lg hover:bg-primary-500/30">Add</button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Quick Actions FAB -->
        <div class="fixed bottom-8 right-8 flex flex-col gap-3">
          <button class="w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full shadow-lg shadow-primary-500/30 flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform" title="Create Activity">
            +
          </button>
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
  </div>
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
