<template>
  <!-- 原 App.tsx 389: grid -->
  <div class="grid grid-cols-1 gap-8 md:grid-cols-[120px_1fr] md:gap-12">
    <!-- 原 App.tsx 391: Left Column: Year (Desktop) -->
    <div class="hidden justify-center md:flex">
      <h1
        class="writing-vertical-rl -mt-3 font-serif text-[120px] leading-none tracking-[0.05em] whitespace-nowrap opacity-90 select-none"
        :style="{ fontFamily: '&quot;Liu Jian Mao Cao&quot;, serif' }"
      >
        {{ desktopYear }}
      </h1>
    </div>

    <!-- 原 App.tsx 401: Right Column: Content -->
    <div class="relative flex flex-col md:pr-6">
      <!-- 原 App.tsx 403: "天下" Button - Desktop -->
      <div ref="menuRef" class="absolute -top-4 right-6 z-50 hidden items-start gap-2 md:flex">
        <TianxiaMenu
          :menu-open="menuOpen"
          :set-menu-open="setMenuOpen"
          :view-mode="viewMode"
          :on-select="onViewChange"
          :is-mobile="false"
        />
      </div>

      <!-- 原 App.tsx 450: Mobile Header: Year + Menu Button -->
      <div class="mb-4 flex items-start justify-between md:hidden">
        <h1
          class="mt-2 flex items-end gap-2 whitespace-nowrap opacity-90 select-none"
          style="font-family: 'Noto Serif CJK', serif; font-weight: normal"
        >
          <span class="text-4xl leading-none">
            {{ yearText.slice(0, 2) }}
          </span>
          <span class="mb-[2px] text-[15px] tracking-wide opacity-70">
            {{ yearText.slice(2) }}
          </span>
        </h1>
        <div ref="menuRefMobile" class="mt-[6px] flex items-start gap-1 md:hidden">
          <TianxiaMenu
            :menu-open="menuOpen"
            :set-menu-open="setMenuOpen"
            :view-mode="viewMode"
            :on-select="onViewChange"
            :is-mobile="true"
          />
        </div>
      </div>

      <!-- 原 App.tsx 507: Date, Time, Location -->
      <div
        class="mb-10 flex flex-col items-center gap-2 text-lg tracking-widest opacity-80 select-none md:mb-16 md:items-start md:gap-3 md:text-xl"
      >
        <div class="leading-none"><EditableText :model-value="worldInfo.date" mvu-path="世界.日期" /></div>
        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-base md:gap-x-6 md:text-lg">
          <span class="flex items-center gap-2">
            <span>{{ timeName }}</span>
            <span class="font-serif text-base tracking-normal opacity-60 md:text-lg"
              ><EditableText :model-value="timeNumber" mvu-path="世界.时间"
            /></span>
          </span>
          <EditableText :model-value="worldInfo.location" mvu-path="世界.地点" />
        </div>
      </div>

      <!-- 内容插槽（原 App.tsx 516+ 的内容区域） -->
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import EditableText from './EditableText.vue';
import TianxiaMenu from './TianxiaMenu.vue';

const props = defineProps<{
  worldInfo: { year: string; date: string; timeName: string; timeNumber: string; location: string };
  viewMode: string;
  onViewChange: (view: string) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}>();

const menuRef = ref<HTMLElement>();
const menuRefMobile = ref<HTMLElement>();

// 年号格式化
const yearText = props.worldInfo.year;
// 桌面版：4字加中点，6字以上截断到5字（末尾"年"字可省略）
const desktopYear = computed(() => {
  const y = props.worldInfo.year;
  if (y.length === 4) return y.slice(0, 2) + '\u00B7' + y.slice(2);
  if (y.length > 5) return y.slice(0, 5);
  return y;
});

// 时间
const timeName = computed(() => props.worldInfo.timeName || '');
const timeNumber = computed(() => props.worldInfo.timeNumber || '');

// 暴露 ref 给父组件
defineExpose({ menuRef, menuRefMobile });
</script>
