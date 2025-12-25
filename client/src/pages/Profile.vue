<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import api from '@/services/api'
import type { AvailabilityStatus, BadgeType } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const isLoaded = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const showLogoutDialog = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const activeTab = ref<'profile' | 'activity'>('profile')

// File upload refs
const avatarInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref('')
const coverPreview = ref('')

const form = ref({
  name: '',
  avatar: '',
  coverPhoto: '',
  bio: '',
  activeZones: [] as string[],
  interests: [] as string[],
  availabilityStatus: 'open' as AvailabilityStatus,
  languages: [] as string[],
})

const newInterest = ref('')
const newZone = ref('')
const newLanguage = ref('')

const user = computed(() => authStore.user)

onMounted(async () => {
  await authStore.checkAuth()
  if (authStore.user) {
    syncFormWithUser()
  }
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})

const syncFormWithUser = () => {
  if (!authStore.user) return
  form.value = {
    name: authStore.user.name || '',
    avatar: authStore.user.avatar || '',
    coverPhoto: authStore.user.coverPhoto || '',
    bio: authStore.user.bio || '',
    activeZones: authStore.user.activeZones || [],
    interests: authStore.user.interests || [],
    availabilityStatus: authStore.user.availabilityStatus || 'open',
    languages: authStore.user.languages || [],
  }
  avatarPreview.value = authStore.user.avatar || ''
  coverPreview.value = authStore.user.coverPhoto || ''
}

const initials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const memberSince = computed(() => {
  if (!user.value?.createdAt) return ''
  return new Date(user.value.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const badgeInfo: Record<BadgeType, { label: string; icon: string; color: string }> = {
  GoodHost: { label: 'Good Host', icon: '🏠', color: 'from-amber-500 to-orange-500' },
  TeamPlayer: { label: 'Team Player', icon: '🤝', color: 'from-blue-500 to-cyan-500' },
  Punctual: { label: 'Punctual', icon: '⏰', color: 'from-green-500 to-emerald-500' },
  Reliable: { label: 'Reliable', icon: '⭐', color: 'from-purple-500 to-pink-500' },
  Verified: { label: 'Verified', icon: '✓', color: 'from-primary-500 to-secondary-500' },
  EarlyAdopter: { label: 'Early Adopter', icon: '🚀', color: 'from-rose-500 to-red-500' },
}

const availabilityOptions = [
  { value: 'open', label: 'Open to Activities', color: 'bg-emerald-500' },
  { value: 'busy', label: 'Busy', color: 'bg-amber-500' },
  { value: 'away', label: 'Away', color: 'bg-gray-500' },
]

// Compress image to reduce size
const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width
      let height = img.height
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      const compressed = canvas.toDataURL('image/jpeg', quality)
      resolve(compressed)
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

// Handle avatar upload (compress to 200x200, ~20-50KB)
const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Please select an image file'
    return
  }

  // Validate file size (max 5MB before compression)
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Image size must be less than 5MB'
    return
  }

  try {
    // Compress to 200x200 for avatar
    const compressed = await compressImage(file, 200, 200, 0.85)
    form.value.avatar = compressed
    avatarPreview.value = compressed
    errorMessage.value = ''
  } catch {
    errorMessage.value = 'Failed to process image'
  }
}

// Handle cover photo upload (compress to 1200x400, ~80-150KB)
const handleCoverUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Please select an image file'
    return
  }

  // Validate file size (max 10MB before compression)
  if (file.size > 10 * 1024 * 1024) {
    errorMessage.value = 'Cover image size must be less than 10MB'
    return
  }

  try {
    // Compress to 1200x400 for cover
    const compressed = await compressImage(file, 1200, 400, 0.8)
    form.value.coverPhoto = compressed
    coverPreview.value = compressed
    errorMessage.value = ''
  } catch {
    errorMessage.value = 'Failed to process image'
  }
}

// Remove avatar
const removeAvatar = () => {
  form.value.avatar = ''
  avatarPreview.value = ''
  if (avatarInput.value) avatarInput.value.value = ''
}

// Remove cover photo
const removeCover = () => {
  form.value.coverPhoto = ''
  coverPreview.value = ''
  if (coverInput.value) coverInput.value.value = ''
}

const startEditing = () => {
  syncFormWithUser()
  isEditing.value = true
  errorMessage.value = ''
  successMessage.value = ''
}

const cancelEditing = () => {
  isEditing.value = false
  errorMessage.value = ''
  syncFormWithUser()
}

const addInterest = () => {
  const tag = newInterest.value.trim()
  if (tag && !form.value.interests.includes(tag)) {
    form.value.interests.push(tag)
    newInterest.value = ''
  }
}

const removeInterest = (index: number) => {
  form.value.interests.splice(index, 1)
}

const addZone = () => {
  const zone = newZone.value.trim()
  if (zone && !form.value.activeZones.includes(zone)) {
    form.value.activeZones.push(zone)
    newZone.value = ''
  }
}

const removeZone = (index: number) => {
  form.value.activeZones.splice(index, 1)
}

const addLanguage = () => {
  const lang = newLanguage.value.trim()
  if (lang && !form.value.languages.includes(lang)) {
    form.value.languages.push(lang)
    newLanguage.value = ''
  }
}

const removeLanguage = (index: number) => {
  form.value.languages.splice(index, 1)
}

const saveProfile = async () => {
  if (!form.value.name.trim()) {
    errorMessage.value = 'Name is required'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.put('/auth/profile', {
      name: form.value.name.trim(),
      avatar: form.value.avatar,
      coverPhoto: form.value.coverPhoto,
      bio: form.value.bio.trim(),
      activeZones: form.value.activeZones,
      interests: form.value.interests,
      availabilityStatus: form.value.availabilityStatus,
      languages: form.value.languages,
    })

    if (data.success && data.user) {
      authStore.user = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
      successMessage.value = 'Profile updated successfully!'
      isEditing.value = false
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to update profile'
  } finally {
    isSaving.value = false
  }
}

const confirmLogout = () => {
  showLogoutDialog.value = true
}

const handleLogout = async () => {
  showLogoutDialog.value = false
  await authStore.logout()
  router.push('/login')
}

// Activities and Groups (will be fetched from API when implemented)
const activities = ref<{ id: number; title: string; date: string; status: string }[]>([])
const groups = ref<{ id: number; name: string; members: number; role: string }[]>([])
</script>

<template>
  <div class="min-h-screen bg-slate-950 relative overflow-hidden">
    <!-- Animated Background -->
    <div class="fixed inset-0 pointer-events-none">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="grid-pattern"></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <RouterLink to="/dashboard" class="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
          <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span class="font-medium">Dashboard</span>
        </RouterLink>
        <RouterLink to="/" class="text-2xl font-bold gradient-text">QuickIn</RouterLink>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 max-w-6xl mx-auto px-6 py-8">
      <div :class="['', isLoaded ? 'animate-slide-up' : 'opacity-0']">
        
        <!-- Cover Photo & Avatar Section -->
        <div class="relative mb-8">
          <!-- Cover Photo -->
          <div class="h-48 md:h-64 rounded-3xl overflow-hidden bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 relative">
            <img v-if="user?.coverPhoto" :src="user.coverPhoto" alt="Cover" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
          </div>

          <!-- Avatar & Quick Info -->
          <div class="absolute -bottom-16 left-8 flex items-end gap-6">
            <!-- Avatar -->
            <div class="relative">
              <div class="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 p-1 shadow-2xl shadow-primary-500/20">
                <div class="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
                  <img v-if="user?.avatar" :src="user.avatar" :alt="user?.name" class="w-full h-full object-cover" />
                  <span v-else class="gradient-text">{{ initials }}</span>
                </div>
              </div>
              <!-- Verification Badge -->
              <div v-if="user?.isEmailVerified" class="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center border-4 border-slate-950 shadow-lg">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <!-- Availability Indicator -->
              <div :class="['absolute -top-1 -right-1 w-5 h-5 rounded-full border-3 border-slate-950', 
                user?.availabilityStatus === 'open' ? 'bg-emerald-500' : 
                user?.availabilityStatus === 'busy' ? 'bg-amber-500' : 'bg-gray-500']">
              </div>
            </div>
          </div>

          <!-- Action Buttons (Desktop) -->
          <div class="absolute bottom-4 right-8 flex gap-3">
            <button
              v-if="!isEditing"
              @click="startEditing"
              class="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
            <button
              @click="confirmLogout"
              class="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        <!-- Name & Bio Section -->
        <div class="mt-20 mb-8 pl-8">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-3xl font-bold text-white">{{ user?.name }}</h1>
            <span v-if="user?.isVerifiedStudent" class="px-3 py-1 bg-primary-500/20 text-primary-400 text-sm font-medium rounded-full flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Verified Student
            </span>
          </div>
          <p class="text-gray-400 text-lg mb-4">{{ user?.email }}</p>
          <p v-if="user?.bio" class="text-gray-300 max-w-2xl">{{ user.bio }}</p>
          <p v-else class="text-gray-500 italic">No bio yet</p>
        </div>

        <!-- Messages -->
        <Transition name="slide-down">
          <div v-if="successMessage" class="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="font-medium">{{ successMessage }}</span>
          </div>
        </Transition>

        <Transition name="slide-down">
          <div v-if="errorMessage" class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span class="font-medium">{{ errorMessage }}</span>
          </div>
        </Transition>

        <!-- Edit Form Modal -->
        <Transition name="slide-down">
          <div v-if="isEditing" class="mb-8">
            <div class="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                Edit Profile
              </h3>
              
              <!-- Image Upload Section -->
              <div class="grid md:grid-cols-2 gap-6 mb-6">
                <!-- Avatar Upload -->
                <div class="space-y-3">
                  <label class="block text-sm font-medium text-gray-400">Profile Picture</label>
                  <div class="flex items-center gap-4">
                    <div class="relative">
                      <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 p-0.5">
                        <div class="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                          <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar" class="w-full h-full object-cover" />
                          <span v-else class="text-2xl font-bold gradient-text">{{ initials }}</span>
                        </div>
                      </div>
                      <button v-if="avatarPreview" @click="removeAvatar" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm hover:bg-red-600 transition-colors">
                        ×
                      </button>
                    </div>
                    <div class="flex-1">
                      <input ref="avatarInput" type="file" accept="image/*" @change="handleAvatarUpload" class="hidden" />
                      <button @click="avatarInput?.click()" class="px-4 py-2 bg-primary-500/20 text-primary-400 rounded-xl hover:bg-primary-500/30 transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload Photo
                      </button>
                      <p class="text-xs text-gray-500 mt-2">Max 2MB • JPG, PNG, GIF</p>
                    </div>
                  </div>
                </div>

                <!-- Cover Photo Upload -->
                <div class="space-y-3">
                  <label class="block text-sm font-medium text-gray-400">Cover Photo</label>
                  <div class="relative">
                    <div class="h-24 rounded-xl overflow-hidden bg-gradient-to-r from-primary-600 to-secondary-500">
                      <img v-if="coverPreview" :src="coverPreview" alt="Cover" class="w-full h-full object-cover" />
                    </div>
                    <button v-if="coverPreview" @click="removeCover" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm hover:bg-red-600 transition-colors">
                      ×
                    </button>
                  </div>
                  <input ref="coverInput" type="file" accept="image/*" @change="handleCoverUpload" class="hidden" />
                  <button @click="coverInput?.click()" class="w-full px-4 py-2 bg-secondary-500/20 text-secondary-400 rounded-xl hover:bg-secondary-500/30 transition-colors flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Cover
                  </button>
                  <p class="text-xs text-gray-500 text-center">Max 5MB • JPG, PNG</p>
                </div>
              </div>

              <div class="grid md:grid-cols-2 gap-6">
                <!-- Left Column -->
                <div class="space-y-5">
                  <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                    <input v-model="form.name" type="text" class="input-field" placeholder="Your name" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                    <textarea v-model="form.bio" rows="3" maxlength="200" class="input-field resize-none" placeholder="Tell others about yourself..."></textarea>
                    <p class="text-xs text-gray-500 mt-1">{{ form.bio.length }}/200</p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Availability</label>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in availabilityOptions"
                        :key="opt.value"
                        @click="form.availabilityStatus = opt.value as AvailabilityStatus"
                        :class="['px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2', 
                          form.availabilityStatus === opt.value 
                            ? 'bg-white/10 text-white border-2 border-primary-500' 
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10']"
                      >
                        <div :class="['w-2 h-2 rounded-full', opt.color]"></div>
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-5">
                  <!-- Interests -->
                  <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Interests</label>
                    <div class="flex gap-2 mb-2">
                      <input v-model="newInterest" @keyup.enter="addInterest" type="text" class="input-field flex-1" placeholder="Add interest (e.g., Football)" />
                      <button @click="addInterest" class="px-4 py-2 bg-primary-500/20 text-primary-400 rounded-xl hover:bg-primary-500/30 transition-colors">Add</button>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <span v-for="(interest, i) in form.interests" :key="i" class="tag-pill">
                        #{{ interest }}
                        <button @click="removeInterest(i)" class="ml-1 hover:text-red-400">×</button>
                      </span>
                    </div>
                  </div>

                  <!-- Active Zones -->
                  <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Active Zones</label>
                    <div class="flex gap-2 mb-2">
                      <input v-model="newZone" @keyup.enter="addZone" type="text" class="input-field flex-1" placeholder="Add zone (e.g., Downtown)" />
                      <button @click="addZone" class="px-4 py-2 bg-secondary-500/20 text-secondary-400 rounded-xl hover:bg-secondary-500/30 transition-colors">Add</button>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <span v-for="(zone, i) in form.activeZones" :key="i" class="px-3 py-1 bg-secondary-500/20 text-secondary-400 rounded-full text-sm flex items-center">
                        📍 {{ zone }}
                        <button @click="removeZone(i)" class="ml-1 hover:text-red-400">×</button>
                      </span>
                    </div>
                  </div>

                  <!-- Languages -->
                  <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Languages</label>
                    <div class="flex gap-2 mb-2">
                      <input v-model="newLanguage" @keyup.enter="addLanguage" type="text" class="input-field flex-1" placeholder="Add language (e.g., English)" />
                      <button @click="addLanguage" class="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-colors">Add</button>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <span v-for="(lang, i) in form.languages" :key="i" class="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm flex items-center">
                        🌐 {{ lang }}
                        <button @click="removeLanguage(i)" class="ml-1 hover:text-red-400">×</button>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="flex gap-4 mt-8 pt-6 border-t border-white/10">
                <button @click="cancelEditing" class="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors" :disabled="isSaving">
                  Cancel
                </button>
                <button @click="saveProfile" class="flex-1 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25" :disabled="isSaving">
                  <svg v-if="isSaving" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ isSaving ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Stats & Info Grid -->
        <div class="grid lg:grid-cols-3 gap-6 mb-8">
          <!-- Trust Score Card -->
          <div class="info-card">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                <span class="text-2xl">⭐</span>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Trust Score</p>
                <p class="text-3xl font-bold text-white">{{ user?.trustScore?.toFixed(1) || '5.0' }}</p>
              </div>
            </div>
            <div class="flex gap-1">
              <div v-for="i in 5" :key="i" :class="['w-8 h-2 rounded-full', i <= Math.round(user?.trustScore || 5) ? 'bg-amber-500' : 'bg-slate-700']"></div>
            </div>
          </div>

          <!-- Attendance Card -->
          <div class="info-card">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                <span class="text-2xl">📊</span>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Attendance Rate</p>
                <p class="text-3xl font-bold text-white">{{ user?.attendanceRate || 100 }}%</p>
              </div>
            </div>
            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all" :style="{ width: (user?.attendanceRate || 100) + '%' }"></div>
            </div>
          </div>

          <!-- Activities Card -->
          <div class="info-card">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center">
                <span class="text-2xl">🎯</span>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Total Activities</p>
                <p class="text-3xl font-bold text-white">{{ user?.totalActivities || 0 }}</p>
              </div>
            </div>
            <p class="text-gray-500 text-sm">Member since {{ memberSince }}</p>
          </div>
        </div>

        <!-- Badges Section -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-white mb-4">Badges & Achievements</h3>
          <div class="flex flex-wrap gap-3">
            <div v-if="!user?.badges?.length" class="text-gray-500">No badges yet. Participate in activities to earn badges!</div>
            <div v-for="badge in user?.badges" :key="badge" :class="['px-4 py-2 rounded-xl bg-gradient-to-r text-white font-medium flex items-center gap-2', badgeInfo[badge]?.color || 'from-gray-500 to-gray-600']">
              <span>{{ badgeInfo[badge]?.icon }}</span>
              {{ badgeInfo[badge]?.label }}
            </div>
            <!-- Show default badge for new users -->
            <div v-if="!user?.badges?.length" class="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-medium flex items-center gap-2 opacity-50">
              <span>🚀</span>
              Early Adopter (Coming Soon)
            </div>
          </div>
        </div>

        <!-- Interests & Zones Row -->
        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <!-- Interests -->
          <div class="info-card">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🏷️</span> Interests
            </h3>
            <div class="flex flex-wrap gap-2">
              <span v-if="!user?.interests?.length" class="text-gray-500">No interests added yet</span>
              <span v-for="interest in user?.interests" :key="interest" class="tag-pill">#{{ interest }}</span>
            </div>
          </div>

          <!-- Active Zones -->
          <div class="info-card">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📍</span> Active Zones
            </h3>
            <div class="flex flex-wrap gap-2">
              <span v-if="!user?.activeZones?.length" class="text-gray-500">No zones added yet</span>
              <span v-for="zone in user?.activeZones" :key="zone" class="px-3 py-1.5 bg-secondary-500/20 text-secondary-400 rounded-full text-sm">{{ zone }}</span>
            </div>
          </div>
        </div>

        <!-- Languages -->
        <div class="info-card mb-8">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🌐</span> Languages
          </h3>
          <div class="flex flex-wrap gap-2">
            <span v-if="!user?.languages?.length" class="text-gray-500">No languages added yet</span>
            <span v-for="lang in user?.languages" :key="lang" class="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-sm">{{ lang }}</span>
          </div>
        </div>

        <!-- Activity History & Groups (Tabs) -->
        <div class="mb-8">
          <div class="flex gap-4 mb-6 border-b border-white/10">
            <button 
              @click="activeTab = 'profile'" 
              :class="['px-4 py-3 font-medium transition-colors', activeTab === 'profile' ? 'text-white border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-300']"
            >
              Activity History
            </button>
            <button 
              @click="activeTab = 'activity'" 
              :class="['px-4 py-3 font-medium transition-colors', activeTab === 'activity' ? 'text-white border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-300']"
            >
              Groups
            </button>
          </div>

          <!-- Activity History Tab -->
          <div v-if="activeTab === 'profile'" class="grid gap-4">
            <div v-if="!activities.length" class="text-center py-16">
              <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                <span class="text-4xl">🎯</span>
              </div>
              <h4 class="text-lg font-semibold text-white mb-2">No Activities Yet</h4>
              <p class="text-gray-500 max-w-sm mx-auto">Join activities to build your reputation and connect with others!</p>
            </div>
            <div v-for="activity in activities" :key="activity.id" class="info-card flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <span class="text-xl">🎯</span>
                </div>
                <div>
                  <p class="text-white font-medium">{{ activity.title }}</p>
                  <p class="text-gray-500 text-sm">{{ activity.date }}</p>
                </div>
              </div>
              <span class="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full">{{ activity.status }}</span>
            </div>
          </div>

          <!-- Groups Tab -->
          <div v-if="activeTab === 'activity'" class="grid md:grid-cols-2 gap-4">
            <div v-if="!groups.length" class="text-center py-16 md:col-span-2">
              <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-secondary-500/10 flex items-center justify-center">
                <span class="text-4xl">👥</span>
              </div>
              <h4 class="text-lg font-semibold text-white mb-2">No Groups Yet</h4>
              <p class="text-gray-500 max-w-sm mx-auto">Create or join a group to collaborate with others on projects and activities!</p>
            </div>
            <div v-for="group in groups" :key="group.id" class="info-card">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center text-2xl">
                  👥
                </div>
                <div class="flex-1">
                  <p class="text-white font-semibold">{{ group.name }}</p>
                  <p class="text-gray-500 text-sm">{{ group.members }} members</p>
                </div>
                <span :class="['px-3 py-1 text-sm rounded-full', group.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-primary-500/20 text-primary-400']">
                  {{ group.role }}
                </span>
              </div>
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
  </div>
</template>

<style scoped>
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  animation: float-orb 25s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--color-primary-500), transparent 70%);
  top: -200px;
  right: -100px;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--color-secondary-500), transparent 70%);
  bottom: 200px;
  left: -100px;
  animation-delay: -12s;
}

@keyframes float-orb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px);
  background-size: 60px 60px;
}

.info-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s ease;
}

.info-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(15, 23, 42, 0.8);
}

.input-field {
  width: 100%;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 15px;
  transition: all 0.3s ease;
}

.input-field::placeholder {
  color: #64748b;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15);
}

.tag-pill {
  padding: 6px 12px;
  background: rgba(14, 165, 233, 0.15);
  color: var(--color-primary-400);
  border-radius: 9999px;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out forwards;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
