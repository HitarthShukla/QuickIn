<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { LMap, LTileLayer, LMarker, LPopup, LIcon } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import activityService from '@/services/activityService'
import type { Activity } from '@/types'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const props = defineProps<{
  filters?: {
    type?: string
    time?: string
    status?: string
  }
}>()

const emit = defineEmits<{
  viewActivity: [activity: Activity]
}>()

// Map configuration
const zoom = ref(5)
const center = ref<[number, number]>([20.5937, 78.9629]) // Center of India
const activities = ref<Activity[]>([])
const isLoading = ref(true)
const selectedActivity = ref<Activity | null>(null)
const currentSlideIndex = ref<Record<string, number>>({}) // Track slide index per location

// Activity type configurations
const activityTypeConfig: Record<string, { icon: string; color: string }> = {
  sport: { icon: '⚽', color: '#ef4444' },
  movie: { icon: '🎬', color: '#8b5cf6' },
  gaming: { icon: '🎮', color: '#6366f1' },
  study: { icon: '📚', color: '#10b981' },
  food: { icon: '🍕', color: '#f59e0b' },
  event: { icon: '🎉', color: '#ec4899' },
  hangout: { icon: '☕', color: '#14b8a6' },
  other: { icon: '✨', color: '#a855f7' }
}

// Group activities by location
const activitiesByLocation = computed(() => {
  const grouped = new Map<string, Activity[]>()
  
  activities.value.forEach(activity => {
    // Create a key from coordinates (rounded to avoid floating point issues)
    const lat = Math.round(activity.location.coordinates[1] * 10000) / 10000
    const lon = Math.round(activity.location.coordinates[0] * 10000) / 10000
    const key = `${lat},${lon}`
    
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(activity)
  })
  
  return grouped
})

// Get marker locations (unique coordinates)
const markerLocations = computed(() => {
  return Array.from(activitiesByLocation.value.entries()).map(([key, activities]) => ({
    key,
    activities,
    coordinates: activities[0].location.coordinates
  }))
})

const fetchActivities = async () => {
  try {
    isLoading.value = true
    const params: any = {
      limit: 100, // Get more activities for map view
    }

    if (props.filters?.type && props.filters.type !== 'all') {
      params.type = props.filters.type
    }

    if (props.filters?.time && props.filters.time !== 'all') {
      params.time = props.filters.time
    }

    if (props.filters?.status && props.filters.status !== 'all') {
      params.status = props.filters.status
    }

    const { data } = await activityService.getActivities(params)

    if (data.success) {
      activities.value = data.activities.filter((activity: Activity) => 
        activity.location?.coordinates && 
        activity.location.coordinates.length === 2
      )
      
      // Debug: Log activities with their coordinates
      console.log('Activities loaded for map:', activities.value.map(a => ({
        title: a.title,
        type: a.type,
        coordinates: a.location.coordinates,
        latLng: [a.location.coordinates[1], a.location.coordinates[0]]
      })))
    }
  } catch (error) {
    console.error('Failed to fetch activities:', error)
  } finally {
    isLoading.value = false
  }
}

const getMarkerIcon = (locationActivities: Activity[]) => {
  const activity = locationActivities[0]
  const config = activityTypeConfig[activity.type] || activityTypeConfig.other
  const hasMultiple = locationActivities.length > 1
  const hasMyActivity = locationActivities.some(a => a.creator._id === user.value?._id)
  
  return {
    html: `
      <div style="background: ${config.color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid ${hasMyActivity ? '#fbbf24' : 'white'}; position: relative;">
        ${config.icon}
        ${hasMultiple ? `<div style="position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white;">${locationActivities.length}</div>` : ''}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const handleMarkerClick = (locationKey: string, locationActivities: Activity[]) => {
  // Initialize slide index for this location if not exists
  if (!currentSlideIndex.value[locationKey]) {
    currentSlideIndex.value[locationKey] = 0
  }
  selectedActivity.value = locationActivities[currentSlideIndex.value[locationKey]]
  
  // Center map on clicked marker
  const lat = locationActivities[0].location.coordinates[1]
  const lon = locationActivities[0].location.coordinates[0]
  center.value = [lat, lon]
}

const nextSlide = (locationKey: string, locationActivities: Activity[]) => {
  const currentIndex = currentSlideIndex.value[locationKey] || 0
  const nextIndex = (currentIndex + 1) % locationActivities.length
  currentSlideIndex.value[locationKey] = nextIndex
  selectedActivity.value = locationActivities[nextIndex]
}

const prevSlide = (locationKey: string, locationActivities: Activity[]) => {
  const currentIndex = currentSlideIndex.value[locationKey] || 0
  const prevIndex = currentIndex === 0 ? locationActivities.length - 1 : currentIndex - 1
  currentSlideIndex.value[locationKey] = prevIndex
  selectedActivity.value = locationActivities[prevIndex]
}

const getCurrentActivity = (locationKey: string, locationActivities: Activity[]) => {
  const index = currentSlideIndex.value[locationKey] || 0
  return locationActivities[index]
}

const getMarkerPosition = (activity: Activity, index: number) => {
  let lat = activity.location.coordinates[1]
  let lon = activity.location.coordinates[0]
  
  // Check if another activity has the same coordinates
  const sameLocationCount = activities.value.slice(0, index).filter(a => 
    a.location.coordinates[0] === activity.location.coordinates[0] &&
    a.location.coordinates[1] === activity.location.coordinates[1]
  ).length
  
  // Add small offset if markers overlap (0.0001 degrees ~ 11 meters)
  if (sameLocationCount > 0) {
    const offsetAngle = (sameLocationCount * 60) * (Math.PI / 180) // 60 degrees apart
    const offsetDistance = 0.0005 // About 55 meters
    lat += offsetDistance * Math.sin(offsetAngle)
    lon += offsetDistance * Math.cos(offsetAngle)
  }
  
  return [lat, lon] as [number, number]
}

const handleViewDetails = () => {
  if (selectedActivity.value) {
    emit('viewActivity', selectedActivity.value)
  }
}

const handleJoinActivity = async (activity: Activity) => {
  try {
    const { data } = await activityService.joinActivity(activity._id)
    if (data.success) {
      // Refresh activities
      await fetchActivities()
      alert('Successfully joined the activity!')
    }
  } catch (error: any) {
    console.error('Failed to join activity:', error)
    alert(error.response?.data?.message || 'Failed to join activity')
  }
}

// Touch/Swipe handling for carousel
let touchStartX = 0
let touchEndX = 0

const handleTouchStart = (e: TouchEvent) => {
  touchStartX = e.changedTouches[0].screenX
}

const handleTouchMove = (e: TouchEvent) => {
  touchEndX = e.changedTouches[0].screenX
}

const handleTouchEnd = (_e: TouchEvent, locationKey: string, locationActivities: Activity[]) => {
  if (!touchStartX || !touchEndX) return
  
  const swipeThreshold = 50 // minimum distance for swipe
  const diff = touchStartX - touchEndX
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swipe left - next slide
      nextSlide(locationKey, locationActivities)
    } else {
      // Swipe right - previous slide
      prevSlide(locationKey, locationActivities)
    }
  }
  
  // Reset values
  touchStartX = 0
  touchEndX = 0
}

// Watch for filter changes
watch(() => props.filters, () => {
  fetchActivities()
}, { deep: true })

onMounted(() => {
  fetchActivities()
  
  // Try to get user's current location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        center.value = [position.coords.latitude, position.coords.longitude]
        zoom.value = 12
      },
      () => {
        console.log('Geolocation not available, using default center')
      }
    )
  }
})

// Expose refresh method
defineExpose({
  refresh: () => fetchActivities()
})
</script>

<template>
  <div class="relative w-full h-[calc(100vh-16rem)] bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="absolute inset-0 z-[1000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-white font-medium">Loading activities...</p>
      </div>
    </div>

    <!-- Map Container -->
    <LMap
      v-if="!isLoading"
      :zoom="zoom"
      :center="center"
      :use-global-leaflet="false"
      style="height: 100%; width: 100%; z-index: 1;"
    >
      <!-- Tile Layer - OpenStreetMap -->
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        :options="{ maxZoom: 18 }"
      />

      <!-- Activity Markers -->
      <LMarker
        v-for="location in markerLocations"
        :key="location.key"
        :lat-lng="[location.coordinates[1], location.coordinates[0]]"
        @click="handleMarkerClick(location.key, location.activities)"
      >
        <LIcon :options="getMarkerIcon(location.activities)" />
        
        <LPopup :options="{ maxWidth: 320, minWidth: 280, maxHeight: 400, className: 'custom-popup', autoPan: true }">
          <div class="p-3 w-[280px] max-h-[380px] overflow-y-auto relative">
            <!-- Multiple Activities Indicator & Navigation -->
            <div v-if="location.activities.length > 1" class="mb-3">
              <div class="flex items-center justify-between bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-3 py-2 rounded-lg">
                <button
                  @click.stop="prevSlide(location.key, location.activities)"
                  class="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <span class="text-sm font-medium">
                  {{ (currentSlideIndex[location.key] || 0) + 1 }} of {{ location.activities.length }} activities
                </span>
                
                <button
                  @click.stop="nextSlide(location.key, location.activities)"
                  class="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <p class="text-xs text-slate-500 mt-1 text-center">Swipe or use arrows to see other activities</p>
            </div>

            <!-- Activity Card (Swipeable) -->
            <div 
              class="activity-card"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd($event, location.key, location.activities)"
            >
              <!-- Activity Header -->
              <div class="flex items-start gap-3 mb-3">
                <div class="text-3xl">{{ activityTypeConfig[getCurrentActivity(location.key, location.activities).type]?.icon || '✨' }}</div>
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-slate-900 mb-1 line-clamp-2">{{ getCurrentActivity(location.key, location.activities).title }}</h3>
                  <span class="inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    {{ getCurrentActivity(location.key, location.activities).type.charAt(0).toUpperCase() + getCurrentActivity(location.key, location.activities).type.slice(1) }}
                  </span>
                </div>
              </div>

              <!-- Activity Details -->
              <div class="space-y-2 mb-3">
                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ formatDate(getCurrentActivity(location.key, location.activities).dateTime) }}</span>
                </div>

                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class="truncate">{{ getCurrentActivity(location.key, location.activities).location.address }}</span>
                </div>

                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>{{ getCurrentActivity(location.key, location.activities).participants.length }}/{{ getCurrentActivity(location.key, location.activities).maxParticipants }} joined</span>
                </div>
              </div>

              <!-- Creator Info -->
              <div class="flex items-center gap-2 mb-3 p-2 bg-slate-50 rounded-lg">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-bold">
                  {{ getCurrentActivity(location.key, location.activities).creator.name.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-slate-900">{{ getCurrentActivity(location.key, location.activities).creator.name }}</p>
                  <p class="text-xs text-slate-500">Organizer</p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  @click="handleViewDetails"
                  class="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg text-sm font-medium transition-colors"
                >
                  View Details
                </button>
                <button
                  v-if="!getCurrentActivity(location.key, location.activities).participants.some(p => p._id === user?._id)"
                  @click="handleJoinActivity(getCurrentActivity(location.key, location.activities))"
                  class="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </LPopup>
      </LMarker>
    </LMap>

    <!-- Map Info Badge -->
    <div class="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2">
      <p class="text-white text-sm font-medium">
        {{ activities.length }} {{ activities.length === 1 ? 'activity' : 'activities' }} found
      </p>
    </div>
  </div>
</template>

<style>
/* Custom marker styling */
.custom-marker {
  background: transparent !important;
  border: none !important;
}

/* Custom popup styling */
.custom-popup .leaflet-popup-content-wrapper {
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow: hidden;
}

.custom-popup .leaflet-popup-content {
  margin: 0;
  width: 280px !important;
  max-height: 380px;
}

.custom-popup .leaflet-popup-tip {
  background: white;
}

/* Custom scrollbar for popup */
.custom-popup ::-webkit-scrollbar {
  width: 6px;
}

.custom-popup ::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.custom-popup ::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.custom-popup ::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Activity card transition for swipe effect */
.activity-card {
  transition: transform 0.2s ease-out;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y;
}

.activity-card:active {
  cursor: grabbing;
}
</style>
