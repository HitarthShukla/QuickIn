<script setup lang="ts">
import { computed } from 'vue'
import type { Activity } from '@/types'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  activity: Activity
  showManageButton?: boolean
  hasPendingRequest?: boolean
}>()

const emit = defineEmits(['join', 'leave', 'view-details', 'rate'])

const authStore = useAuthStore()

const activityTypeConfig: Record<string, { icon: string, color: string }> = {
  sport: { icon: '⚽', color: 'from-green-500 to-emerald-500' },
  movie: { icon: '🎬', color: 'from-purple-500 to-pink-500' },
  gaming: { icon: '🎮', color: 'from-blue-500 to-cyan-500' },
  study: { icon: '📚', color: 'from-yellow-500 to-orange-500' },
  food: { icon: '🍕', color: 'from-red-500 to-pink-500' },
  event: { icon: '🎉', color: 'from-indigo-500 to-purple-500' },
  hangout: { icon: '☕', color: 'from-teal-500 to-green-500' },
  other: { icon: '✨', color: 'from-gray-500 to-slate-500' },
}

const typeConfig = computed(() => activityTypeConfig[props.activity.type] || activityTypeConfig.other)

const isFull = computed(() => props.activity.participants.length >= props.activity.maxParticipants)

const isParticipant = computed(() => {
  if (!authStore.user?._id) return false
  return props.activity.participants.some(p => p._id === authStore.user?._id)
})

const isCreator = computed(() => {
  if (!authStore.user?._id) return false
  return props.activity.creator._id === authStore.user._id
})

const spotsLeft = computed(() => props.activity.maxParticipants - props.activity.participants.length)

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 2) {
    const diffInMinutes = Math.round(diffInHours * 60)
    return `in ${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''}`
  } else if (diffInHours < 24) {
    return `in ${Math.round(diffInHours)} hrs`
  }
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString))
}

const formatTime = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString))
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
</script>

<template>
  <div class="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group">
    <!-- Header with Type Badge -->
    <div class="p-4 border-b border-white/10">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <!-- Activity Type Icon -->
          <div :class="['w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl flex-shrink-0', typeConfig.color]">
            {{ typeConfig.icon }}
          </div>
          
          <div class="flex-1 min-w-0">
            <!-- Title -->
            <h3 class="text-lg font-bold text-white group-hover:text-primary-400 transition-colors truncate cursor-pointer" @click="$emit('view-details')">
              {{ activity.title }}
            </h3>
            
            <!-- Creator Info -->
            <div class="flex items-center gap-2 mt-1">
              <div v-if="activity.creator.avatar" class="w-5 h-5 rounded-full overflow-hidden">
                <img :src="activity.creator.avatar" :alt="activity.creator.name" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-[10px] font-bold text-white">
                {{ getInitials(activity.creator.name) }}
              </div>
              <span class="text-sm text-gray-400">{{ activity.creator.name }}</span>
              <span v-if="activity.creator.trustScore" class="flex items-center gap-1 text-xs text-yellow-400">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {{ activity.creator.trustScore.toFixed(1) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Status Badge -->
        <div :class="[
          'px-3 py-1 rounded-full text-xs font-medium flex-shrink-0',
          activity.status === 'open' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
          activity.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
          activity.status === 'completed' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
          'bg-red-500/10 text-red-400 border border-red-500/20'
        ]">
          {{ activity.status }}
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-3">
      <!-- Description -->
      <p class="text-gray-300 text-sm line-clamp-2">{{ activity.description }}</p>

      <!-- Details Grid -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Location -->
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-gray-500">Location</p>
            <p class="text-sm text-white font-medium truncate">{{ activity.location.placeName }}</p>
          </div>
        </div>

        <!-- Date & Time -->
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-gray-500">When</p>
            <p class="text-sm text-white font-medium">{{ formatDate(activity.dateTime) }}</p>
            <p class="text-xs text-gray-400">{{ formatTime(activity.dateTime) }}</p>
          </div>
        </div>
      </div>

      <!-- Participants -->
      <div class="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-xl">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span class="text-sm text-white font-medium">
            {{ activity.participants.length }}/{{ activity.maxParticipants }} joined
          </span>
        </div>
        <div v-if="!isFull && activity.status === 'open'" class="text-xs text-primary-400 font-medium">
          {{ spotsLeft }} spot{{ spotsLeft !== 1 ? 's' : '' }} left
        </div>
        <div v-else-if="isFull" class="text-xs text-red-400 font-medium">
          Full
        </div>
      </div>

      <!-- Interests Tags -->
      <div v-if="activity.interests && activity.interests.length > 0" class="flex flex-wrap gap-2">
        <span
          v-for="interest in activity.interests.slice(0, 3)"
          :key="interest"
          class="px-2 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-full text-xs"
        >
          {{ interest }}
        </span>
        <span v-if="activity.interests.length > 3" class="px-2 py-1 text-gray-400 text-xs">
          +{{ activity.interests.length - 3 }} more
        </span>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-white/10 bg-slate-800/30">
      <div class="flex items-center justify-between gap-3">
        <div class="text-sm text-gray-400">
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ formatDateTime(activity.dateTime) }}
        </div>
        
        <div class="flex items-center gap-2">
          <button
            v-if="isCreator && showManageButton !== false"
            class="px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all text-sm font-medium cursor-pointer"
            @click="$emit('view-details', activity)"
          >
            Manage
          </button>
          <button
            v-if="(isCreator || isParticipant) && activity.status === 'completed'"
            class="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-all text-sm font-medium cursor-pointer ml-2"
            @click="$emit('rate', activity)"
          >
            Rate Participants
          </button>
          <button
            v-else-if="isParticipant && activity.status !== 'completed'"
            class="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-sm font-medium cursor-pointer"
            @click="$emit('leave')"
          >
            Leave
          </button>
          <button
            v-else-if="hasPendingRequest"
            class="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl cursor-not-allowed text-sm font-medium"
            disabled
          >
            ⏳ Request Pending
          </button>
          <button
            v-else-if="activity.status === 'open' && !isFull"
            :class="[
              'px-4 py-2 rounded-xl transition-all text-sm font-medium cursor-pointer',
              activity.joinType === 'request'
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            ]"
            @click="$emit('join')"
          >
            {{ activity.joinType === 'request' ? 'Request to Join' : 'Join Activity' }}
          </button>
          <button
            v-else
            class="px-4 py-2 bg-slate-700 text-gray-400 rounded-xl cursor-not-allowed text-sm font-medium"
            disabled
          >
            {{ isFull ? 'Full' : 'Closed' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
