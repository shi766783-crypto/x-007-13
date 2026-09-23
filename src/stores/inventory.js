import { defineStore } from 'pinia'
import { read, write } from '@/utils/storage'
import { uid } from '@/utils/id'
import { remainingDays, toDateKey, addDaysKey } from '@/utils/date'
import { EXPIRY_WARN_DAYS, RESTOCK_WARN_DAYS, RESTOCK_TARGET_DAYS } from '@/constants'
import { useConsumptionStore } from './consumption'

const STORAGE_KEY = 'inventory'

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

    // 补货提醒：根据历史消耗速度估算预计用完日期，返回提前预警的食材
    // 用法：inventory.restockAlerts(3)
    restockAlerts() {
      return (warnDays = RESTOCK_WARN_DAYS) => {
        const consumption = useConsumptionStore()
        const today = new Date()
        const todayKey = toDateKey(today)

        return this.items
          .map((item) => {
            const stat = consumption.statFor(item, today)
            if (!stat.count || !(stat.ratePerDay > 0)) return null

            const quantity = Number(item.quantity || 0)
            const daysLeft = quantity / stat.ratePerDay
            // 建议补货量 = 目标周期用量 - 当前库存（至少补一天的用量）
            const suggested = Math.max(
              stat.ratePerDay,
              stat.ratePerDay * RESTOCK_TARGET_DAYS - quantity,
            )

            return {
              ...item,
              ratePerDay: stat.ratePerDay,
              consumedTotal: stat.total,
              consumedCount: stat.count,
              reliable: stat.reliable,
              daysLeft,
              runOutDate: addDaysKey(todayKey, Math.floor(daysLeft)),
              suggested,
              urgent: daysLeft <= 1,
            }
          })
          .filter((a) => a && a.daysLeft <= warnDays)
          .sort((a, b) => a.daysLeft - b.daysLeft)
      }
    },
  },

  actions: {
    persist() {
      write(STORAGE_KEY, this.items)
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

    // 消耗食材（减少数量，归零则删除），同时记录一条消耗历史
    consume(id, amount = 1) {
      const item = this.items.find((i) => i.id === id)
      if (!item) return
      const used = Math.min(Number(item.quantity), Number(amount))
      if (!(used > 0)) return

      useConsumptionStore().record({
        ingredientId: item.id,
        name: item.name,
        unit: item.unit,
        quantity: used,
      })

      const next = Number(item.quantity) - used
      if (next <= 0) this.removeItem(id)
      else {
        const idx = this.items.findIndex((i) => i.id === id)
        this.items[idx] = { ...item, quantity: next }
        this.persist()
      }
    },

    // 入库（增加数量），不存在则新建
    restock({ name, unit, quantity, category = '其他', location = '常温', shelfLifeDays = 7 }) {
      const exist = this.items.find(
        (i) => i.name === name && i.unit === unit,
      )
      if (exist) {
        this.updateItem(exist.id, { quantity: Number(exist.quantity) + Number(quantity) })
      } else {
        this.addItem({
          name,
          unit,
          quantity,
          category,
          location,
          shelfLifeDays,
          purchaseDate: new Date().toISOString().slice(0, 10),
        })
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
