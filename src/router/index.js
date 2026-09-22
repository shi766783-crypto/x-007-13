import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: '首页' } },
  { path: '/inventory', name: 'inventory', component: () => import('@/views/InventoryView.vue'), meta: { title: '食材库存' } },
  { path: '/meal-plan', name: 'meal-plan', component: () => import('@/views/MealPlanView.vue'), meta: { title: '每周食谱计划' } },
  { path: '/shopping', name: 'shopping', component: () => import('@/views/ShoppingListView.vue'), meta: { title: '采购清单' } },
  { path: '/diet', name: 'diet', component: () => import('@/views/DietRecordView.vue'), meta: { title: '每日饮食记录' } },
  { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: '饮食看板' } },
  { path: '/challenge', name: 'challenge', component: () => import('@/views/ChallengeView.vue'), meta: { title: '冰箱清理挑战' } },
  { path: '/achievements', name: 'achievements', component: () => import('@/views/AchievementsView.vue'), meta: { title: '成就徽章' } },
  { path: '/leaderboard', name: 'leaderboard', component: () => import('@/views/LeaderboardView.vue'), meta: { title: '排行榜' } },
  { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue'), meta: { title: '个人中心' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · 家庭饮食管家` : '家庭饮食计划与食材管家'
})

export default router
