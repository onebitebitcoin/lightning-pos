import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../cart'

vi.mock('@/services/api', () => ({
  cartAPI: {
    getCart: vi.fn(),
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),
    addCustomItem: vi.fn(),
  },
  ordersAPI: {
    createOrder: vi.fn(),
  },
}))

import { cartAPI, ordersAPI } from '@/services/api'

const mockCartItem = {
  id: 1,
  product: 1,
  product_name: '아메리카노',
  product_price: 4500,
  quantity: 2,
  total_price: 9000,
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useCartStore - computed', () => {
  it('subtotal sums all item total_prices', () => {
    const store = useCartStore()
    store.items = [
      { ...mockCartItem, id: 1, total_price: 9000 },
      { ...mockCartItem, id: 2, total_price: 5000 },
    ] as any
    expect(store.subtotal).toBe(14000)
  })

  it('total applies discount percentage', () => {
    const store = useCartStore()
    store.items = [{ ...mockCartItem, total_price: 10000 }] as any
    store.discount = 10
    expect(store.total).toBe(9000)
  })

  it('total equals subtotal when discount is 0', () => {
    const store = useCartStore()
    store.items = [{ ...mockCartItem, total_price: 5000 }] as any
    store.discount = 0
    expect(store.total).toBe(5000)
  })

  it('itemCount sums all quantities', () => {
    const store = useCartStore()
    store.items = [
      { ...mockCartItem, quantity: 2 },
      { ...mockCartItem, id: 2, quantity: 3 },
    ] as any
    expect(store.itemCount).toBe(5)
  })

  it('discountAmount calculates correctly', () => {
    const store = useCartStore()
    store.items = [{ ...mockCartItem, total_price: 10000 }] as any
    store.discount = 20
    expect(store.discountAmount).toBe(2000)
  })

  it('subtotal is 0 for empty cart', () => {
    const store = useCartStore()
    expect(store.subtotal).toBe(0)
  })

  it('itemCount is 0 for empty cart', () => {
    const store = useCartStore()
    expect(store.itemCount).toBe(0)
  })
})

describe('useCartStore - setDiscount', () => {
  it('sets discount percentage', () => {
    const store = useCartStore()
    store.setDiscount(15)
    expect(store.discount).toBe(15)
  })

  it('can reset discount to 0', () => {
    const store = useCartStore()
    store.discount = 10
    store.setDiscount(0)
    expect(store.discount).toBe(0)
  })
})

describe('useCartStore - resetLocal', () => {
  it('clears items and resets discount without API call', () => {
    const store = useCartStore()
    store.items = [mockCartItem] as any
    store.discount = 20
    store.resetLocal()
    expect(store.items).toHaveLength(0)
    expect(store.discount).toBe(0)
  })
})

describe('useCartStore - clearError', () => {
  it('sets error to null', () => {
    const store = useCartStore()
    store.error = '오류 발생'
    store.clearError()
    expect(store.error).toBeNull()
  })
})

describe('useCartStore - isAddingToCart', () => {
  it('returns false when not adding', () => {
    const store = useCartStore()
    expect(store.isAddingToCart(1)).toBe(false)
  })

  it('returns true when product ID is in set', () => {
    const store = useCartStore()
    store.addingToCart.add(1)
    expect(store.isAddingToCart(1)).toBe(true)
  })
})

describe('useCartStore - isUpdatingItem', () => {
  it('returns false when not updating', () => {
    const store = useCartStore()
    expect(store.isUpdatingItem(1)).toBe(false)
  })

  it('returns true when item ID is in set', () => {
    const store = useCartStore()
    store.updatingItems.add(5)
    expect(store.isUpdatingItem(5)).toBe(true)
  })
})

describe('useCartStore - fetchCart', () => {
  it('loads items on successful API response', async () => {
    vi.mocked(cartAPI.getCart).mockResolvedValueOnce({
      success: true,
      items: [mockCartItem],
      subtotal: '9000',
      item_count: 1,
    } as any)

    const store = useCartStore()
    await store.fetchCart()

    expect(store.items).toHaveLength(1)
    expect(store.isLoading).toBe(false)
  })

  it('sets empty items when API returns success=false', async () => {
    vi.mocked(cartAPI.getCart).mockResolvedValueOnce({ success: false } as any)

    const store = useCartStore()
    await store.fetchCart()

    expect(store.items).toHaveLength(0)
  })

  it('sets error on network exception', async () => {
    vi.mocked(cartAPI.getCart).mockRejectedValueOnce(new Error('네트워크 오류'))

    const store = useCartStore()
    await store.fetchCart()

    expect(store.error).toBeTruthy()
    expect(store.isLoading).toBe(false)
  })
})

describe('useCartStore - addItem', () => {
  it('adds new item to local state on success', async () => {
    vi.mocked(cartAPI.addToCart).mockResolvedValueOnce({
      success: true,
      message: '추가됨',
      item: mockCartItem,
    } as any)

    const store = useCartStore()
    const product = { id: 1, name: '아메리카노', price: 4500 } as any
    const result = await store.addItem(product, 1)

    expect(result.success).toBe(true)
    expect(store.items).toHaveLength(1)
  })

  it('updates existing item quantity if already in cart', async () => {
    const updatedItem = { ...mockCartItem, quantity: 3, total_price: 13500 }
    vi.mocked(cartAPI.addToCart).mockResolvedValueOnce({
      success: true,
      item: updatedItem,
    } as any)

    const store = useCartStore()
    store.items = [mockCartItem] as any
    const product = { id: 1 } as any
    await store.addItem(product, 1)

    expect(store.items[0].quantity).toBe(3)
  })

  it('returns failure and sets error on API failure', async () => {
    vi.mocked(cartAPI.addToCart).mockResolvedValueOnce({
      success: false,
      message: '재고 부족',
    } as any)

    const store = useCartStore()
    const result = await store.addItem({ id: 1 } as any, 1)

    expect(result.success).toBe(false)
    expect(store.error).toBeTruthy()
  })
})

describe('useCartStore - removeItem', () => {
  it('removes item from local state on success', async () => {
    vi.mocked(cartAPI.removeCartItem).mockResolvedValueOnce({
      success: true,
      message: '제거됨',
    } as any)

    const store = useCartStore()
    store.items = [mockCartItem] as any
    const result = await store.removeItem(1)

    expect(result.success).toBe(true)
    expect(store.items).toHaveLength(0)
  })

  it('returns failure when API reports error', async () => {
    vi.mocked(cartAPI.removeCartItem).mockResolvedValueOnce({
      success: false,
      message: '실패',
    } as any)

    const store = useCartStore()
    store.items = [mockCartItem] as any
    const result = await store.removeItem(1)

    expect(result.success).toBe(false)
  })
})

describe('useCartStore - updateItem', () => {
  it('updates item in local state on success', async () => {
    const updated = { ...mockCartItem, quantity: 5, total_price: 22500 }
    vi.mocked(cartAPI.updateCartItem).mockResolvedValueOnce({
      success: true,
      item: updated,
    } as any)

    const store = useCartStore()
    store.items = [mockCartItem] as any
    const result = await store.updateItem(1, 5)

    expect(result.success).toBe(true)
    expect(store.items[0].quantity).toBe(5)
  })

  it('returns failure on API error', async () => {
    vi.mocked(cartAPI.updateCartItem).mockResolvedValueOnce({
      success: false,
      message: '수량 변경 실패',
    } as any)

    const store = useCartStore()
    store.items = [mockCartItem] as any
    const result = await store.updateItem(1, 99)

    expect(result.success).toBe(false)
  })
})

describe('useCartStore - clearCart', () => {
  it('empties items and resets discount on success', async () => {
    vi.mocked(cartAPI.clearCart).mockResolvedValueOnce({
      success: true,
      message: '비워짐',
    } as any)

    const store = useCartStore()
    store.items = [mockCartItem] as any
    store.discount = 15
    const result = await store.clearCart()

    expect(result.success).toBe(true)
    expect(store.items).toHaveLength(0)
    expect(store.discount).toBe(0)
  })

  it('returns failure on API error', async () => {
    vi.mocked(cartAPI.clearCart).mockResolvedValueOnce({
      success: false,
      message: '실패',
    } as any)

    const store = useCartStore()
    const result = await store.clearCart()
    expect(result.success).toBe(false)
  })
})

describe('useCartStore - createOrder', () => {
  it('clears cart after successful order creation', async () => {
    vi.mocked(ordersAPI.createOrder).mockResolvedValueOnce({
      success: true,
      message: '주문 완료',
      order: { id: 1, order_number: 'ORD001' },
    } as any)

    const store = useCartStore()
    store.items = [mockCartItem] as any
    const result = await store.createOrder('cash')

    expect(result.success).toBe(true)
    expect(result.order).toBeDefined()
    expect(store.items).toHaveLength(0)
    expect(store.discount).toBe(0)
  })

  it('returns failure when order API fails', async () => {
    vi.mocked(ordersAPI.createOrder).mockResolvedValueOnce({
      success: false,
      message: '주문 실패',
    } as any)

    const store = useCartStore()
    store.items = [mockCartItem] as any
    const result = await store.createOrder('lightning')

    expect(result.success).toBe(false)
  })
})
