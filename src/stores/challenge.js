import { defineStore } from 'pinia'
import { read, write } from '@/utils/storage'
import { uid } from '@/utils/id'
import { useUserStore } from './user'
import { CHALLENGE_POINTS } from '@/constants'

const KEY = 'challenges'

export const useChallengeStore = defineStore('challenge', {
  state: () => ({
    completed: read(KEY, []), // [{ id, ingredientId, ingredientName, dishName, points, date }]
  }),

  getters: {
    challengeCount: (state) => state.completed.length,
    // 已完成挑战的食材 id 集合（用于判断是否还能挑战）
    completedIngredientIds() {
      return new Set(this.completed.map((c) => c.ingredientId))
    },
  },

  actions: {
    persist() {
      write(KEY, this.completed)
    },

    complete({ ingredientId, ingredientName, dishName }) {
      const user = useUserStore()
      const record = {
        id: uid('ch'),
        ingredientId,
        ingredientName,
        dishName,
        points: CHALLENGE_POINTS,
        date: new Date().toISOString(),
      }
      this.completed.unshift(record)
      user.addPoints(CHALLENGE_POINTS)
      this.persist()
      return record
    },
  },
})
