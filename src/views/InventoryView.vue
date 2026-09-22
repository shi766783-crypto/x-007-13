<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { CATEGORIES, LOCATIONS, CATEGORY_ICONS, LOCATION_ICONS } from '@/constants'
import IngredientForm from '@/components/inventory/IngredientForm.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseTag from '@/components/common/BaseTag.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import { formatDate } from '@/utils/date'

const inventory = useInventoryStore()

const showForm = ref(false)
const editing = ref(null)
const filterCategory = ref('全部')
const filterStatus = ref('全部')
const filterLocation = ref('全部')

const statusFilter = ['全部', 'fresh', 'near', 'expired']

const filtered = computed(() =>
  inventory.withExpiry.filter((i) => {
    if (filterCategory.value !== '全部' && i.category !== filterCategory.value) return false
    if (filterLocation.value !== '全部' && i.location !== filterLocation.value) return false
    if (filterStatus.value !== '全部' && i.status !== filterStatus.value) return false
    return true
  }),
)

function openAdd() {
  editing.value = null
  showForm.value = true
}

function openEdit(item) {
  editing.value = item
  showForm.value = true
}

function onSave(data) {
  if (editing.value) inventory.updateItem(editing.value.id, data)
  else inventory.addItem(data)
  showForm.value = false
}

function statusTag(item) {
  if (item.status === 'expired') return { text: `过期 ${Math.abs(item.remain)} 天`, color: '#ef5350' }
  if (item.status === 'near') return { text: `剩余 ${item.remain} 天`, color: '#ff9800' }
  return { text: `剩余 ${item.remain} 天`, color: '#4caf50' }
}
</script>

<template>
  <div>
    <div class="page-head">
      <h2>🥬 食材库存</h2>
      <BaseButton @click="openAdd">+ 添加食材</BaseButton>
    </div>

    <div class="filters card">
      <div class="filter-group">
        <span class="f-label">类别</span>
        <button
          v-for="c in ['全部', ...CATEGORIES]"
          :key="c"
          class="chip"
          :class="{ on: filterCategory === c }"
          @click="filterCategory = c"
        >
          {{ c === '全部' ? '全部' : CATEGORY_ICONS[c] + ' ' + c }}
        </button>
      </div>
      <div class="filter-group">
        <span class="f-label">状态</span>
        <button
          v-for="s in statusFilter"
          :key="s"
          class="chip"
          :class="{ on: filterStatus === s }"
          @click="filterStatus = s"
        >
          {{ { 全部: '全部', fresh: '新鲜', near: '临期', expired: '过期' }[s] }}
        </button>
      </div>
      <div class="filter-group">
        <span class="f-label">位置</span>
        <button
          v-for="l in ['全部', ...LOCATIONS]"
          :key="l"
          class="chip"
          :class="{ on: filterLocation === l }"
          @click="filterLocation = l"
        >
          {{ l === '全部' ? '全部' : LOCATION_ICONS[l] + ' ' + l }}
        </button>
      </div>
    </div>

    <BaseEmpty v-if="!filtered.length" emoji="🧺" text="库存空空如也，点击右上角添加食材吧" />

    <div v-else class="grid grid-3">
      <div v-for="item in filtered" :key="item.id" class="item card">
        <div class="item-head">
          <div class="thumb" v-if="item.photo"><img :src="item.photo" alt="" /></div>
          <div v-else class="thumb icon">{{ CATEGORY_ICONS[item.category] }}</div>
          <div class="head-info">
            <div class="name">{{ item.name }}</div>
            <div class="meta muted">{{ item.quantity }}{{ item.unit }} · {{ LOCATION_ICONS[item.location] }} {{ item.location }}</div>
          </div>
          <BaseTag :category="item.category" :text="item.category" />
        </div>
        <div class="item-body">
          <BaseTag :text="statusTag(item).text" :color="statusTag(item).color" />
          <span class="muted small">购买于 {{ formatDate(item.purchaseDate) }}</span>
        </div>
        <div v-if="item.note" class="note">{{ item.note }}</div>
        <div class="item-actions">
          <BaseButton size="sm" variant="ghost" @click="inventory.consume(item.id)">- 消耗</BaseButton>
          <BaseButton size="sm" variant="ghost" @click="openEdit(item)">编辑</BaseButton>
          <BaseButton size="sm" variant="text" @click="inventory.removeItem(item.id)">删除</BaseButton>
        </div>
      </div>
    </div>

    <BaseModal :show="showForm" :title="editing ? '编辑食材' : '添加食材'" @close="showForm = false">
      <IngredientForm :initial="editing" @submit="onSave" @cancel="showForm = false" />
    </BaseModal>
  </div>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.page-head h2 {
  margin: 0;
}
.filters {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.f-label {
  font-size: 12px;
  color: var(--text-2);
  width: 36px;
}
.chip {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
}
.chip.on {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary-dark);
  font-weight: 600;
}
.item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.item-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.thumb {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
}
.thumb.icon {
  font-size: 26px;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.head-info {
  flex: 1;
  min-width: 0;
}
.name {
  font-weight: 600;
  font-size: 15px;
}
.meta {
  font-size: 12px;
}
.item-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.small {
  font-size: 12px;
}
.note {
  font-size: 12px;
  color: var(--text-2);
  background: var(--surface-2);
  padding: 6px 10px;
  border-radius: 8px;
}
.item-actions {
  display: flex;
  gap: 6px;
  border-top: 1px solid var(--border);
  padding-top: 10px;
}
</style>
