<template>
  <div>
    <!-- Character Section container -->
    <div
      class="relative z-10 mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-12 sm:pl-28 md:mt-6 md:mb-24 md:flex-row md:items-start md:gap-16 md:pl-0"
    >
      <!-- Character Switcher (long-press = play/pause) -->
      <div class="relative z-10 flex items-center gap-4 md:gap-6">
        <!-- 手机端门派图标（定位在切换区中心，跟随名字位置） -->
        <div
          class="pointer-events-none absolute top-1/2 left-1/2 h-[270px] w-[270px] -translate-x-1/2 -translate-y-1/2 opacity-5 sm:h-[300px] sm:w-[300px] md:hidden"
          style="z-index: 0"
        >
          <Transition name="sect-icon" mode="out-in" appear>
            <svg :key="activeChar.name" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
              <path v-for="(d, i) in iconPaths" :key="i" fill="#000000" :d="d" />
            </svg>
          </Transition>
        </div>
        <button class="p-2 text-3xl opacity-20 transition-opacity select-none hover:opacity-100" @click="prevChar">
          〈
        </button>
        <div
          class="relative flex h-[220px] w-20 items-center justify-center transition-transform duration-300 ease-out sm:h-[220px] md:h-[300px] md:w-24"
          :style="isPressing ? 'transform: scale(0.96)' : ''"
          @mousedown="onPressStart"
          @mouseup="onPressEnd"
          @mouseleave="onPressEnd"
          @touchstart.passive="onPressStart"
          @touchend="onPressEnd"
          @touchcancel="onPressEnd"
        >
          <Transition name="char-name" mode="out-in">
            <div
              :key="activeChar.name"
              :class="
                'absolute leading-none tracking-[0.2em] font-medium select-none writing-vertical-rl sm:translate-y-2 ' +
                nameSize.mobile +
                ' ' +
                nameSize.desktop
              "
            >
              {{ activeChar.name }}
            </div>
          </Transition>
        </div>
        <button class="p-2 text-3xl opacity-20 transition-opacity select-none hover:opacity-100" @click="nextChar">
          〉
        </button>
      </div>

      <!-- Character Details & Affairs -->
      <div
        class="relative z-10 flex min-h-[140px] w-full max-w-md flex-col justify-start sm:min-h-[220px] sm:justify-center md:min-h-[280px] md:justify-center"
      >
        <Transition name="char-details" mode="out-in">
          <div
            :key="activeChar.name"
            class="absolute flex w-full flex-col items-center gap-2 text-base tracking-widest opacity-80 select-none sm:items-start md:items-start md:gap-4 md:text-xl"
          >
            <div class="flex items-center gap-4">
              <span>{{ trustStageName }}</span>
              <span class="font-serif text-xl md:text-2xl">
                <EditableText
                  :model-value="activeChar.trust"
                  :mvu-path="`人物.${activeChar.name}.亲近度`"
                  input-type="number"
                />
              </span>
            </div>
            <div><EditableText :model-value="activeChar.sect" :mvu-path="`人物.${activeChar.name}.归属`" /></div>
            <div>
              <EditableText :model-value="activeChar.relationship" :mvu-path="`人物.${activeChar.name}.关系`" />
            </div>

            <div
              v-if="activeChar.affairs && activeChar.affairs.length > 0"
              class="scroll-fade-mask mt-2 flex max-h-[65px] flex-col items-center gap-1 overflow-y-auto px-1 text-center text-sm tracking-wider opacity-70 sm:max-h-[100px] sm:items-start sm:px-0 sm:text-left md:mt-6 md:max-h-[130px] md:items-start md:gap-2 md:px-0 md:text-left md:text-base"
            >
              <div v-for="(affair, idx) in activeChar.affairs" :key="idx" class="flex items-start gap-1">
                <span class="opacity-40 select-none"> · </span>
                <span>
                  <EditableText
                    :model-value="affair.content"
                    mvu-path=""
                    :on-write="(newName: string) => renameTask(activeChar.name, affair.content, newName)"
                  />
                  <span class="ml-2 text-xs opacity-50 md:text-sm">
                    <EditableText
                      :model-value="affair.timeLimit"
                      :mvu-path="`人物.${activeChar.name}.事务.${affair.content}.时限`"
                    />
                    |
                    <EditableEnum
                      :model-value="affair.status"
                      :mvu-path="`人物.${activeChar.name}.事务.${affair.content}.状态`"
                      :options="['未开始', '进行中', '已完成']"
                    />
                  </span>
                </span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Affair {
  content: string;
  timeLimit: string;
  status: string;
}

interface Character {
  name: string;
  trust: number;
  sect: string;
  relationship: string;
  affairs: Affair[];
}

const props = defineProps<{
  activeChar: Character;
  prevChar: () => void;
  nextChar: () => void;
}>();

import { SECT_ICONS } from '../data/sect-icons';
import type { MusicPlayerState } from '../utils/music-bridge';
import type { MvuResult } from '../utils/mvu-bridge';
import { renameTaskKey } from '../utils/mvu-bridge';
import EditableEnum from './EditableEnum.vue';
import EditableText from './EditableText.vue';

const mvuData = inject<MvuResult>('mvuData')!;

async function renameTask(charName: string, oldKey: string, newKey: string) {
  await renameTaskKey(charName, oldKey, newKey, mvuData);
}

// 门派图标路径
const iconPaths = computed(() => {
  const rawName = props.activeChar.sect.split('\u00B7')[0];
  if (SECT_ICONS[rawName]) return SECT_ICONS[rawName];
  for (const key of Object.keys(SECT_ICONS)) {
    if (rawName.includes(key)) return SECT_ICONS[key];
  }
  return [];
});

// 动态字号
function getNameSize(name: string) {
  const len = name.length;
  if (len <= 3) return { mobile: 'text-[55px]', desktop: 'md:text-[80px]' };
  if (len === 4) return { mobile: 'text-[42px]', desktop: 'md:text-[62px]' };
  if (len === 5) return { mobile: 'text-[34px]', desktop: 'md:text-[50px]' };
  if (len === 6) return { mobile: 'text-[28px]', desktop: 'md:text-[42px]' };
  return { mobile: 'text-[24px]', desktop: 'md:text-[36px]' };
}

const nameSize = computed(() => getNameSize(props.activeChar.name));

// 信赖阶段名称映射（-100 ~ 100，左闭右开，共 10 阶）
function getTrustStageName(trust: number): string {
  const t = Math.max(-100, Math.min(100, trust));
  if (t < -80) return '血海深仇';
  if (t < -60) return '势若水火';
  if (t < -40) return '冷眼相待';
  if (t < -20) return '形同陌路';
  if (t < 0) return '泛泛之交';
  if (t < 20) return '萍水相逢';
  if (t < 40) return '相谈甚欢';
  if (t < 60) return '引为知己';
  if (t < 80) return '八拜之交';
  return '生死不离';
}
const trustStageName = computed(() => getTrustStageName(props.activeChar.trust));

// ===== 音乐播放器长按控制 =====
const musicPlayer = inject<{
  state: MusicPlayerState;
  togglePlayPause: () => void;
}>('musicPlayer', null as any);

const isPressing = ref(false);
let pressTimer: ReturnType<typeof setTimeout> | null = null;

function onPressStart() {
  if (!musicPlayer?.state.isApiReady || !musicPlayer.state.hasQueue) return;
  isPressing.value = true;
  pressTimer = setTimeout(() => {
    musicPlayer.togglePlayPause();
  }, 500);
}

function onPressEnd() {
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
  isPressing.value = false;
}
</script>
