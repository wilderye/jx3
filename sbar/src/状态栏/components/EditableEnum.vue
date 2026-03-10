<template>
  <!-- 非编辑状态：显示文字，双击进入编辑 -->
  <span v-if="!editing" class="editable-enum" @dblclick="startEdit">
    {{ modelValue }}
  </span>
  <!-- 编辑状态：原位 select + ✓✗ 按钮 -->
  <span v-else class="editable-wrapper">
    <select ref="selectRef" v-model="draft" class="edit-select">
      <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
    </select>
    <button class="edit-btn" @click="confirm">✓</button>
    <button class="edit-btn" @click="cancel">✗</button>
  </span>
</template>

<script setup lang="ts">
import type { MvuResult } from '../utils/mvu-bridge';
import { writeMvuVariable } from '../utils/mvu-bridge';

const props = defineProps<{
  modelValue: string;
  mvuPath: string;
  options: string[];
}>();

const emit = defineEmits<{
  (e: 'updated'): void;
}>();

const mvuData = inject<MvuResult>('mvuData')!;

const editing = ref(false);
const draft = ref('');
const selectRef = ref<HTMLSelectElement>();

function startEdit() {
  draft.value = props.modelValue;
  editing.value = true;
  nextTick(() => selectRef.value?.focus());
}

async function confirm() {
  const newVal = draft.value;
  if (newVal === props.modelValue) {
    editing.value = false;
    return;
  }
  await writeMvuVariable(props.mvuPath, newVal, mvuData);
  editing.value = false;
  emit('updated');
}

function cancel() {
  editing.value = false;
}
</script>

<style scoped>
.editable-enum {
  cursor: pointer;
  user-select: none;
}
.editable-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.edit-select {
  background: transparent;
  border: none;
  border-bottom: 1px solid currentColor;
  color: inherit;
  font: inherit;
  padding: 0;
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
.edit-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 0.85em;
  cursor: pointer;
  padding: 0 2px;
  opacity: 0.7;
}
.edit-btn:hover {
  opacity: 1;
}
</style>
