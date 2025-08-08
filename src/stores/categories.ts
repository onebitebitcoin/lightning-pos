import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categoriesAPI, type Category } from '@/services/api'

export const useCategoryStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const globalCategories = computed(() => 
    categories.value.filter(category => category.is_global)
  )

  const userCategories = computed(() => 
    categories.value.filter(category => !category.is_global)
  )

  // Load categories from API
  async function fetchCategories() {
    isLoading.value = true
    error.value = null

    try {
      const fetchedCategories = await categoriesAPI.getCategories()
      categories.value = fetchedCategories
    } catch (err: any) {
      error.value = err.message || '카테고리를 불러오는데 실패했습니다'
      console.error('Error fetching categories:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Load categories that are actually used in user's available products
  async function fetchUserProductCategories() {
    isLoading.value = true
    error.value = null

    try {
      const fetchedCategories = await categoriesAPI.getUserProductCategories()
      categories.value = fetchedCategories
    } catch (err: any) {
      error.value = err.message || '카테고리를 불러오는데 실패했습니다'
      console.error('Error fetching user product categories:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Add new category
  async function addCategory(categoryData: {
    name: string
    description?: string
  }): Promise<{ success: boolean; message?: string; category?: Category }> {
    try {
      const result = await categoriesAPI.createCategory(categoryData)
      if (result.success && result.category) {
        categories.value.push(result.category)
        return { success: true, category: result.category }
      } else {
        error.value = result.message || '오류가 발생했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '카테고리 추가에 실패했습니다'
      return { success: false, message: error.value || '카테고리 추가에 실패했습니다' }
    }
  }

  // Update category
  async function updateCategory(id: number, categoryData: {
    name?: string
    description?: string
  }): Promise<{ success: boolean; message?: string; category?: Category }> {
    try {
      const result = await categoriesAPI.updateCategory(id, categoryData)
      if (result.success && result.category) {
        const index = categories.value.findIndex(c => c.id === id)
        if (index !== -1) {
          categories.value[index] = result.category
        }
        return { success: true, category: result.category }
      } else {
        error.value = result.message || '오류가 발생했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '카테고리 수정에 실패했습니다'
      return { success: false, message: error.value || '카테고리 수정에 실패했습니다' }
    }
  }

  // Delete category
  async function deleteCategory(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await categoriesAPI.deleteCategory(id)
      if (result.success) {
        categories.value = categories.value.filter(c => c.id !== id)
        return { success: true, message: result.message }
      } else {
        error.value = result.message || '오류가 발생했습니다'
        return { success: false, message: error.value || '오류가 발생했습니다' }
      }
    } catch (err: any) {
      error.value = err.message || '카테고리 삭제에 실패했습니다'
      return { success: false, message: error.value || '카테고리 삭제에 실패했습니다' }
    }
  }

  // Get category by ID
  function getCategory(id: number): Category | undefined {
    return categories.value.find(category => category.id === id)
  }

  // Clear error
  function clearError() {
    error.value = null
  }

  // Initialize store
  async function initialize() {
    if (categories.value.length === 0) {
      await fetchCategories()
    }
  }

  return {
    // State
    categories,
    isLoading,
    error,

    // Computed
    globalCategories,
    userCategories,

    // Actions
    initialize,
    fetchCategories,
    fetchUserProductCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    clearError
  }
})