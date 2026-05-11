import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'Index', component: () => import('../views/Index.vue') },
    { path: '/home', name: 'Home', component: Home },
    { path: '/events-summary', name: 'EventsSummary', component: () => import('../views/EventsSummary.vue') },
    { path: '/account', name: 'Account', component: () => import('../views/Account.vue') },
    { path: '/family', name: 'Family', component: () => import('../views/Family.vue') },
    { path: '/event-detail/:id', name: 'EventDetail', component: () => import('../views/EventsDetail.vue') },
    { path: '/member/:id', name: 'MemberDetailWithId', component: () => import('../views/MemberDetail.vue') },
    { path: '/member-detail', name: 'MemberDetail', component: () => import('../views/MemberDetail.vue') },
    { path: '/china', name: 'China', component: () => import('../views/China.vue') }
  ]
})

router.beforeEach((to, from, next) => {
  try {
    const requiresAuth = to.path !== '/'
    let isLoggedIn = true
    try {
      isLoggedIn = !!localStorage.getItem('isLoggedIn') || true
    } catch (error) {
      isLoggedIn = true
    }
    if (requiresAuth && !isLoggedIn) next('/')
    else next()
  } catch (error) {
    next()
  }
})

export default router
