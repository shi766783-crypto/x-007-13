import { defineStore } from 'pinia'
import { read, write } from '@/utils/storage'
import { uid } from '@/utils/id'
import { useInventoryStore } from './inventory'
import { useMealPlanStore } from './mealPlan'

const LIST_KEY = 'shopping-list'
const HISTORY_KEY = 'shopping-history'

export const useShoppingListStore = defineStore('shoppingList', {
  state: () => ({
    items: read(LIST_KEY, []),
    history: read(HISTORY_KEY, []), // 采购记录 [{ id, date, items, total }]
  }),

  getters: {
    activeItems: (state) => state.items.filter((i) => !i.purchased),
    purchasedItems: (state) => state.items.filter((i) => i.purchased),
    // 本轮采购轮次（完成次数）
    purchaseRounds: (state) => state.history.length,
    // 总花费
    totalSpend: (state) => state.history.reduce((s, h) => s + Number(h.total || 0), 0),
    weeklySpend() {
      const now = new Date()
      const start = new Date(now)
      const day = now.getDay()
      start.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      start.setHours(0, 0, 0, 0)
      return this.history
        .filter((h) => new Date(h.date) >= start)
        .reduce((s, h) => s + Number(h.total || 0), 0)
    },
    // 缺口总额（未采购项）
    totalGap: (state) =>
      state.items.filter((i) => !i.purchased).reduce((s, i) => s + Number(i.gap || 0), 0),
  },

  actions: {
    persist() {
      write(LIST_KEY, this.items)
      write(HISTORY_KEY, this.history)
    },

    // 根据本周食谱计划与库存生成采购清单
    generate() {
      const mealPlan = useMealPlanStore()
      const inventory = useInventoryStore()
      const requirements = mealPlan.weeklyRequirements

      this.items = requirements
        .map((req) => {
          const inStock = inventory.findByRef(req)
          const available = inStock ? Number(inStock.quantity || 0) : 0
          const gap = Math.max(0, req.required - available)
          return {
            id: uid('shop'),
            name: req.name,
            unit: req.unit,
            ingredientId: req.ingredientId,
            required: req.required,
            inStock: available,
            gap,
            price: 0,
            purchased: false,
            createdAt: new Date().toISOString(),
          }
        })
        .filter((i) => i.gap > 0)

      this.persist()
      return this.items
    },

    // 标记已采购并自动入库
    markPurchased(ids) {
      const inventory = useInventoryStore()
      const targets = this.items.filter((i) => ids.includes(i.id) && !i.purchased)

      targets.forEach((i) => {
        inventory.restock({
          name: i.name,
          unit: i.unit,
          quantity: i.gap,
          category: i.category || '其他',
        })
        i.purchased = true
      })

      const total = targets.reduce((s, i) => s + Number(i.price || 0), 0)
      if (targets.length) {
        this.history.unshift({
          id: uid('purchase'),
          date: new Date().toISOString(),
          items: targets.map((t) => ({ name: t.name, unit: t.unit, quantity: t.gap, price: t.price })),
          total,
        })
      }
      this.persist()
      return targets.length
    },

    // 全部标记已采购
    markAllPurchased() {
      const ids = this.activeItems.map((i) => i.id)
      return this.markPurchased(ids)
    },

    // 将补货提醒的食材一键加入采购清单（已存在的待采购项自动合并数量）
    // entries: [{ ingredientId, name, unit, category, suggested, daysLeft }]
    addRestockItems(entries) {
      let added = 0
      let merged = 0
      const round2 = (n) => Math.round(n * 100) / 100

      entries.forEach((e) => {
        const amount = round2(Number(e.suggested) || 0)
        if (!(amount > 0)) return

        const exist = this.items.find(
          (i) =>
            !i.purchased &&
            ((e.ingredientId && i.ingredientId === e.ingredientId) ||
              (i.name === e.name && i.unit === e.unit)),
        )

        if (exist) {
          // 已在清单中：在缺口上累加建议补货量
          exist.gap = round2(Number(exist.gap || 0) + amount)
          if (typeof exist.required === 'number') exist.required = round2(exist.required + amount)
          merged++
        } else {
          this.items.push({
            id: uid('shop'),
            name: e.name,
            unit: e.unit,
            ingredientId: e.ingredientId || null,
            category: e.category || '其他',
            required: amount,
            inStock: Number(e.quantity || 0),
            gap: amount,
            source: 'restock',
            price: 0,
            purchased: false,
            createdAt: new Date().toISOString(),
          })
          added++
        }
      })

      this.persist()
      return { added, merged }
    },

    // 某食材是否已在待采购清单中（用于提醒卡片去重显示）
    hasPending(name, unit, ingredientId = null) {
      return this.items.some(
        (i) =>
          !i.purchased &&
          ((ingredientId && i.ingredientId === ingredientId) ||
            (i.name === name && i.unit === unit)),
      )
    },

    clearCompleted() {
      this.items = this.items.filter((i) => !i.purchased)
      this.persist()
    },

    resetList() {
      this.items = []
      this.persist()
    },
  },
})
