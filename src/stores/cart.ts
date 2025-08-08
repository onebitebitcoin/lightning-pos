import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartAPI, ordersAPI, type CartItem, type Product, type Order } from '@/services/api'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const discount = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const addingToCart = ref(new Set<number>()) // Track which products are being added

  // Computed properties
  const subtotal = computed(() => {
    return items.value.reduce((sum, item) => sum + item.total_price, 0)
  })

  const total = computed(() => {
    return subtotal.value * (1 - discount.value / 100)
  })

  const itemCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const discountAmount = computed(() => {
    return subtotal.value * (discount.value / 100)
  })

  // Load cart from API
  async function fetchCart() {
    isLoading.value = true
    error.value = null

    try {
      const result = await cartAPI.getCart()
      if (result.success) {
        items.value = result.items
      } else {
        items.value = []
      }
    } catch (err: any) {
      error.value = err.message || '장바구니를 불러오는데 실패했습니다'
      console.error('Error fetching cart:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Add item to cart
  async function addItem(product: Product, quantity: number = 1): Promise<{ success: boolean; message?: string }> {
    // Add product ID to loading set
    addingToCart.value.add(product.id)
    error.value = null

    try {
      const result = await cartAPI.addToCart(product.id, quantity)
      
      if (result.success) {
        // Refresh cart to get updated data
        await fetchCart()
        return { success: true, message: result.message }
      } else {
        error.value = result.message || '장바구니 추가에 실패했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '장바구니 추가에 실패했습니다'
      return { success: false, message: error.value || '오류가 발생했습니다' }
    } finally {
      // Remove product ID from loading set
      addingToCart.value.delete(product.id)
    }
  }

  // Update item quantity
  async function updateItem(itemId: number, quantity: number): Promise<{ success: boolean; message?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const result = await cartAPI.updateCartItem(itemId, quantity)
      
      if (result.success) {
        // Update local state
        const index = items.value.findIndex(item => item.id === itemId)
        if (index > -1 && result.item) {
          items.value[index] = result.item
        }
        return { success: true, message: result.message }
      } else {
        error.value = result.message || '수량 변경에 실패했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '수량 변경에 실패했습니다'
      return { success: false, message: error.value || '오류가 발생했습니다' }
    } finally {
      isLoading.value = false
    }
  }

  // Remove item from cart
  async function removeItem(itemId: number): Promise<{ success: boolean; message?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const result = await cartAPI.removeCartItem(itemId)
      
      if (result.success) {
        // Remove from local state
        const index = items.value.findIndex(item => item.id === itemId)
        if (index > -1) {
          items.value.splice(index, 1)
        }
        return { success: true, message: result.message }
      } else {
        error.value = result.message || '아이템 제거에 실패했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '아이템 제거에 실패했습니다'
      return { success: false, message: error.value || '오류가 발생했습니다' }
    } finally {
      isLoading.value = false
    }
  }

  // Clear entire cart
  async function clearCart(): Promise<{ success: boolean; message?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const result = await cartAPI.clearCart()
      
      if (result.success) {
        items.value = []
        discount.value = 0
        return { success: true, message: result.message }
      } else {
        error.value = result.message || '장바구니 비우기에 실패했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '장바구니 비우기에 실패했습니다'
      return { success: false, message: error.value || '오류가 발생했습니다' }
    } finally {
      isLoading.value = false
    }
  }

  // Create order
  async function createOrder(paymentMethod: string): Promise<{ success: boolean; message?: string; order?: Order }> {
    isLoading.value = true
    error.value = null

    try {
      const result = await ordersAPI.createOrder({
        payment_method: paymentMethod,
        discount_percentage: discount.value
      })

      if (result.success) {
        // Clear cart after successful order
        items.value = []
        discount.value = 0
        return { success: true, message: result.message, order: result.order }
      } else {
        error.value = result.message || '주문 생성에 실패했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '주문 생성에 실패했습니다'
      return { success: false, message: error.value || '오류가 발생했습니다' }
    } finally {
      isLoading.value = false
    }
  }

  // Set discount percentage
  function setDiscount(percentage: number) {
    discount.value = percentage
  }

  // Clear error
  function clearError() {
    error.value = null
  }

  // Check if a specific product is being added to cart
  function isAddingToCart(productId: number): boolean {
    return addingToCart.value.has(productId)
  }

  // Initialize cart
  async function initialize() {
    await fetchCart()
  }

  // Helper function to add item by product ID
  async function addItemById(productId: number, quantity: number = 1): Promise<{ success: boolean; message?: string }> {
    // Add product ID to loading set
    addingToCart.value.add(productId)
    error.value = null

    try {
      const result = await cartAPI.addToCart(productId, quantity)
      
      if (result.success) {
        // Refresh cart to get updated data
        await fetchCart()
        return { success: true, message: result.message }
      } else {
        error.value = result.message || '장바구니 추가에 실패했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '장바구니 추가에 실패했습니다'
      return { success: false, message: error.value || '오류가 발생했습니다' }
    } finally {
      // Remove product ID from loading set
      addingToCart.value.delete(productId)
    }
  }

  // Add custom item to cart
  async function addCustomItem(itemData: {
    name: string
    price: number
    description?: string
  }): Promise<{ success: boolean; message?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const result = await cartAPI.addCustomItem(itemData)
      
      if (result.success) {
        // Refresh cart to get updated data
        await fetchCart()
        return { success: true, message: result.message }
      } else {
        error.value = result.message || '커스텀 아이템 추가에 실패했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '커스텀 아이템 추가에 실패했습니다'
      return { success: false, message: error.value || '오류가 발생했습니다' }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    items,
    discount,
    isLoading,
    error,
    addingToCart,

    // Computed
    total,
    subtotal,
    itemCount,
    discountAmount,

    // Actions
    initialize,
    fetchCart,
    addItem,
    addItemById,
    addCustomItem,
    updateItem,
    removeItem,
    clearCart,
    createOrder,
    setDiscount,
    clearError,
    isAddingToCart
  }
})