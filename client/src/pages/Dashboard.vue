<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LeftSidebar from '@/components/dashboard/LeftSidebar.vue'
import FeedSection from '@/components/dashboard/FeedSection.vue'
import RightSidebar from '@/components/dashboard/RightSidebar.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LocationBlocker from '@/components/common/LocationBlocker.vue'
import CreatePostModal from '@/components/modals/CreatePostModal.vue'
import postService from '@/services/postService'

const router = useRouter()
const authStore = useAuthStore()

const isLoaded = ref(false)
const showLogoutDialog = ref(false)
const showCreatePostModal = ref(false)
const viewMode = ref<'feed' | 'map'>('feed')
const feedKey = ref(0)
const isCreatingPost = ref(false)

// Data from API (empty by default)

const user = computed(() => authStore.user)

onMounted(async () => {
  await authStore.checkAuth()
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})

const confirmLogout = () => {
  showLogoutDialog.value = true
}

const handleLogout = async () => {
  showLogoutDialog.value = false
  await authStore.logout()
  router.push('/')
}

const compressImage = (file: File, maxWidth: number = 1024, maxHeight: number = 1024, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
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

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}

const handleCreatePost = async (payload: { content: string; file: File | null }) => {
  try {
    isCreatingPost.value = true
    let image = ''
    
    if (payload.file) {
      if (payload.file.type.startsWith('image/')) {
        image = await compressImage(payload.file)
      }
      // Handle other file types if needed
    }

    await postService.createPost({
      content: payload.content,
      image: image || undefined
    })

    // Refresh feed
    feedKey.value++
    showCreatePostModal.value = false
  } catch (error) {
    console.error('Failed to create post:', error)
    // Could add error handling/notification here
  } finally {
    isCreatingPost.value = false
  }
}

const initials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})



</script>

<template>
  <LocationBlocker>
  <div class="min-h-screen bg-slate-950 relative">
    <!-- Animated Background -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="grid-pattern"></div>
    </div>


    <!-- Main Content -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div :class="['', isLoaded ? 'animate-fade-in' : 'opacity-0']">
        


        <!-- 3-Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          
          <!-- Left Sidebar (Services) -->
          <div class="hidden lg:block lg:col-span-1">
            <div class="sticky top-24">
              <LeftSidebar @logout="confirmLogout" @create-post="showCreatePostModal = true" />
            </div>
          </div>

          <!-- Center Feed -->
          <div class="lg:col-span-2 xl:col-span-3">
            <FeedSection :key="feedKey" />
          </div>

          <!-- Right Sidebar (Widgets) -->
          <div class="hidden xl:block xl:col-span-1">
            <div class="sticky top-24">
              <RightSidebar />
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

    <!-- Create Post Modal -->
    <CreatePostModal
      :show="showCreatePostModal"
      :is-creating="isCreatingPost"
      @close="showCreatePostModal = false"
      @post="handleCreatePost"
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
  bottom: 100px;
  left: -50px;
  animation-delay: -12s;
}

@keyframes float-orb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -20px) scale(1.05); }
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px);
  background-size: 60px 60px;
}

.stat-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.widget-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.empty-state .empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state h4 {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: #64748b;
  max-width: 280px;
  margin: 0 auto 16px;
}

.empty-state .empty-action {
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
  color: white;
  border-radius: 12px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
}

.empty-state .empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3);
}

.empty-state-sm {
  text-align: center;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
