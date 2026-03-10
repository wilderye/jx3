<template>
  <div class="relative mx-auto max-w-7xl p-4 md:p-12 lg:p-24">
    <StatusHeader
      ref="statusHeaderRef"
      :world-info="WORLD_INFO"
      :view-mode="viewMode"
      :on-view-change="(v: string) => (viewMode = v)"
      :menu-open="menuOpen"
      :set-menu-open="(v: boolean) => (menuOpen = v)"
    >
      <!-- 门派图标背景 -->
      <SectIconBackground v-if="showSectIcon" :active-char="activeChar" />

      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0">
        <!-- 主视图切换区 -->
        <Transition name="view-fade" mode="out-in" :duration="400">
          <div v-if="viewMode === '人物'" key="char">
            <CharacterContent :active-char="activeChar" :prev-char="prevChar" :next-char="nextChar" />
          </div>
          <div v-else-if="viewMode === '见闻'" key="events">
            <EventsView
              :events="EVENTS_DATA"
              :events-year="eventsYear"
              :set-events-year="(v: string) => (eventsYear = v)"
              :active-event-index="activeEventIndex"
              :set-active-event-index="(v: number) => (activeEventIndex = v)"
            />
          </div>
          <div v-else-if="viewMode === '舆图'" key="map" style="flex: 1; min-height: 0">
            <MapView :location="WORLD_INFO.location" :year="GREGORIAN_YEAR" />
          </div>
        </Transition>
      </div>

      <!-- 诗句 / 音量条 -->
      <Transition name="view-fade" :duration="400">
        <div v-if="showPoetry" class="mt-auto flex justify-center pt-8 select-none md:justify-start">
          <p
            class="w-fit text-center text-[min(0.875rem,calc((100vw-2rem)/20))] tracking-[0.3em] whitespace-nowrap md:text-left md:text-base"
            :class="{ 'cursor-pointer': volumeActive }"
            :style="{ ...poetryStyle, touchAction: volumeActive ? 'none' : 'auto' }"
            @mousedown="onVolumeStart"
            @touchstart.passive="onVolumeTouchStart"
            @touchmove.prevent="onVolumeTouchMove"
            @touchend="onVolumeTouchEnd"
          >
            待到秋来九月八，我花开后百花杀
          </p>
        </div>
      </Transition>
    </StatusHeader>
  </div>
</template>

<script setup lang="ts">
import CharacterContent from './components/CharacterContent.vue';
import EventsView from './components/EventsView.vue';
import MapView from './components/MapView.vue';
import SectIconBackground from './components/SectIconBackground.vue';
import StatusHeader from './components/StatusHeader.vue';
import { SECT_LIST, TIANXIA_TAGS, YEARS } from './data/chronicles';
import './styles/status-bar.css';
import type { MusicPlayerAPI, MusicPlayerState } from './utils/music-bridge';
import { extractPlayerState, initializeMusicPlayer } from './utils/music-bridge';
import type { MvuResult } from './utils/mvu-bridge';

// ===== 从 index.ts 注入的 Mvu 数据 =====
const mvuData = inject<MvuResult | null>('mvuData');
if (!mvuData) {
  throw new Error('[App.vue] mvuData 注入失败，请确保 index.ts 已正确读取 Mvu 数据');
}

// --- 解包数据 ---
const WORLD_INFO = mvuData.worldInfo;
const CHARACTERS = mvuData.characters;
const GREGORIAN_YEAR = mvuData.gregorianYear;

// ===== 从年代表生成见闻数据 =====
/** 将某一年的年代表数据转换为 {tag, content}[] */
function buildYearEvents(year: number): Array<{ tag: string; content: string }> {
  const entry = YEARS[String(year)];
  if (!entry) return [];
  const events: Array<{ tag: string; content: string }> = [];
  // 天下标签（朝堂/江湖/九天/...）
  if (entry.天下) {
    for (const tag of TIANXIA_TAGS) {
      const text = entry.天下[tag];
      if (text) events.push({ tag, content: text });
    }
  }
  // 门派标签
  if (entry.门派) {
    for (const sect of SECT_LIST) {
      const text = entry.门派[sect];
      if (text) events.push({ tag: sect, content: text });
    }
  }
  return events;
}

const EVENTS_DATA: Record<string, Array<{ tag: string; content: string }>> = {
  往岁: buildYearEvents(GREGORIAN_YEAR - 1),
  今岁: buildYearEvents(GREGORIAN_YEAR),
  来岁: buildYearEvents(GREGORIAN_YEAR + 1),
};

// ===== 状态 =====
const activeCharIndex = ref(0);
const viewMode = ref('人物');
const menuOpen = ref(false);
const eventsYear = ref('今岁');
const activeEventIndex = ref(0);
const statusHeaderRef = ref<InstanceType<typeof StatusHeader>>();

// 年份变更时重置事件索引
watch(eventsYear, () => {
  activeEventIndex.value = 0;
});

// 延迟显示门派图标和诗句，等待旧视图淡出完毕后再挂载
const showSectIcon = ref(viewMode.value === '人物');
const showPoetry = ref(viewMode.value !== '舆图');
let sectIconTimer: ReturnType<typeof setTimeout> | null = null;
let poetryTimer: ReturnType<typeof setTimeout> | null = null;
watch(viewMode, val => {
  if (sectIconTimer) clearTimeout(sectIconTimer);
  if (poetryTimer) clearTimeout(poetryTimer);
  if (val === '人物') {
    sectIconTimer = setTimeout(() => {
      showSectIcon.value = true;
    }, 400);
    poetryTimer = setTimeout(() => {
      showPoetry.value = true;
    }, 400);
  } else if (val === '舆图') {
    showSectIcon.value = false;
    showPoetry.value = false;
  } else {
    // 见闻视图：隐藏图标，延迟显示诗句
    showSectIcon.value = false;
    poetryTimer = setTimeout(() => {
      showPoetry.value = true;
    }, 400);
  }
});

// 当前角色
const activeChar = computed(() => CHARACTERS[activeCharIndex.value]);

// 角色切换
const nextChar = () => {
  activeCharIndex.value = (activeCharIndex.value + 1) % CHARACTERS.length;
};
const prevChar = () => {
  activeCharIndex.value = (activeCharIndex.value - 1 + CHARACTERS.length) % CHARACTERS.length;
};

// 点击外部关闭菜单（原 app.js L137-156：需排除菜单区域的点击）
watch(menuOpen, val => {
  if (!val) return;
  function handler(e: MouseEvent) {
    const menuEl = statusHeaderRef.value?.menuRef;
    const menuMobileEl = statusHeaderRef.value?.menuRefMobile;
    if (menuEl && !menuEl.contains(e.target as Node) && (!menuMobileEl || !menuMobileEl.contains(e.target as Node))) {
      menuOpen.value = false;
    }
  }
  document.addEventListener('mousedown', handler);
  onWatcherCleanup(() => {
    document.removeEventListener('mousedown', handler);
  });
});

// ===== 音乐播放器集成 =====
const musicState = reactive<MusicPlayerState>({
  isApiReady: false,
  isPlaying: false,
  masterVolume: 0.5,
  hasQueue: false,
});

let musicApi: MusicPlayerAPI | null = null;
let unsubFullState: (() => void) | null = null;

onMounted(async () => {
  try {
    const api = await initializeMusicPlayer();
    musicApi = api;

    // 获取初始状态
    const initial = api.getCurrentState();
    Object.assign(musicState, extractPlayerState(initial), { isApiReady: true });

    // 注册状态更新监听
    unsubFullState = api.onFullStateUpdate(payload => {
      Object.assign(musicState, extractPlayerState(payload));
    });

    console.log('[App.vue] 音乐播放器初始化成功');
  } catch (error: any) {
    console.error('[App.vue] 音乐播放器初始化失败:', error);
    toastr.error(error.message, '播放器加载失败', { timeOut: 10000 });
  }
});

onUnmounted(() => {
  if (unsubFullState) {
    unsubFullState();
    unsubFullState = null;
  }
});

// ===== 诗句音量条 =====
const volumeActive = computed(() => musicState.isApiReady && musicState.hasQueue);

const poetryStyle = computed(() => {
  if (!volumeActive.value) {
    return { opacity: '0.5' };
  }
  const pct = Math.round(musicState.masterVolume * 100);
  return {
    background: `linear-gradient(to right, rgba(0,0,0,0.5) ${pct}%, rgba(0,0,0,0.15) ${pct}%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };
});

// --- 拖拽音量控制 ---
let isDraggingVolume = false;
let volumeTarget: HTMLElement | null = null;

/** 根据 clientX 计算音量百分比 */
function calcVolumePct(clientX: number): number {
  if (!volumeTarget) return 0;
  const rect = volumeTarget.getBoundingClientRect();
  return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
}

/** 应用即时音量（不持久化） */
function applyLiveVolume(clientX: number) {
  const pct = calcVolumePct(clientX);
  musicState.masterVolume = pct;
  musicApi?.setLiveVolume(pct);
}

// -- 鼠标事件 --
function onVolumeStart(e: MouseEvent) {
  if (!volumeActive.value) return;
  isDraggingVolume = true;
  volumeTarget = e.currentTarget as HTMLElement;
  applyLiveVolume(e.clientX);
  document.addEventListener('mousemove', onDocMouseMove);
  document.addEventListener('mouseup', onDocMouseUp);
}
function onDocMouseMove(e: MouseEvent) {
  if (!isDraggingVolume) return;
  applyLiveVolume(e.clientX);
}
function onDocMouseUp(e: MouseEvent) {
  if (!isDraggingVolume) return;
  const pct = calcVolumePct(e.clientX);
  musicState.masterVolume = pct;
  musicApi?.persistVolumeAndBroadcast(pct);
  isDraggingVolume = false;
  volumeTarget = null;
  document.removeEventListener('mousemove', onDocMouseMove);
  document.removeEventListener('mouseup', onDocMouseUp);
}

// -- 触摸事件 --
function onVolumeTouchStart(e: TouchEvent) {
  if (!volumeActive.value) return;
  isDraggingVolume = true;
  volumeTarget = e.currentTarget as HTMLElement;
  applyLiveVolume(e.touches[0].clientX);
}
function onVolumeTouchMove(e: TouchEvent) {
  if (!isDraggingVolume) return;
  applyLiveVolume(e.touches[0].clientX);
}
function onVolumeTouchEnd(e: TouchEvent) {
  if (!isDraggingVolume) return;
  // changedTouches 包含刚离开的触点
  const clientX = e.changedTouches[0]?.clientX ?? 0;
  const pct = calcVolumePct(clientX);
  musicState.masterVolume = pct;
  musicApi?.persistVolumeAndBroadcast(pct);
  isDraggingVolume = false;
  volumeTarget = null;
}

// 向子组件提供音乐播放器状态和 API
provide('musicPlayer', {
  state: musicState,
  togglePlayPause: () => musicApi?.togglePlayPause(),
  setVolume: (v: number) => musicApi?.persistVolumeAndBroadcast(v),
});
</script>
