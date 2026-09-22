<script setup>
import { ref, computed } from 'vue'
import { useMealPlanStore } from '@/stores/mealPlan'
import { WEEK_DAYS, MEALS, MEAL_ICONS, DIFFICULTY_COLORS } from '@/constants'
import { currentWeekKey, toWeekKey, parseDateKey, weekStartFromKey, currentWeekStart } from '@/utils/date'
import DishForm from '@/components/mealplan/DishForm.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseTag from '@/components/common/BaseTag.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'

const mealPlan = useMealPlanStore()

const weekKey = ref(currentWeekKey())
const showSlotPicker = ref(false)
const showDishForm = ref(false)
const showLibrary = ref(false)
const editingDish = ref(null)
const slotTarget = ref({ day: 'monday', meal: '早餐' })
const search = ref('')

const weekDays = computed(() => mealPlan.plan[weekKey.value] || {})
const weekLabel = computed(() => {
  const start = weekStartFromKey(weekKey.value)
  const d = parseDateKey(start)
  return `${d.getMonth() + 1}月${d.getDate()}日 起`
})

const filteredDishes = computed(() => {
  const q = search.value.trim()
  if (!q) return mealPlan.dishes
  return mealPlan.dishes.filter((d) => d.name.includes(q))
})

function shiftWeek(delta) {
  const start = parseDateKey(weekStartFromKey(weekKey.value))
  start.setDate(start.getDate() + delta * 7)
  weekKey.value = toWeekKey(start)
}

function openPicker(day, meal) {
  slotTarget.value = { day, meal }
  showSlotPicker.value = true
}

function pickDish(dishId) {
  mealPlan.toggleDish(weekKey.value, slotTarget.value.day, slotTarget.value.meal, dishId)
}

function removeDish(day, meal, dishId) {
  mealPlan.toggleDish(weekKey.value, day, meal, dishId)
}

function openNewDish() {
  editingDish.value = null
  showDishForm.value = true
}

function openEditDish(dish) {
  editingDish.value = dish
  showDishForm.value = true
}

function onDishSave(data) {
  if (editingDish.value) mealPlan.updateDish(editingDish.value.id, data)
  else mealPlan.addDish(data)
  showDishForm.value = false
}

function mealSlot(day, meal) {
  const m = { 早餐: 'breakfast', 午餐: 'lunch', 晚餐: 'dinner' }[meal]
  return (weekDays.value[day] && weekDays.value[day][m]) || []
}
</script>

<template>
  <div>
    <div class="page-head">
      <h2>📅 每周食谱计划</h2>
      <div class="head-actions">
        <BaseButton variant="ghost" size="sm" @click="showLibrary = true">我的菜谱（{{ mealPlan.dishes.length }}）</BaseButton>
        <BaseButton size="sm" @click="openNewDish">+ 新建菜品</BaseButton>
      </div>
    </div>

    <div class="week-nav card">
      <BaseButton variant="ghost" size="sm" @click="shiftWeek(-1)">‹ 上周</BaseButton>
      <div class="week-label">
        <span class="week-title">{{ weekKey }}</span>
        <span class="muted small">{{ weekLabel }}</span>
      </div>
      <BaseButton variant="ghost" size="sm" @click="shiftWeek(1)">下周 ›</BaseButton>
      <BaseButton variant="text" size="sm" @click="weekKey = currentWeekKey()">回到本周</BaseButton>
    </div>

    <div class="plan-board">
      <div class="plan-header">
        <div class="corner"></div>
        <div v-for="d in WEEK_DAYS" :key="d.key" class="day-head">{{ d.label }}</div>
      </div>
      <div v-for="meal in MEALS" :key="meal" class="plan-row">
        <div class="meal-label">
          {{ MEAL_ICONS[meal] }} {{ meal }}
        </div>
        <div v-for="d in WEEK_DAYS" :key="d.key" class="slot">
          <div v-for="dishId in mealSlot(d.key, meal)" :key="dishId" class="dish-chip">
            <BaseTag :text="mealPlan.dishMap[dishId]?.name || '未知'" :color="DIFFICULTY_COLORS[mealPlan.dishMap[dishId]?.difficulty] || '#90a4ae'" />
            <button class="rm" @click="removeDish(d.key, meal, dishId)">✕</button>
          </div>
          <button class="add-slot" @click="openPicker(d.key, meal)">+</button>
        </div>
      </div>
    </div>

    <!-- 菜品选择 -->
    <BaseModal :show="showSlotPicker" :title="`为 ${slotTarget.meal} 选择菜品`" @close="showSlotPicker = false">
      <div class="picker-search">
        <input v-model="search" type="text" placeholder="搜索菜品…" />
        <BaseButton size="sm" variant="ghost" @click="openNewDish">+ 新建</BaseButton>
      </div>
      <BaseEmpty v-if="!filteredDishes.length" emoji="🍲" text="还没有菜谱，先新建一道菜吧" />
      <div v-else class="dish-list">
        <div v-for="dish in filteredDishes" :key="dish.id" class="dish-row">
          <div class="dish-info">
            <span class="dish-name">{{ dish.name }}</span>
            <span class="muted small">{{ dish.ingredients.length }} 种食材 · {{ dish.cookTime }}分钟</span>
          </div>
          <BaseButton size="sm" @click="pickDish(dish.id)">加入</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- 菜谱库 -->
    <BaseModal :show="showLibrary" title="我的菜谱库" width="640px" @close="showLibrary = false">
      <BaseEmpty v-if="!mealPlan.dishes.length" emoji="📖" text="暂无菜谱" />
      <div v-else class="library">
        <div v-for="dish in mealPlan.dishes" :key="dish.id" class="lib-item">
          <div class="lib-head">
            <span class="dish-name">{{ dish.name }}</span>
            <BaseTag :category="dish.category" :text="dish.category" />
          </div>
          <div class="muted small">
            {{ dish.ingredients.map((i) => i.name).join('、') || '无食材' }} · {{ dish.cookTime }}分钟 · {{ dish.difficulty }}
          </div>
          <div v-if="dish.instructions" class="muted small instr">{{ dish.instructions }}</div>
          <div class="lib-actions">
            <BaseButton size="sm" variant="ghost" @click="openEditDish(dish)">编辑</BaseButton>
            <BaseButton size="sm" variant="text" @click="mealPlan.removeDish(dish.id)">删除</BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>

    <!-- 菜品表单 -->
    <BaseModal :show="showDishForm" :title="editingDish ? '编辑菜品' : '新建菜品'" width="640px" @close="showDishForm = false">
      <DishForm :initial="editingDish" @submit="onDishSave" @cancel="showDishForm = false" />
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
.head-actions {
  display: flex;
  gap: 8px;
}
.week-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.week-label {
  flex: 1;
  text-align: center;
}
.week-title {
  font-weight: 700;
  font-size: 16px;
}
.small {
  font-size: 12px;
}
.plan-board {
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px;
}
.plan-header,
.plan-row {
  display: grid;
  grid-template-columns: 64px repeat(7, minmax(120px, 1fr));
  gap: 6px;
  align-items: stretch;
}
.plan-header {
  margin-bottom: 6px;
}
.day-head {
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  color: var(--text-2);
  padding: 6px 0;
}
.plan-row {
  margin-bottom: 6px;
}
.meal-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-2);
  font-weight: 600;
  border-right: 1px solid var(--border);
}
.slot {
  min-height: 56px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--surface-2);
}
.dish-chip {
  display: flex;
  align-items: center;
  gap: 4px;
}
.dish-chip :deep(.tag) {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rm {
  border: none;
  background: none;
  color: var(--text-2);
  cursor: pointer;
  font-size: 12px;
}
.add-slot {
  border: none;
  background: none;
  color: var(--text-2);
  cursor: pointer;
  font-size: 14px;
  padding: 2px;
}
.add-slot:hover {
  color: var(--primary);
}
.picker-search {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.picker-search input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
}
.dish-list,
.library {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 50vh;
  overflow-y: auto;
}
.dish-row,
.lib-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
}
.lib-item {
  flex-direction: column;
  align-items: stretch;
}
.lib-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dish-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dish-name {
  font-weight: 600;
}
.instr {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lib-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
</style>
