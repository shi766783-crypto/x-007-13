import { defineStore } from 'pinia'
import { useInventoryStore } from './inventory'
import { useMealPlanStore } from './mealPlan'
import { useDietRecordStore } from './dietRecord'
import { useShoppingListStore } from './shoppingList'
import { useUserStore } from './user'
import { weekDateKeys } from '@/utils/date'
import { BOTS } from '@/data/bots'

export const useStatsStore = defineStore('stats', {
  getters: {
    // 本周计划完成率 = 本周已记录餐次 / 本周已计划餐次
    weekCompletionRate() {
      const mealPlan = useMealPlanStore()
      const diet = useDietRecordStore()
      const planned = mealPlan.plannedMeals
      if (!planned) return 0
      const weekSet = new Set(weekDateKeys())
      const recorded = diet.records.filter((r) => weekSet.has(r.date)).length
      return Math.min(100, Math.round((recorded / planned) * 100))
    },

    // 食材浪费率 = 过期数量 / 采购总量
    wasteRate() {
      const inventory = useInventoryStore()
      const total = inventory.items.length
      if (!total) return 0
      return inventory.expiredItems.length / total
    },

    expiredCount: () => useInventoryStore().expiredItems.length,
    inventoryCount: () => useInventoryStore().items.length,

    totalSpend: () => useShoppingListStore().totalSpend,
    weeklySpend: () => useShoppingListStore().weeklySpend,

    nutritionTrend: () => useDietRecordStore().nutritionTrend(7),
    avgNutritionThisWeek: () => useDietRecordStore().avgNutritionThisWeek,

    // 节约达人榜（浪费率从低到高）
    saverLeaderboard() {
      const inventory = useInventoryStore()
      const myWaste = inventory.items.length ? inventory.expiredItems.length / inventory.items.length : 0
      const rows = BOTS.map((b) => ({
        name: b.name,
        avatar: b.avatar,
        wasteRate: b.wasteRate,
        isMe: false,
      }))
      rows.push({ name: useUserStore().name, avatar: useUserStore().avatar, wasteRate: myWaste, isMe: true })
      return rows.sort((a, b) => a.wasteRate - b.wasteRate)
    },

    // 食谱创意榜（发布菜谱数量从高到低）
    recipeLeaderboard() {
      const mealPlan = useMealPlanStore()
      const rows = BOTS.map((b) => ({
        name: b.name,
        avatar: b.avatar,
        recipeCount: b.recipeCount,
        isMe: false,
      }))
      rows.push({
        name: useUserStore().name,
        avatar: useUserStore().avatar,
        recipeCount: mealPlan.totalDishes,
        isMe: true,
      })
      return rows.sort((a, b) => b.recipeCount - a.recipeCount)
    },
  },
})
