<template>
  <!-- ===== 手机端 ===== -->
  <template v-if="isMobile">
    <div class="relative flex items-start">
      <div :class="'tianxia-panel mobile absolute right-full top-0 mr-1 flex gap-1' + (menuOpen ? ' open' : '')">
        <button
          v-for="item in items"
          :key="item"
          :class="
            [
              'w-7 h-[48px] border rounded-sm flex items-center justify-center transition-colors',
              isActive(item) ? 'border-black/25 bg-black/5' : 'border-black/10 hover:bg-black/5',
            ].join(' ')
          "
          @click="handleSelect(item)"
        >
          <span
            :class="
              [
                'writing-vertical-rl text-xs tracking-widest select-none transition-colors',
                isActive(item) ? 'text-black/70' : 'text-black/30 hover:text-black/60',
              ].join(' ')
            "
          >
            {{ item }}
          </span>
        </button>
      </div>
      <button
        class="group flex h-[48px] w-7 shrink-0 items-center justify-center rounded-sm border border-black/15 transition-colors hover:bg-black/5"
        @click="setMenuOpen(!menuOpen)"
      >
        <span
          class="writing-vertical-rl text-xs tracking-widest text-black/40 transition-colors select-none group-hover:text-black"
        >
          天下
        </span>
      </button>
    </div>
  </template>

  <!-- ===== 桌面端 ===== -->
  <template v-else>
    <div :class="'tianxia-panel desktop flex gap-1' + (menuOpen ? ' open' : '')">
      <button
        v-for="item in items"
        :key="item"
        :class="
          [
            'w-10 h-24 border rounded-sm flex items-center justify-center transition-colors',
            isActive(item) ? 'border-black/30 bg-black/5' : 'border-black/10 hover:bg-black/5',
          ].join(' ')
        "
        @click="handleSelect(item)"
      >
        <span
          :class="
            [
              'writing-vertical-rl tracking-widest select-none transition-colors',
              isActive(item) ? 'text-black/80' : 'text-black/40 hover:text-black/70',
            ].join(' ')
          "
        >
          {{ item }}
        </span>
      </button>
    </div>
    <button
      class="group flex h-24 w-10 items-center justify-center rounded-sm border border-black/20 transition-colors hover:bg-black/5"
      @click="setMenuOpen(!menuOpen)"
    >
      <span
        class="writing-vertical-rl tracking-widest text-black/60 transition-colors select-none group-hover:text-black"
      >
        天下
      </span>
    </button>
  </template>
</template>

<script setup lang="ts">
// ===== 天下菜单组件 =====
// Phase 1: Framer Motion → CSS transition

const props = defineProps<{
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  viewMode: string;
  onSelect: (view: string) => void;
  isMobile: boolean;
}>();

const items = ['故人', '见闻', '舆图'];

function menuToView(item: string) {
  return item === '故人' ? '人物' : item;
}

function handleSelect(item: string) {
  props.onSelect(menuToView(item));
  props.setMenuOpen(false);
}

function isActive(item: string) {
  return props.viewMode === menuToView(item);
}
</script>
