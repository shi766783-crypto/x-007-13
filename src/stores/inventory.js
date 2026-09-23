import { defineStore } from 'pinia'
import { read, write } from '@/utils/storage'
import { uid } from '@/utils/id'
import { remainingDays, toDateKey } from '@/utils/date'
import { EXPIRY_WARN_DAYS, RESTOCK_WARN_DAYS, CONSUMPTION_WINDOW_DAYS, RESTOCK_CYCLE_DAYS } from '@/constants'
import { predictRestockAlerts } from '@/utils/restock'

const STORAGE_KEY = 'inventory'
const LOG_KEY = 'inventory-logs'
const LOG_MAX = 500

function createItem(data) {
  return {
    id: uid('ing'),
    name: '',
    category: '蔬菜',
    quantity: 1,
    unit: '个',
    purchaseDate: '',
    shelfLifeDays: 7,
    location: '冷藏',
    note: '',
    photo: '',
    ...data,
  }
}

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    items: read(STORAGE_KEY, []),
    // 出入库流水 [{ id, type: 'consume'|'restock', ingredientId, name, unit, quantity, date }]
    logs: read(LOG_KEY, []),
  }),

  getters: {
    // 附带剩余保质期与状态的列表
    withExpiry(state) {
      const today = new Date()
      return state.items.map((item) => {
        const remain = remainingDays(item.purchaseDate, item.shelfLifeDays, today)
        let status = 'fresh'
        if (remain < 0) status = 'expired'
        else if (remain <= EXPIRY_WARN_DAYS) status = 'near'
        return { ...item, remain, status }
      })
    },
    expiredItems() {
      return this.withExpiry.filter((i) => i.status === 'expired')
    },
    nearExpiryItems() {
      return this.withExpiry.filter((i) => i.status === 'near')
    },
    freshItems() {
      return this.withExpiry.filter((i) => i.status === 'fresh')
    },
    // 按类别统计
    byCategory() {
      const map = {}
      this.items.forEach((i) => {
        map[i.category] = (map[i.category] || 0) + 1
      })
      return map
    },
    totalQuantity() {
      return this.items.reduce((sum, i) => sum + Number(i.quantity || 0), 0)
    },

    // 补货提醒：根据历史消耗速度估算，列出即将用完 / 已用完的食材
    restockAlerts(state) {
      return predictRestockAlerts(state.items, state.logs, {
        warnDays: RESTOCK_WARN_DAYS,
        windowDays: CONSUMPTION_WINDOW_DAYS,
        cycleDays: RESTOCK_CYCLE_DAYS,
      })
    },
  },

  actions: {
    persist() {
      write(STORAGE_KEY, this.items)
    },

    persistLogs() {
      write(LOG_KEY, this.logs)
    },

    // 记录出入库流水（仅记录有实际数量变化的事件）
    addLog(type, { id, name, unit, quantity }, date = toDateKey()) {
      const qty = Number(quantity)
      if (!qty || qty <= 0) return
      this.logs.unshift({
        id: uid('log'),
        type,
        ingredientId: id || null,
        name,
        unit,
        quantity: qty,
        date,
      })
      // 控制体积，仅保留最近 LOG_MAX 条
      if (this.logs.length > LOG_MAX) this.logs = this.logs.slice(0, LOG_MAX)
      this.persistLogs()
    },

    addItem(data) {
      const item = createItem(data)
      this.items.unshift(item)
      this.persist()
      return item
    },

    updateItem(id, patch) {
      const idx = this.items.findIndex((i) => i.id === id)
      if (idx === -1) return
      this.items[idx] = { ...this.items[idx], ...patch }
      this.persist()
    },

    removeItem(id) {
      this.items = this.items.filter((i) => i.id !== id)
      this.persist()
    },

    // 消耗食材（减少数量，归零则删除），并记录消耗流水用于消耗速度估算
    consume(id, amount = 1) {
      const item = this.items.find((i) => i.id === id)
      if (!item) return
      const used = Math.min(Number(item.quantity), Number(amount))
      const next = Number(item.quantity) - Number(amount)
      if (next <= 0) this.removeItem(id)
      else this.updateItem(id, { quantity: next })
      this.addLog('consume', {
        id: item.id,
        name: item.name,
        unit: item.unit,
        quantity: used,
      })
    },

    // 入库（增加数量），不存在则新建
    restock({ name, unit, quantity, category = '其他', location = '常温', shelfLifeDays = 7 }) {
      const exist = this.items.find(
        (i) => i.name === name && i.unit === unit,
      )
      if (exist) {
        this.updateItem(exist.id, { quantity: Number(exist.quantity) + Number(quantity) })
        this.addLog('restock', { id: exist.id, name, unit, quantity })
      } else {
        const item = this.addItem({
          name,
          unit,
          quantity,
          category,
          location,
          shelfLifeDays,
          purchaseDate: new Date().toISOString().slice(0, 10),
        })
        this.addLog('restock', { id: item.id, name, unit, quantity })
      }
    },

    // 通过名称/单位查找库存（用于采购缺口对比）
    findByRef(ref) {
      if (ref.ingredientId) {
        const byId = this.items.find((i) => i.id === ref.ingredientId)
        if (byId) return byId
      }
      return this.items.find((i) => i.name === ref.name && i.unit === ref.unit)
    },
  },
})
