<script setup>
import { ref, computed, watch } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useShoppingListStore } from '@/stores/shoppingList'
import { CATEGORY_ICONS } from '@/constants'
import { RESTOCK_WARN_DAYS } from '@/constants'
import BaseButton from '@/components/common/BaseButton.vue'

defineProps({
  // 添加成功后是否展示“查看采购清单”入口（采购清单页内使用时关闭）
  showLink: { type: Boolean, default: true },
})

const inventory = useInventoryStore()
const shopping = useShoppingListStore()

const leadOptions = [1, 3, 5, 7]
const leadDays = ref(RESTOCK_WARN_DAYS)
const selected = ref(new Set())
const result = ref(null)

const alerts = computed(() => inventory.restockAlerts(leadDays.value))

// 切换预警天数后清空勾选，避免残留无效选择
watch(leadDays, () => {
  selected.value = new Set()
})

function isPending(alert) {
  return shopping.hasPending(alert.name, alert.unit, alert.ingredientId)
}

// 还可以加入清单的候选项（排除已在清单中的）
const candidates = computed(() => alerts.value.filter((a) => !isPending(a)))

function toggle(id) {
  const s = new Set(selected.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selected.value = s
}

function selectAll() {
  selected.value = new Set(candidates.value.map((a) => a.id))
}

function fmt(n) {
  return String(Math.round(Number(n) * 100) / 100)
}

function daysText(d) {
  if (d < 1) return '预计今天内用完'
  if (d < 1.5) return '预计 1 天内用完'
  return `预计 ${Math.round(d)} 天后用完`
}

function add(entries) {
  const { added, merged } = shopping.addRestockItems(entries)
  selected.value = new Set()
  if (added || merged) {
    result.value = { added, merged, ts: Date.now() }
  }
}

function addSelected() {
  const entries = candidates.value.filter((a) => selected.value.has(a.id))
  add(entries)
}

function addAll() {
  add(candidates.value)
}
</script>

<template>
  <div v-if="alerts.length" class="card restock-card">
    <div class="head">
      <div class="title">
        🔔 补货提醒
        <span class="count">{{ alerts.length }}</span>
      </div>
      <div class="lead-chips">
        <span class="lead-label">提前</span>
        <button
          v-for="d in leadOptions"
          :key="d"
          class="chip"
          :class="{ on: leadDays === d }"
          @click="leadDays = d"
        >
          {{ d }} 天
        </button>
      </div>
    </div>

    <p class="muted small desc">
      根据最近的食材消耗速度估算，以下食材将在 {{ leadDays }} 天内用完，可提前补货。
    </p>

    <div class="alert-list">
      <label v-for="a in alerts" :key="a.id" class="alert-row" :class="{ urgent: a.urgent }">
        <input
          type="checkbox"
          :checked="selected.has(a.id)"
          :disabled="isPending(a)"
          @change="toggle(a.id)"
        />
        <span class="emoji">{{ CATEGORY_ICONS[a.category] || '📦' }}</span>
        <div class="info">
          <div class="name-line">
            <span class="name">{{ a.name }}</span>
            <span class="runout" :class="{ urgent: a.urgent }">{{ daysText(a.daysLeft) }}</span>
          </div>
          <div class="muted small meta">
            剩 {{ fmt(a.quantity) }}{{ a.unit }} · 日均消耗约 {{ fmt(a.ratePerDay) }}{{ a.unit }}
            · 建议补 {{ fmt(a.suggested) }}{{ a.unit }}
            <span v-if="!a.reliable" class="unreliable">（记录较少，估算仅供参考）</span>
          </div>
        </div>
        <span v-if="isPending(a)" class="in-list">已在清单</span>
      </label>
    </div>

    <div class="foot">
      <BaseButton size="sm" @click="addSelected" :disabled="!selected.size">
        加入采购清单{{ selected.size ? `（${selected.size}）` : '' }}
      </BaseButton>
      <BaseButton size="sm" variant="ghost" @click="selectAll" :disabled="!candidates.length">
        全选
      </BaseButton>
      <BaseButton size="sm" variant="ghost" @click="addAll" :disabled="!candidates.length">
        一键全部加入
      </BaseButton>
      <span v-if="result" :key="result.ts" class="result">
        ✅ 已加入 {{ result.added }} 项<template v-if="result.merged">，合并 {{ result.merged }} 项</template>
        <router-link v-if="showLink" to="/shopping" class="link">查看清单 →</router-link>
      </span>
    </div>
  </div>
</template>

<style scoped>
.restock-card {
  border-color: #ffd699;
  background: linear-gradient(180deg, #fffaf2 0%, #ffffff 60%);
  margin-bottom: 16px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.count {
  background: var(--warn);
  color: #fff;
  font-size: 12px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}
.lead-chips {
  display: flex;
  align-items: center;
  gap: 6px;
}
.lead-label {
  font-size: 12px;
  color: var(--text-2);
}
.chip {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 14px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
}
.chip.on {
  background: var(--warn-light);
  border-color: var(--warn);
  color: #e65100;
  font-weight: 600;
}
.desc {
  margin: 8px 0 12px;
}
.small {
  font-size: 12px;
}
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.alert-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--surface-2);
  cursor: pointer;
}
.alert-row.urgent {
  background: var(--danger-light);
}
.alert-row:has(input:disabled) {
  opacity: 0.75;
  cursor: default;
}
.emoji {
  font-size: 22px;
}
.info {
  flex: 1;
  min-width: 0;
}
.name-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.name {
  font-weight: 600;
}
.runout {
  font-size: 12px;
  color: #e65100;
  background: var(--warn-light);
  padding: 1px 8px;
  border-radius: 10px;
}
.runout.urgent {
  color: var(--danger);
  background: #ffd9d9;
}
.meta {
  margin-top: 2px;
}
.unreliable {
  opacity: 0.8;
}
.in-list {
  font-size: 12px;
  color: var(--primary-dark);
  background: var(--primary-light);
  padding: 3px 10px;
  border-radius: 10px;
  white-space: nowrap;
}
.foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.result {
  font-size: 13px;
  color: var(--primary-dark);
  font-weight: 500;
}
.link {
  margin-left: 6px;
  font-size: 13px;
}
</style>
