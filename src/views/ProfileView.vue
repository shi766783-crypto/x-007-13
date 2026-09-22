<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useInventoryStore } from '@/stores/inventory'
import { useMealPlanStore } from '@/stores/mealPlan'
import { useShoppingListStore } from '@/stores/shoppingList'
import { useAchievementsStore } from '@/stores/achievements'
import { useStatsStore } from '@/stores/stats'
import { CATEGORIES, CATEGORY_ICONS } from '@/constants'
import BaseButton from '@/components/common/BaseButton.vue'

const user = useUserStore()
const inventory = useInventoryStore()
const mealPlan = useMealPlanStore()
const shopping = useShoppingListStore()
const achievements = useAchievementsStore()
const stats = useStatsStore()

const editing = ref(false)
const nameInput = ref(user.name)
const avatarInput = ref(user.avatar)

const avatarOptions = ['👨‍👩‍👧', '👩‍🍳', '🧑‍🍳', '👨‍🍳', '🏡', '👪', '💑', '🐱']

function saveProfile() {
  user.setName(nameInput.value.trim() || '我的家庭')
  user.setAvatar(avatarInput.value)
  editing.value = false
}

function fmt(iso) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<template>
  <div>
    <h2>👤 个人中心</h2>

    <div class="card profile-card">
      <div class="avatar-big">{{ user.avatar }}</div>
      <template v-if="!editing">
        <div class="p-info">
          <div class="p-name">{{ user.name }}</div>
          <div class="muted">积分 ⭐ {{ user.points }} · 已解锁 {{ achievements.progress.unlocked }} 个成就</div>
        </div>
        <BaseButton variant="ghost" size="sm" @click="editing = true">编辑资料</BaseButton>
      </template>
      <template v-else>
        <div class="edit-form">
          <input v-model="nameInput" type="text" placeholder="家庭名称" />
          <div class="avatars">
            <button
              v-for="a in avatarOptions"
              :key="a"
              class="avatar-opt"
              :class="{ on: avatarInput === a }"
              @click="avatarInput = a"
            >
              {{ a }}
            </button>
          </div>
          <div class="edit-actions">
            <BaseButton variant="ghost" size="sm" @click="editing = false">取消</BaseButton>
            <BaseButton size="sm" @click="saveProfile">保存</BaseButton>
          </div>
        </div>
      </template>
    </div>

    <div class="grid grid-3">
      <div class="card">
        <div class="section-title">🥬 我的食材库存</div>
        <div class="stat-line"><span>食材种类</span><b>{{ inventory.items.length }}</b></div>
        <div class="stat-line"><span>库存总量</span><b>{{ inventory.totalQuantity }}</b></div>
        <div class="cat-list">
          <div v-for="c in CATEGORIES" :key="c" class="cat">
            <span>{{ CATEGORY_ICONS[c] }} {{ c }}</span>
            <b>{{ inventory.byCategory[c] || 0 }}</b>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-title">📅 食谱计划</div>
        <div class="stat-line"><span>菜谱总数</span><b>{{ mealPlan.totalDishes }}</b></div>
        <div class="stat-line"><span>本周已安排餐次</span><b>{{ mealPlan.plannedMeals }} / 21</b></div>
        <div class="stat-line"><span>采购完成轮次</span><b>{{ shopping.purchaseRounds }}</b></div>
        <div class="stat-line"><span>累计采购花费</span><b>¥{{ shopping.totalSpend.toFixed(1) }}</b></div>
      </div>

      <div class="card">
        <div class="section-title">🗑️ 浪费统计</div>
        <div class="stat-line"><span>过期食材</span><b>{{ inventory.expiredItems.length }}</b></div>
        <div class="stat-line"><span>临期食材</span><b>{{ inventory.nearExpiryItems.length }}</b></div>
        <div class="stat-line"><span>浪费率</span><b>{{ (stats.wasteRate * 100).toFixed(1) }}%</b></div>
        <div class="stat-line"><span>成就徽章</span><b>{{ achievements.progress.unlocked }} / {{ achievements.progress.total }}</b></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">🧾 采购记录</div>
      <div v-if="!shopping.history.length" class="muted">暂无采购记录</div>
      <div v-else class="history">
        <div v-for="h in shopping.history" :key="h.id" class="hist-row">
          <span class="muted">{{ fmt(h.date) }}</span>
          <span class="items">{{ h.items.map((i) => `${i.name}×${i.quantity}${i.unit}`).join('、') }}</span>
          <span class="total">¥{{ (h.total || 0).toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
h2 {
  margin-bottom: 16px;
}
.profile-card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.avatar-big {
  font-size: 56px;
}
.p-info {
  flex: 1;
}
.p-name {
  font-size: 20px;
  font-weight: 700;
}
.edit-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.edit-form input {
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
}
.avatars {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.avatar-opt {
  font-size: 24px;
  border: 2px solid transparent;
  background: var(--surface-2);
  border-radius: 10px;
  padding: 6px;
  cursor: pointer;
}
.avatar-opt.on {
  border-color: var(--primary);
  background: var(--primary-light);
}
.edit-actions {
  display: flex;
  gap: 8px;
}
.stat-line {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.stat-line:last-of-type {
  border-bottom: none;
}
.cat-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cat {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-2);
}
.cat b {
  color: var(--text);
}
.history {
  display: flex;
  flex-direction: column;
}
.hist-row {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.hist-row:last-child {
  border-bottom: none;
}
.hist-row .items {
  flex: 1;
  color: var(--text-2);
}
.total {
  font-weight: 600;
  color: var(--primary-dark);
}
</style>
