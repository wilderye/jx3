<template>
  <!-- 手机端图标 -->
  <div
    class="md:hidden"
    style="
      position: absolute;
      top: 300px;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      height: 300px;
      opacity: 0.05;
      pointer-events: none;
      z-index: 0;
    "
  >
    <Transition name="sect-icon" mode="out-in" appear>
      <svg :key="activeChar.name" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <path v-for="(d, i) in iconPaths" :key="i" fill="#000000" :d="d" />
      </svg>
    </Transition>
  </div>
  <!-- 桌面端图标 -->
  <div
    class="hidden md:flex"
    style="
      position: absolute;
      top: 50%;
      left: 118px;
      transform: translate(-50%, -50%);
      width: 450px;
      height: 450px;
      opacity: 0.05;
      pointer-events: none;
      z-index: 0;
    "
  >
    <Transition name="sect-icon" mode="out-in" appear>
      <svg :key="activeChar.name" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <path v-for="(d, i) in iconPaths" :key="i" fill="#000000" :d="d" />
      </svg>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { SECT_ICONS } from '../data/sect-icons';

const props = defineProps<{
  activeChar: { name: string; sect: string };
}>();

const iconPaths = computed(() => {
  const rawName = props.activeChar.sect.split('\u00B7')[0];
  // 精确匹配
  if (SECT_ICONS[rawName]) return SECT_ICONS[rawName];
  // 模糊匹配：归属名包含门派简称（如 "长歌门" 包含 "长歌"）
  for (const key of Object.keys(SECT_ICONS)) {
    if (rawName.includes(key)) return SECT_ICONS[key];
  }
  return [];
});
</script>
