import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Shop from '../views/Shop.vue'
import Payment from '../views/Payment.vue'
import Settings from '../views/Settings.vue'
import Admin from '../views/Admin.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: to => {
        // Check if user has a token stored
        const token = localStorage.getItem('auth_token')
        return token ? '/shop' : '/login'
      }
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/register',
      name: 'register',
      component: Register
    },
    {
      path: '/shop',
      name: 'shop',
      component: Shop,
      meta: { requiresAuth: true }
    },
    {
      path: '/payment',
      name: 'payment',
      component: Payment,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: Admin,
      meta: { requiresAuth: true, requiresAdmin: true }
    }
  ]
})

// Route guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // If the route requires auth, check authentication
  if (to.meta.requiresAuth) {
    // If user is already logged in, check permissions
    if (authStore.isLoggedIn) {
      // Check admin permissions if required
      if (to.meta.requiresAdmin && !authStore.isAdmin) {
        next('/shop') // Redirect non-admin users to shop
        return
      }
      next()
      return
    }
    
    // If there's a token but user isn't logged in, try to initialize auth
    if (authStore.user === null && localStorage.getItem('auth_token')) {
      try {
        await authStore.initialize()
        // After initialization, check if login was successful
        if (authStore.isLoggedIn) {
          // Check admin permissions if required
          if (to.meta.requiresAdmin && !authStore.isAdmin) {
            next('/shop') // Redirect non-admin users to shop
            return
          }
          next()
          return
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
      }
    }
    
    // No valid authentication, redirect to login
    next('/login')
  } else {
    // Route doesn't require auth
    if (to.path === '/login' && authStore.isLoggedIn) {
      // If user is logged in and trying to access login, redirect to shop
      next('/shop')
    } else {
      next()
    }
  }
})

export default router