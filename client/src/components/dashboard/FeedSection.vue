<script setup lang="ts">
import { ref } from 'vue'
// Placeholder for feed logic
const posts = ref([])
</script>

<template>
  <div class="space-y-6">


    <!-- Feed -->
    <div class="space-y-4">
      <div v-if="posts.length > 0" class="space-y-4">
        <article v-for="post in posts" :key="post.id" class="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-slate-700"></div>
            <div>
              <h4 class="font-semibold text-white">{{ post.author }}</h4>
              <p class="text-xs text-gray-400">{{ post.time }}</p>
            </div>
          </div>
          <p class="text-gray-300 mb-4">{{ post.content }}</p>
          
          <!-- Actions -->
          <div class="flex gap-4 text-gray-400 text-sm">
            <button class="flex items-center gap-2 hover:text-primary-400 transition-colors">
              <span>❤️</span> Like
            </button>
            <button class="flex items-center gap-2 hover:text-primary-400 transition-colors">
              <span>💬</span> Comment
            </button>
            <button class="flex items-center gap-2 hover:text-primary-400 transition-colors">
              <span>↗️</span> Share
            </button>
          </div>
        </article>
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
  </div>
</template>
