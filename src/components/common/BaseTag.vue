<script setup>
import { computed } from 'vue'
import { CATEGORY_COLORS } from '@/constants'

const props = defineProps({
  text: { type: String, default: '' },
  color: { type: String, default: '' }, // 指定色值，优先级高于 category
  category: { type: String, default: '' }, // 从类别自动取色
})

const bg = computed(() => {
  const c = props.color || CATEGORY_COLORS[props.category] || '#90a4ae'
  return c + '22'
})
const fg = computed(() => props.color || CATEGORY_COLORS[props.category] || '#90a4ae')
</script>

<template>
  <span class="tag" :style="{ background: bg, color: fg }">
    <slot>{{ text }}</slot>
  </span>
</template>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
}
</style>
