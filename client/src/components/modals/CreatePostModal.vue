<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  show: boolean
  isCreating?: boolean
}>()

const emit = defineEmits(['close', 'post'])

const content = ref('')
const imageInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const docInput = ref<HTMLInputElement | null>(null)

const selectedFile = ref<File | null>(null)

const triggerFileSelect = (type: 'image' | 'video' | 'doc') => {
  if (type === 'image') imageInput.value?.click()
  else if (type === 'video') videoInput.value?.click()
  else if (type === 'doc') docInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0]
  }
}

const handlePost = () => {
  if (!content.value.trim() && !selectedFile.value) return
  
  emit('post', {
    content: content.value,
    file: selectedFile.value
  })
}
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
        class="relative w-full max-w-5xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl transform transition-all"
        role="dialog"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-white/10">
          <h3 class="text-xl font-bold text-white">Create Post</h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg cursor-pointer">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <div class="flex gap-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex-shrink-0"></div>
            <div class="flex-1">
              <textarea 
                v-model="content"
                placeholder="What do you want to talk about?"
                class="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 resize-none h-80 text-lg leading-relaxed p-0"
                autoFocus
              ></textarea>
              
              <!-- File Preview -->
              <div v-if="selectedFile" class="mt-4 p-3 bg-slate-800 rounded-lg flex items-center justify-between group">
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="w-10 h-10 rounded bg-slate-700 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs uppercase">
                    {{ selectedFile.name.split('.').pop() }}
                  </div>
                  <div class="truncate">
                    <p class="text-sm font-medium text-white truncate">{{ selectedFile.name }}</p>
                    <p class="text-xs text-gray-400">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                  </div>
                </div>
                <button @click="selectedFile = null" class="text-gray-400 hover:text-red-400 p-1">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Hidden Inputs -->
        <input type="file" ref="imageInput" accept="image/*" class="hidden" @change="handleFileChange">
        <input type="file" ref="videoInput" accept="video/*" class="hidden" @change="handleFileChange">
        <input type="file" ref="docInput" accept=".pdf,.doc,.docx,.txt" class="hidden" @change="handleFileChange">

        <!-- Footer -->
        <div class="flex items-center justify-between p-6 border-t border-white/10 bg-white/5 rounded-b-2xl">
          <div class="flex gap-2">
            <button @click="triggerFileSelect('image')" class="p-2.5 text-primary-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer" title="Add Image">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button @click="triggerFileSelect('video')" class="p-2.5 text-primary-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer" title="Add Video">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button @click="triggerFileSelect('doc')" class="p-2.5 text-primary-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer" title="Add Document">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>

          <button 
            @click="handlePost"
            :disabled="(!content.trim() && !selectedFile) || isCreating"
            class="px-8 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-full transition-all text-base shadow-lg shadow-primary-500/20 cursor-pointer flex items-center gap-2"
          >
            <svg v-if="isCreating" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ isCreating ? 'Posting...' : 'Post' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
