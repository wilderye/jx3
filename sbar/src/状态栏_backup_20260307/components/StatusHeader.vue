<template>
  <!-- 原 App.tsx 389: grid -->
  <div class="grid grid-cols-1 gap-8 md:grid-cols-[120px_1fr] md:gap-12">
    <!-- 原 App.tsx 391: Left Column: Year (Desktop) -->
    <div class="hidden justify-center md:flex">
      <h1
        class="writing-vertical-rl -mt-5 font-serif text-[120px] leading-none tracking-[0.05em] opacity-90 select-none"
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
      <div class="mb-8 flex items-start justify-between md:hidden">
        <h1
          class="mt-2 flex items-end gap-2 whitespace-nowrap opacity-90 select-none"
          style="font-family: 'Noto Serif CJK', serif; font-weight: normal"
        >
          <span class="text-5xl leading-none">
            {{ yearText.slice(0, 2) }}
          </span>
          <span class="mb-[2px] text-xl tracking-wide opacity-70">
            {{ yearText.slice(2) }}
          </span>
        </h1>
        <div ref="menuRefMobile" class="mt-2 flex items-start gap-1 md:hidden">
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
        class="mb-12 flex flex-col items-center gap-3 text-lg tracking-widest opacity-80 select-none md:mb-16 md:items-start md:text-xl"
      >
        <div class="leading-none">{{ worldInfo.date }}</div>
        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-base md:gap-x-6 md:text-lg">
          <span class="flex items-center gap-2">
            <span>{{ timeName }}</span>
            <span class="font-serif text-base tracking-normal opacity-60 md:text-lg">{{ timeNumber }}</span>
          </span>
          <span>{{ worldInfo.location }}</span>
        </div>
      </div>

      <!-- 内容插槽（原 App.tsx 516+ 的内容区域） -->
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
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
// 桌面版：4字时第2字后加·
const desktopYear = computed(() => {
  const y = props.worldInfo.year;
  return y.length === 4 ? y.slice(0, 2) + '\u00B7' + y.slice(2) : y;
});

// 时间
const timeName = computed(() => props.worldInfo.timeName || '');
const timeNumber = computed(() => props.worldInfo.timeNumber || '');

// 暴露 ref 给父组件
defineExpose({ menuRef, menuRefMobile });
</script>
