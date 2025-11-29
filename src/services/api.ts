import axios, { type AxiosInstance, type AxiosResponse } from 'axios'

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increase timeout for file uploads
  withCredentials: true, // Enable sending cookies with requests for CSRF
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token'
  private static readonly CSRF_TOKEN_KEY = 'csrf_token'
  
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }
  
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token)
  }
  
  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY)
  }
  
  static hasToken(): boolean {
    return !!this.getToken()
  }
  
  // CSRF token management
  static getCSRFToken(): string | null {
    return localStorage.getItem(this.CSRF_TOKEN_KEY)
  }
  
  static setCSRFToken(token: string): void {
    localStorage.setItem(this.CSRF_TOKEN_KEY, token)
  }
  
  static removeCSRFToken(): void {
    localStorage.removeItem(this.CSRF_TOKEN_KEY)
  }
  
  // Get CSRF token from cookie (Django default)
  static getCSRFTokenFromCookie(): string | null {
    const name = 'csrftoken'
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      const token = parts.pop()?.split(';').shift() || null
      return token
    }
    return null
  }

  // Get CSRF token from meta tag (alternative method)
  static getCSRFTokenFromMeta(): string | null {
    const metaTag = document.querySelector('meta[name="csrf-token"]')
    return metaTag ? metaTag.getAttribute('content') : null
  }
}

// Request interceptor to add auth token and CSRF token
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.getToken()
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    
    // Add CSRF token for POST, PUT, PATCH, DELETE requests
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      let csrfToken = TokenManager.getCSRFToken() || 
                      TokenManager.getCSRFTokenFromCookie() || 
                      TokenManager.getCSRFTokenFromMeta()
      
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken
        console.debug('요청에 CSRF 토큰 추가:', csrfToken.substring(0, 10) + '...')
      } else {
        // If no CSRF token available, try to fetch one first
        console.warn('CSRF 토큰이 없습니다. 요청이 실패할 수 있습니다')
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - remove token but don't redirect during login attempts
      TokenManager.removeToken()
      
      // Only redirect if this is not a login or register request
      const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                           error.config?.url?.includes('/auth/register')
      
      if (!isAuthRequest) {
        // Use router for navigation instead of window.location to avoid page refresh
        import('@/router').then(({ default: router }) => {
          router.push('/login')
        })
      }
    } else if (error.response?.status === 403 && 
               error.response?.data?.detail?.includes('CSRF')) {
      // CSRF token error - try to get a fresh token and retry once
      console.warn('CSRF 토큰 오류, 새 토큰 발급 후 재시도...')
      
      try {
        // Clear old token and get a new one
        TokenManager.removeCSRFToken()
        await csrfAPI.getCSRFToken()
        
        // Retry the original request once
        if (error.config && !error.config.__retryCount) {
          error.config.__retryCount = 1
          return apiClient.request(error.config)
        }
      } catch (retryError) {
        console.error('CSRF 토큰 갱신 실패:', retryError)
      }
    }
    return Promise.reject(error)
  }
)

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

export interface User {
  id: number
  username: string
  email: string
  lightning_address?: string
  usdt_address?: string
  ecash_enabled?: boolean
  created_at: string
  is_kiosk_admin: boolean
}

export interface Category {
  id: number
  name: string
  description?: string
  created_by?: number
  created_by_username?: string
  is_global: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  name: string
  description?: string
  price: number
  regular_price?: number | null
  image_url?: string
  image?: string
  image_display_url: string
  category?: number
  category_name?: string
  is_available: boolean
  stock_quantity: number
  created_by?: number
  created_by_username?: string
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: number
  product: number
  product_name: string
  product_price: number
  product_image: string
  quantity: number
  total_price: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  order_number: string
  user: number
  user_name: string
  status: string
  payment_method: string
  subtotal: number
  discount_percentage: number
  discount_amount: number
  total_amount: number
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  product: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

// CSRF API
export const csrfAPI = {
  async getCSRFToken(): Promise<{ success: boolean; csrf_token?: string; message?: string }> {
    try {
      console.debug('서버에서 CSRF 토큰 가져오는 중...')
      const response = await apiClient.get('/auth/csrf/')
      if (response.data.csrf_token) {
        TokenManager.setCSRFToken(response.data.csrf_token)
        console.debug('CSRF 토큰 수신 및 저장:', response.data.csrf_token.substring(0, 10) + '...')
      }
      return response.data
    } catch (error: any) {
      console.error('CSRF 토큰 조회 실패:', error)
      return { success: false, message: '서버 오류가 발생했습니다' }
    }
  }
}

// Auth API
export const authAPI = {
  async register(userData: {
    username: string
    email: string
    password: string
    password_confirm: string
    lightning_address: string
  }): Promise<{ success: boolean; message: string; user?: User; token?: string; errors?: any }> {
    try {
      const response = await apiClient.post('/auth/register/', userData)
      if (response.data.success && response.data.token) {
        TokenManager.setToken(response.data.token)
      }
      return response.data
    } catch (error: any) {
      return error.response?.data || { success: false, message: '서버 오류가 발생했습니다' }
    }
  },

  async login(credentials: {
    username: string
    password: string
  }): Promise<{ success: boolean; message: string; user?: User; token?: string }> {
    try {
      // Ensure we have a CSRF token before login
      await csrfAPI.getCSRFToken()
      
      const response = await apiClient.post('/auth/login/', credentials)
      if (response.data.success && response.data.token) {
        TokenManager.setToken(response.data.token)
      }
      return response.data
    } catch (error: any) {
      return error.response?.data || { success: false, message: '서버 오류가 발생했습니다' }
    }
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/auth/logout/')
      TokenManager.removeToken()
      return response.data
    } catch (error: any) {
      TokenManager.removeToken()
      return { success: true, message: '로그아웃되었습니다' }
    }
  },

  async getProfile(): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const response = await apiClient.get('/auth/profile/')
      return response.data
    } catch (error: any) {
      return error.response?.data || { success: false, message: '프로필을 불러올 수 없습니다' }
    }
  },


  async updateProfile(profileData: {
    username?: string
    email?: string
    lightning_address?: string
    usdt_address?: string
    ecash_enabled?: boolean
  }): Promise<{ success: boolean; message: string; user?: User; errors?: any }> {
    try {
      const response = await apiClient.put('/auth/profile/update/', profileData)
      return response.data
    } catch (error: any) {
      return error.response?.data || { success: false, message: '서버 오류가 발생했습니다' }
    }
  }
}

// Admin API
export const adminAPI = {
  async getUsersList(): Promise<{ success: boolean; users: (User & { product_count: number })[]; total_count: number; message?: string }> {
    try {
      const response = await apiClient.get('/auth/admin/users/')
      return response.data
    } catch (error: any) {
      return error.response?.data || { success: false, users: [], total_count: 0, message: '서버 오류가 발생했습니다' }
    }
  },

  async getUserDetail(userId: number): Promise<{ 
    success: boolean; 
    user?: User; 
    products?: any[]; 
    product_count?: number; 
    message?: string 
  }> {
    try {
      const response = await apiClient.get(`/auth/admin/users/${userId}/`)
      return response.data
    } catch (error: any) {
      return error.response?.data || { success: false, message: '서버 오류가 발생했습니다' }
    }
  },

  async deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/auth/admin/users/${userId}/delete/`)
      return response.data
    } catch (error: any) {
      return error.response?.data || { success: false, message: '서버 오류가 발생했습니다' }
    }
  }
}

// Categories API
export const categoriesAPI = {
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get('/products/categories/')
      return response.data.results || response.data
    } catch (error) {
      console.error('카테고리 가져오기 오류:', error)
      return []
    }
  },

  async createCategory(categoryData: Omit<Category, 'id' | 'created_by' | 'created_by_username' | 'is_global' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; category?: Category; message?: string }> {
    try {
      const response = await apiClient.post('/products/categories/', categoryData)
      return { success: true, category: response.data }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || '카테고리 생성에 실패했습니다' 
      }
    }
  },

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<{ success: boolean; category?: Category; message?: string }> {
    try {
      const response = await apiClient.put(`/products/categories/${id}/`, categoryData)
      return { success: true, category: response.data }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || '카테고리 수정에 실패했습니다' 
      }
    }
  },

  async deleteCategory(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      await apiClient.delete(`/products/categories/${id}/`)
      return { success: true, message: '카테고리가 삭제되었습니다' }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || '카테고리 삭제에 실패했습니다' 
      }
    }
  },

  async getUserProductCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get('/products/categories/used/')
      return response.data.categories || []
    } catch (error) {
      console.error('사용자 상품 카테고리 가져오기 오류:', error)
      return []
    }
  }
}

// Products API
export const productsAPI = {
  // Get user's own products (for management/settings)
  async getProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get('/products/')
      return response.data.results || response.data
    } catch (error) {
      console.error('상품 가져오기 오류:', error)
      return []
    }
  },

  // Get all available products (for shopping)
  async getAvailableProducts(categoryId?: string): Promise<Product[]> {
    try {
      const params = categoryId ? `?category=${categoryId}` : ''
      const response = await apiClient.get(`/products/available/${params}`)
      return response.data.products || response.data
    } catch (error) {
      console.error('판매 상품 가져오기 오류:', error)
      return []
    }
  },

  async getProduct(id: number): Promise<Product | null> {
    try {
      const response = await apiClient.get(`/products/${id}/`)
      return response.data
    } catch (error) {
      console.error('상품 조회 오류:', error)
      return null
    }
  },

  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'image_display_url'>): Promise<{ success: boolean; product?: Product; message?: string }> {
    try {
      const response = await apiClient.post('/products/', productData)
      return { success: true, product: response.data }
    } catch (error: any) {
      console.error('상품 생성 오류:', error.response?.data)
      
      // Handle validation errors from Django serializer
      if (error.response?.data?.image_url) {
        const imageError = Array.isArray(error.response.data.image_url) 
          ? error.response.data.image_url[0] 
          : error.response.data.image_url
        return { success: false, message: imageError }
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.non_field_errors?.[0] || '상품 생성에 실패했습니다' 
      }
    }
  },

  async createProductWithFile(productData: {
    name: string
    description?: string
    price: number
    regular_price?: number | null
    category?: number
    stock_quantity: number
    is_available: boolean
  }, imageFile?: File): Promise<{ success: boolean; product?: Product; message?: string }> {
    try {
      const formData = new FormData()
      
      // Add product data
      formData.append('name', productData.name)
      if (productData.description) formData.append('description', productData.description)
      formData.append('price', productData.price.toString())
      if (productData.regular_price != null) {
        formData.append('regular_price', productData.regular_price.toString())
      }
      if (productData.category) formData.append('category', productData.category.toString())
      formData.append('stock_quantity', productData.stock_quantity.toString())
      formData.append('is_available', productData.is_available.toString())
      
      // Add image file if provided
      if (imageFile) {
        formData.append('image', imageFile)
      }
      
      const response = await apiClient.post('/products/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for file upload
      })
      return { success: true, product: response.data }
    } catch (error: any) {
      console.error('상품 생성 오류:', error.response?.data)
      
      // Handle validation errors
      if (error.response?.data?.image) {
        const imageError = Array.isArray(error.response.data.image) 
          ? error.response.data.image[0] 
          : error.response.data.image
        return { success: false, message: imageError }
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.non_field_errors?.[0] || '상품 생성에 실패했습니다' 
      }
    }
  },

  async updateProduct(id: number, productData: Partial<Product>): Promise<{ success: boolean; product?: Product; message?: string }> {
    try {
      const response = await apiClient.put(`/products/${id}/`, productData)
      return { success: true, product: response.data }
    } catch (error: any) {
      console.error('상품 수정 오류:', error.response?.data)
      
      // Handle validation errors from Django serializer
      if (error.response?.data?.image_url) {
        const imageError = Array.isArray(error.response.data.image_url) 
          ? error.response.data.image_url[0] 
          : error.response.data.image_url
        return { success: false, message: imageError }
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.non_field_errors?.[0] || '상품 수정에 실패했습니다' 
      }
    }
  },

  async deleteProduct(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      await apiClient.delete(`/products/${id}/`)
      return { success: true, message: '상품이 삭제되었습니다' }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || '상품 삭제에 실패했습니다' 
      }
    }
  }
}

// Cart API
export const cartAPI = {
  async getCart(): Promise<{ success: boolean; items: CartItem[]; subtotal: number; item_count: number }> {
    try {
      const response = await apiClient.get('/products/cart/')
      return response.data
    } catch (error: any) {
      console.error('장바구니 조회 오류:', error)
      return { success: false, items: [], subtotal: 0, item_count: 0 }
    }
  },

  async addToCart(productId: number, quantity: number = 1): Promise<{ success: boolean; message?: string; item?: CartItem }> {
    try {
      const response = await apiClient.post('/products/cart/', {
        product_id: productId,
        quantity
      })
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '장바구니 추가에 실패했습니다'
      }
    }
  },

  async updateCartItem(itemId: number, quantity: number): Promise<{ success: boolean; message?: string; item?: CartItem }> {
    try {
      const response = await apiClient.put(`/products/cart/${itemId}/`, { quantity })
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '수량 변경에 실패했습니다'
      }
    }
  },

  async removeCartItem(itemId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.delete(`/products/cart/${itemId}/`)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '아이템 제거에 실패했습니다'
      }
    }
  },

  async clearCart(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post('/products/cart/clear/')
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '장바구니 비우기에 실패했습니다'
      }
    }
  },

  async addCustomItem(itemData: {
    name: string
    price: number
    description?: string
  }): Promise<{ success: boolean; message?: string; item?: CartItem }> {
    try {
      // Ensure we have a CSRF token before making the request
      if (!TokenManager.getCSRFToken() && !TokenManager.getCSRFTokenFromCookie()) {
        await csrfAPI.getCSRFToken()
      }
      
      const response = await apiClient.post('/products/cart/add-custom/', itemData)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.detail || '커스텀 아이템 추가에 실패했습니다'
      }
    }
  }
}

// Orders API
export const ordersAPI = {
  async createOrder(orderData: {
    payment_method: string
    discount_percentage: number
    cart_items: Array<{
      product_id: number
      quantity: number
      unit_price: number
    }>
  }): Promise<{ success: boolean; message?: string; order?: Order }> {
    try {
      const response = await apiClient.post('/products/orders/create/', orderData)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '주문 생성에 실패했습니다'
      }
    }
  },

  async getOrders(): Promise<{ success: boolean; orders: Order[] }> {
    try {
      const response = await apiClient.get('/products/orders/')
      return response.data
    } catch (error: any) {
      console.error('주문 목록 조회 오류:', error)
      return { success: false, orders: [] }
    }
  },

  async getOrder(orderId: number): Promise<{ success: boolean; order?: Order; message?: string }> {
    try {
      const response = await apiClient.get(`/products/orders/${orderId}/`)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '주문을 불러올 수 없습니다'
      }
    }
  }
}

export { TokenManager, apiClient }
export default apiClient
