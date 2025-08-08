import axios, { type AxiosInstance, type AxiosResponse } from 'axios'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increase timeout for file uploads
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


  async updateProfile(profileData: {
    username?: string
    email?: string
    lightning_address?: string
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
      console.error('Error fetching categories:', error)
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
      console.error('Error fetching user product categories:', error)
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
      console.error('Error fetching products:', error)
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
      console.error('Error fetching available products:', error)
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

  async createProductWithFile(productData: {
    name: string
    description?: string
    price: number
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
      console.error('Product creation error:', error.response?.data)
      
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
  },

  async addCustomItem(itemData: {
    name: string
    price: number
    description?: string
  }): Promise<{ success: boolean; message?: string; item?: CartItem }> {
    try {
      const response = await apiClient.post('/products/cart/add-custom/', itemData)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '커스텀 아이템 추가에 실패했습니다'
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