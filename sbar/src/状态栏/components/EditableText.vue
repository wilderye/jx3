<template>
  <!-- 非编辑状态：显示文字，双击进入编辑 -->
  <span v-if="!editing" class="editable-text" @dblclick="startEdit">
    <slot>{{ modelValue }}</slot>
  </span>
  <!-- 编辑状态：原位 input + ✓✗ 按钮 -->
  <span v-else class="editable-wrapper">
    <input
      ref="inputRef"
      v-model="draft"
      class="edit-input"
      :type="inputType"
      @keydown.enter="confirm"
      @keydown.escape="cancel"
    />
    <button class="edit-btn" @click="confirm">✓</button>
    <button class="edit-btn" @click="cancel">✗</button>
  </span>
</template>

<script setup lang="ts">
import type { MvuResult } from '../utils/mvu-bridge';
import { writeMvuVariable } from '../utils/mvu-bridge';

const props = defineProps<{
  /** 当前显示值 */
  modelValue: string | number;
  /** stat_data 下的路径，如 '世界.地点' */
  mvuPath: string;
  /** 输入类型，默认 'text' */
  inputType?: string;
  /** 自定义写入函数（如键名重命名），提供时跳过默认 writeMvuVariable */
  onWrite?: (newVal: string) => Promise<void>;
}>();

const emit = defineEmits<{
  (e: 'updated'): void;
}>();

const mvuData = inject<MvuResult>('mvuData')!;

const editing = ref(false);
const draft = ref('');
const inputRef = ref<HTMLInputElement>();

function startEdit() {
  draft.value = String(props.modelValue);
  editing.value = true;
  nextTick(() => inputRef.value?.focus());
}

async function confirm() {
  const newVal = draft.value;
  if (newVal === String(props.modelValue)) {
    editing.value = false;
    return;
  }
  if (props.onWrite) {
    await props.onWrite(newVal);
  } else {
    await writeMvuVariable(props.mvuPath, newVal, mvuData);
  }
  editing.value = false;
  emit('updated');
}

function cancel() {
  editing.value = false;
}
</script>

<style scoped>
.editable-text {
  cursor: pointer;
  user-select: none;
}
.editable-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.edit-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid currentColor;
  color: inherit;
  font: inherit;
  padding: 0;
  width: 6em;
  outline: none;
  -moz-appearance: textfield;
}
.edit-input::-webkit-outer-spin-button,
.edit-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
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
