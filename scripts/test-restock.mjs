import { createPinia, setActivePinia } from 'pinia'
import { useInventoryStore } from '@/stores/inventory'
import { useConsumptionStore } from '@/stores/consumption'
import { useShoppingListStore } from '@/stores/shoppingList'
import { toDateKey } from '@/utils/date'

// ---- 内存版 localStorage ----
const mem = {}
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v) },
  removeItem: (k) => { delete mem[k] },
}

setActivePinia(createPinia())
const inventory = useInventoryStore()
const consumption = useConsumptionStore()
const shopping = useShoppingListStore()

const now = new Date()

let pass = 0
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log('  ✅', name) }
  else { console.error('  ❌', name, extra); process.exitCode = 1 }
}

// ---- 场景：番茄，最近 10 天共消耗 8 个（跨天 ≥2 次，可靠）----
const tomato = inventory.addItem({
  name: '番茄', category: '蔬菜', quantity: 2, unit: '个',
  purchaseDate: toDateKey(), shelfLifeDays: 7, location: '冷藏',
})
for (const d of [10, 7, 4, 1]) {
  const day = new Date(now); day.setDate(now.getDate() - d)
  consumption.record({ ingredientId: tomato.id, name: '番茄', unit: '个', quantity: 2 }, day)
}
// 速度: 8 / 10 = 0.8/天；库存 2 → 2.5 天后用完 → 3 天阈值应预警
const alerts3 = inventory.restockAlerts(3)
const tAlert = alerts3.find((a) => a.id === tomato.id)
check('番茄出现在 3 天补货预警中', !!tAlert)
check('番茄日均速度≈0.8', tAlert && Math.abs(tAlert.ratePerDay - 0.8) < 1e-9, `got ${tAlert?.ratePerDay}`)
check('番茄剩余天数=2.5', tAlert && Math.abs(tAlert.daysLeft - 2.5) < 1e-9, `got ${tAlert?.daysLeft}`)
check('估算标记为可靠', tAlert && tAlert.reliable === true)
check('建议补货量=0.8*7-2=3.6', tAlert && Math.abs(tAlert.suggested - 3.6) < 1e-9, `got ${tAlert?.suggested}`)
check('番茄不紧急（>1天）', tAlert && tAlert.urgent === false)

// 1 天阈值不应包含番茄（2.5 天）
check('1 天阈值不包含番茄', !inventory.restockAlerts(1).some((a) => a.id === tomato.id))

// ---- 场景：鸡蛋，库存 0.5 个、速度 1/天 → 今天内用完，紧急 ----
const egg = inventory.addItem({
  name: '鸡蛋', category: '蛋奶', quantity: 0.5, unit: '个',
  purchaseDate: toDateKey(), shelfLifeDays: 30, location: '冷藏',
})
consumption.record({ ingredientId: egg.id, name: '鸡蛋', unit: '个', quantity: 2 }, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2))
consumption.record({ ingredientId: egg.id, name: '鸡蛋', unit: '个', quantity: 1 }, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
const eAlert = inventory.restockAlerts(3).find((a) => a.id === egg.id)
check('鸡蛋紧急（≤1天）', eAlert && eAlert.urgent === true, `daysLeft=${eAlert?.daysLeft}`)

// ---- 场景：盐，从无消耗记录，不预警 ----
inventory.addItem({
  name: '盐', category: '调料', quantity: 1, unit: '袋',
  purchaseDate: toDateKey(), shelfLifeDays: 365, location: '常温',
})
check('无消耗记录的盐不预警', !inventory.restockAlerts(7).some((a) => a.name === '盐'))

// ---- 场景：仅 1 条记录 → 参与估算但不可靠 ----
const beef = inventory.addItem({
  name: '牛肉', category: '肉类', quantity: 5, unit: '克',
  purchaseDate: toDateKey(), shelfLifeDays: 5, location: '冷冻',
})
consumption.record({ ingredientId: beef.id, name: '牛肉', unit: '克', quantity: 10 }, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
const bStat = consumption.statFor(beef)
check('单条记录不可靠', bStat.reliable === false)
check('单条记录速度=10/天', Math.abs(bStat.ratePerDay - 10) < 1e-9)

// ---- consume() 会自动记录日志，归零删除 ----
const milk = inventory.addItem({
  name: '牛奶', category: '蛋奶', quantity: 3, unit: '盒',
  purchaseDate: toDateKey(), shelfLifeDays: 10, location: '冷藏',
})
inventory.consume(milk.id, 1)
check('消耗后库存为 2', inventory.items.find((i) => i.id === milk.id)?.quantity === 2)
check('consume 自动写日志', consumption.logsOf(milk).length === 1)
inventory.consume(milk.id, 5) // 超出库存只记实际量，归零删除
check('超量消耗按实际库存记录', consumption.logsOf(milk).reduce((s, l) => s + l.quantity, 0) === 3)
check('归零后食材移除', !inventory.items.find((i) => i.id === milk.id))

// ---- 一键加入采购清单（用最终的预警列表：鸡蛋、牛肉、番茄）----
const finalAlerts = inventory.restockAlerts(3)
check('最终预警共 3 种', finalAlerts.length === 3, `got ${finalAlerts.length}`)
check('预警按紧急程度排序（鸡蛋最前）', finalAlerts[0].id === egg.id, `first=${finalAlerts[0]?.name}`)

const before = shopping.items.length
const res = shopping.addRestockItems(finalAlerts.map((a) => ({
  ingredientId: a.id, name: a.name, unit: a.unit, category: a.category,
  quantity: a.quantity, suggested: a.suggested,
})))
check('加入后清单新增条目', shopping.items.length - before === finalAlerts.length,
  `added=${shopping.items.length - before}, alerts=${finalAlerts.length}`)
check('返回新增数=预警数', res.added === finalAlerts.length, JSON.stringify(res))
const tomatoInList = shopping.items.find((i) => i.ingredientId === tomato.id)
check('番茄条目缺口=3.6', Math.abs(tomatoInList.gap - 3.6) < 1e-9)
check('番茄标记为补货来源', tomatoInList.source === 'restock')
check('hasPending 识别已在清单', shopping.hasPending('番茄', '个', tomato.id) === true)

// ---- 再次加入：合并而非重复 ----
const res2 = shopping.addRestockItems([{
  ingredientId: tomato.id, name: '番茄', unit: '个', category: '蔬菜', quantity: 2, suggested: 3.6,
}])
check('重复加入触发合并', res2.merged === 1 && res2.added === 0)
check('合并后缺口=7.2', Math.abs(shopping.items.find((i) => i.ingredientId === tomato.id).gap - 7.2) < 1e-9)
check('合并后只有一条番茄', shopping.items.filter((i) => i.ingredientId === tomato.id).length === 1)

// ---- 已采购项不参与合并（应新增）----
shopping.items.forEach((i) => { if (i.ingredientId === tomato.id) i.purchased = true })
const res3 = shopping.addRestockItems([{
  ingredientId: tomato.id, name: '番茄', unit: '个', category: '蔬菜', quantity: 2, suggested: 1,
}])
check('已采购项不合并、新建条目', res3.added === 1)

// ---- 预警按名称+单位兜底匹配（无 id 的食材也能合并）----
const eggGapBefore = shopping.items.find((i) => i.name === '鸡蛋' && !i.purchased).gap
const res4 = shopping.addRestockItems([
  { ingredientId: null, name: '鸡蛋', unit: '个', category: '蛋奶', quantity: 0.5, suggested: 10 },
  { ingredientId: null, name: '鸡蛋', unit: '个', category: '蛋奶', quantity: 0.5, suggested: 10 },
])
// 同一批次里的两条相同食材应都合并到已有行，不产生新条目
check('无 id 时按名称+单位匹配并合并', res4.added === 0 && res4.merged === 2, JSON.stringify(res4))
check('合并后仍只有一条待采购鸡蛋', shopping.items.filter((i) => i.name === '鸡蛋' && !i.purchased).length === 1)
check('鸡蛋缺口累加 +20', Math.abs(shopping.items.find((i) => i.name === '鸡蛋' && !i.purchased).gap - (eggGapBefore + 20)) < 1e-9)

console.log(`\n${pass} 项检查全部通过`)
