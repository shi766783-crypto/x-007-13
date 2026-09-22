<script setup>
import { computed } from 'vue'
import { useStatsStore } from '@/stores/stats'
import { useInventoryStore } from '@/stores/inventory'
import { useDietRecordStore } from '@/stores/dietRecord'
import StatCard from '@/components/common/StatCard.vue'
import SimpleChart from '@/components/common/SimpleChart.vue'
import { weekDateKeys, parseDateKey } from '@/utils/date'

const stats = useStatsStore()
const inventory = useInventoryStore()
const diet = useDietRecordStore()

const weekDates = weekDateKeys()
const trendLabels = computed(() => weekDates.map((d) => `${parseDateKey(d).getMonth() + 1}/${parseDateKey(d).getDate()}`))
const trendData = computed(() => weekDates.map((d) => diet.dailyScores[d] || 0))

const categoryStats = computed(() => {
  const cats = {}
  inventory.items.forEach((i) => {
    cats[i.category] = (cats[i.category] || 0) + i.quantity
  })
  return cats
})
const catLabels = computed(() => Object.keys(categoryStats.value))
const catData = computed(() => Object.values(categoryStats.value))
</script>

<template>
  <div>
    <h2>📊 饮食看板</h2>

    <div class="grid grid-4">
      <StatCard label="本周计划完成率" :value="stats.weekCompletionRate" suffix="%" icon="🎯" color="#2196f3" />
      <StatCard label="食材浪费率" :value="(stats.wasteRate * 100).toFixed(1)" suffix="%" icon="🗑️" color="#ef5350" />
      <StatCard label="本周采购花费" :value="stats.weeklySpend.toFixed(1)" suffix="元" icon="💰" color="#ff9800" />
      <StatCard label="本周平均营养评分" :value="stats.avgNutritionThisWeek" icon="⚖️" color="#4caf50" />
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="section-title">营养评分趋势（本周）</div>
        <SimpleChart type="line" :labels="trendLabels" :data="trendData" color="#2196f3" :height="200" />
      </div>
      <div class="card">
        <div class="section-title">库存类别分布</div>
        <SimpleChart type="bar" :labels="catLabels" :data="catData" color="#4caf50" :height="200" />
      </div>
    </div>

    <div class="grid grid-3">
      <div class="card">
        <div class="section-title">库存状态</div>
        <div class="status-bar">
          <div class="seg fresh" :style="{ flex: inventory.freshItems.length }"></div>
          <div class="seg near" :style="{ flex: inventory.nearExpiryItems.length }"></div>
          <div class="seg expired" :style="{ flex: inventory.expiredItems.length }"></div>
        </div>
        <div class="legend">
          <span><i class="dot fresh"></i> 新鲜 {{ inventory.freshItems.length }}</span>
          <span><i class="dot near"></i> 临期 {{ inventory.nearExpiryItems.length }}</span>
          <span><i class="dot expired"></i> 过期 {{ inventory.expiredItems.length }}</span>
        </div>
      </div>
      <div class="card">
        <div class="section-title">本周采购</div>
        <div class="big-num">¥{{ stats.weeklySpend.toFixed(1) }}</div>
        <div class="muted small">累计采购 {{ stats.totalSpend.toFixed(1) }} 元</div>
      </div>
      <div class="card">
        <div class="section-title">过期食材</div>
        <div class="big-num">{{ inventory.expiredItems.length }}<span class="suffix"> 种</span></div>
        <div class="muted small">库存共 {{ inventory.items.length }} 种</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
h2 {
  margin-bottom: 16px;
}
.grid {
  margin-bottom: 16px;
}
.status-bar {
  display: flex;
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
  gap: 2px;
  margin-bottom: 12px;
}
.seg {
  min-width: 4px;
  border-radius: 2px;
}
.seg.fresh {
  background: #4caf50;
}
.seg.near {
  background: #ff9800;
}
.seg.expired {
  background: #ef5350;
}
.legend {
  display: flex;
  gap: 16px;
  font-size: 13px;
}
.legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.dot.fresh {
  background: #4caf50;
}
.dot.near {
  background: #ff9800;
}
.dot.expired {
  background: #ef5350;
}
.big-num {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-dark);
}
.suffix {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-2);
}
.small {
  font-size: 12px;
}
</style>
