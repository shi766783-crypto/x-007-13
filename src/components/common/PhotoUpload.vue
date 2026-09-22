<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)

function pick() {
  inputRef.value?.click()
}

function onFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => emit('update:modelValue', reader.result)
  reader.readAsDataURL(file)
  e.target.value = ''
}

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="photo-upload">
    <div v-if="modelValue" class="preview">
      <img :src="modelValue" alt="食材照片" />
      <button class="remove" @click="clear">✕</button>
    </div>
    <button v-else type="button" class="picker" @click="pick">
      <span>📷</span>
      <span>上传照片</span>
    </button>
    <input ref="inputRef" type="file" accept="image/*" hidden @change="onFile" />
  </div>
</template>

<style scoped>
.photo-upload {
  display: inline-block;
}
.preview {
  position: relative;
  width: 96px;
  height: 96px;
}
.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--border);
}
.remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--danger);
  color: #fff;
  cursor: pointer;
  font-size: 12px;
}
.picker {
  width: 96px;
  height: 96px;
  border: 2px dashed var(--border);
  border-radius: 10px;
  background: var(--surface-2);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-2);
  font-size: 12px;
}
.picker span:first-child {
  font-size: 24px;
}
</style>
