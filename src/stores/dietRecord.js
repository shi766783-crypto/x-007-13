import { defineStore } from 'pinia'
import { read, write } from '@/utils/storage'
import { uid } from '@/utils/id'
import { nutritionScore } from '@/utils/nutrition'
import { toDateKey, weekDateKeys, isConsecutive } from '@/utils/date'

const KEY = 'diet-records'

export const useDietRecordStore = defineStore('dietRecord', {
  state: () => ({
    records: read(KEY, []), // [{ id, date, meal, dishes: [{ name, category }] }]
  }),

  getters: {
    recordedMeals: (state) => state.records.length,

    // 按日期分组的记录
    byDate() {
      const map = {}
      this.records.forEach((r) => {
        if (!map[r.date]) map[r.date] = []
        map[r.date].push(r)
      })
      return map
    },

    // 某日某餐次的菜品
    mealDishes: (state) => (date, meal) => {
      const rec = state.records.find((r) => r.date === date && r.meal === meal)
      return rec ? rec.dishes : []
    },

    // 每日营养评分
    dailyScores() {
      const map = {}
      this.records.forEach((r) => {
        if (!map[r.date]) map[r.date] = []
        map[r.date].push(...r.dishes)
      })
      const scores = {}
      Object.entries(map).forEach(([date, dishes]) => {
        scores[date] = nutritionScore(dishes)
      })
      return scores
    },

    // 本周平均营养评分
    avgNutritionThisWeek() {
      const days = weekDateKeys()
      const scores = this.dailyScores
      const vals = days.map((d) => scores[d]).filter((s) => s !== undefined)
      if (!vals.length) return 0
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    },

    // 连续记录天数（最长连续）
    maxStreak() {
      const dates = [...new Set(this.records.map((r) => r.date))].sort()
      if (!dates.length) return 0
      let streak = 1
      let max = 1
      for (let i = 1; i < dates.length; i++) {
        if (isConsecutive(dates[i], dates[i - 1])) {
          streak++
          max = Math.max(max, streak)
        } else {
          streak = 1
        }
      }
      return max
    },

    // 营养评分趋势（最近 N 天）
    nutritionTrend: (state) => (n = 7) => {
      const end = new Date()
      const arr = []
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date(end)
        d.setDate(end.getDate() - i)
        const key = toDateKey(d)
        const dishes = state.records.filter((r) => r.date === key).flatMap((r) => r.dishes)
        arr.push({ date: key, score: dishes.length ? nutritionScore(dishes) : 0 })
      }
      return arr
    },
  },

  actions: {
    persist() {
      write(KEY, this.records)
    },

    addRecord(date, meal, dishes) {
      const rec = {
        id: uid('rec'),
        date,
        meal,
        dishes: dishes.map((d) => ({ name: d.name, category: d.category || '其他' })),
      }
      this.records.push(rec)
      this.persist()
      return rec
    },

    updateRecord(id, dishes) {
      const rec = this.records.find((r) => r.id === id)
      if (!rec) return
      rec.dishes = dishes.map((d) => ({ name: d.name, category: d.category || '其他' }))
      this.persist()
    },

    removeRecord(id) {
      this.records = this.records.filter((r) => r.id !== id)
      this.persist()
    },

    // 快捷记录：从食谱计划导入当日菜品
    importFromPlan(date, meal, dishList) {
      this.addRecord(date, meal, dishList.map((d) => ({ name: d.name, category: d.category })))
    },
  },
})
