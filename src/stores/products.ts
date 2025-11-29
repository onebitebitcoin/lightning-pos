import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productsAPI, type Product } from '@/services/api'

export const useProductStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const availableProducts = computed(() => 
    products.value.filter(product => product.is_available)
  )

  // Helper to apply saved order
  function applySavedOrder(productList: Product[]): Product[] {
    try {
      const savedOrder = JSON.parse(localStorage.getItem('product_order') || '[]') as number[]
      if (savedOrder.length === 0) return productList

      // Create a map for O(1) lookup of order index
      const orderMap = new Map(savedOrder.map((id, index) => [id, index]))

      return [...productList].sort((a, b) => {
        const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : Infinity
        const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : Infinity
        
        // If both have saved order, sort by that
        if (indexA !== Infinity && indexB !== Infinity) {
          return indexA - indexB
        }
        
        // If only one has saved order, put it first
        if (indexA !== Infinity) return -1
        if (indexB !== Infinity) return 1
        
        // Default: sort by ID descending (newest first) or keep original order
        return b.id - a.id
      })
    } catch (e) {
      console.error('Error applying product order:', e)
      return productList
    }
  }

  // Reorder products locally and persist
  function reorderProducts(newProducts: Product[]) {
    products.value = newProducts
    const orderIds = newProducts.map(p => p.id)
    localStorage.setItem('product_order', JSON.stringify(orderIds))
  }

  // Load user's own products (for management/settings)
  async function fetchProducts() {
    isLoading.value = true
    error.value = null

    try {
      const fetchedProducts = await productsAPI.getProducts()
      products.value = applySavedOrder(fetchedProducts)
    } catch (err: any) {
      error.value = err.message || '상품을 불러오는데 실패했습니다'
      console.error('상품 가져오기 오류:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Load all available products (for shopping)
  async function fetchAvailableProducts(categoryId?: string) {
    isLoading.value = true
    error.value = null

    try {
      const fetchedProducts = await productsAPI.getAvailableProducts(categoryId)
      products.value = applySavedOrder(fetchedProducts)
    } catch (err: any) {
      error.value = err.message || '상품을 불러오는데 실패했습니다'
      console.error('판매 상품 가져오기 오류:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Get single product
  async function fetchProduct(id: number): Promise<Product | null> {
    try {
      return await productsAPI.getProduct(id)
    } catch (err: any) {
      error.value = err.message || '상품을 불러오는데 실패했습니다'
      console.error('상품 조회 오류:', err)
      return null
    }
  }

  // Add new product
  async function addProduct(productData: {
    name: string
    description?: string
    price: number
    regular_price?: number | null
    image_url?: string
    category?: number
    stock_quantity?: number
  }): Promise<{ success: boolean; message?: string; product?: Product }> {
    isLoading.value = true
    error.value = null

    try {
      const result = await productsAPI.createProduct({
        ...productData,
        is_available: true,
        stock_quantity: productData.stock_quantity || 0
      })

      if (result.success && result.product) {
        products.value.push(result.product)
        return { success: true, product: result.product }
      } else {
        error.value = result.message || '상품 추가에 실패했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '상품 추가에 실패했습니다'
      return { success: false, message: error.value || '상품 추가에 실패했습니다' }
    } finally {
      isLoading.value = false
    }
  }

  // Add new product with file upload
  async function addProductWithFile(productData: {
    name: string
    description?: string
    price: number
    regular_price?: number | null
    category?: number
    stock_quantity: number
    is_available: boolean
  }, imageFile: File): Promise<{ success: boolean; message?: string; product?: Product }> {
    isLoading.value = true
    error.value = null

    try {
      const result = await productsAPI.createProductWithFile(productData, imageFile)

      if (result.success && result.product) {
        products.value.push(result.product)
        return { success: true, product: result.product }
      } else {
        error.value = result.message || '상품 추가에 실패했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '상품 추가에 실패했습니다'
      return { success: false, message: error.value || '상품 추가에 실패했습니다' }
    } finally {
      isLoading.value = false
    }
  }

  // Update product
  async function updateProduct(id: number, updates: Partial<Product>): Promise<{ success: boolean; message?: string; product?: Product }> {
    isLoading.value = true
    error.value = null

    try {
      const result = await productsAPI.updateProduct(id, updates)

      if (result.success && result.product) {
        const index = products.value.findIndex(p => p.id === id)
        if (index > -1) {
          products.value[index] = result.product
        }
        return { success: true, product: result.product }
      } else {
        error.value = result.message || '상품 수정에 실패했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '상품 수정에 실패했습니다'
      return { success: false, message: error.value || '상품 수정에 실패했습니다' }
    } finally {
      isLoading.value = false
    }
  }

  // Delete product
  async function deleteProduct(id: number): Promise<{ success: boolean; message?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const result = await productsAPI.deleteProduct(id)

      if (result.success) {
        const index = products.value.findIndex(p => p.id === id)
        if (index > -1) {
          products.value.splice(index, 1)
        }
        return { success: true, message: result.message }
      } else {
        error.value = result.message || '상품 삭제에 실패했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '상품 삭제에 실패했습니다'
      return { success: false, message: error.value || '상품 삭제에 실패했습니다' }
    } finally {
      isLoading.value = false
    }
  }

  // Get product by ID from store
  function getProduct(id: number): Product | undefined {
    return products.value.find(p => p.id === id)
  }

  // Clear error
  function clearError() {
    error.value = null
  }

  // Reset local state (used on logout)
  function resetLocal() {
    products.value = []
    error.value = null
    isLoading.value = false
  }

  // Initialize store for shop (loads all available products)
  async function initialize() {
    if (products.value.length === 0) {
      await fetchAvailableProducts()
    }
  }

  // Initialize store for settings (loads user's own products)  
  async function initializeForSettings() {
    if (products.value.length === 0) {
      await fetchProducts()
    }
  }

  return {
    // State
    products,
    isLoading,
    error,

    // Computed
    availableProducts,

    // Actions
    initialize,
    initializeForSettings,
    fetchProducts,
    fetchAvailableProducts,
    fetchProduct,
    addProduct,
    addProductWithFile,
    updateProduct,
    deleteProduct,
    getProduct,
    clearError,
    resetLocal,
    reorderProducts
  }
})
