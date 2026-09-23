// 补货预测：基于消耗流水估算日均消耗速度、预计用完日期，生成补货提醒
import { toDateKey, diffDays } from './date'

// 采购清单 / 流水里的食材唯一键
export function refKey(name, unit) {
  return `${name}|${unit}`
}

// 聚合统计窗口内的消耗情况
// logs: [{ type: 'consume'|'restock', name, unit, quantity, date }]
// 返回 { [key]: { name, unit, ingredientId, total, days, ratePerDay, eventCount } }
export function buildConsumptionStats(logs, todayKey = toDateKey(), windowDays = 30) {
  const stats = {}
  logs.forEach((log) => {
    if (log.type !== 'consume') return
    if (diffDays(log.date, todayKey) > windowDays) return

    const key = refKey(log.name, log.unit)
    if (!stats[key]) {
      stats[key] = {
        name: log.name,
        unit: log.unit,
        ingredientId: log.ingredientId || null,
        total: 0,
        eventCount: 0,
        earliest: log.date,
        latest: log.date,
      }
    }
    const s = stats[key]
    s.total += Number(log.quantity || 0)
    s.eventCount += 1
    if (log.date < s.earliest) s.earliest = log.date
    if (log.date > s.latest) s.latest = log.date
  })

  Object.values(stats).forEach((s) => {
    // 首次消耗到今天的跨度，至少按 1 天计，避免单日记录算出极端速率
    const span = Math.max(1, diffDays(s.earliest, todayKey) + 1)
    // 不超过统计窗口本身（窗口内首次记录可能就发生在今天）
    s.days = Math.min(span, windowDays)
    s.ratePerDay = s.total / s.days
  })

  return stats
}

// 生成补货提醒列表
// items: 当前库存 [{ id, name, unit, quantity, category }]
// logs:  出入库流水
export function predictRestockAlerts(
  items,
  logs,
  {
    todayKey = toDateKey(),
    windowDays = 30,
    warnDays = 3,
    cycleDays = 7,
    staleDays = windowDays,
  } = {},
) {
  const stats = buildConsumptionStats(logs, todayKey, windowDays)
  const alerts = []

  // 库存中、按消耗速度即将用完的食材
  items.forEach((item) => {
    const s = stats[refKey(item.name, item.unit)]
    if (!s || s.ratePerDay <= 0) return
    const quantity = Math.max(0, Number(item.quantity || 0))
    const daysLeft = quantity / s.ratePerDay
    if (daysLeft > warnDays) return

    const suggested = Math.max(1, Math.ceil(s.ratePerDay * cycleDays - quantity))
    alerts.push({
      ingredientId: item.id,
      name: item.name,
      unit: item.unit,
      category: item.category,
      status: quantity <= 0 ? 'empty' : daysLeft < 1 ? 'today' : 'soon',
      inStock: quantity,
      ratePerDay: s.ratePerDay,
      daysLeft,
      runOutDate: addDays(todayKey, Math.floor(daysLeft)),
      suggested,
      dataWindowDays: s.days,
    })
  })

  // 已用完（库存归零）但近期还有消耗记录的食材
  const stockKeys = new Set(items.map((i) => refKey(i.name, i.unit)))
  Object.values(stats).forEach((s) => {
    if (stockKeys.has(refKey(s.name, s.unit))) return
    // 距最后一次消耗太久不再提醒，避免长期堆积无效项
    if (diffDays(s.latest, todayKey) > staleDays) return
    alerts.push({
      ingredientId: s.ingredientId || null,
      name: s.name,
      unit: s.unit,
      category: '',
      status: 'empty',
      inStock: 0,
      ratePerDay: s.ratePerDay,
      daysLeft: 0,
      runOutDate: s.latest,
      suggested: Math.max(1, Math.ceil(s.ratePerDay * cycleDays)),
      dataWindowDays: s.days,
    })
  })

  const rank = { empty: 0, today: 1, soon: 2 }
  alerts.sort((a, b) =>
    rank[a.status] - rank[b.status] || a.daysLeft - b.daysLeft || a.name.localeCompare(b.name),
  )
  return alerts
}

function addDays(dateKey, days) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
