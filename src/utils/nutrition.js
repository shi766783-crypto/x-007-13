// 营养评分：基于菜品类别映射到食物组，按平衡度给出 0-100 分

import { FOOD_GROUPS } from '@/constants'

// 将菜品类别映射到食物组
export function categoryToGroup(category) {
  for (const [group, cats] of Object.entries(FOOD_GROUPS)) {
    if (cats.includes(category)) return group
  }
  return '其他'
}

// 理想占比：蔬菜 50%、蛋白质 25%、主食 25%
const IDEAL = { 蛋白质: 0.25, 蔬菜: 0.5, 主食: 0.25 }

// 对一组菜品（每项含 category）计算营养平衡分
export function nutritionScore(dishes) {
  if (!dishes.length) return 0
  const count = { 蛋白质: 0, 蔬菜: 0, 主食: 0, 其他: 0 }
  dishes.forEach((d) => {
    const g = categoryToGroup(d.category)
    count[g] = (count[g] || 0) + 1
  })
  const total = dishes.length
  let score = 100
  for (const [group, ideal] of Object.entries(IDEAL)) {
    const actual = (count[group] || 0) / total
    score -= Math.abs(actual - ideal) * 100
  }
  // 多样性加分：覆盖核心组越多分越高（每多一组 +3，最多 +9）
  const coreGroups = ['蛋白质', '蔬菜', '主食'].filter((g) => (count[g] || 0) > 0)
  score += (coreGroups.length - 1) * 3
  return Math.max(0, Math.min(100, Math.round(score)))
}

// 评分等级文案
export function scoreLabel(score) {
  if (score >= 85) return { label: '优秀', color: '#4caf50' }
  if (score >= 70) return { label: '良好', color: '#8bc34a' }
  if (score >= 50) return { label: '一般', color: '#ff9800' }
  return { label: '失衡', color: '#ef5350' }
}

// 由菜品类别推断菜品的主导食物组（用于看板统计）
export function dishGroupRatio(dishes) {
  const groups = { 蛋白质: 0, 蔬菜: 0, 主食: 0, 其他: 0 }
  dishes.forEach((d) => {
    const g = categoryToGroup(d.category)
    groups[g] = (groups[g] || 0) + 1
  })
  const total = dishes.length || 1
  return {
    protein: groups['蛋白质'] / total,
    vegetable: groups['蔬菜'] / total,
    staple: groups['主食'] / total,
    other: groups['其他'] / total,
  }
}
