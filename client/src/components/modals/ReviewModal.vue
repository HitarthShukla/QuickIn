<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Activity, User } from '@/types'
import activityService from '@/services/activityService'

const props = defineProps<{
  activity: Activity
  currentUser: User
}>()

const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref('')
const success = ref('')

const reviewedUsers = ref<string[]>([])
const selectedUser = ref<User | null>(null)
const rating = ref(5)
const feedback = ref('')

// Compute users that can be reviewed
const reviewableUsers = computed(() => {
  const allUsers = [props.activity.creator, ...props.activity.participants]
  return allUsers.filter(u => u._id !== props.currentUser._id)
})

const fetchReviewedUsers = async () => {
  try {
    const { data } = await activityService.getMyReviewedUsers(props.activity._id)
    if (data.success) {
      reviewedUsers.value = data.reviewedUserIds
    }
  } catch (err: any) {
    console.error('Error fetching reviewed users:', err)
  }
}

const selectUser = (user: User) => {
  selectedUser.value = user
  rating.value = 5
  feedback.value = ''
  error.value = ''
  success.value = ''
}

const submitReview = async () => {
  if (!selectedUser.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    await activityService.submitReview(props.activity._id, {
      revieweeId: selectedUser.value._id,
      rating: rating.value,
      feedback: feedback.value
    })
    
    success.value = 'Review submitted successfully!'
    reviewedUsers.value.push(selectedUser.value._id)
    
    setTimeout(() => {
      selectedUser.value = null
      success.value = ''
    }, 1500)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to submit review'
  } finally {
    loading.value = false
  }
}

fetchReviewedUsers()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
    <div class="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white">Rate Participants</h2>
          <p class="text-sm text-gray-400 mt-1">Leave feedback for users in {{ activity.title }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Main Content -->
      <div class="p-6 overflow-y-auto flex-1">
        <template v-if="!selectedUser">
          <div v-if="reviewableUsers.length === 0" class="text-center py-8 text-gray-400">
            No other participants to review.
          </div>
          
          <div v-else class="space-y-3">
            <button
              v-for="user in reviewableUsers"
              :key="user._id"
              @click="!reviewedUsers.includes(user._id) && selectUser(user)"
              :class="[
                'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                reviewedUsers.includes(user._id)
                  ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                  : 'border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:border-primary-500/50'
              ]"
              :disabled="reviewedUsers.includes(user._id)"
            >
              <img v-if="user.avatar" :src="user.avatar" :alt="user.name" class="w-10 h-10 rounded-full object-cover" />
              <div v-else class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white truncate">{{ user.name }}</p>
              </div>
              <span v-if="reviewedUsers.includes(user._id)" class="text-xs text-green-400 font-medium">
                Reviewed
              </span>
              <span v-else class="text-xs text-primary-400 font-medium">
                Rate User
              </span>
            </button>
          </div>
        </template>

        <template v-else>
          <button @click="selectedUser = null" class="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            Back to users
          </button>
          
          <div class="text-center mb-6">
            <img v-if="selectedUser.avatar" :src="selectedUser.avatar" class="w-16 h-16 rounded-full mx-auto mb-2 object-cover" />
            <h3 class="text-lg font-bold text-white">{{ selectedUser.name }}</h3>
          </div>

          <div class="space-y-4">
            <!-- Rating -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2 text-center">Trust Score Rating</label>
              <div class="flex justify-center gap-2">
                <button
                  v-for="star in 5"
                  :key="star"
                  @click="rating = star"
                  class="p-1 transition-transform hover:scale-110"
                >
                  <svg
                    class="w-8 h-8"
                    :class="star <= rating ? 'text-amber-400' : 'text-slate-700'"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Feedback -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Feedback (Optional)</label>
              <textarea
                v-model="feedback"
                rows="3"
                class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="How was your experience?"
              ></textarea>
            </div>

            <!-- Alerts -->
            <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {{ error }}
            </div>
            <div v-if="success" class="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
              {{ success }}
            </div>

            <button
              @click="submitReview"
              :disabled="loading || !!success"
              class="w-full py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <span v-if="loading">Submitting...</span>
              <span v-else>Submit Review</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
