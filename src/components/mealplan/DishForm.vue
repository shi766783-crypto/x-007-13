<script setup>
import { reactive, ref } from 'vue'
import { DISH_CATEGORIES, DIFFICULTIES, UNITS } from '@/constants'
import { useInventoryStore } from '@/stores/inventory'

const props = defineProps({
  initial: { type: Object, default: null },
})
const emit = defineEmits(['submit', 'cancel'])

const inventory = useInventoryStore()

const form = reactive({
  name: props.initial?.name || '',
  category: props.initial?.category || '蔬菜',
  difficulty: props.initial?.difficulty || '简单',
  cookTime: props.initial?.cookTime ?? 15,
  instructions: props.initial?.instructions || '',
  ingredients: props.initial?.ingredients?.length
    ? props.initial.ingredients.map((i) => ({ ...i }))
    : [{ ingredientId: null, name: '', quantity: 1, unit: '克' }],
})

const pickValue = ref('')

function addIngredient() {
  form.ingredients.push({ ingredientId: null, name: '', quantity: 1, unit: '克' })
}

function removeIngredient(index) {
  if (form.ingredients.length === 1) {
    form.ingredients[0] = { ingredientId: null, name: '', quantity: 1, unit: '克' }
  } else {
    form.ingredients.splice(index, 1)
  }
}

function applyPick() {
  if (!pickValue.value) return
  const item = inventory.items.find((i) => i.id === pickValue.value)
  if (!item) return
  form.ingredients.push({
    ingredientId: item.id,
    name: item.name,
    quantity: 1,
    unit: item.unit,
  })
  pickValue.value = ''
}

function submit() {
  if (!form.name.trim()) return
  const ingredients = form.ingredients
    .filter((i) => i.name.trim())
    .map((i) => ({ ...i, name: i.name.trim(), quantity: Number(i.quantity) }))
  emit('submit', {
    ...form,
    name: form.name.trim(),
    cookTime: Number(form.cookTime),
    ingredients,
  })
}
</script>

<template>
  <form class="dish-form" @submit.prevent="submit">
    <div class="field">
      <label>菜名 *</label>
      <input v-model="form.name" type="text" placeholder="如：番茄炒蛋" required />
    </div>

    <div class="row">
      <div class="field">
        <label>菜品类别</label>
        <select v-model="form.category">
          <option v-for="c in DISH_CATEGORIES" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div class="field">
        <label>难度</label>
        <select v-model="form.difficulty">
          <option v-for="d in DIFFICULTIES" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <div class="field">
        <label>烹饪时长（分钟）</label>
        <input v-model.number="form.cookTime" type="number" min="1" />
      </div>
    </div>

    <div class="field">
      <label>所需食材清单</label>
      <div class="pick-row">
        <select v-model="pickValue" @change="applyPick">
          <option value="">+ 从库存选择食材…</option>
          <option v-for="i in inventory.items" :key="i.id" :value="i.id">
            {{ i.name }}（{{ i.unit }}）
          </option>
        </select>
        <button type="button" class="add-btn" @click="addIngredient">+ 手动添加</button>
      </div>

      <div v-for="(ing, idx) in form.ingredients" :key="idx" class="ing-row">
        <input v-model="ing.name" type="text" placeholder="食材名" class="grow" />
        <input v-model.number="ing.quantity" type="number" min="0" step="0.01" class="qty" />
        <select v-model="ing.unit">
          <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
        </select>
        <button type="button" class="del-btn" @click="removeIngredient(idx)">✕</button>
      </div>
    </div>

    <div class="field">
      <label>做法简介</label>
      <textarea v-model="form.instructions" rows="3" placeholder="简单描述做法…"></textarea>
    </div>

    <div class="actions">
      <button type="button" class="btn-cancel" @click="emit('cancel')">取消</button>
      <button type="submit" class="btn-submit">保存</button>
    </div>
  </form>
</template>

<style scoped>
.dish-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 12px;
  color: var(--text-2);
  font-weight: 500;
}
input,
select,
textarea {
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #fff;
}
input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--primary);
}
.pick-row {
  display: flex;
  gap: 8px;
}
.pick-row select {
  flex: 1;
}
.add-btn {
  background: var(--primary-light);
  border: 1px solid var(--primary);
  color: var(--primary-dark);
  border-radius: 8px;
  padding: 0 12px;
  cursor: pointer;
  white-space: nowrap;
}
.ing-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.ing-row .grow {
  flex: 1;
}
.ing-row .qty {
  width: 70px;
}
.ing-row select {
  width: 70px;
}
.del-btn {
  border: none;
  background: var(--danger-light);
  color: var(--danger);
  width: 30px;
  height: 30px;
  border-radius: 6px;
  cursor: pointer;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}
.btn-cancel,
.btn-submit {
  padding: 9px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.btn-cancel {
  background: #fff;
  border: 1px solid var(--border);
  color: var(--text);
}
.btn-submit {
  background: var(--primary);
  border: none;
  color: #fff;
  font-weight: 600;
}
@media (max-width: 560px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
