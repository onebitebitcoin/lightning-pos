import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

// Initialize stores after app is mounted
import { useAuthStore } from './stores/auth'
import { useProductStore } from './stores/products'
import { useCartStore } from './stores/cart'

const authStore = useAuthStore()
const productStore = useProductStore()
const cartStore = useCartStore()

// Initialize stores in proper order
async function initializeStores() {
  try {
    // Initialize auth state first
    await authStore.initialize()
    
    // Initialize products
    await productStore.initialize()
    
    // Initialize cart if user is logged in
    if (authStore.isLoggedIn) {
      await cartStore.initialize()
    }
  } catch (error) {
    console.error('Store initialization error:', error)
  }
}

initializeStores()