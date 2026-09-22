<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | ghost | danger | text
  size: { type: String, default: 'md' }, // sm | md | lg
  disabled: Boolean,
  block: Boolean,
})
</script>

<template>
  <button
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`, { 'btn--block': block }]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn--primary {
  background: var(--primary);
  color: #fff;
}
.btn--primary:hover:not(:disabled) {
  background: var(--primary-dark);
}
.btn--ghost {
  background: #fff;
  border-color: var(--border);
  color: var(--text);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--surface-2);
}
.btn--danger {
  background: var(--danger);
  color: #fff;
}
.btn--danger:hover:not(:disabled) {
  background: #d32f2f;
}
.btn--text {
  background: transparent;
  color: var(--primary-dark);
}
.btn--text:hover:not(:disabled) {
  background: var(--primary-light);
}
.btn--sm {
  padding: 4px 10px;
  font-size: 12px;
}
.btn--md {
  padding: 8px 16px;
  font-size: 14px;
}
.btn--lg {
  padding: 12px 20px;
  font-size: 15px;
}
.btn--block {
  width: 100%;
}
</style>
