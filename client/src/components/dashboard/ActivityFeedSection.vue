<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import ActivityCard from './ActivityCard.vue'
import SendJoinRequestModal from '../modals/SendJoinRequestModal.vue'
import activityService from '@/services/activityService'
import joinRequestService from '@/services/joinRequestService'
import type { Activity } from '@/types'
import socketService from '@/services/socketService'

const activities = ref<Activity[]>([])
const isLoading = ref(true)
const page = ref(1)
const hasMore = ref(false)
const isLoadingMore = ref(false)
const showJoinRequestModal = ref(false)
const selectedActivityForRequest = ref<Activity | null>(null)
const isSendingRequest = ref(false)
const sentRequests = ref<Set<string>>(new Set()) // Track activities user has sent requests for

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
      if (reset) {
        activities.value = data.activities
      } else {
        activities.value.push(...data.activities)
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
  // Check if activity requires join request
  if (activity.joinType === 'request') {
    selectedActivityForRequest.value = activity
    showJoinRequestModal.value = true
    return
  }

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

const handleSendJoinRequest = async (message?: string) => {
  if (!selectedActivityForRequest.value) return

  try {
    isSendingRequest.value = true
    const { data } = await joinRequestService.sendJoinRequest(
      selectedActivityForRequest.value._id,
      { message }
    )
    
    if (data.success) {
      sentRequests.value.add(selectedActivityForRequest.value._id)
      alert('Join request sent successfully! The creator will review your request.')
      showJoinRequestModal.value = false
      selectedActivityForRequest.value = null
    }
  } catch (error: any) {
    console.error('Failed to send join request:', error)
    alert(error.response?.data?.message || 'Failed to send join request')
  } finally {
    isSendingRequest.value = false
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

  socketService.connect()

  socketService.on('activity:created', () => fetchActivities(true))
  socketService.on('activity:updated', () => fetchActivities(true))
  socketService.on('activity:deleted', () => fetchActivities(true))
  socketService.on('activity:participant-joined', () => fetchActivities(true))
  socketService.on('activity:participant-left', () => fetchActivities(true))
  
  // Join request events
  socketService.on('activity:join-request:sent', ({ activityId, userId }) => {
    sentRequests.value.add(activityId)
  })
  
  socketService.on('activity:join-request:accepted', ({ activityId }) => {
    sentRequests.value.delete(activityId)
    fetchActivities(true)
  })
  
  socketService.on('activity:join-request:rejected', ({ activityId }) => {
    sentRequests.value.delete(activityId)
  })
})

onUnmounted(() => {
  socketService.off('activity:created')
  socketService.off('activity:updated')
  socketService.off('activity:deleted')
  socketService.off('activity:participant-joined')
  socketService.off('activity:participant-left')
  socketService.off('activity:join-request:sent')
  socketService.off('activity:join-request:accepted')
  socketService.off('activity:join-request:rejected')
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
              'px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2',
              selectedType === type.value
                ? 'bg-primary-500 text-white'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white'
            ]"
          >
            <span>{{ type.icon }}</span>
            <span>{{ type.label }}</span>
          </button>
        </div>
      </div>

      <!-- Time & Status Filters -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Time</label>
          <select
            v-model="selectedTime"
            class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
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
            class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Activities List -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-slate-800 rounded-xl"></div>
          <div class="flex-1 space-y-3">
            <div class="h-6 bg-slate-800 rounded w-3/4"></div>
            <div class="h-4 bg-slate-800 rounded w-1/2"></div>
            <div class="h-16 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activities.length === 0" class="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
      <div class="text-6xl mb-4">🎯</div>
      <h3 class="text-xl font-bold text-white mb-2">No activities found</h3>
      <p class="text-gray-400">Try adjusting your filters or create a new activity!</p>
    </div>

    <div v-else class="space-y-4">
      <ActivityCard
        v-for="activity in activities"
        :key="activity._id"
        :activity="activity"
        :show-manage-button="false"
        :has-pending-request="sentRequests.has(activity._id)"
        @join="handleJoin(activity)"
        @leave="handleLeave(activity)"
        @view-details="handleViewDetails(activity)"
      />

      <!-- Load More Button -->
      <button
        v-if="hasMore"
        @click="loadMore"
        :disabled="isLoadingMore"
        class="w-full py-3 bg-slate-900/50 backdrop-blur-xl border border-white/10 text-white rounded-2xl hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isLoadingMore ? 'Loading...' : 'Load More Activities' }}
      </button>
    </div>

    <!-- Join Request Modal -->
    <SendJoinRequestModal
      v-if="showJoinRequestModal && selectedActivityForRequest"
      :activity="selectedActivityForRequest"
      :is-sending="isSendingRequest"
      @close="showJoinRequestModal = false"
      @send="handleSendJoinRequest"
    />
  </div>
</template>
