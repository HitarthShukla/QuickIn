<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ActivityType } from '@/types'

defineProps<{
  show: boolean
  isCreating?: boolean
}>()

const emit = defineEmits(['close', 'create'])

const title = ref('')
const description = ref('')
const type = ref<ActivityType>('hangout')
const dateTime = ref('')
const duration = ref<number>(60)
const maxParticipants = ref<number>(5)
const location = ref({
  placeName: '',
  address: '',
  coordinates: [0, 0] as [number, number]
})
const requirements = ref('')
const interests = ref<string[]>([])
const newInterest = ref('')

const activityTypes = [
  { value: 'sport', label: 'Sports', icon: '⚽', color: 'from-green-500 to-emerald-500' },
  { value: 'movie', label: 'Movie', icon: '🎬', color: 'from-purple-500 to-pink-500' },
  { value: 'gaming', label: 'Gaming', icon: '🎮', color: 'from-blue-500 to-cyan-500' },
  { value: 'study', label: 'Study', icon: '📚', color: 'from-yellow-500 to-orange-500' },
  { value: 'food', label: 'Food', icon: '🍕', color: 'from-red-500 to-pink-500' },
  { value: 'event', label: 'Event', icon: '🎉', color: 'from-indigo-500 to-purple-500' },
  { value: 'hangout', label: 'Hangout', icon: '☕', color: 'from-teal-500 to-green-500' },
  { value: 'other', label: 'Other', icon: '✨', color: 'from-gray-500 to-slate-500' },
]

// Get user's current location
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        location.value.coordinates = [
          position.coords.longitude,
          position.coords.latitude
        ]
      },
      (error) => {
        console.error('Error getting location:', error)
      }
    )
  }
}

const addInterest = () => {
  if (newInterest.value.trim() && !interests.value.includes(newInterest.value.trim())) {
    interests.value.push(newInterest.value.trim())
    newInterest.value = ''
  }
}

const removeInterest = (interest: string) => {
  interests.value = interests.value.filter(i => i !== interest)
}

const minDateTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 30) // At least 30 minutes in the future
  return now.toISOString().slice(0, 16)
})

const isValid = computed(() => {
  return title.value.trim().length >= 3 &&
         description.value.trim().length >= 10 &&
         dateTime.value &&
         location.value.placeName.trim() &&
         maxParticipants.value >= 2
})

const handleCreate = () => {
  if (!isValid.value) return
  
  emit('create', {
    title: title.value,
    description: description.value,
    type: type.value,
    location: {
      type: 'Point' as const,
      coordinates: location.value.coordinates,
      placeName: location.value.placeName,
      address: location.value.address || undefined
    },
    dateTime: new Date(dateTime.value).toISOString(),
    duration: duration.value || undefined,
    maxParticipants: maxParticipants.value,
    interests: interests.value.length > 0 ? interests.value : undefined,
    requirements: requirements.value.trim() || undefined
  })
}

// Initialize location on mount
getCurrentLocation()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>

      <!-- Modal -->
      <div 
        class="relative w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto"
        role="dialog"
      >
        <!-- Header -->
        <div class="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-slate-900">
          <h3 class="text-xl font-bold text-white">Create Activity</h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg cursor-pointer">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-6">
          <!-- Activity Type Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-3">Activity Type *</label>
            <div class="grid grid-cols-4 gap-3">
              <button
                v-for="activityType in activityTypes"
                :key="activityType.value"
                @click="type = activityType.value as ActivityType"
                :class="[
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer',
                  type === activityType.value
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-white/10 hover:border-white/20 bg-slate-800/50'
                ]"
              >
                <div :class="['w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl', activityType.color]">
                  {{ activityType.icon }}
                </div>
                <span class="text-xs font-medium text-white">{{ activityType.label }}</span>
              </button>
            </div>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input
              v-model="title"
              type="text"
              placeholder="e.g., Basketball at Central Park"
              maxlength="100"
              class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <p class="text-xs text-gray-500 mt-1">{{ title.length }}/100</p>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Description *</label>
            <textarea
              v-model="description"
              placeholder="Tell people what this activity is about..."
              maxlength="500"
              rows="4"
              class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">{{ description.length }}/500</p>
          </div>

          <!-- Location -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Place Name *</label>
              <input
                v-model="location.placeName"
                type="text"
                placeholder="e.g., Central Park"
                class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Address (Optional)</label>
              <input
                v-model="location.address"
                type="text"
                placeholder="Full address"
                class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <!-- Date/Time and Duration -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Date & Time *</label>
              <input
                v-model="dateTime"
                type="datetime-local"
                :min="minDateTime"
                class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
              <input
                v-model.number="duration"
                type="number"
                min="15"
                max="1440"
                placeholder="60"
                class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <!-- Max Participants -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Max Participants *</label>
            <input
              v-model.number="maxParticipants"
              type="number"
              min="2"
              max="100"
              class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- Interests/Tags -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Interests (Optional)</label>
            <div class="flex gap-2 mb-2">
              <input
                v-model="newInterest"
                @keydown.enter.prevent="addInterest"
                type="text"
                placeholder="Add interest (press Enter)"
                class="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <button
                @click="addInterest"
                class="px-4 py-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-xl hover:bg-primary-500/20 transition-all cursor-pointer"
              >
                Add
              </button>
            </div>
            <div v-if="interests.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="interest in interests"
                :key="interest"
                class="px-3 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-full text-sm flex items-center gap-2 group"
              >
                {{ interest }}
                <button @click="removeInterest(interest)" class="hover:text-red-400 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            </div>
          </div>

          <!-- Requirements -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Requirements (Optional)</label>
            <input
              v-model="requirements"
              type="text"
              placeholder="e.g., Bring your own equipment"
              maxlength="200"
              class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-slate-900">
          <button
            @click="$emit('close')"
            class="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="handleCreate"
            :disabled="!isValid || isCreating"
            :class="[
              'px-6 py-3 rounded-xl font-medium transition-all cursor-pointer',
              isValid && !isCreating
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-slate-800 text-gray-500 cursor-not-allowed'
            ]"
          >
            {{ isCreating ? 'Creating...' : 'Create Activity' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
