<script setup lang="ts">
// Placeholder for widgets
const trendingTopics = [
  '#TechCollaboration',
  '#RemoteWork',
  '#ProjectManagement',
  '#DesignSystems'
]


</script>

<template>
  <aside class="space-y-6">
    <!-- Trending Topics -->
    <div class="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
      <h3 class="text-sm font-bold text-white mb-4">Trending for you</h3>
      <ul class="space-y-3">
        <li v-for="topic in trendingTopics" :key="topic" class="text-sm">
          <a href="#" class="text-gray-400 hover:text-primary-400 transition-colors block py-1">
            {{ topic }}
          </a>
        </li>
      </ul>
    </div>

  </aside>
</template>
