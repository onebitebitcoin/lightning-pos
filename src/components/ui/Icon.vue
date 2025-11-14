<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

type IconTag = 'path' | 'circle' | 'rect'
type IconShape = {
  tag: IconTag
  attrs: Record<string, string>
}

type IconDefinition = {
  viewBox: string
  paths: readonly IconShape[]
  strokeWidth?: number
}

const icons = {
  sun: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '4' } },
      { tag: 'path', attrs: { d: 'M12 3v2' } },
      { tag: 'path', attrs: { d: 'M12 19v2' } },
      { tag: 'path', attrs: { d: 'M5.22 5.22l1.42 1.42' } },
      { tag: 'path', attrs: { d: 'M17.36 17.36l1.42 1.42' } },
      { tag: 'path', attrs: { d: 'M3 12h2' } },
      { tag: 'path', attrs: { d: 'M19 12h2' } },
      { tag: 'path', attrs: { d: 'M6.64 17.36l-1.42 1.42' } },
      { tag: 'path', attrs: { d: 'M18.78 5.22l-1.42 1.42' } },
    ],
  },
  moon: {
    viewBox: '0 0 24 24',
    paths: [
      {
        tag: 'path',
        attrs: {
          d: 'M21 12.79A9 9 0 1111.21 3 7.5 7.5 0 0021 12.79z',
        },
      },
    ],
  },
  menu: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M4 6h16' } },
      { tag: 'path', attrs: { d: 'M4 12h16' } },
      { tag: 'path', attrs: { d: 'M4 18h16' } },
    ],
  },
  close: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M6 6l12 12' } },
      { tag: 'path', attrs: { d: 'M6 18L18 6' } },
    ],
  },
  refresh: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M20 11a8.1 8.1 0 00-7-7.9V1l-3 3 3 3V5.1a6 6 0 11-5.2 8.9' } },
    ],
  },
  warning: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M12 9v4' } },
      { tag: 'path', attrs: { d: 'M12 17h.01' } },
      { tag: 'path', attrs: { d: 'M10.29 3.86L1.82 18a2 2 0 001.72 3h16.92a2 2 0 001.72-3L13.71 3.86a2 2 0 00-3.42 0z' } },
    ],
  },
  arrowLeft: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M15 18l-6-6 6-6' } },
    ],
  },
  chevronRight: {
    viewBox: '0 0 24 24',
    paths: [{ tag: 'path', attrs: { d: 'M9 6l6 6-6 6' } }],
  },
  chevronUp: {
    viewBox: '0 0 24 24',
    paths: [{ tag: 'path', attrs: { d: 'M6 15l6-6 6 6' } }],
  },
  chevronDown: {
    viewBox: '0 0 24 24',
    paths: [{ tag: 'path', attrs: { d: 'M6 9l6 6 6-6' } }],
  },
  eye: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M2.458 12C3.732 7.943 7.522 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7z' } },
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '3' } },
    ],
  },
  trash: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M3 6h18' } },
      { tag: 'path', attrs: { d: 'M8 6V4h8v2' } },
      { tag: 'path', attrs: { d: 'M10 11v6' } },
      { tag: 'path', attrs: { d: 'M14 11v6' } },
      { tag: 'path', attrs: { d: 'M5 6l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12' } },
    ],
  },
  cart: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'circle', attrs: { cx: '9', cy: '19', r: '1' } },
      { tag: 'circle', attrs: { cx: '17', cy: '19', r: '1' } },
      { tag: 'path', attrs: { d: 'M5 6h2l1 7h10l1-5H8' } },
    ],
  },
  box: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M21 8l-9-5-9 5 9 5 9-5v8l-9 5-9-5V8' } },
      { tag: 'path', attrs: { d: 'M12 13V3' } },
    ],
  },
  bookOpen: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M12 20H5a2 2 0 01-2-2V6a2 2 0 012-2h6' } },
      { tag: 'path', attrs: { d: 'M12 20h7a2 2 0 002-2V6a2 2 0 00-2-2h-6' } },
      { tag: 'path', attrs: { d: 'M12 4v16' } },
    ],
  },
  celebration: {
    viewBox: '0 0 24 24',
    paths: [
      {
        tag: 'path',
        attrs: {
          d: 'M2 22l6-2 10-10-4-4-10 10-2 6z',
          fill: 'currentColor',
          'fill-opacity': '0.9',
        },
      },
      { tag: 'path', attrs: { d: 'M14 3.5l2.5 2.5' } },
      { tag: 'path', attrs: { d: 'M11 6l2 2' } },
      { tag: 'path', attrs: { d: 'M16 11l2 2' } },
    ],
  },
  btc: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M12 6v12' } },
      { tag: 'path', attrs: { d: 'M10 4v2' } },
      { tag: 'path', attrs: { d: 'M14 4v2' } },
      { tag: 'path', attrs: { d: 'M10 18v2' } },
      { tag: 'path', attrs: { d: 'M14 18v2' } },
      { tag: 'path', attrs: { d: 'M9 6h4.5a2.5 2.5 0 010 5h-4.5 5a2.5 2.5 0 010 5h-5' } },
    ],
  },
  edit: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M12 20h9' } },
      { tag: 'path', attrs: { d: 'M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4z' } },
    ],
  },
  lightning: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z' } },
    ],
  },
  settings: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '3' } },
      { tag: 'path', attrs: { d: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' } },
    ],
  },
  plus: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M12 5v14' } },
      { tag: 'path', attrs: { d: 'M5 12h14' } },
    ],
  },
  logout: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4' } },
      { tag: 'path', attrs: { d: 'M16 17l5-5-5-5' } },
      { tag: 'path', attrs: { d: 'M21 12H9' } },
    ],
  },
  download: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' } },
      { tag: 'path', attrs: { d: 'M7 10l5 5 5-5' } },
      { tag: 'path', attrs: { d: 'M12 15V3' } },
    ],
  },
  upload: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' } },
      { tag: 'path', attrs: { d: 'M17 9l-5-5-5 5' } },
      { tag: 'path', attrs: { d: 'M12 4v12' } },
    ],
  },
  coin: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
      { tag: 'path', attrs: { d: 'M12 7v10' } },
      { tag: 'path', attrs: { d: 'M15 9a3 3 0 00-3-2H9' } },
      { tag: 'path', attrs: { d: 'M9 15h3a3 3 0 013 2' } },
    ],
  },
  banknote: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'rect', attrs: { x: '3', y: '7', width: '18', height: '10', rx: '2' } },
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '2.5' } },
      { tag: 'path', attrs: { d: 'M7 12h.01' } },
      { tag: 'path', attrs: { d: 'M17 12h.01' } },
    ],
  },
  checkCircle: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M9 12l2 2 4-4' } },
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
    ],
  },
  user: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'path', attrs: { d: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2' } },
      { tag: 'circle', attrs: { cx: '12', cy: '7', r: '4' } },
    ],
  },
  spinner: {
    viewBox: '0 0 24 24',
    paths: [
      {
        tag: 'path',
        attrs: {
          d: 'M12 4a8 8 0 108 8',
          'stroke-dasharray': '50',
        },
      },
    ],
  },
  mail: {
    viewBox: '0 0 24 24',
    paths: [
      { tag: 'rect', attrs: { x: '3', y: '5', width: '18', height: '14', rx: '2' } },
      { tag: 'path', attrs: { d: 'M3 7l9 6 9-6' } },
    ],
  },
} as const satisfies Record<string, IconDefinition>

type IconName = keyof typeof icons

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number | string
    strokeWidth?: number
    decorative?: boolean
    title?: string
  }>(),
  {
    size: 20,
    strokeWidth: 1.8,
    decorative: true,
  },
)

const attrs = useAttrs()
const icon = computed<IconDefinition | undefined>(() => icons[props.name])
const viewBox = computed(() => icon.value?.viewBox ?? '0 0 24 24')
const shapes = computed(() => icon.value?.paths ?? [])
const strokeWidth = computed(() => icon.value?.strokeWidth ?? props.strokeWidth)
const role = computed(() => (props.decorative ? undefined : 'img'))
const ariaHidden = computed(() => (props.decorative ? 'true' : undefined))
</script>

<template>
  <svg
    v-bind="attrs"
    :viewBox="viewBox"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="role"
    :aria-hidden="ariaHidden"
  >
    <title v-if="title">{{ title }}</title>
    <template v-for="(shape, index) in shapes" :key="index">
      <component :is="shape.tag" v-bind="shape.attrs" />
    </template>
  </svg>
</template>
