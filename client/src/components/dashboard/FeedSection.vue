<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import postService, { type Post, type Comment, type Reaction } from '@/services/postService'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const posts = ref<Post[]>([])
const isLoading = ref(true)
const page = ref(1)
const hasMore = ref(false)
const isLoadingMore = ref(false)

// Comment state
const activeCommentPostId = ref<string | null>(null)
const commentInputs = ref<Record<string, string>>({})
const submittingComment = ref<string | null>(null)

// Reactions
const reactionTypes = [
  { type: 'like', icon: '👍', label: 'Like', class: 'text-blue-500' },
  { type: 'love', icon: '❤️', label: 'Love', class: 'text-red-500' },
  { type: 'haha', icon: '😂', label: 'Haha', class: 'text-yellow-500' },
  { type: 'wow', icon: '😮', label: 'Wow', class: 'text-yellow-500' },
  { type: 'sad', icon: '😢', label: 'Sad', class: 'text-yellow-500' },
  { type: 'angry', icon: '😡', label: 'Angry', class: 'text-orange-500' },
]

const fetchPosts = async (reset = false) => {
  try {
    if (reset) {
      isLoading.value = true
      page.value = 1
      posts.value = []
    } else {
      isLoadingMore.value = true
    }

    const { data } = await postService.getPosts(page.value)
    if (data.success) {
      if (reset) {
        posts.value = data.posts
      } else {
        posts.value.push(...data.posts)
      }
      hasMore.value = page.value < data.pagination.pages
    }
  } catch (error) {
    console.error('Failed to fetch posts:', error)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

const loadMore = () => {
  if (hasMore.value && !isLoadingMore.value) {
    page.value++
    fetchPosts()
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date)
}

// Reaction functionality
const getUserReaction = (post: Post) => {
  if (!authStore.user?._id) return null
  return post.reactions.find(r => r.user === authStore.user!._id)
}

const getReactionIcon = (type: string) => {
  return reactionTypes.find(r => r.type === type)?.icon || '👍'
}

const getReactionLabel = (type: string) => {
  return reactionTypes.find(r => r.type === type)?.label || 'Like'
}

const getReactionClass = (type: string) => {
  return reactionTypes.find(r => r.type === type)?.class || 'text-gray-400'
}

const handleReaction = async (post: Post, type: string = 'like') => {
  if (!authStore.user?._id) return

  // Optimistic update
  const userId = authStore.user!._id
  const existingReaction = getUserReaction(post)
  const originalReactions = [...post.reactions]

  if (existingReaction) {
    if (existingReaction.type === type) {
      // Toggle off
      post.reactions = post.reactions.filter(r => r.user !== userId)
    } else {
      // Change type
      existingReaction.type = type
    }
  } else {
    // Add new
    post.reactions.push({ user: userId, type })
  }

  try {
    const { data } = await postService.reactToPost(post._id, type)
    if (data.success) {
      post.reactions = data.reactions
    } else {
      // Revert
      post.reactions = originalReactions
    }
  } catch (error) {
    console.error('Failed to react:', error)
    post.reactions = originalReactions
  }
}

// Comment functionality
const toggleComments = (postId: string) => {
  if (activeCommentPostId.value === postId) {
    activeCommentPostId.value = null
  } else {
    activeCommentPostId.value = postId
  }
}

const handleComment = async (post: Post) => {
  const content = commentInputs.value[post._id]?.trim()
  if (!content) return

  try {
    submittingComment.value = post._id
    const { data } = await postService.addComment(post._id, content)
    
    if (data.success) {
      // Find post in reactive array to ensure update triggers view
      const targetPost = posts.value.find(p => p._id === post._id)
      if (targetPost) {
        targetPost.comments = data.comments
      } else {
         // Fallback if not found (shouldn't happen)
         post.comments = data.comments
      }
      // Clear input
      commentInputs.value[post._id] = ''
    }
  } catch (error) {
    console.error('Failed to add comment:', error)
  } finally {
    submittingComment.value = null
  }
}

// Share functionality
const copiedPostId = ref<string | null>(null)

const handleShare = async (post: Post) => {
  const url = `${window.location.origin}/post/${post._id}`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Post by ${post.user.name}`,
        text: post.content,
        url: url
      })
      return
    } catch (error) {
      // Fallback to clipboard if share fails or is cancelled
      console.log('Share skipped/failed, falling back to clipboard')
    }
  }

  // Fallback: Copy to clipboard
  try {
    await navigator.clipboard.writeText(url)
    // Show feedback on the button
    copiedPostId.value = post._id
    setTimeout(() => {
      copiedPostId.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy to clipboard', err)
  }
}

onMounted(() => {
  fetchPosts(true)
})

const showImageModal = ref(false)
const selectedImage = ref('')
const openImage = (url: string) => {
  selectedImage.value = url
  showImageModal.value = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    </div>

    <!-- Feed -->
    <div v-else class="space-y-4">
      <div v-if="posts.length > 0" class="space-y-4">
        <article v-for="post in posts" :key="post._id" class="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
          <div class="p-4 pb-2">
            <!-- Header -->
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-slate-700">
                 <img v-if="post.user.avatar" :src="post.user.avatar" :alt="post.user.name" class="w-full h-full object-cover" />
                 <div v-else class="w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-primary-500 to-secondary-500">
                    {{ post.user.name.charAt(0).toUpperCase() }}
                 </div>
              </div>
              <div>
                <h4 class="font-semibold text-white">{{ post.user.name }}</h4>
                <p class="text-xs text-gray-400">{{ formatDate(post.createdAt) }}</p>
              </div>
            </div>
            
            <!-- Content -->
            <p class="text-gray-200 mb-3 whitespace-pre-wrap leading-relaxed">{{ post.content }}</p>
          </div>
          
          <!-- Image -->
          <div v-if="post.image" class="w-full cursor-pointer bg-black/50" @click="openImage(post.image)">
            <img :src="post.image" alt="Post content" class="w-full h-auto max-h-[500px] object-contain mx-auto" />
          </div>

          <!-- Actions Bar -->
          <div class="px-4 py-3 border-t border-white/5 flex items-center justify-between relative">
            <!-- Like/Reaction Button Container -->
            <div class="relative group">
              <!-- Reaction Picker (Hover) -->
              <div class="absolute bottom-full left-0 mb-3 invisible group-hover:visible flex items-center gap-2 bg-slate-800 rounded-full p-2 shadow-2xl border border-white/20 transition-all transform origin-bottom-left scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 z-50">
                <button 
                  v-for="reaction in reactionTypes" 
                  :key="reaction.type"
                  @click.stop="handleReaction(post, reaction.type)"
                  class="text-2xl hover:scale-125 transition-transform cursor-pointer p-1"
                  :title="reaction.label"
                >
                  {{ reaction.icon }}
                </button>
              </div>

              <button 
                @click="handleReaction(post, getUserReaction(post)?.type || 'like')"
                :class="['flex items-center gap-2 transition-all px-3 py-2 rounded-full cursor-pointer group-active:scale-95', getUserReaction(post) ? 'bg-white/10 ' + getReactionClass(getUserReaction(post)!.type) : 'text-gray-400 hover:bg-white/5 hover:text-blue-400']"
              >
                <div class="flex items-center gap-2">
                    <span v-if="getUserReaction(post)" class="text-xl leading-none transform transition-transform group-hover:scale-110">{{ getReactionIcon(getUserReaction(post)!.type) }}</span>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span class="font-medium text-sm">{{ getUserReaction(post) ? getReactionLabel(getUserReaction(post)!.type) : 'Like' }}</span>
                </div>
                
                <span v-if="post.reactions.length > 0" class="pl-2 border-l border-white/20 text-xs font-semibold opacity-80">
                    {{ post.reactions.length }}
                </span>
              </button>
            </div>

            <button 
              @click="toggleComments(post._id)"
              :class="['flex items-center gap-2 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer', activeCommentPostId === post._id ? 'text-primary-400' : 'text-gray-400 hover:text-primary-400']"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span class="font-medium">Comment</span>
              <span v-if="post.comments.length > 0" class="ml-1 text-xs bg-slate-800 px-1.5 py-0.5 rounded-full text-gray-400">{{ post.comments.length }}</span>
            </button>

            <button 
              @click="handleShare(post)"
              :class="['flex items-center gap-2 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer', copiedPostId === post._id ? 'text-emerald-400' : 'text-gray-400 hover:text-blue-400']"
            >
              <svg v-if="copiedPostId === post._id" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span class="font-medium">{{ copiedPostId === post._id ? 'Copied!' : 'Share' }}</span>
            </button>
          </div>

          <!-- Comments Section -->
          <div v-if="activeCommentPostId === post._id" class="px-4 pb-4 bg-slate-900/40 border-t border-white/5">
            <!-- Comment List -->
            <div v-if="post.comments.length > 0" class="py-4 space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
              <div v-for="comment in post.comments" :key="comment._id" class="flex gap-3">
                <div class="w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                   <img v-if="comment.user.avatar" :src="comment.user.avatar" :alt="comment.user.name" class="w-full h-full object-cover" />
                   <div v-else class="w-full h-full flex items-center justify-center text-white text-xs font-bold bg-slate-600">
                      {{ comment.user.name.charAt(0).toUpperCase() }}
                   </div>
                </div>
                <div class="flex-1">
                  <div class="bg-white/5 rounded-2xl rounded-tl-none px-4 py-2">
                    <p class="text-sm font-semibold text-white">{{ comment.user.name }}</p>
                    <p class="text-sm text-gray-300">{{ comment.content }}</p>
                  </div>
                  <p class="text-[10px] text-gray-500 mt-1 ml-2">{{ formatDate(comment.createdAt) }}</p>
                </div>
              </div>
            </div>
            <div v-else class="py-6 text-center text-gray-500 text-sm">
              No comments yet. Be the first to start the conversation!
            </div>

            <!-- Add Comment Input -->
            <div class="flex items-center gap-3 pt-2">
              <div class="w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                 <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" :alt="authStore.user.name" class="w-full h-full object-cover" />
                 <div v-else class="w-full h-full flex items-center justify-center text-white text-xs font-bold bg-primary-600">
                    {{ authStore.user?.name?.charAt(0).toUpperCase() || '?' }}
                 </div>
              </div>
              <div class="flex-1 relative">
                <input 
                  v-model="commentInputs[post._id]"
                  @keyup.enter="handleComment(post)"
                  type="text" 
                  placeholder="Write a comment..." 
                  class="w-full bg-slate-950/50 border border-white/10 rounded-full py-2.5 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder-gray-500 transition-all"
                >
                <button 
                  @click="handleComment(post)"
                  :disabled="!commentInputs[post._id]?.trim() || submittingComment === post._id"
                  class="absolute right-1.5 top-1.5 p-1.5 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:bg-slate-700 transition-colors cursor-pointer"
                >
                  <svg v-if="submittingComment === post._id" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                     <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                     <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </article>
        
        <!-- Load More Button -->
        <div v-if="hasMore" class="flex justify-center pt-4">
          <button 
            @click="loadMore" 
            :disabled="isLoadingMore"
            class="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <svg v-if="isLoadingMore" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ isLoadingMore ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12 bg-slate-900/30 backdrop-blur-sm border border-white/5 rounded-2xl">
        <div class="w-20 h-20 mx-auto mb-6 rounded-3xl bg-slate-800/30 flex items-center justify-center transform rotate-3">
          <svg class="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">It's quiet here</h3>
        <p class="text-gray-400 max-w-sm mx-auto leading-relaxed">
          Your feed is empty. Be the first to share your thoughts or activities with your network!
        </p>
      </div>
    </div>
    
    <!-- Image Modal -->
    <div v-if="showImageModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" @click="showImageModal = false">
      <img :src="selectedImage" class="max-w-full max-h-full rounded-lg" />
      <button class="absolute top-4 right-4 text-white hover:text-gray-300 cursor-pointer" @click="showImageModal = false">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  </div>
</template>
