import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(true) // Default to dark mode

  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  const setTheme = (dark: boolean) => {
    isDark.value = dark
  }

  // Watch for changes and update the document class
  watch(isDark, (newValue) => {
    if (newValue) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    // Store preference in localStorage
    localStorage.setItem('theme', newValue ? 'dark' : 'light')
  }, { immediate: true })

  // Initialize theme from localStorage or default to dark
  const initTheme = () => {
    const stored = localStorage.getItem('theme')
    if (stored) {
      isDark.value = stored === 'dark'
    } else {
      // Default to dark mode
      isDark.value = true
    }
  }

  return {
    isDark,
    toggleTheme,
    setTheme,
    initTheme
  }
})