<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  activity: any
  isSending?: boolean
}>()

const emit = defineEmits(['close', 'send'])

const message = ref('')

const handleSend = () => {
  emit('send', message.value.trim() || undefined)
  message.value = ''
}

const handleClose = () => {
  message.value = ''
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click="handleClose"
      >
        <div
          @click.stop
          class="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-white/10">
            <h2 class="text-xl font-bold text-white">Request to Join</h2>
            <p class="text-sm text-primary-400 mt-1 font-medium">{{ activity?.title }}</p>
          </div>

          <!-- Body -->
          <div class="p-6">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-3">
                Message <span class="text-gray-500 font-normal">(Optional)</span>
              </label>
              <textarea
                v-model="message"
                rows="4"
                maxlength="200"
                placeholder="Tell the creator why you'd like to join..."
                class="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
              />
              <p class="text-xs text-gray-500 mt-2">{{ message.length }}/200 characters</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-white/10 flex gap-3">
            <button
              @click="handleClose"
              :disabled="isSending"
              class="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              @click="handleSend"
              :disabled="isSending"
              class="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {{ isSending ? 'Sending...' : 'Send Request' }}
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
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>
