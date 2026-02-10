<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import ActivityCard from './ActivityCard.vue'
import activityService from '@/services/activityService'
import { useAuthStore } from '@/stores/auth'
import type { Activity } from '@/types'

const authStore = useAuthStore()
const user = computed(() => authStore.user)
const activities = ref<Activity[]>([])
const isLoading = ref(true)
const page = ref(1)
const hasMore = ref(false)
const isLoadingMore = ref(false)

// Filters
const selectedType = ref<string>('all')
const selectedTime = ref<string>('all')
const selectedStatus = ref<string>('open')

const activityTypes = [
  { value: 'all', label: 'All', icon: '🎯' },
  { value: 'sport', label: 'Sports', icon: '⚽' },
  { value: 'movie', label: 'Movie', icon: '🎬' },
  { value: 'gaming', label: 'Gaming', icon: '🎮' },
  { value: 'study', label: 'Study', icon: '📚' },
  { value: 'food', label: 'Food', icon: '🍕' },
  { value: 'event', label: 'Event', icon: '🎉' },
  { value: 'hangout', label: 'Hangout', icon: '☕' },
  { value: 'other', label: 'Other', icon: '✨' },
]

const timeFilters = [
  { value: 'all', label: 'All Time' },
  { value: 'now', label: 'Happening Now' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
]

const fetchActivities = async (reset = false) => {
  try {
    if (reset) {
      isLoading.value = true
      page.value = 1
      activities.value = []
    } else {
      isLoadingMore.value = true
    }

    const params: any = {
      page: page.value,
      limit: 10,
    }

    if (selectedType.value !== 'all') {
      params.type = selectedType.value
    }

    if (selectedTime.value !== 'all') {
      params.time = selectedTime.value
    }

    if (selectedStatus.value !== 'all') {
      params.status = selectedStatus.value
    }

    const { data } = await activityService.getActivities(params)

    if (data.success) {
      // Filter to show only activities created by current user
      const myActivitiesOnly = data.activities.filter(
        (activity: Activity) => activity.creator._id === user.value?._id
      )
      
      if (reset) {
        activities.value = myActivitiesOnly
      } else {
        activities.value.push(...myActivitiesOnly)
      }
      hasMore.value = page.value < (data.pagination?.pages || 1)
    }
  } catch (error) {
    console.error('Failed to fetch activities:', error)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

const loadMore = () => {
  if (hasMore.value && !isLoadingMore.value) {
    page.value++
    fetchActivities()
  }
}

const handleJoin = async (activity: Activity) => {
  try {
    const { data } = await activityService.joinActivity(activity._id)
    if (data.success && data.activity) {
      // Update the activity in the list
      const index = activities.value.findIndex(a => a._id === activity._id)
      if (index !== -1) {
        activities.value[index] = data.activity
      }
    }
  } catch (error: any) {
    console.error('Failed to join activity:', error)
    alert(error.response?.data?.message || 'Failed to join activity')
  }
}

const handleLeave = async (activity: Activity) => {
  try {
    const { data } = await activityService.leaveActivity(activity._id)
    if (data.success && data.activity) {
      // Update the activity in the list
      const index = activities.value.findIndex(a => a._id === activity._id)
      if (index !== -1) {
        activities.value[index] = data.activity
      }
    }
  } catch (error: any) {
    console.error('Failed to leave activity:', error)
    alert(error.response?.data?.message || 'Failed to leave activity')
  }
}

const handleViewDetails = (activity: Activity) => {
  // TODO: Navigate to activity details page or open modal
  console.log('View activity details:', activity)
}

// Watch for filter changes
watch([selectedType, selectedTime, selectedStatus], () => {
  fetchActivities(true)
})

onMounted(() => {
  fetchActivities(true)
})

// Expose refresh method
defineExpose({
  refresh: () => fetchActivities(true)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3">
      <!-- Type Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Activity Type</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="type in activityTypes"
            :key="type.value"
            @click="selectedType = type.value"
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-all',
              selectedType === type.value
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800 hover:text-white'
            ]"
          >
            <span class="mr-1">{{ type.icon }}</span>
            {{ type.label }}
          </button>
        </div>
      </div>

      <!-- Time and Status Filters -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Time</label>
          <select
            v-model="selectedTime"
            class="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option v-for="filter in timeFilters" :key="filter.value" :value="filter.value">
              {{ filter.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            v-model="selectedStatus"
            class="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="bg-slate-900/50 border border-white/10 rounded-2xl p-6 animate-pulse">
        <div class="h-4 bg-slate-800 rounded w-3/4 mb-3"></div>
        <div class="h-3 bg-slate-800 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Activities List -->
    <div v-else-if="activities.length > 0" class="space-y-4">
      <ActivityCard
        v-for="activity in activities"
        :key="activity._id"
        :activity="activity"
        @join="handleJoin"
        @leave="handleLeave"
        @view-details="handleViewDetails"
      />

      <!-- Load More Button -->
      <button
        v-if="hasMore"
        @click="loadMore"
        :disabled="isLoadingMore"
        class="w-full py-3 bg-slate-900/50 hover:bg-slate-900/70 border border-white/10 hover:border-white/20 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isLoadingMore ? 'Loading...' : 'Load More' }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
      <div class="text-center">
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30 flex items-center justify-center">
          <svg class="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">No Activities Yet</h3>
        <p class="text-gray-400 mb-6">You haven't created any activities. Start by creating your first one!</p>
      </div>
    </div>
  </div>
</template>
