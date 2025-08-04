import axios, { type AxiosInstance, type AxiosResponse } from 'axios'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token'
  
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
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.getToken()
    if (token) {
      config.headers.Authorization = `Token ${token}`
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
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - remove token and redirect to login
      TokenManager.removeToken()
      window.location.href = '/login'
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
  created_at: string
  is_kiosk_admin: boolean
}

export interface Product {
  id: number
  name: string
  description?: string
  price: number
  image_url?: string
  image?: string
  image_display_url: string
  category?: number
  category_name?: string
  is_available: boolean
  stock_quantity: number
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

// Auth API
export const authAPI = {
  async register(userData: {
    username: string
    email: string
    password: string
    password_confirm: string
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

  async demoLogin(credentials: {
    username: string
    password: string
  }): Promise<{ success: boolean; message: string; user?: User; token?: string }> {
    try {
      const response = await apiClient.post('/auth/demo-login/', credentials)
      if (response.data.success && response.data.token) {
        TokenManager.setToken(response.data.token)
      }
      return response.data
    } catch (error: any) {
      return error.response?.data || { success: false, message: '서버 오류가 발생했습니다' }
    }
  }
}

// Products API
export const productsAPI = {
  async getProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get('/products/')
      return response.data.results || response.data
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  },

  async getProduct(id: number): Promise<Product | null> {
    try {
      const response = await apiClient.get(`/products/${id}/`)
      return response.data
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  },

  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'image_display_url'>): Promise<{ success: boolean; product?: Product; message?: string }> {
    try {
      const response = await apiClient.post('/products/', productData)
      return { success: true, product: response.data }
    } catch (error: any) {
      console.error('Product creation error:', error.response?.data)
      
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

  async updateProduct(id: number, productData: Partial<Product>): Promise<{ success: boolean; product?: Product; message?: string }> {
    try {
      const response = await apiClient.put(`/products/${id}/`, productData)
      return { success: true, product: response.data }
    } catch (error: any) {
      console.error('Product update error:', error.response?.data)
      
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
      console.error('Error fetching cart:', error)
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
  }
}

// Orders API
export const ordersAPI = {
  async createOrder(orderData: {
    payment_method: string
    discount_percentage: number
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
      console.error('Error fetching orders:', error)
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

export { TokenManager }
export default apiClient