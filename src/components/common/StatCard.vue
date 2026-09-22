<script setup>
defineProps({
  label: String,
  value: [String, Number],
  icon: String,
  color: { type: String, default: '#4caf50' },
  suffix: { type: String, default: '' },
})
</script>

<template>
  <div class="stat-card">
    <div class="icon" :style="{ background: color + '22', color }">{{ icon }}</div>
    <div class="info">
      <div class="value">{{ value }}<span v-if="suffix" class="suffix">{{ suffix }}</span></div>
      <div class="label">{{ label }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
}
.icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}
.suffix {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-2);
  margin-left: 2px;
}
.label {
  font-size: 12px;
  color: var(--text-2);
}
</style>
