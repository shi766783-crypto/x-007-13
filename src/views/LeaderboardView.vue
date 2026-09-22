<script setup>
import { useStatsStore } from '@/stores/stats'

const stats = useStatsStore()

const medals = ['🥇', '🥈', '🥉']
</script>

<template>
  <div>
    <h2>🏆 排行榜</h2>

    <div class="grid grid-2">
      <div class="card">
        <div class="section-title">♻️ 节约达人榜 <span class="muted small">按食材浪费率从低到高</span></div>
        <div class="board">
          <div
            v-for="(row, i) in stats.saverLeaderboard"
            :key="row.name"
            class="row"
            :class="{ me: row.isMe }"
          >
            <span class="rank">{{ medals[i] || i + 1 }}</span>
            <span class="avatar">{{ row.avatar }}</span>
            <span class="name">{{ row.name }}</span>
            <span class="val">{{ (row.wasteRate * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-title">👨‍🍳 食谱创意榜 <span class="muted small">按发布菜谱数量排序</span></div>
        <div class="board">
          <div
            v-for="(row, i) in stats.recipeLeaderboard"
            :key="row.name"
            class="row"
            :class="{ me: row.isMe }"
          >
            <span class="rank">{{ medals[i] || i + 1 }}</span>
            <span class="avatar">{{ row.avatar }}</span>
            <span class="name">{{ row.name }}</span>
            <span class="val">{{ row.recipeCount }} 道</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
h2 {
  margin-bottom: 16px;
}
.small {
  font-size: 12px;
  font-weight: 400;
}
.board {
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 8px;
  border-bottom: 1px solid var(--border);
}
.row:last-child {
  border-bottom: none;
}
.row.me {
  background: var(--primary-light);
  font-weight: 600;
}
.rank {
  width: 28px;
  text-align: center;
  font-size: 18px;
}
.avatar {
  font-size: 22px;
}
.name {
  flex: 1;
}
.val {
  font-weight: 600;
  color: var(--primary-dark);
}
</style>
