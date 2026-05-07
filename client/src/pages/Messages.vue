<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LeftSidebar from '@/components/dashboard/LeftSidebar.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LocationBlocker from '@/components/common/LocationBlocker.vue'
import chatService from '@/services/chatService'
import socketService from '@/services/socketService'
import joinRequestService from '@/services/joinRequestService'
import activityService from '@/services/activityService'
import api from '@/services/api'
import type { ActivityChat, ActivityChatMessage, JoinRequest } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const isLoaded = ref(false)
const showLogoutDialog = ref(false)
const chats = ref<ActivityChat[]>([])
const selectedChat = ref<ActivityChat | null>(null)
const messages = ref<ActivityChatMessage[]>([])
const isLoadingChats = ref(true)
const isLoadingMessages = ref(false)
const isSending = ref(false)
const newMessage = ref('')
const showChatMenu = ref(false)
const showParticipantsModal = ref(false)
const showUserProfileModal = ref(false)
const isLoadingUserProfile = ref(false)
const selectedUserProfile = ref<any | null>(null)
const isRecording = ref(false)
const recordingDuration = ref(0)
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordingTimer = ref<number | null>(null)
const isUploading = ref(false)
const showImageLightbox = ref(false)
const lightboxImageUrl = ref('')
const activeTab = ref<'chat' | 'management'>('chat')
const joinRequests = ref<JoinRequest[]>([])
const isLoadingRequests = ref(false)
const isProcessingRequest = ref(false)
const showDeleteConfirm = ref(false)
const isDeletingActivity = ref(false)
const isUpdatingStatus = ref(false)

const user = computed(() => authStore.user)

const isCreator = computed(() => {
  if (!selectedChat.value || !user.value) return false
  return selectedChat.value.activity.creator._id === user.value._id
})

const sortChats = () => {
  chats.value.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || a.updatedAt
    const bTime = b.lastMessage?.createdAt || b.updatedAt
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })
}

const fetchChats = async () => {
  try {
    isLoadingChats.value = true
    const { data } = await chatService.getMyActivityChats()

    if (data.success) {
      chats.value = data.chats
      sortChats()

      if (!selectedChat.value && chats.value.length > 0) {
        await selectChat(chats.value[0])
      }
    }
  } catch (error) {
    console.error('Failed to fetch chats:', error)
  } finally {
    isLoadingChats.value = false
  }
}

const fetchMessages = async (activityId: string) => {
  try {
    isLoadingMessages.value = true
    const { data } = await chatService.getActivityChatMessages(activityId, { limit: 100 })

    if (data.success) {
      messages.value = data.messages
    }
  } catch (error) {
    console.error('Failed to fetch messages:', error)
  } finally {
    isLoadingMessages.value = false
  }
}

const selectChat = async (chat: ActivityChat) => {
  selectedChat.value = chat
  showChatMenu.value = false
  messages.value = []
  activeTab.value = 'chat'
  await fetchMessages(chat.activity._id)
  socketService.emit('activity:chat:join', chat.activity._id)
  
  // Fetch join requests if creator
  if (chat.activity.creator._id === user.value?._id) {
    await fetchJoinRequests(chat.activity._id)
  }
}

const fetchJoinRequests = async (activityId: string) => {
  try {
    isLoadingRequests.value = true
    const { data } = await joinRequestService.getJoinRequests(activityId)
    if (data.success) {
      joinRequests.value = data.requests
    }
  } catch (error) {
    console.error('Failed to fetch join requests:', error)
  } finally {
    isLoadingRequests.value = false
  }
}

const handleAcceptRequest = async (requestId: string) => {
  if (!selectedChat.value) return
  
  try {
    isProcessingRequest.value = true
    const { data } = await joinRequestService.acceptJoinRequest(
      selectedChat.value.activity._id,
      requestId
    )
    
    if (data.success) {
      // Remove from requests list
      joinRequests.value = joinRequests.value.filter(r => r._id !== requestId)
      // Refresh chat to update participants
      await fetchChats()
    }
  } catch (error: any) {
    console.error('Failed to accept request:', error)
    alert(error.response?.data?.message || 'Failed to accept request')
  } finally {
    isProcessingRequest.value = false
  }
}

const handleRejectRequest = async (requestId: string) => {
  if (!selectedChat.value) return
  
  try {
    isProcessingRequest.value = true
    const { data } = await joinRequestService.rejectJoinRequest(
      selectedChat.value.activity._id,
      requestId
    )
    
    if (data.success) {
      // Remove from requests list
      joinRequests.value = joinRequests.value.filter(r => r._id !== requestId)
    }
  } catch (error: any) {
    console.error('Failed to reject request:', error)
    alert(error.response?.data?.message || 'Failed to reject request')
  } finally {
    isProcessingRequest.value = false
  }
}

const handleRemoveParticipant = async (participantId: string) => {
  if (!selectedChat.value) return
  if (!confirm('Are you sure you want to remove this participant?')) return
  
  try {
    const { data } = await joinRequestService.removeParticipant(
      selectedChat.value.activity._id,
      participantId
    )
    
    if (data.success) {
      // Refresh chat to update participants
      await fetchChats()
    }
  } catch (error: any) {
    console.error('Failed to remove participant:', error)
    alert(error.response?.data?.message || 'Failed to remove participant')
  }
}

const handleDeleteActivity = async () => {
  if (!selectedChat.value) return
  
  const deletedActivityId = selectedChat.value.activity._id
  
  try {
    isDeletingActivity.value = true
    const { data } = await activityService.deleteActivity(deletedActivityId)
    
    if (data.success) {
      showDeleteConfirm.value = false
      // Remove only the deleted activity from the list
      chats.value = chats.value.filter(c => c.activity._id !== deletedActivityId)
      selectedChat.value = null
      activeTab.value = 'chat'
      alert('Activity deleted successfully')
    }
  } catch (error: any) {
    console.error('Failed to delete activity:', error)
    alert(error.response?.data?.message || 'Failed to delete activity')
  } finally {
    isDeletingActivity.value = false
  }
}

const completeActivity = async () => {
  if (!selectedChat.value) return
  
  try {
    isUpdatingStatus.value = true
    const { data } = await activityService.updateActivityStatus(selectedChat.value.activity._id, 'completed')
    
    if (data.success) {
      selectedChat.value.activity.status = 'completed'
      await fetchChats()
      alert('Activity successfully marked as completed!')
    }
  } catch (error: any) {
    console.error('Failed to complete activity:', error)
    alert(error.response?.data?.message || 'Failed to complete activity')
  } finally {
    isUpdatingStatus.value = false
  }
}

const openParticipants = () => {
  showChatMenu.value = false
  showParticipantsModal.value = true
}

const openUserProfile = async (userId: string) => {
  try {
    isLoadingUserProfile.value = true
    showUserProfileModal.value = true
    const { data } = await api.get(`/auth/users/${userId}`)
    if (data.success) {
      selectedUserProfile.value = data.user
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    selectedUserProfile.value = null
  } finally {
    isLoadingUserProfile.value = false
  }
}

const getAvailabilityText = (status?: string) => {
  if (status === 'open') return 'Open to Activities'
  if (status === 'busy') return 'Busy'
  return 'Away'
}

const sendMessage = async () => {
  if (!selectedChat.value || !newMessage.value.trim() || isSending.value) return

  try {
    isSending.value = true
    await chatService.sendActivityChatMessage(selectedChat.value.activity._id, {
      content: newMessage.value.trim(),
      messageType: 'text',
    })
    newMessage.value = ''
  } catch (error: any) {
    console.error('Failed to send message:', error)
    alert(error.response?.data?.message || 'Failed to send message')
  } finally {
    isSending.value = false
  }
}

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    const audioChunks: Blob[] = []

    recorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
      
      await sendVoiceMessage(audioFile, recordingDuration.value)
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop())
    }

    recorder.start()
    mediaRecorder.value = recorder
    isRecording.value = true
    recordingDuration.value = 0

    // Start timer
    recordingTimer.value = window.setInterval(() => {
      recordingDuration.value++
    }, 1000)
  } catch (error) {
    console.error('Failed to start recording:', error)
    alert('Could not access microphone. Please check permissions.')
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
    
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }
  }
}

const cancelRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    isRecording.value = false
    mediaRecorder.value = undefined
    
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }
    recordingDuration.value = 0
  }
}

const sendVoiceMessage = async (file: File, duration: number) => {
  if (!selectedChat.value) return

  try {
    isUploading.value = true
    
    // Upload the file
    const { data: uploadData } = await chatService.uploadChatFile(file)
    
    if (uploadData.success) {
      // Send the message with file info
      await chatService.sendActivityChatMessage(selectedChat.value.activity._id, {
        messageType: 'voice',
        fileUrl: uploadData.fileUrl,
        fileName: uploadData.fileName,
        fileSize: uploadData.fileSize,
        duration,
      })
    }
  } catch (error: any) {
    console.error('Failed to send voice message:', error)
    alert(error.response?.data?.message || 'Failed to send voice message')
  } finally {
    isUploading.value = false
  }
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file || !selectedChat.value) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file')
    return
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('Image size must be less than 10MB')
    return
  }

  try {
    isUploading.value = true
    
    // Upload the file
    const { data: uploadData } = await chatService.uploadChatFile(file)
    
    if (uploadData.success) {
      // Send the message with file info
      await chatService.sendActivityChatMessage(selectedChat.value.activity._id, {
        messageType: 'image',
        fileUrl: uploadData.fileUrl,
        fileName: uploadData.fileName,
        fileSize: uploadData.fileSize,
      })
    }
  } catch (error: any) {
    console.error('Failed to send image:', error)
    alert(error.response?.data?.message || 'Failed to send image')
  } finally {
    isUploading.value = false
    // Reset input
    target.value = ''
  }
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const triggerImageUpload = () => {
  const input = document.getElementById('imageInput') as HTMLInputElement
  if (input) {
    input.click()
  }
}

const openImageLightbox = (imageUrl: string) => {
  lightboxImageUrl.value = imageUrl
  showImageLightbox.value = true
}

const closeImageLightbox = () => {
  showImageLightbox.value = false
  lightboxImageUrl.value = ''
}

const formatMessageTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatChatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return formatMessageTime(dateString)
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

const upsertChat = (incomingChat: ActivityChat) => {
  const index = chats.value.findIndex((chat) => chat._id === incomingChat._id)

  if (index === -1) {
    chats.value.unshift(incomingChat)
  } else {
    chats.value[index] = {
      ...chats.value[index],
      ...incomingChat,
    }
  }

  sortChats()
}

const removeChat = (chatId: string) => {
  chats.value = chats.value.filter((chat) => chat._id !== chatId)

  if (selectedChat.value?._id === chatId) {
    selectedChat.value = chats.value[0] || null
    if (selectedChat.value) {
      fetchMessages(selectedChat.value.activity._id)
    } else {
      messages.value = []
    }
  }
}

const handleIncomingMessage = (payload: {
  chatId: string
  activityId: string
  message: ActivityChatMessage
}) => {
  const targetChat = chats.value.find((chat) => chat._id === payload.chatId)
  if (targetChat) {
    targetChat.lastMessage = {
      sender: payload.message.sender._id,
      content: payload.message.content,
      createdAt: payload.message.createdAt,
    }
    targetChat.updatedAt = payload.message.createdAt
    sortChats()
  }

  if (selectedChat.value?._id === payload.chatId) {
    const alreadyExists = messages.value.some((message) => message._id === payload.message._id)
    if (!alreadyExists) {
      messages.value.push(payload.message)
    }
  }
}

const handleChatRenamed = (payload: { chatId: string; title: string }) => {
  const chat = chats.value.find((item) => item._id === payload.chatId)
  if (chat) {
    chat.title = payload.title
    chat.activity.title = payload.title
  }
}

const confirmLogout = () => {
  showLogoutDialog.value = true
}

const handleLogout = async () => {
  showLogoutDialog.value = false
  await authStore.logout()
  router.push('/')
}

onMounted(async () => {
  await authStore.checkAuth()
  setTimeout(() => {
    isLoaded.value = true
  }, 100)

  socketService.connect()
  await fetchChats()

  socketService.on('activity:chat:added', ({ chat }) => {
    if (chat) {
      upsertChat(chat)
    }
  })

  socketService.on('activity:chat:created', ({ chat }) => {
    if (chat) {
      upsertChat(chat)
    }
  })

  socketService.on('activity:chat:removed', ({ chatId }) => {
    removeChat(chatId)
  })

  socketService.on('activity:chat:deleted', ({ chatId }) => {
    removeChat(chatId)
  })

  socketService.on('activity:chat:renamed', handleChatRenamed)
  socketService.on('activity:message:new', handleIncomingMessage)

  // Join request events
  socketService.on('activity:join-request:accepted', ({ activityId }) => {
    if (selectedChat.value?.activity._id === activityId) {
      fetchJoinRequests(activityId)
      fetchChats()
    }
  })

  socketService.on('activity:join-request:rejected', ({ activityId }) => {
    if (selectedChat.value?.activity._id === activityId) {
      fetchJoinRequests(activityId)
    }
  })

  socketService.on('activity:join-request:updated', ({ activityId }) => {
    if (selectedChat.value?.activity._id === activityId) {
      fetchJoinRequests(activityId)
    }
  })

  socketService.on('activity:participant:joined', ({ activityId }) => {
    if (selectedChat.value?.activity._id === activityId) {
      fetchChats()
    }
  })

  socketService.on('activity:participant:left', ({ activityId }) => {
    if (selectedChat.value?.activity._id === activityId) {
      fetchChats()
    }
  })

  socketService.on('activity:join-request:sent', ({ activityId }) => {
    // Update activity list to show request sent
    if (selectedChat.value?.activity._id === activityId) {
      fetchChats()
    }
  })
})

onUnmounted(() => {
  socketService.off('activity:chat:added')
  socketService.off('activity:chat:created')
  socketService.off('activity:chat:removed')
  socketService.off('activity:chat:deleted')
  socketService.off('activity:chat:renamed')
  socketService.off('activity:message:new')
  socketService.off('activity:join-request:accepted')
  socketService.off('activity:join-request:rejected')
  socketService.off('activity:join-request:updated')
  socketService.off('activity:participant:joined')
  socketService.off('activity:participant:left')
  socketService.off('activity:join-request:sent')
})
</script>

<template>
  <LocationBlocker>
    <div class="min-h-screen bg-slate-950 relative">
      <div class="fixed inset-0 pointer-events-none overflow-hidden">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="grid-pattern"></div>
      </div>

      <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div :class="['', isLoaded ? 'animate-fade-in' : 'opacity-0']">
          <div class="mb-3">
            <h1 class="text-3xl font-bold text-white mb-1">Messages</h1>
            <p class="text-gray-400 text-sm">Activity group chats with participants</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div class="hidden lg:block lg:col-span-1">
              <div class="sticky top-24">
                <LeftSidebar @logout="confirmLogout" />
              </div>
            </div>

            <div class="lg:col-span-3">
              <div class="grid grid-cols-1 md:grid-cols-5 gap-4 h-[calc(100vh-7.5rem)]">
                <div class="md:col-span-1 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                  <div class="px-4 py-3 border-b border-white/10">
                    <h3 class="text-white font-semibold">Activity Chats</h3>
                  </div>

                  <div v-if="isLoadingChats" class="p-4 text-gray-400 text-sm">Loading chats...</div>

                  <div v-else-if="chats.length === 0" class="p-4 text-gray-400 text-sm">
                    No activity chats yet. Create or join an activity to start chatting.
                  </div>

                  <div v-else class="overflow-y-auto h-[calc(100%-3.2rem)]">
                    <button
                      v-for="chat in chats"
                      :key="chat._id"
                      @click="selectChat(chat)"
                      :class="[
                        'w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors',
                        selectedChat?._id === chat._id ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : ''
                      ]"
                    >
                      <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                          <p class="text-white text-sm font-semibold truncate">{{ chat.title }}</p>
                          <p class="text-gray-400 text-xs truncate mt-1">
                            {{ chat.lastMessage?.content || 'No messages yet' }}
                          </p>
                        </div>
                        <span class="text-[11px] text-gray-500">{{ formatChatTime(chat.lastMessage?.createdAt || chat.updatedAt) }}</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div class="md:col-span-4 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                  <template v-if="selectedChat">
                    <!-- Tabs for Creator (Top) -->
                    <div v-if="isCreator" class="px-4 pt-3 pb-0 flex gap-2">
                      <button
                        @click="activeTab = 'chat'"
                        :class="[
                          'flex-1 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors',
                          activeTab === 'chat'
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        ]"
                      >
                        💬 Group Chat
                      </button>
                      <button
                        @click="activeTab = 'management'"
                        :class="[
                          'flex-1 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative',
                          activeTab === 'management'
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        ]"
                      >
                        ⚙️ Activity Management
                        <span
                          v-if="joinRequests.length > 0"
                          class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                        >
                          {{ joinRequests.length }}
                        </span>
                      </button>
                    </div>

                    <!-- Header with Menu -->
                    <div class="px-4 py-3 border-b border-white/10">
                      <div class="flex items-center justify-between gap-4">
                        <div>
                          <h3 class="text-white font-semibold">{{ selectedChat.title }}</h3>
                          <p class="text-xs text-gray-400 mt-1">{{ selectedChat.participants.length }} participants</p>
                        </div>

                        <div class="relative">
                          <button
                            @click="showChatMenu = !showChatMenu"
                            class="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Chat options"
                          >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6h.01M12 12h.01M12 18h.01" />
                            </svg>
                          </button>

                          <div
                            v-if="showChatMenu"
                            class="absolute right-0 mt-2 w-44 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden"
                          >
                            <button
                              @click="openParticipants"
                              class="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                            >
                              View participants
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Chat Tab Content -->
                    <template v-if="activeTab === 'chat'">
                    <div class="flex-1 overflow-y-auto p-3 space-y-3">
                      <div v-if="isLoadingMessages" class="text-gray-400 text-sm">Loading messages...</div>

                      <div v-else-if="messages.length === 0" class="text-gray-400 text-sm">
                        No messages yet. Start the conversation.
                      </div>

                      <div
                        v-else
                        v-for="message in messages"
                        :key="message._id"
                        :class="[
                          'flex',
                          message.sender._id === user?._id ? 'justify-end' : 'justify-start'
                        ]"
                      >
                        <div class="flex items-center gap-2 max-w-[85%]" :class="message.sender._id === user?._id ? 'flex-row-reverse' : ''">
                          <button
                            @click="openUserProfile(message.sender._id)"
                            class="w-12 h-12 rounded-full overflow-hidden bg-slate-700 border border-white/10 flex-shrink-0 hover:ring-2 hover:ring-primary-500/60 transition-all"
                          >
                            <img
                              v-if="message.sender.avatar"
                              :src="message.sender.avatar"
                              :alt="message.sender.name"
                              class="w-full h-full object-cover"
                            />
                            <div v-else class="w-full h-full flex items-center justify-center text-white text-sm font-semibold bg-primary-500/20">
                              {{ message.sender.name.charAt(0).toUpperCase() }}
                            </div>
                          </button>

                          <div
                            :class="[
                              'rounded-2xl px-3 py-2',
                              message.sender._id === user?._id
                                ? 'bg-primary-500 text-white'
                                : 'bg-slate-800 text-gray-100 border border-white/10'
                            ]"
                          >
                            <p class="text-xs opacity-80 mb-1" v-if="message.sender._id !== user?._id">{{ message.sender.name }}</p>
                            
                            <!-- Text message -->
                            <p v-if="message.messageType === 'text'" class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
                            
                            <!-- Voice message -->
                            <div v-else-if="message.messageType === 'voice'" class="flex items-center gap-2 min-w-[200px]">
                              <audio 
                                :src="message.fileUrl" 
                                controls 
                                class="w-full max-w-xs"
                                style="height: 32px;"
                              ></audio>
                              <span class="text-xs opacity-70 whitespace-nowrap">
                                {{ message.duration ? formatDuration(message.duration) : '' }}
                              </span>
                            </div>
                            
                            <!-- Image message -->
                            <div v-else-if="message.messageType === 'image'" class="max-w-md">
                              <img 
                                :src="message.fileUrl" 
                                :alt="message.fileName || 'Image'"
                                class="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                @click="openImageLightbox(message.fileUrl)"
                              />
                            </div>
                            
                            <p class="text-[11px] opacity-70 mt-1">{{ formatMessageTime(message.createdAt) }}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="p-4 border-t border-white/10">
                      <div v-if="isRecording" class="flex items-center gap-3 mb-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <div class="flex items-center gap-2 flex-1">
                          <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span class="text-red-400 text-sm font-semibold">Recording...</span>
                          <span class="text-gray-400 text-sm">{{ formatDuration(recordingDuration) }}</span>
                        </div>
                        <button
                          @click="cancelRecording"
                          class="px-3 py-1 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          @click="stopRecording"
                          class="px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                          Send
                        </button>
                      </div>

                      <div v-if="isUploading" class="flex items-center gap-2 mb-2 p-3 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                        <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        <span class="text-primary-400 text-sm">Uploading...</span>
                      </div>

                      <div class="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          @change="handleImageUpload"
                          class="hidden"
                          ref="imageInput"
                          id="imageInput"
                        />
                        
                        <button
                          @click="triggerImageUpload"
                          :disabled="isRecording || isUploading || isSending"
                          class="p-2 bg-slate-800 text-gray-400 rounded-xl hover:bg-slate-700 hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Send image"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>

                        <button
                          @click="isRecording ? stopRecording() : startRecording()"
                          :disabled="isUploading || isSending"
                          :class="[
                            'p-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                            isRecording 
                              ? 'bg-red-500 text-white hover:bg-red-600' 
                              : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-primary-400'
                          ]"
                          :title="isRecording ? 'Stop recording' : 'Record voice note'"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>

                        <input
                          v-model="newMessage"
                          @keyup.enter="sendMessage"
                          type="text"
                          placeholder="Type a message..."
                          :disabled="isRecording || isUploading"
                          class="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                        />
                        <button
                          @click="sendMessage"
                          :disabled="isSending || isRecording || isUploading || !newMessage.trim()"
                          class="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {{ isSending ? 'Sending...' : 'Send' }}
                        </button>
                      </div>
                    </div>
                    </template>

                    <!-- Activity Management Tab Content -->
                    <template v-if="activeTab === 'management'">
                      <div class="flex-1 overflow-y-auto p-4">
                        <!-- Join Requests Section -->
                        <div class="mb-6">
                          <h4 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            📨 Join Requests
                            <span v-if="joinRequests.length > 0" class="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full">
                              {{ joinRequests.length }}
                            </span>
                          </h4>

                          <div v-if="isLoadingRequests" class="text-gray-400 text-sm">Loading requests...</div>

                          <div v-else-if="joinRequests.length === 0" class="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center text-gray-400 text-sm">
                            No pending join requests
                          </div>

                          <div v-else class="space-y-3">
                            <div
                              v-for="request in joinRequests"
                              :key="request._id"
                              class="bg-slate-800/50 border border-white/10 rounded-xl p-4"
                            >
                              <div class="flex items-start gap-3">
                                <button
                                  @click="openUserProfile(request.user._id)"
                                  class="w-12 h-12 rounded-full overflow-hidden bg-slate-700 border border-white/10 flex-shrink-0 hover:ring-2 hover:ring-primary-500/60 transition-all"
                                >
                                  <img
                                    v-if="request.user.avatar"
                                    :src="request.user.avatar"
                                    :alt="request.user.name"
                                    class="w-full h-full object-cover"
                                  />
                                  <div v-else class="w-full h-full flex items-center justify-center text-white text-sm font-semibold bg-primary-500/20">
                                    {{ request.user.name.charAt(0).toUpperCase() }}
                                  </div>
                                </button>

                                <div class="flex-1 min-w-0">
                                  <div class="flex items-start justify-between gap-2">
                                    <div>
                                      <button
                                        @click="openUserProfile(request.user._id)"
                                        class="font-semibold text-white hover:text-primary-400 transition-colors"
                                      >
                                        {{ request.user.name }}
                                      </button>
                                      <p class="text-xs text-gray-400">{{ request.user.email }}</p>
                                    </div>
                                    <span class="text-[11px] text-gray-500 whitespace-nowrap">
                                      {{ formatMessageTime(request.createdAt) }}
                                    </span>
                                  </div>

                                  <p v-if="request.message" class="text-sm text-gray-300 mt-2 bg-slate-700/50 rounded-lg p-2">
                                    "{{ request.message }}"
                                  </p>

                                  <div class="flex gap-2 mt-3">
                                    <button
                                      @click="handleAcceptRequest(request._id)"
                                      :disabled="isProcessingRequest"
                                      class="flex-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      ✓ Accept
                                    </button>
                                    <button
                                      @click="handleRejectRequest(request._id)"
                                      :disabled="isProcessingRequest"
                                      class="flex-1 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      ✗ Reject
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Current Participants Section -->
                        <div>
                          <h4 class="text-lg font-semibold text-white mb-3">
                            👥 Current Participants ({{ selectedChat?.participants.length }})
                          </h4>

                          <div class="space-y-2">
                            <div
                              v-for="participant in selectedChat?.participants"
                              :key="participant._id"
                              class="bg-slate-800/50 border border-white/10 rounded-xl p-3 flex items-center gap-3"
                            >
                              <button
                                @click="openUserProfile(participant._id)"
                                class="w-10 h-10 rounded-full overflow-hidden bg-slate-700 border border-white/10 flex-shrink-0 hover:ring-2 hover:ring-primary-500/60 transition-all"
                              >
                                <img
                                  v-if="participant.avatar"
                                  :src="participant.avatar"
                                  :alt="participant.name"
                                  class="w-full h-full object-cover"
                                />
                                <div v-else class="w-full h-full flex items-center justify-center text-white text-sm font-semibold bg-primary-500/20">
                                  {{ participant.name.charAt(0).toUpperCase() }}
                                </div>
                              </button>

                              <button
                                @click="openUserProfile(participant._id)"
                                class="flex-1 text-left"
                              >
                                <p class="font-semibold text-white hover:text-primary-400 transition-colors">
                                  {{ participant.name }}
                                  <span v-if="participant._id === selectedChat?.activity.creator._id" class="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full ml-2">
                                    Creator
                                  </span>
                                </p>
                                <p class="text-xs text-gray-400">{{ participant.email }}</p>
                              </button>

                              <button
                                v-if="participant._id !== selectedChat?.activity.creator._id"
                                @click="handleRemoveParticipant(participant._id)"
                                class="px-3 py-1.5 bg-red-500/10 text-red-400 text-sm rounded-lg hover:bg-red-500/20 border border-red-500/30 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>

                        <!-- Delete Activity Section -->
                        <div class="mt-6 pt-6 border-t border-white/10 space-y-3">
                          <button
                            v-if="selectedChat?.activity.status !== 'completed'"
                            @click="completeActivity"
                            :disabled="isUpdatingStatus"
                            class="w-full px-4 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ✅ Mark as Completed
                          </button>
                          <button
                            @click="showDeleteConfirm = true"
                            class="w-full px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors font-medium text-sm"
                          >
                            🗑️ Delete Activity
                          </button>
                        </div>
                      </div>
                    </template>
                  </template>

                  <div v-else class="flex-1 flex items-center justify-center text-gray-400 text-sm p-6 text-center">
                    Select an activity chat to start messaging.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <div
        v-if="showParticipantsModal && selectedChat"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showParticipantsModal = false"
      >
        <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>

        <div class="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 class="text-white font-semibold">Participants</h3>
            <button
              @click="showParticipantsModal = false"
              class="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="max-h-96 overflow-y-auto p-4 space-y-2">
            <div
              v-for="participant in selectedChat.participants"
              :key="participant._id"
              @click="openUserProfile(participant._id)"
              class="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-white/5 hover:bg-slate-700/70 transition-colors cursor-pointer"
            >
              <img
                v-if="participant.avatar"
                :src="participant.avatar"
                :alt="participant.name"
                class="w-9 h-9 rounded-full object-cover"
              />
              <div
                v-else
                class="w-9 h-9 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-300 flex items-center justify-center text-sm font-semibold"
              >
                {{ participant.name.charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ participant.name }}</p>
                <p class="text-gray-400 text-xs truncate">{{ participant.email }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="showUserProfileModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showUserProfileModal = false"
      >
        <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>

        <div class="relative w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
            <h3 class="text-white font-semibold">Profile</h3>
            <button
              @click="showUserProfileModal = false"
              class="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div v-if="isLoadingUserProfile" class="p-8 text-center text-gray-400">Loading profile...</div>

          <div v-else-if="selectedUserProfile" class="p-6">
            <div class="h-44 rounded-2xl overflow-hidden bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 relative mb-6">
              <img
                v-if="selectedUserProfile.coverPhoto"
                :src="selectedUserProfile.coverPhoto"
                :alt="selectedUserProfile.name"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>
            </div>

            <div class="flex items-start gap-4 mb-6">
              <div class="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 flex-shrink-0">
                <img
                  v-if="selectedUserProfile.avatar"
                  :src="selectedUserProfile.avatar"
                  :alt="selectedUserProfile.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                  {{ selectedUserProfile.name?.charAt(0)?.toUpperCase() || '?' }}
                </div>
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-2xl font-bold text-white truncate">{{ selectedUserProfile.name }}</h2>
                  <span
                    v-if="selectedUserProfile.isVerifiedStudent"
                    class="px-2.5 py-1 rounded-full text-xs font-medium bg-primary-500/20 text-primary-300"
                  >
                    Verified Student
                  </span>
                </div>
                <p class="text-sm text-gray-400 mt-2">{{ getAvailabilityText(selectedUserProfile.availabilityStatus) }}</p>
                <p class="text-sm text-gray-300 mt-2">{{ selectedUserProfile.bio || 'No bio yet' }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div class="bg-slate-800/50 border border-white/10 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-1">Trust Score</p>
                <p class="text-white font-semibold">{{ selectedUserProfile.trustScore ?? 0 }}</p>
              </div>
              <div class="bg-slate-800/50 border border-white/10 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-1">Attendance Rate</p>
                <p class="text-white font-semibold">{{ selectedUserProfile.attendanceRate ?? 0 }}%</p>
              </div>
              <div class="bg-slate-800/50 border border-white/10 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-1">Total Activities</p>
                <p class="text-white font-semibold">{{ selectedUserProfile.totalActivities ?? 0 }}</p>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <p class="text-xs font-medium text-gray-400 mb-2">Interests</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="interest in selectedUserProfile.interests || []"
                    :key="interest"
                    class="px-2.5 py-1 rounded-full text-xs bg-primary-500/15 text-primary-300 border border-primary-500/25"
                  >
                    {{ interest }}
                  </span>
                  <p v-if="!selectedUserProfile.interests || selectedUserProfile.interests.length === 0" class="text-sm text-gray-500">No interests listed</p>
                </div>
              </div>

              <div>
                <p class="text-xs font-medium text-gray-400 mb-2">Active Zones</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="zone in selectedUserProfile.activeZones || []"
                    :key="zone"
                    class="px-2.5 py-1 rounded-full text-xs bg-secondary-500/15 text-secondary-300 border border-secondary-500/25"
                  >
                    {{ zone }}
                  </span>
                  <p v-if="!selectedUserProfile.activeZones || selectedUserProfile.activeZones.length === 0" class="text-sm text-gray-500">No active zones listed</p>
                </div>
              </div>

              <div>
                <p class="text-xs font-medium text-gray-400 mb-2">Languages</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="language in selectedUserProfile.languages || []"
                    :key="language"
                    class="px-2.5 py-1 rounded-full text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                  >
                    {{ language }}
                  </span>
                  <p v-if="!selectedUserProfile.languages || selectedUserProfile.languages.length === 0" class="text-sm text-gray-500">No languages listed</p>
                </div>
              </div>

              <div>
                <p class="text-xs font-medium text-gray-400 mb-2">Badges</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="badge in selectedUserProfile.badges || []"
                    :key="badge"
                    class="px-2.5 py-1 rounded-full text-xs bg-amber-500/15 text-amber-300 border border-amber-500/25"
                  >
                    {{ badge }}
                  </span>
                  <p v-if="!selectedUserProfile.badges || selectedUserProfile.badges.length === 0" class="text-sm text-gray-500">No badges yet</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="p-8 text-center text-gray-400">Unable to load profile.</div>
        </div>
      </div>

      <!-- Image Lightbox Modal -->
      <div
        v-if="showImageLightbox"
        @click="closeImageLightbox"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      >
        <button
          @click="closeImageLightbox"
          class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-colors z-10"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div class="max-w-[90vw] max-h-[90vh] overflow-auto" @click.stop>
          <img 
            :src="lightboxImageUrl" 
            alt="Full size image"
            class="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      </div>

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

      <ConfirmDialog
        :show="showDeleteConfirm"
        title="Delete Activity"
        message="Are you sure you want to delete this activity? This action cannot be undone. All participants will be removed and all messages will be deleted."
        confirm-text="Delete"
        cancel-text="Cancel"
        type="danger"
        :is-loading="isDeletingActivity"
        @confirm="handleDeleteActivity"
        @cancel="showDeleteConfirm = false"
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
  bottom: -150px;
  left: -150px;
  animation-delay: 5s;
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float-orb {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}
</style>
