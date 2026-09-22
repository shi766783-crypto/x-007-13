<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  type: { type: String, default: 'line' }, // line | bar
  labels: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] }, // 数值数组
  color: { type: String, default: '#4caf50' },
  height: { type: Number, default: 200 },
})

const canvas = ref(null)
let observer = null

function roundedRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r)
    return
  }
  ctx.rect(x, y, w, h)
}

function draw() {
  const el = canvas.value
  if (!el) return
  const dpr = window.devicePixelRatio || 1
  const width = el.clientWidth
  const height = props.height
  el.width = width * dpr
  el.height = height * dpr
  const ctx = el.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)

  const values = props.data.map(Number)
  if (!values.length) return
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const padX = 30
  const padY = 20
  const chartW = width - padX * 2
  const chartH = height - padY * 2

  const xAt = (i) => padX + (values.length === 1 ? chartW / 2 : (i / (values.length - 1)) * chartW)
  const yAt = (v) => padY + chartH - ((v - min) / range) * chartH

  // 网格与基线
  ctx.strokeStyle = '#eceff1'
  ctx.lineWidth = 1
  ctx.fillStyle = '#9e9e9e'
  ctx.font = '11px sans-serif'
  for (let g = 0; g <= 4; g++) {
    const y = padY + (chartH / 4) * g
    ctx.beginPath()
    ctx.moveTo(padX, y)
    ctx.lineTo(width - padX, y)
    ctx.stroke()
    const val = Math.round(max - (range / 4) * g)
    ctx.fillText(String(val), 4, y + 4)
  }

  if (props.type === 'bar') {
    const barW = Math.min(28, chartW / values.length / 2)
    values.forEach((v, i) => {
      const x = xAt(i)
      ctx.fillStyle = props.color
      ctx.beginPath()
      const y = yAt(v)
      const bh = Math.max(1, padY + chartH - y)
      ctx.beginPath()
      roundedRect(ctx, x - barW / 2, y, barW, bh, 3)
      ctx.fill()
    })
  } else {
    ctx.strokeStyle = props.color
    ctx.lineWidth = 2.5
    ctx.beginPath()
    values.forEach((v, i) => {
      const x = xAt(i)
      const y = yAt(v)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    // 数据点
    ctx.fillStyle = props.color
    values.forEach((v, i) => {
      ctx.beginPath()
      ctx.arc(xAt(i), yAt(v), 3.5, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  // 标签
  ctx.fillStyle = '#757575'
  ctx.textAlign = 'center'
  props.labels.forEach((label, i) => {
    ctx.fillText(String(label), xAt(i), height - 4)
  })
}

onMounted(() => {
  draw()
  if (window.ResizeObserver) {
    observer = new ResizeObserver(draw)
    observer.observe(canvas.value)
  }
})
onBeforeUnmount(() => observer && observer.disconnect())
watch(() => [props.data, props.labels, props.type], draw, { deep: true })
</script>

<template>
  <canvas ref="canvas" class="chart" :style="{ height: height + 'px' }"></canvas>
</template>

<style scoped>
.chart {
  width: 100%;
  display: block;
}
</style>
