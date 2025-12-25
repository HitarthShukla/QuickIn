<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isLoaded = ref(false)

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div class="min-h-screen overflow-hidden relative">
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden">
      <!-- Gradient Orbs -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      
      <!-- Grid Pattern -->
      <div class="grid-pattern"></div>
      
      <!-- Floating Particles -->
      <div class="particles">
        <div v-for="n in 20" :key="n" class="particle" :style="{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${5 + Math.random() * 10}s`
        }"></div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 flex flex-col min-h-screen">
      <!-- Navigation -->
      <nav class="p-6">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <div class="text-2xl font-bold gradient-text">QuickIn</div>
          <div class="flex gap-4">
            <template v-if="authStore.isAuthenticated">
              <RouterLink to="/dashboard" class="btn-secondary text-sm px-4 py-2">
                Dashboard
              </RouterLink>
            </template>
            <template v-else>
              <RouterLink to="/login" class="text-gray-300 hover:text-white transition-colors px-4 py-2">
                Sign In
              </RouterLink>
              <RouterLink to="/register" class="btn-primary text-sm px-4 py-2">
                Get Started
              </RouterLink>
            </template>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <div class="flex-1 flex items-center justify-center px-4 py-8">
        <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left Content -->
          <div :class="['space-y-8 text-center lg:text-left', isLoaded ? 'animate-slide-in-left' : 'opacity-0']">
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Real-time collaboration platform
            </div>

            <!-- Main Heading -->
            <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span class="text-white">Connect &</span>
              <br />
              <span class="gradient-text-animated">Collaborate</span>
              <br />
              <span class="text-white">in Real-time</span>
            </h1>

            <!-- Description -->
            <p class="text-xl text-gray-400 max-w-lg mx-auto lg:mx-0">
              Experience seamless communication with instant messaging, group activities, and live updates. 
              Join thousands of teams already using QuickIn.
            </p>

            <!-- Stats -->
            <div class="flex flex-wrap gap-8 justify-center lg:justify-start">
              <div class="text-center">
                <div class="text-3xl font-bold text-white counter" data-target="10000">10K+</div>
                <div class="text-sm text-gray-500">Active Users</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-white">99.9%</div>
                <div class="text-sm text-gray-500">Uptime</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-white">50ms</div>
                <div class="text-sm text-gray-500">Latency</div>
              </div>
            </div>

            <!-- CTA Buttons -->
            <div class="flex flex-wrap gap-4 justify-center lg:justify-start">
              <RouterLink to="/register" class="btn-primary-3d group">
                <span>Start Free Trial</span>
                <svg class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </RouterLink>
              <button class="btn-secondary-3d group">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span>Watch Demo</span>
              </button>
            </div>
          </div>

          <!-- Right Content - 3D Visual & Cards -->
          <div :class="['relative perspective-1000', isLoaded ? 'animate-slide-in-right' : 'opacity-0']">
            <!-- 3D Animated Sphere -->
            <div class="relative z-10 flex justify-center items-center">
              <div class="sphere-container">
                <!-- Outer Glow Ring -->
                <div class="glow-ring"></div>
                
                <!-- Main Sphere -->
                <div class="sphere-3d">
                  <!-- Rotating Rings -->
                  <div class="orbit orbit-1">
                    <div class="orbit-dot"></div>
                  </div>
                  <div class="orbit orbit-2">
                    <div class="orbit-dot"></div>
                  </div>
                  <div class="orbit orbit-3">
                    <div class="orbit-dot"></div>
                  </div>
                  
                  <!-- Inner Core -->
                  <div class="sphere-core">
                    <div class="core-inner"></div>
                  </div>
                  
                  <!-- Connection Lines -->
                  <svg class="connection-lines" viewBox="0 0 200 200">
                    <line x1="50" y1="100" x2="150" y2="100" class="conn-line" />
                    <line x1="100" y1="50" x2="100" y2="150" class="conn-line" />
                    <line x1="65" y1="65" x2="135" y2="135" class="conn-line" />
                    <line x1="135" y1="65" x2="65" y2="135" class="conn-line" />
                    <circle cx="50" cy="100" r="6" class="conn-node" />
                    <circle cx="150" cy="100" r="6" class="conn-node" />
                    <circle cx="100" cy="50" r="6" class="conn-node" />
                    <circle cx="100" cy="150" r="6" class="conn-node" />
                    <circle cx="65" cy="65" r="4" class="conn-node-sm" />
                    <circle cx="135" cy="65" r="4" class="conn-node-sm" />
                    <circle cx="65" cy="135" r="4" class="conn-node-sm" />
                    <circle cx="135" cy="135" r="4" class="conn-node-sm" />
                  </svg>
                </div>
                
                <!-- Floating Icons -->
                <div class="floating-icon icon-chat">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div class="floating-icon icon-users">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div class="floating-icon icon-bolt">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Floating 3D Cards -->
            <div class="absolute top-10 -left-8 floating-card-1">
              <div class="glass-card-3d p-4 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div class="text-white font-medium text-sm">Message Sent!</div>
                  <div class="text-gray-400 text-xs">Just now</div>
                </div>
              </div>
            </div>

            <div class="absolute top-1/2 -right-4 floating-card-2">
              <div class="glass-card-3d p-4">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500"></div>
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 -ml-3"></div>
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 -ml-3"></div>
                  <span class="text-white text-sm ml-1">+24</span>
                </div>
                <div class="text-gray-400 text-xs">Team Members Online</div>
              </div>
            </div>

            <div class="absolute bottom-20 -left-4 floating-card-3">
              <div class="glass-card-3d p-4 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div class="text-white font-medium text-sm">Live Activity</div>
                  <div class="text-green-400 text-xs flex items-center gap-1">
                    <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    Active Now
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="py-20 px-4">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to <span class="gradient-text">collaborate</span>
            </h2>
            <p class="text-gray-400 max-w-2xl mx-auto">
              Powerful features designed to help teams work together seamlessly
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <!-- Feature 1 -->
            <div class="feature-card-3d group">
              <div class="feature-icon bg-gradient-to-br from-blue-500 to-cyan-400">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                Real-time Chat
              </h3>
              <p class="text-gray-400">
                Instant messaging with typing indicators, read receipts, and rich media support.
              </p>
              <div class="feature-shine"></div>
            </div>

            <!-- Feature 2 -->
            <div class="feature-card-3d group">
              <div class="feature-icon bg-gradient-to-br from-purple-500 to-pink-400">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-white mb-2 group-hover:text-secondary-400 transition-colors">
                Group Activities
              </h3>
              <p class="text-gray-400">
                Create and join groups for collaborative projects, events, and team building.
              </p>
              <div class="feature-shine"></div>
            </div>

            <!-- Feature 3 -->
            <div class="feature-card-3d group">
              <div class="feature-icon bg-gradient-to-br from-emerald-500 to-teal-400">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                Live Updates
              </h3>
              <p class="text-gray-400">
                Stay connected with real-time notifications and activity feeds across all devices.
              </p>
              <div class="feature-shine"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="py-8 text-center text-gray-500 text-sm border-t border-white/5">
        <p>&copy; 2024 QuickIn. Built with ❤️ for seamless collaboration.</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Perspective for 3D effects */
.perspective-1000 {
  perspective: 1000px;
}

/* Animated Gradient Text */
.gradient-text-animated {
  background: linear-gradient(
    90deg,
    var(--color-primary-400),
    var(--color-secondary-400),
    var(--color-primary-400),
    var(--color-secondary-400)
  );
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradient-shift 4s ease infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Gradient Orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float-orb 20s ease-in-out infinite;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--color-primary-500), transparent 70%);
  top: -200px;
  right: -200px;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--color-secondary-500), transparent 70%);
  bottom: -150px;
  left: -150px;
  animation-delay: -10s;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #10b981, transparent 70%);
  top: 50%;
  left: 30%;
  animation-delay: -5s;
}

@keyframes float-orb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(50px, -30px) scale(1.1); }
  50% { transform: translate(-30px, 50px) scale(0.9); }
  75% { transform: translate(-50px, -20px) scale(1.05); }
}

/* Grid Pattern */
.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
}

/* Particles */
.particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--color-primary-400);
  border-radius: 50%;
  opacity: 0.6;
  animation: float-particle linear infinite;
}

@keyframes float-particle {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% {
    transform: translateY(-100vh) rotate(720deg);
    opacity: 0;
  }
}

/* 3D Sphere Visualization */
.sphere-container {
  position: relative;
  width: 320px;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glow-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, transparent 40%, var(--color-primary-500) 50%, transparent 60%);
  opacity: 0.3;
  animation: pulse-ring 4s ease-in-out infinite;
  filter: blur(10px);
}

@keyframes pulse-ring {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.1); opacity: 0.5; }
}

.sphere-3d {
  position: relative;
  width: 200px;
  height: 200px;
  transform-style: preserve-3d;
  animation: rotate-sphere 20s linear infinite;
}

@keyframes rotate-sphere {
  from { transform: rotateY(0deg) rotateX(15deg); }
  to { transform: rotateY(360deg) rotateX(15deg); }
}

/* Orbits */
.orbit {
  position: absolute;
  inset: 0;
  border: 2px solid;
  border-radius: 50%;
  transform-style: preserve-3d;
}

.orbit-1 {
  border-color: rgba(14, 165, 233, 0.4);
  animation: orbit-rotate-1 8s linear infinite;
}

.orbit-2 {
  border-color: rgba(217, 70, 239, 0.4);
  transform: rotateX(60deg);
  animation: orbit-rotate-2 12s linear infinite reverse;
}

.orbit-3 {
  border-color: rgba(16, 185, 129, 0.4);
  transform: rotateY(60deg);
  animation: orbit-rotate-3 10s linear infinite;
}

@keyframes orbit-rotate-1 {
  from { transform: rotateZ(0deg); }
  to { transform: rotateZ(360deg); }
}

@keyframes orbit-rotate-2 {
  from { transform: rotateX(60deg) rotateZ(0deg); }
  to { transform: rotateX(60deg) rotateZ(360deg); }
}

@keyframes orbit-rotate-3 {
  from { transform: rotateY(60deg) rotateZ(0deg); }
  to { transform: rotateY(60deg) rotateZ(360deg); }
}

.orbit-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
  border-radius: 50%;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 20px var(--color-primary-400);
}

.orbit-2 .orbit-dot {
  background: linear-gradient(135deg, var(--color-secondary-400), var(--color-secondary-600));
  box-shadow: 0 0 20px var(--color-secondary-400);
}

.orbit-3 .orbit-dot {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 0 20px #10b981;
}

/* Core */
.sphere-core {
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  background: linear-gradient(135deg, 
    rgba(14, 165, 233, 0.3),
    rgba(217, 70, 239, 0.3)
  );
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    inset 0 0 40px rgba(14, 165, 233, 0.3),
    0 0 60px rgba(14, 165, 233, 0.2);
}

.core-inner {
  width: 50%;
  height: 50%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary-400), var(--color-secondary-400));
  animation: core-pulse 2s ease-in-out infinite;
  box-shadow: 0 0 30px var(--color-primary-400);
}

@keyframes core-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

/* Connection Lines SVG */
.connection-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  animation: connection-rotate 30s linear infinite reverse;
}

@keyframes connection-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.conn-line {
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1;
}

.conn-node {
  fill: var(--color-primary-400);
  filter: drop-shadow(0 0 6px var(--color-primary-400));
}

.conn-node-sm {
  fill: var(--color-secondary-400);
  filter: drop-shadow(0 0 4px var(--color-secondary-400));
}

/* Floating Icons */
.floating-icon {
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
}

.icon-chat {
  top: 0;
  right: 20px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.3), rgba(14, 165, 233, 0.1));
  animation: float-icon-1 6s ease-in-out infinite;
}

.icon-users {
  bottom: 20px;
  right: 0;
  background: linear-gradient(135deg, rgba(217, 70, 239, 0.3), rgba(217, 70, 239, 0.1));
  animation: float-icon-2 7s ease-in-out infinite;
}

.icon-bolt {
  bottom: 0;
  left: 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1));
  animation: float-icon-3 8s ease-in-out infinite;
}

@keyframes float-icon-1 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
}

@keyframes float-icon-2 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(-5deg); }
}

@keyframes float-icon-3 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(3deg); }
}

/* Floating Cards */
.floating-card-1 {
  animation: float-card-1 8s ease-in-out infinite;
}

.floating-card-2 {
  animation: float-card-2 7s ease-in-out infinite;
  animation-delay: -2s;
}

.floating-card-3 {
  animation: float-card-3 9s ease-in-out infinite;
  animation-delay: -4s;
}

@keyframes float-card-1 {
  0%, 100% { transform: translateY(0) rotateX(5deg) rotateY(-5deg); }
  50% { transform: translateY(-15px) rotateX(-5deg) rotateY(5deg); }
}

@keyframes float-card-2 {
  0%, 100% { transform: translateY(0) rotateX(-5deg) rotateY(5deg); }
  50% { transform: translateY(-20px) rotateX(5deg) rotateY(-5deg); }
}

@keyframes float-card-3 {
  0%, 100% { transform: translateY(0) rotateX(3deg) rotateY(-3deg); }
  50% { transform: translateY(-10px) rotateX(-3deg) rotateY(3deg); }
}

/* Glass Card 3D */
.glass-card-3d {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transform-style: preserve-3d;
}

/* 3D Buttons */
.btn-primary-3d {
  display: inline-flex;
  align-items: center;
  padding: 16px 32px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
  border-radius: 16px;
  box-shadow: 
    0 10px 30px -10px rgba(14, 165, 233, 0.5),
    0 4px 6px -2px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  transform: translateY(0);
}

.btn-primary-3d:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 20px 40px -15px rgba(14, 165, 233, 0.6),
    0 8px 12px -4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-secondary-3d {
  display: inline-flex;
  align-items: center;
  padding: 16px 32px;
  font-weight: 600;
  color: white;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 20px -5px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.btn-secondary-3d:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

/* Feature Cards */
.feature-card-3d {
  position: relative;
  padding: 32px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  overflow: hidden;
  transition: all 0.4s ease;
  transform-style: preserve-3d;
}

.feature-card-3d:hover {
  transform: translateY(-10px) rotateX(5deg);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 30px 60px -20px rgba(0, 0, 0, 0.5),
    0 0 40px -10px var(--color-primary-500);
}

.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
}

.feature-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transition: left 0.6s ease;
}

.feature-card-3d:hover .feature-shine {
  left: 100%;
}

/* Slide-in Animations */
.animate-slide-in-left {
  animation: slide-in-left 0.8s ease-out forwards;
}

.animate-slide-in-right {
  animation: slide-in-right 0.8s ease-out 0.2s forwards;
  opacity: 0;
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
