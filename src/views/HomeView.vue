<script setup>
import { computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useStatsStore } from '@/stores/stats'
import { useUserStore } from '@/stores/user'
import BaseTag from '@/components/common/BaseTag.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import { expiryDateKey } from '@/utils/date'

const inventory = useInventoryStore()
const stats = useStatsStore()
const user = useUserStore()

const expired = computed(() => inventory.expiredItems)
const near = computed(() => inventory.nearExpiryItems)
const priority = computed(() =>
  [...inventory.expiredItems, ...inventory.nearExpiryItems].sort((a, b) => a.remain - b.remain),
)
</script>

<template>
  <div>
    <div class="hero">
      <h2>你好，{{ user.name }} 👋</h2>
      <p class="muted">合理规划每一餐，让食材不再被浪费。</p>
    </div>

    <div class="grid grid-3 alert-row">
      <div class="alert-card danger">
        <div class="num">{{ expired.length }}</div>
        <div class="txt">已过期食材</div>
      </div>
      <div class="alert-card warn">
        <div class="num">{{ near.length }}</div>
        <div class="txt">临期食材（3天内）</div>
      </div>
      <div class="alert-card ok">
        <div class="num">{{ inventory.items.length }}</div>
        <div class="txt">库存总种类</div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">
        <span>⚠️ 优先消耗清单</span>
        <router-link to="/challenge" class="link">去清理 →</router-link>
      </div>
      <BaseEmpty v-if="!priority.length" emoji="🎉" text="暂无临期或过期食材，库存很健康！" />
      <div v-else class="priority-list">
        <div
          v-for="item in priority"
          :key="item.id"
          class="priority-item"
          :class="item.status"
        >
          <span class="emoji">{{ item.photo ? '' : '🥘' }}</span>
          <div class="info">
            <div class="name">
              {{ item.name }}
              <BaseTag
                :text="item.status === 'expired' ? `已过期 ${Math.abs(item.remain)} 天` : `剩余 ${item.remain} 天`"
                :color="item.status === 'expired' ? '#ef5350' : '#ff9800'"
              />
            </div>
            <div class="meta muted">
              {{ item.quantity }}{{ item.unit }} · {{ item.location }} · 过期日 {{ expiryDateKey(item.purchaseDate, item.shelfLifeDays) }}
            </div>
          </div>
          <router-link to="/challenge" class="btn-use">做菜</router-link>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">
        <span>📊 本周概览</span>
        <router-link to="/dashboard" class="link">看板 →</router-link>
      </div>
      <div class="grid grid-4">
        <div class="mini-stat">
          <div class="v">{{ stats.weekCompletionRate }}%</div>
          <div class="l">计划完成率</div>
        </div>
        <div class="mini-stat">
          <div class="v">{{ (stats.wasteRate * 100).toFixed(1) }}%</div>
          <div class="l">食材浪费率</div>
        </div>
        <div class="mini-stat">
          <div class="v">{{ stats.avgNutritionThisWeek }}</div>
          <div class="l">本周营养评分</div>
        </div>
        <div class="mini-stat">
          <div class="v">¥{{ stats.weeklySpend.toFixed(1) }}</div>
          <div class="l">本周采购花费</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  margin-bottom: 16px;
}
.hero h2 {
  font-size: 22px;
}
.alert-row {
  margin-bottom: 16px;
}
.alert-card {
  border-radius: var(--radius);
  padding: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
}
.alert-card.danger {
  background: linear-gradient(135deg, #ef5350, #e53935);
}
.alert-card.warn {
  background: linear-gradient(135deg, #ffa726, #fb8c00);
}
.alert-card.ok {
  background: linear-gradient(135deg, #66bb6a, #43a047);
}
.alert-card .num {
  font-size: 30px;
  font-weight: 700;
}
.alert-card .txt {
  font-size: 13px;
  opacity: 0.95;
}
.link {
  font-size: 13px;
}
.priority-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.priority-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: var(--surface-2);
}
.priority-item.near {
  background: var(--warn-light);
}
.priority-item.expired {
  background: var(--danger-light);
}
.priority-item .emoji {
  font-size: 28px;
}
.info {
  flex: 1;
}
.name {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.meta {
  font-size: 12px;
}
.btn-use {
  background: var(--primary);
  color: #fff;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
}
.mini-stat {
  text-align: center;
  padding: 12px;
  background: var(--surface-2);
  border-radius: 10px;
}
.mini-stat .v {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-dark);
}
.mini-stat .l {
  font-size: 12px;
  color: var(--text-2);
}
</style>
