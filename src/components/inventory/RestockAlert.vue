<script setup>
import { computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useShoppingListStore } from '@/stores/shoppingList'
import { refKey } from '@/utils/restock'
import { RESTOCK_WARN_DAYS, CONSUMPTION_WINDOW_DAYS } from '@/constants'
import BaseButton from '@/components/common/BaseButton.vue'
import { formatDate } from '@/utils/date'

const inventory = useInventoryStore()
const shopping = useShoppingListStore()

const alerts = computed(() => inventory.restockAlerts)

function inList(alert) {
  return shopping.activeRefKeys.has(refKey(alert.name, alert.unit))
}

// 尚未加入采购清单的提醒（用于全部加入）
const pending = computed(() => alerts.value.filter((a) => !inList(a)))

function addOne(alert) {
  shopping.addRestockItems([alert])
}

function addAll() {
  const n = shopping.addRestockItems(pending.value).length
  if (n) alert(`已将 ${n} 种食材加入采购清单 🛒`)
}

function statusMeta(alert) {
  if (alert.status === 'empty') return { text: '已用完', color: '#ef5350' }
  if (alert.status === 'today') return { text: '预计今天用完', color: '#ef5350' }
  return { text: `约 ${alert.daysLeft < 1 ? '<1' : Math.ceil(alert.daysLeft)} 天后用完`, color: '#ff9800' }
}

function formatRate(rate, unit) {
  const rounded = Math.round(rate * 100) / 100
  return `${rounded}${unit}/天`
}
</script>

<template>
  <div v-if="alerts.length" class="card restock-card">
    <div class="section-title">
      <span>🔔 补货提醒</span>
      <BaseButton v-if="pending.length" size="sm" @click="addAll">
        一键加入采购清单（{{ pending.length }}）
      </BaseButton>
    </div>
    <p class="muted small desc">
      根据近 {{ CONSUMPTION_WINDOW_DAYS }} 天的消耗速度估算，提前 {{ RESTOCK_WARN_DAYS }} 天提醒补货。
    </p>
    <div class="alert-list">
      <div v-for="a in alerts" :key="refKey(a.name, a.unit)" class="alert-row">
        <div class="info">
          <div class="name">
            {{ a.name }}
            <span class="status-tag" :style="{ background: statusMeta(a).color + '22', color: statusMeta(a).color }">
              {{ statusMeta(a).text }}
            </span>
          </div>
          <div class="muted small">
            库存 {{ a.inStock }}{{ a.unit }} · 日均消耗约 {{ formatRate(a.ratePerDay, a.unit) }}
            · 建议补 {{ a.suggested }}{{ a.unit }}
            <template v-if="a.status !== 'empty'">（{{ formatDate(a.runOutDate) }}前）</template>
          </div>
        </div>
        <BaseButton v-if="inList(a)" size="sm" variant="ghost" disabled>已在清单</BaseButton>
        <BaseButton v-else size="sm" @click="addOne(a)">加入清单</BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.restock-card {
  border-color: #ffcc80;
  background: linear-gradient(180deg, #fffaf2 0%, #ffffff 60%);
}
.desc {
  margin: -4px 0 12px;
}
.small {
  font-size: 12px;
}
.alert-list {
  display: flex;
  flex-direction: column;
}
.alert-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.alert-row:last-child {
  border-bottom: none;
}
.info {
  flex: 1;
  min-width: 0;
}
.name {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
}
</style>
