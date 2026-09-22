<script setup>
defineProps({
  emoji: { type: String, default: '🍽️' },
  text: { type: String, default: '暂无数据' },
})
</script>

<template>
  <div class="empty">
    <span class="emoji">{{ emoji }}</span>
    <p>{{ text }}</p>
  </div>
</template>

<style scoped>
.empty {
  text-align: center;
  color: var(--text-2);
  padding: 32px 16px;
}
.emoji {
  font-size: 40px;
  display: block;
  margin-bottom: 8px;
}
p {
  margin: 0;
}
</style>
