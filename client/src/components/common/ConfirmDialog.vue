<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  show: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const typeColors = computed(() => {
  switch (props.type) {
    case 'danger':
      return {
        icon: 'bg-red-500/20 text-red-400',
        button: 'bg-red-600 hover:bg-red-700',
      }
    case 'warning':
      return {
        icon: 'bg-amber-500/20 text-amber-400',
        button: 'bg-amber-600 hover:bg-amber-700',
      }
    default:
      return {
        icon: 'bg-primary-500/20 text-primary-400',
        button: 'bg-primary-600 hover:bg-primary-700',
      }
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('cancel')"></div>
        
        <!-- Dialog -->
        <div class="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div :class="['w-16 h-16 rounded-full flex items-center justify-center', typeColors.icon]">
              <svg v-if="type === 'danger'" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <svg v-else-if="type === 'warning'" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <svg v-else class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <!-- Title -->
          <h3 class="text-xl font-bold text-white text-center mb-2">
            {{ title || 'Confirm Action' }}
          </h3>

          <!-- Message -->
          <p class="text-gray-400 text-center mb-6">{{ message }}</p>

          <!-- Buttons -->
          <div class="flex gap-3">
            <button
              @click="emit('cancel')"
              class="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors cursor-pointer"
            >
              {{ cancelText || 'Cancel' }}
            </button>
            <button
              @click="emit('confirm')"
              :class="['flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors cursor-pointer', typeColors.button]"
            >
              {{ confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95) translateY(10px);
}
</style>
