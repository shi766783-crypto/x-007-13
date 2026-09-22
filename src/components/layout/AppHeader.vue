<script setup>
import { useUserStore } from '@/stores/user'
import { useAchievementsStore } from '@/stores/achievements'

const user = useUserStore()
const achievements = useAchievementsStore()
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <span class="logo">🥕</span>
      <div>
        <h1 class="title">家庭饮食计划与食材管家</h1>
        <p class="subtitle">规划每周饮食 · 管理食材库存 · 减少浪费</p>
      </div>
    </div>
    <div class="right">
      <router-link to="/achievements" class="badge-chip" title="已解锁成就">
        🏅 {{ achievements.progress.unlocked }}/{{ achievements.progress.total }}
      </router-link>
      <router-link to="/profile" class="user-chip">
        <span class="avatar">{{ user.avatar }}</span>
        <span class="name">{{ user.name }}</span>
        <span class="points">⭐ {{ user.points }}</span>
      </router-link>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(135deg, #43a047, #66bb6a);
  color: #fff;
  box-shadow: var(--shadow);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo {
  font-size: 32px;
}
.title {
  margin: 0;
  font-size: 18px;
}
.subtitle {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}
.right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.badge-chip,
.user-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 13px;
  transition: background 0.15s;
}
.badge-chip:hover,
.user-chip:hover {
  background: rgba(255, 255, 255, 0.3);
}
.avatar {
  font-size: 18px;
}
.points {
  font-weight: 600;
}
@media (max-width: 600px) {
  .subtitle {
    display: none;
  }
}
</style>
