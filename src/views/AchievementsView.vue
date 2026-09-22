<script setup>
import { useAchievementsStore } from '@/stores/achievements'

const achievements = useAchievementsStore()
</script>

<template>
  <div>
    <h2>🏅 成就徽章</h2>

    <div class="progress card">
      <div class="progress-head">
        <span>已解锁 {{ achievements.progress.unlocked }} / {{ achievements.progress.total }}</span>
        <span class="muted">{{ achievements.progress.percent }}%</span>
      </div>
      <div class="bar">
        <div class="fill" :style="{ width: achievements.progress.percent + '%' }"></div>
      </div>
    </div>

    <div class="grid grid-3">
      <div
        v-for="a in achievements.defs"
        :key="a.id"
        class="badge card"
        :class="{ locked: !achievements.unlocked.some((u) => u.id === a.id) }"
      >
        <div class="icon">{{ a.icon }}</div>
        <div class="name">{{ a.name }}</div>
        <div class="desc">{{ a.desc }}</div>
        <div class="state" :class="achievements.unlocked.some((u) => u.id === a.id) ? 'on' : ''">
          {{ achievements.unlocked.some((u) => u.id === a.id) ? '已解锁' : '未解锁' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
h2 {
  margin-bottom: 16px;
}
.progress {
  margin-bottom: 16px;
}
.progress-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
}
.bar {
  height: 10px;
  background: var(--surface-2);
  border-radius: 5px;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd54f, #ff9800);
  border-radius: 5px;
  transition: width 0.4s;
}
.badge {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: transform 0.15s;
}
.badge:hover {
  transform: translateY(-2px);
}
.badge.locked {
  opacity: 0.55;
  filter: grayscale(0.6);
}
.icon {
  font-size: 42px;
}
.name {
  font-weight: 600;
  font-size: 15px;
}
.desc {
  font-size: 12px;
  color: var(--text-2);
  min-height: 32px;
}
.state {
  font-size: 11px;
  padding: 3px 12px;
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--text-2);
}
.state.on {
  background: var(--primary-light);
  color: var(--primary-dark);
  font-weight: 600;
}
</style>
