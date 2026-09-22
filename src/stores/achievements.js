import { defineStore } from 'pinia'
import { ACHIEVEMENTS } from '@/utils/achievements'
import { useInventoryStore } from './inventory'
import { useMealPlanStore } from './mealPlan'
import { useDietRecordStore } from './dietRecord'
import { useShoppingListStore } from './shoppingList'
import { useChallengeStore } from './challenge'
import { useUserStore } from './user'

export const useAchievementsStore = defineStore('achievements', {
  state: () => ({
    defs: ACHIEVEMENTS,
  }),

  getters: {
    // 汇聚各 store 的统计快照
    snapshot() {
      const inventory = useInventoryStore()
      const mealPlan = useMealPlanStore()
      const diet = useDietRecordStore()
      const shopping = useShoppingListStore()
      const challenge = useChallengeStore()
      const user = useUserStore()

      return {
        inventoryCount: inventory.items.length,
        weekExpiredCount: inventory.expiredItems.length,
        weekTrackedCount: inventory.items.length,
        totalDishes: mealPlan.totalDishes,
        actuaryPurchases: shopping.purchaseRounds,
        avgNutritionScore: diet.avgNutritionThisWeek,
        challengeCount: challenge.challengeCount,
        plannedMeals: mealPlan.plannedMeals,
        recordedMeals: diet.recordedMeals,
        totalPoints: user.points,
        purchaseRounds: shopping.purchaseRounds,
        maxStreak: diet.maxStreak,
      }
    },

    unlocked() {
      const s = this.snapshot
      return this.defs.filter((a) => {
        try {
          return a.check(s)
        } catch {
          return false
        }
      })
    },

    locked() {
      const unlockedIds = new Set(this.unlocked.map((a) => a.id))
      return this.defs.filter((a) => !unlockedIds.has(a.id))
    },

    progress() {
      const total = this.defs.length
      const unlocked = this.unlocked.length
      return { total, unlocked, percent: total ? Math.round((unlocked / total) * 100) : 0 }
    },
  },
})
