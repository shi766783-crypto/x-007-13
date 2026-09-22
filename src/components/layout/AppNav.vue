<script setup>
import { useInventoryStore } from '@/stores/inventory'

const inventory = useInventoryStore()

const links = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/inventory', label: '食材库存', icon: '🥬', badge: () => inventory.items.length },
  { to: '/meal-plan', label: '每周食谱', icon: '📅' },
  { to: '/shopping', label: '采购清单', icon: '🛒' },
  { to: '/diet', label: '饮食记录', icon: '🍽️' },
  { to: '/dashboard', label: '饮食看板', icon: '📊' },
  { to: '/challenge', label: '清理挑战', icon: '🧹' },
  { to: '/achievements', label: '成就徽章', icon: '🏅' },
  { to: '/leaderboard', label: '排行榜', icon: '🏆' },
  { to: '/profile', label: '个人中心', icon: '👤' },
]
</script>

<template>
  <nav class="app-nav">
    <router-link
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="nav-item"
      :class="{ active: $route.path === link.to }"
    >
      <span class="icon">{{ link.icon }}</span>
      <span class="label">{{ link.label }}</span>
      <span v-if="link.badge && link.badge()" class="badge">{{ link.badge() }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.app-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 180px;
  flex-shrink: 0;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  color: var(--text);
  transition: background 0.15s, color 0.15s;
  position: relative;
}
.nav-item:hover {
  background: var(--surface-2);
}
.nav-item.active {
  background: var(--primary-light);
  color: var(--primary-dark);
  font-weight: 600;
}
.icon {
  font-size: 18px;
}
.label {
  flex: 1;
}
.badge {
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}
@media (max-width: 768px) {
  .app-nav {
    flex-direction: row;
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .nav-item {
    flex-direction: column;
    gap: 2px;
    padding: 8px 10px;
    font-size: 12px;
    white-space: nowrap;
  }
  .label {
    flex: none;
  }
}
</style>
