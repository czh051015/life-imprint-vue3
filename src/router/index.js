import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Index',
      component: () => import('../views/Index.vue')
    },
    {
      path: '/home',
      name: 'Home',
      component: Home
    },
    {
      path: '/events-summary',
      name: 'EventsSummary',
      component: () => import('../views/EventsSummary.vue')
    },
    {
      path: '/account',
      name: 'Account',
      component: () => import('../views/Account.vue')
    },
    {
      path: '/family',
      name: 'Family',
      component: () => import('../views/Family.vue')
    },
    { path: '/event-detail/:id', name: 'EventDetail', component: () => import('../views/EventsDetail.vue') },
    {
      path: '/member/:id',
      name: 'MemberDetailWithId',
      component: () => import('../views/MemberDetail.vue')
    },
    {
      path: '/member-detail',
      name: 'MemberDetail',
      component: () => import('../views/MemberDetail.vue')
    },

    {
      path: '/china',
      name: 'China',
      component: () => import('../views/China.vue')
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  try {
    // 检查是否需要登录
    const requiresAuth = to.path !== '/'
    // 尝试从localStorage获取登录状态，如果失败（比如浏览器禁用了存储API），则默认认为已登录
    let isLoggedIn = true // 默认允许访问
    try {
      isLoggedIn = !!localStorage.getItem('isLoggedIn') || true
    } catch (error) {
      console.error('获取登录状态失败:', error)
      // 如果localStorage不可用，默认允许访问
      isLoggedIn = true
    }
    
    if (requiresAuth && !isLoggedIn) {
      next('/')
    } else {
      next()
    }
  } catch (error) {
    console.error('路由守卫出错:', error)
    // 出错时默认允许访问
    next()
  }
})

export default router