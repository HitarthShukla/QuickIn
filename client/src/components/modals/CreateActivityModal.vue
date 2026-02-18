<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
const joinType = ref<'open' | 'request'>('open')
const location = ref({
  placeName: '',
  address: '',
  coordinates: [0, 0] as [number, number]
})
const requirements = ref('')
const interests = ref<string[]>([])
const newInterest = ref('')
const isGeocodingLocation = ref(false)
const geocodingError = ref('')
const locationSuggestions = ref<any[]>([])
let geocodeTimeout: NodeJS.Timeout | null = null

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

// Geocode location using Nominatim API
const geocodeLocation = async (query: string) => {
  if (!query || query.trim().length < 3) {
    locationSuggestions.value = []
    return
  }

  try {
    isGeocodingLocation.value = true
    geocodingError.value = ''
    
    // Use Nominatim API with country filter for India
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `countrycodes=in&` +
      `format=json&` +
      `limit=5&` +
      `addressdetails=1`
    )
    
    if (!response.ok) throw new Error('Geocoding failed')
    
    const results = await response.json()
    
    if (results && results.length > 0) {
      locationSuggestions.value = results.map((result: any) => ({
        placeName: result.display_name,
        address: result.display_name,
        coordinates: [parseFloat(result.lon), parseFloat(result.lat)]
      }))
    } else {
      geocodingError.value = 'Location not found. Please try a different search.'
      locationSuggestions.value = []
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    geocodingError.value = 'Failed to find location. Please try again.'
    locationSuggestions.value = []
  } finally {
    isGeocodingLocation.value = false
  }
}

// Watch location input and geocode with debounce
watch(() => location.value.placeName, (newValue) => {
  if (geocodeTimeout) {
    clearTimeout(geocodeTimeout)
  }
  
  if (newValue && newValue.trim().length >= 3) {
    geocodeTimeout = setTimeout(() => {
      geocodeLocation(newValue)
    }, 500) // Debounce for 500ms
  } else {
    locationSuggestions.value = []
  }
})

// Select a location suggestion
const selectLocationSuggestion = (suggestion: any) => {
  location.value.placeName = suggestion.placeName
  location.value.address = suggestion.address
  location.value.coordinates = suggestion.coordinates
  locationSuggestions.value = []
  geocodingError.value = ''
}

// Get user's current location as fallback
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `lat=${lat}&lon=${lon}&format=json&addressdetails=1`
          )
          const result = await response.json()
          
          if (result && result.display_name) {
            location.value.placeName = result.display_name
            location.value.address = result.display_name
            location.value.coordinates = [lon, lat]
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error)
          location.value.coordinates = [lon, lat]
        }
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
         location.value.coordinates[0] !== 0 &&
         location.value.coordinates[1] !== 0 &&
         maxParticipants.value >= 2
})

const handleCreate = () => {
  if (!isValid.value) return
  
  const activityData = {
    title: title.value,
    description: description.value,
    type: type.value,
    joinType: joinType.value,
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
  }
  
  console.log('Creating activity with location:', {
    placeName: activityData.location.placeName,
    coordinates: activityData.location.coordinates,
    latLng: [activityData.location.coordinates[1], activityData.location.coordinates[0]]
  })
  
  emit('create', activityData)
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
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-300">Location *</label>
              <button
                @click="getCurrentLocation"
                type="button"
                class="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use my location
              </button>
            </div>
            <div class="relative">
              <input
                v-model="location.placeName"
                type="text"
                placeholder="Search for city, area, or landmark in India..."
                class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              
              <!-- Loading indicator -->
              <div v-if="isGeocodingLocation" class="absolute right-3 top-3">
                <div class="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>

              <!-- Location suggestions dropdown -->
              <div 
                v-if="locationSuggestions.length > 0" 
                class="absolute z-50 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
              >
                <button
                  v-for="(suggestion, index) in locationSuggestions"
                  :key="index"
                  @click="selectLocationSuggestion(suggestion)"
                  type="button"
                  class="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors border-b border-white/5 last:border-0"
                >
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-white truncate">{{ suggestion.placeName }}</p>
                    </div>
                  </div>
                </button>
              </div>

              <!-- Error message -->
              <p v-if="geocodingError" class="mt-2 text-xs text-red-400">{{ geocodingError }}</p>

              <!-- Selected location display -->
              <p v-if="location.coordinates[0] !== 0 && location.coordinates[1] !== 0" class="mt-2 text-xs text-green-400 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Location confirmed
              </p>
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

          <!-- Join Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-3">Join Type *</label>
            <div class="flex gap-4">
              <button
                type="button"
                @click="joinType = 'open'"
                :class="[
                  'flex-1 px-4 py-3 rounded-xl border-2 transition-all text-left',
                  joinType === 'open'
                    ? 'border-primary-500 bg-primary-500/10 text-white'
                    : 'border-white/10 bg-slate-800 text-gray-400 hover:border-white/20'
                ]"
              >
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" :class="joinType === 'open' ? 'text-primary-400' : 'text-gray-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p class="font-medium">Open</p>
                    <p class="text-xs opacity-70">Anyone can join directly</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                @click="joinType = 'request'"
                :class="[
                  'flex-1 px-4 py-3 rounded-xl border-2 transition-all text-left',
                  joinType === 'request'
                    ? 'border-primary-500 bg-primary-500/10 text-white'
                    : 'border-white/10 bg-slate-800 text-gray-400 hover:border-white/20'
                ]"
              >
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" :class="joinType === 'request' ? 'text-primary-400' : 'text-gray-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p class="font-medium">Request to Join</p>
                    <p class="text-xs opacity-70">Approval required</p>
                  </div>
                </div>
              </button>
            </div>
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
