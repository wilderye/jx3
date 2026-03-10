<template>
  <!-- 无事件时的空状态 -->
  <div v-if="!events || events.length === 0" class="mt-8 text-center text-black/30 italic select-none md:text-left">
    暂无记事
  </div>

  <!-- 标签轮播 + 内容 -->
  <div v-else class="mt-6 flex w-full flex-col items-center md:mt-8 md:items-start">
    <!-- Tag Selector (支持拖拽滑动) -->
    <div
      class="relative mb-6 flex h-16 w-full max-w-[400px] items-center overflow-hidden md:mb-4 md:-ml-[85px]"
      :style="{
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'pan-y',
      }"
      @mousedown="onPointerDown"
      @touchstart="onTouchStart"
    >
      <div class="relative flex h-full w-full items-center justify-center">
        <template v-for="(event, idx) in events" :key="yearKey + '-' + event.tag">
          <div
            class="tag-carousel-item absolute text-base tracking-widest whitespace-nowrap select-none"
            :style="getTagStyle(idx)"
            @click="onTagClick(idx)"
          >
            {{ event.tag }}
          </div>
        </template>
      </div>
    </div>

    <!-- Content -->
    <div class="scroll-fade-mask max-h-[150px] w-full overflow-y-auto md:max-h-[245px]">
      <div
        v-if="events[activeIndex]"
        :key="events[activeIndex].tag"
        class="event-content-enter px-4 text-center text-base leading-loose tracking-wider whitespace-pre-line opacity-80 md:px-0 md:text-left md:text-lg"
      >
        {{ events[activeIndex].content }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';

const props = defineProps<{
  events: Array<{ tag: string; content: string }>;
  activeIndex: number;
  onChange: (idx: number) => void;
  yearKey: string;
}>();

// ===== 拖拽状态 =====
const dragOffset = ref(0); // 实时跟手偏移量（px）
const dragging = ref(false); // 是否正在拖拽
let startX = 0; // 按下时的 X 坐标
let hasDragged = false; // 本次交互是否产生了有效拖拽（用于抑制 click）
const THRESHOLD = 30; // 触发切换的拖拽阈值（px），与原版一致
const TAG_GAP = 93; // 标签间距（px）

// ===== 标签样式计算（基于视觉位置） =====
function getTagStyle(idx: number) {
  const pixelOffset = (idx - props.activeIndex) * TAG_GAP + dragOffset.value;
  // 视觉距离（以标签间距为单位）
  const visualDist = Math.abs(pixelOffset / TAG_GAP);
  // 是否是当前激活的标签（未拖拽时）
  const isActive = idx === props.activeIndex && !dragging.value;

  let opacity: number;
  if (isActive) {
    opacity = 1;
  } else if (visualDist <= 0.3) {
    // 非常近，接近中心
    opacity = 1;
  } else if (visualDist <= 2.5) {
    opacity = 0.3;
  } else {
    opacity = 0;
  }

  return {
    transform: `translateX(${pixelOffset}px) scale(${isActive ? 1.2 : 0.8})`,
    opacity,
    zIndex: isActive ? 5 : 0,
    cursor: dragging.value ? 'grabbing' : 'pointer',
    transition: dragging.value ? 'opacity 0.15s ease-out' : undefined,
  };
}

// ===== 点击处理（拖拽时抑制） =====
function onTagClick(idx: number) {
  if (hasDragged) return;
  props.onChange(idx);
}

// ===== 鼠标事件 =====
function onPointerDown(e: MouseEvent) {
  if (e.button !== 0) return; // 只响应左键
  startX = e.clientX;
  dragging.value = true;
  hasDragged = false;
  dragOffset.value = 0;

  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);
}

function onPointerMove(e: MouseEvent) {
  const dx = e.clientX - startX;
  dragOffset.value = dx;
  if (Math.abs(dx) > 5) hasDragged = true;
}

function onPointerUp() {
  document.removeEventListener('mousemove', onPointerMove);
  document.removeEventListener('mouseup', onPointerUp);
  finishDrag();
}

// ===== 触摸事件 =====
function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return;
  startX = e.touches[0].clientX;
  dragging.value = true;
  hasDragged = false;
  dragOffset.value = 0;

  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd);
  document.addEventListener('touchcancel', onTouchEnd);
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - startX;
  dragOffset.value = dx;
  if (Math.abs(dx) > 5) {
    hasDragged = true;
    // 水平滑动时阻止页面滚动
    e.preventDefault();
  }
}

function onTouchEnd() {
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('touchend', onTouchEnd);
  document.removeEventListener('touchcancel', onTouchEnd);
  finishDrag();
}

// ===== 结束拖拽：判定切换或回弹 =====
function finishDrag() {
  const offset = dragOffset.value;
  dragging.value = false;
  dragOffset.value = 0; // CSS transition 自动回弹

  if (Math.abs(offset) >= THRESHOLD) {
    // 根据拖拽距离计算跳过的标签数（每93px间距一个标签）
    const steps = Math.max(1, Math.round(Math.abs(offset) / 93));
    // 向左拖(负值) → 往后切, 向右拖(正值) → 往前切
    const direction = offset < 0 ? 1 : -1;
    const newIndex = Math.max(0, Math.min(props.events.length - 1, props.activeIndex + direction * steps));
    if (newIndex !== props.activeIndex) {
      props.onChange(newIndex);
    }
  }

  // 延迟重置 hasDragged，确保 click 事件被正确抑制
  requestAnimationFrame(() => {
    hasDragged = false;
  });
}

// 组件卸载时清理
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onPointerMove);
  document.removeEventListener('mouseup', onPointerUp);
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('touchend', onTouchEnd);
  document.removeEventListener('touchcancel', onTouchEnd);
});
</script>
