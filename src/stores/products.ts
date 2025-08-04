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

  // Load products from API
  async function fetchProducts() {
    isLoading.value = true
    error.value = null

    try {
      const fetchedProducts = await productsAPI.getProducts()
      products.value = fetchedProducts
    } catch (err: any) {
      error.value = err.message || '상품을 불러오는데 실패했습니다'
      console.error('Error fetching products:', err)
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
      console.error('Error fetching product:', err)
      return null
    }
  }

  // Add new product
  async function addProduct(productData: {
    name: string
    description?: string
    price: number
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

  // Initialize store
  async function initialize() {
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
    fetchProducts,
    fetchProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    clearError
  }
})