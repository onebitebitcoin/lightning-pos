<template>
  <div 
    :class="[
      'grid gap-3 xs:gap-4 tablet:gap-6',
      gridClasses
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'products' | 'cards' | 'items'
  minItemWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'products',
  minItemWidth: 280
})

const gridClasses = computed(() => {
  switch (props.variant) {
    case 'products':
      return [
        'grid-cols-1',
        'xs:grid-cols-2', 
        'tablet:grid-cols-3',
        'lg:grid-cols-2',
        'xl:grid-cols-3',
        '2xl:grid-cols-4'
      ].join(' ')
    case 'cards':
      return [
        'grid-cols-1',
        'tablet:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4'
      ].join(' ')
    case 'items':
      return [
        'grid-cols-1',
        'xs:grid-cols-2',
        'lg:grid-cols-3',
        '2xl:grid-cols-4'
      ].join(' ')
    default:
      return 'grid-cols-1 xs:grid-cols-2 tablet:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
  }
})
</script>