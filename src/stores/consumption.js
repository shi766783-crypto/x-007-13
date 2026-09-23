import { defineStore } from 'pinia'
import { read, write } from '@/utils/storage'
import { uid } from '@/utils/id'
import { toDateKey, diffDays } from '@/utils/date'
import { CONSUMPTION_WINDOW_DAYS, CONSUMPTION_MIN_LOGS } from '@/constants'

const STORAGE_KEY = 'consumption-logs'
// 超出窗口后保留的最大记录数（防止极端情况下存储膨胀）
const MAX_LOGS = 2000

// 消耗日志结构：
// { id, ingredientId, name, unit, quantity, date(YYYY-MM-DD), createdAt }

export const useConsumptionStore = defineStore('consumption', {
  state: () => ({
    logs: read(STORAGE_KEY, []),
  }),

  actions: {
    persist() {
      write(STORAGE_KEY, this.logs)
    },

    // 记录一次食材消耗
    record({ ingredientId, name, unit, quantity }, date = new Date()) {
      const amount = Number(quantity)
      if (!name || !(amount > 0)) return
      this.logs.push({
        id: uid('cons'),
        ingredientId: ingredientId || null,
        name,
        unit,
        quantity: amount,
        date: toDateKey(date),
        createdAt: new Date().toISOString(),
      })
      this.prune()
      this.persist()
    },

    // 清理统计窗口之外的旧记录
    prune(today = new Date()) {
      const cutoff = new Date(today)
      cutoff.setDate(cutoff.getDate() - CONSUMPTION_WINDOW_DAYS)
      const cutoffKey = toDateKey(cutoff)
      this.logs = this.logs.filter((l) => l.date >= cutoffKey)
      if (this.logs.length > MAX_LOGS) {
        this.logs = this.logs.slice(-MAX_LOGS)
      }
    },

    // 匹配某食材的消耗记录：优先按 id，id 缺失时按 名称+单位
    logsOf({ id, name, unit }) {
      return this.logs.filter(
        (l) => (id && l.ingredientId === id) || (l.name === name && l.unit === unit),
      )
    },

    // 计算某食材的消耗速度统计
    // { ratePerDay, total, count, spanDays, reliable }
    statFor(ref, today = new Date()) {
      const todayKey = toDateKey(today)
      const matched = this.logsOf(ref)
      const inWindow = matched.filter((l) => diffDays(l.date, todayKey) <= CONSUMPTION_WINDOW_DAYS)
      const total = inWindow.reduce((s, l) => s + Number(l.quantity || 0), 0)
      const count = inWindow.length

      if (!count) return { ratePerDay: 0, total: 0, count: 0, spanDays: 0, reliable: false }

      // 跨度：从最早一次消耗到今天，至少计 1 天，避免单日消耗导致速度虚高
      const firstDate = inWindow.reduce((min, l) => (l.date < min ? l.date : min), inWindow[0].date)
      const spanDays = Math.max(1, diffDays(firstDate, todayKey))

      return {
        ratePerDay: total / spanDays,
        total,
        count,
        spanDays,
        // 跨天的 2 次及以上记录才认为估算可靠
        reliable: count >= CONSUMPTION_MIN_LOGS && spanDays >= 2,
      }
    },
  },
})
