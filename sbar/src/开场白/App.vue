<script setup lang="ts">
import gsap from 'gsap';
import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { /* SECT_ICONS, */ SECT_QUOTES, SECTS, SKILL_ICONS } from './data/sects';

// ===== 阶段管理 =====
type Stage = 'unseal' | 'sect' | 'skill' | 'farewell';
const stage = ref<Stage>('unseal');

// ===== 阶段0：启封 =====

// --- 音乐播放器：严格遵循两阶段握手协议 ---

let musicApi: any = null;
let unsubStateUpdate: (() => void) | null = null;

const isPlaying = ref(false);
const masterVolume = ref(0.5);
const bgmReady = ref(false); // API 握手完成标志

/** 阶段一：发现 API 对象 */
function _findApiObject(timeoutMs = 10000): Promise<any> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const topWin = top as any;
      if (typeof topWin.musicPlayerAPI === 'object' && topWin.musicPlayerAPI !== null) {
        clearInterval(interval);
        resolve(topWin.musicPlayerAPI);
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error('连接后台脚本失败。'));
      }
    }, 250);
  });
}

/** 根据后台状态更新前端 ref */

function syncStateFromBackend(state: any) {
  isPlaying.value = state.playbackState === 'PLAYING';
  masterVolume.value = state.masterVolume ?? 0.5;
}

/** 主初始化：两阶段握手 */
async function initMusicPlayer() {
  try {
    // 阶段一
    const api = await _findApiObject();
    // 阶段二
    await Promise.race([
      api.requestInitialization(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('后台脚本初始化超时。')), 10000)),
    ]);

    // 握手成功
    musicApi = api;
    bgmReady.value = true;

    // 获取初始状态
    syncStateFromBackend(api.getCurrentState());

    // 注册状态变更回调
    unsubStateUpdate = api.onFullStateUpdate((newState: any) => {
      syncStateFromBackend(newState);
    });
  } catch (e) {
    console.warn('[开场白] 音乐播放器握手失败:', e);
    // 不影响开场白正常使用，仅音乐控件不可用
  }
}

function toggleMusic() {
  if (musicApi) {
    musicApi.togglePlayPause();
  } else {
    isPlaying.value = !isPlaying.value;
  }
}

/** 音量条拖拽交互 */
let volumeDragRect: DOMRect | null = null;

function calcVolFromX(clientX: number): number {
  if (!volumeDragRect) return masterVolume.value;
  return Math.max(0, Math.min(1, (clientX - volumeDragRect.left) / volumeDragRect.width));
}

function onVolumeDragStart(e: MouseEvent) {
  e.stopPropagation();
  e.preventDefault();
  const svg = e.currentTarget as SVGElement;
  volumeDragRect = svg.getBoundingClientRect();
  const vol = calcVolFromX(e.clientX);
  masterVolume.value = vol;
  if (musicApi) musicApi.setLiveVolume(vol);

  document.addEventListener('mousemove', onVolumeDragMove);
  document.addEventListener('mouseup', onVolumeDragEnd);
}

function onVolumeDragMove(e: MouseEvent) {
  const vol = calcVolFromX(e.clientX);
  masterVolume.value = vol;
  if (musicApi) musicApi.setLiveVolume(vol);
}

function onVolumeDragEnd(e: MouseEvent) {
  document.removeEventListener('mousemove', onVolumeDragMove);
  document.removeEventListener('mouseup', onVolumeDragEnd);
  const vol = calcVolFromX(e.clientX);
  masterVolume.value = vol;
  if (musicApi) musicApi.persistVolumeAndBroadcast(vol);
  volumeDragRect = null;
}

function startJourney() {
  stage.value = 'sect';
}

// 启动握手
initMusicPlayer();

// ===== 阶段1：轮播选门派 =====
const selectedSectIndex = ref(0);
const selectedSect = computed(() => SECTS[selectedSectIndex.value]);
const currentQuotes = computed(() => SECT_QUOTES[selectedSect.value.name]);
// const currentIcon = computed(() => SECT_ICONS[selectedSect.value.name] ?? []);

/** 循环索引：支持无限滚动 */
function wrapIndex(i: number): number {
  return ((i % SECTS.length) + SECTS.length) % SECTS.length;
}

function navigateSect(delta: number) {
  selectedSectIndex.value = wrapIndex(selectedSectIndex.value + delta);
}

// 触摸滑动
const touchStartX = ref(0);
const touchStartY = ref(0);
function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX.value;
  const dy = e.changedTouches[0].clientY - touchStartY.value;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
    navigateSect(dx < 0 ? 1 : -1);
  }
}

function confirmSect() {
  stage.value = 'skill';
  selectedSkillIndex.value = 0;
}

// ===== GSAP 动画 (参数来自 _extract_anims.py 提取的原型值) =====

// 宏观诗词 refs
const macroRef0 = useTemplateRef<HTMLElement>('macroRef0');
const macroRef1 = useTemplateRef<HTMLElement>('macroRef1');
const macroRef2 = useTemplateRef<HTMLElement>('macroRef2');
const macroRef3 = useTemplateRef<HTMLElement>('macroRef3');

/** 溶解切换 enter
 *  原型: initial={{ opacity: 0, filter: 'blur(30px)', scale: 1.05 }}
 *       animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
 *       transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }} */
function onSectEnter(el: Element, done: () => void) {
  gsap.fromTo(
    el,
    { opacity: 0, filter: 'blur(30px)', scale: 1.05 },
    {
      opacity: 1,
      filter: 'blur(0px)',
      scale: 1,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        // 清除GSAP残留的内联样式(transform/filter/opacity)，否则会影响flex布局
        gsap.set(el, { clearProps: 'all' });
        startBreathingAnimations();
        done();
      },
    },
  );
}

/** 溶解切换 leave
 *  原型: exit={{ opacity: 0, filter: 'blur(30px)', scale: 0.95 }} */
function onSectLeave(el: Element, done: () => void) {
  stopBreathingAnimations();
  gsap.to(el, {
    opacity: 0,
    filter: 'blur(30px)',
    scale: 0.95,
    duration: 0.8,
    ease: 'power2.inOut',
    onComplete: done,
  });
}

/** 宏观诗词呼吸动画 — 参数精确复制自原型
 *  诗句[0]: y:0→-10→0, blur:2→3→2, opacity:0.03→0.05→0.03, duration:13.7, delay:0
 *  诗句[1]: y:0→10→0,  blur:0.2→0.6→0.2, opacity:0.02→0.04→0.02, duration:17.3, delay:2.4
 *  诗句[2]: y:0→-12→0, blur:3→4→3, opacity:0.02→0.04→0.02, duration:23.1, delay:5.7
 *  诗句[3]: y:0→8→0,   blur:1→2→1, opacity:0.03→0.05→0.03, duration:19.5, delay:1.8 */
const breathingTweens: gsap.core.Tween[] = [];

const BREATHING_CONFIG = [
  /* 原始周期: 13.7 / 17.3 / 23.1 / 19.5 （当前为 ×0.4，快2.5倍） */
  { y: -10, blurFrom: 2, blurTo: 3, opFrom: 0.03, opTo: 0.04, dur: 5.48, del: 0 },
  { y: 10, blurFrom: 0.2, blurTo: 0.6, opFrom: 0.03, opTo: 0.04, dur: 6.92, del: 0.96 },
  { y: -12, blurFrom: 3, blurTo: 4, opFrom: 0.02, opTo: 0.03, dur: 9.24, del: 2.28 },
  { y: 8, blurFrom: 1, blurTo: 2, opFrom: 0.03, opTo: 0.05, dur: 7.8, del: 0.72 },
];

function startBreathingAnimations() {
  const refs = [macroRef0.value, macroRef1.value, macroRef2.value, macroRef3.value];
  refs.forEach((el, i) => {
    if (!el) return;
    const c = BREATHING_CONFIG[i];
    // 初始状态
    gsap.set(el, { y: 0, opacity: c.opFrom });
    // yoyo 呼吸循环（只动画 y 和 opacity，blur 保持 CSS 静态值，避免掉帧）
    const tween = gsap.to(el, {
      y: c.y,
      opacity: c.opTo,
      duration: c.dur / 2,
      delay: c.del,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    breathingTweens.push(tween);
  });
}

function stopBreathingAnimations() {
  breathingTweens.forEach(t => t.kill());
  breathingTweens.length = 0;
}

// ===== 阶段切换动画 (0.8s blur + opacity + scale) =====
function onStageEnter(el: Element, done: () => void) {
  gsap.fromTo(
    el,
    { opacity: 0, filter: 'blur(20px)', scale: 1.03 },
    {
      opacity: 1,
      filter: 'blur(0px)',
      scale: 1,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.set(el, { clearProps: 'all' });
        done();
      },
    },
  );
}
function onStageLeave(el: Element, done: () => void) {
  gsap.to(el, {
    opacity: 0,
    filter: 'blur(20px)',
    scale: 0.97,
    duration: 0.8,
    ease: 'power2.inOut',
    onComplete: done,
  });
}

onUnmounted(() => {
  stopBreathingAnimations();
  // 清理音乐播放器订阅
  if (unsubStateUpdate) {
    unsubStateUpdate();
    unsubStateUpdate = null;
  }
});

// 首次进入时启动呼吸动画
watch(
  () => stage.value,
  val => {
    if (val === 'sect') {
      // Transition enter 完成后会启动, 但首次需要手动触发
      requestAnimationFrame(() => startBreathingAnimations());
    }
  },
  { immediate: true },
);

// ===== 阶段2：选心法 =====
const selectedSkillIndex = ref(0);
const currentSkills = computed(() => selectedSect.value.skills);
const selectedSkill = computed(() => currentSkills.value[selectedSkillIndex.value]);
/** 当前门派所有心法的图标 path data */
const skillIconPaths = computed(() => currentSkills.value.map(s => SKILL_ICONS[s] ?? []));

function selectSkill(index: number) {
  selectedSkillIndex.value = index;
}

function confirmSkill() {
  stage.value = 'farewell';
}

function backToSect() {
  stage.value = 'sect';
}

// ===== 核心逻辑 =====
const isSubmitting = ref(false);

async function setNativeMacro(门派: string) {
  await triggerSlash(`/setvar key=门派归属 ${门派}`);
}

async function setMvuAffiliation(归属: string) {
  const msg = getChatMessages(0, { include_swipes: true })[0];
  const userName = substitudeMacros('{{user}}');
  for (let i = 0; i < msg.swipes_data.length; i++) {
    if (i === 0) continue;
    const statData = msg.swipes_data[i]?.stat_data;
    if (statData?.人物?.[userName]) {
      statData.人物[userName].归属 = 归属;
    }
  }
  await setChatMessages(
    [
      {
        message_id: 0,
        swipes_data: msg.swipes_data,
      },
    ],
    { refresh: 'none' },
  );
}

async function jumpToSwipe(swipeId: number) {
  await setChatMessages([{ message_id: 0, swipe_id: swipeId }]);
}

async function onFinalConfirm() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const 门派 = selectedSect.value.fullName;
    const 心法 = selectedSkill.value;
    const 归属 = `${门派}·${心法}`;
    await setNativeMacro(门派);
    await setMvuAffiliation(归属);
    await jumpToSwipe(1);
  } catch (e) {
    console.error('开场白跳转失败:', e);
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="opening-container">
    <!-- 阶段切换动画容器 -->
    <Transition :css="false" mode="out-in" @enter="onStageEnter" @leave="onStageLeave">
      <!-- 阶段0：启封页面 -->
      <div v-if="stage === 'unseal'" key="unseal" class="unseal-stage">
        <!-- 宣纸纹理噪点 -->
        <div class="noise-texture"></div>

        <!-- 极简音乐控件 -->
        <div class="bgm-control">
          <!-- 音量曲线（点击调节音量） -->
          <svg
            v-show="isPlaying"
            class="bgm-curve"
            viewBox="0 0 100 30"
            preserveAspectRatio="none"
            @mousedown="onVolumeDragStart"
          >
            <defs>
              <linearGradient id="vol-fill">
                <stop :offset="masterVolume" stop-color="currentColor" />
                <stop :offset="masterVolume" stop-color="currentColor" stop-opacity="0.15" />
              </linearGradient>
            </defs>
            <path d="M 0 15 Q 50 -5 100 15 Q 50 35 0 15 Z" fill="url(#vol-fill)" />
          </svg>
          <!-- 奏/止 文字按钮 -->
          <span class="bgm-text" @click="toggleMusic">{{ isPlaying ? '止' : '奏' }}</span>
        </div>

        <!-- 中央"入门"文字 (点击进入门派选择) -->
        <div class="unseal-center" @click="startJourney">
          <div class="unseal-text">入门</div>
        </div>
      </div>

      <!-- 阶段1：选门派 -->
      <div
        v-else-if="stage === 'sect'"
        key="sect"
        class="sect-stage"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <!-- 宣纸纹理噪点 -->
        <div class="noise-texture"></div>

        <!-- 门派溶解切换 -->
        <Transition :css="false" mode="out-in" @enter="onSectEnter" @leave="onSectLeave">
          <div :key="selectedSect.name" class="sect-scene">
            <!-- 宏观诗词纹理层 -->
            <div class="macro-poetry-layer">
              <div ref="macroRef0" class="macro-line macro-line--0">{{ currentQuotes.quote[0] }}</div>
              <div ref="macroRef1" class="macro-line macro-line--1">{{ currentQuotes.quote[1] }}</div>
              <div ref="macroRef2" class="macro-line macro-line--2">{{ currentQuotes.quote[2] }}</div>
              <div ref="macroRef3" class="macro-line macro-line--3">{{ currentQuotes.quote[3] }}</div>
            </div>

            <!-- 微观诗词点缀层 -->
            <div class="micro-poetry-layer">
              <div class="micro-poetry-box">
                <div class="micro-line micro-line--top-left">{{ currentQuotes.microQuote[0] }}</div>
                <div class="micro-line micro-line--bottom-right">{{ currentQuotes.microQuote[1] }}</div>
              </div>
            </div>

            <!-- 核心视觉层 -->
            <div class="core-visual">
              <h1 class="sect-name">{{ selectedSect.name }}</h1>
            </div>

            <!-- 印章 -->
            <img
              class="stamp"
              src="https://testingcf.jsdelivr.net/gh/wilderye/jx3/pic/竹.png"
              alt="印章"
              @click="confirmSect"
            />
          </div>
        </Transition>

        <!-- 极简导航 -->
        <div class="sect-nav">
          <div class="sect-nav-arrow" @click="navigateSect(-1)">〈</div>
          <div class="sect-nav-arrow" @click="navigateSect(1)">〉</div>
        </div>
      </div>

      <!-- 阶段2：选心法 -->
      <div v-else-if="stage === 'skill'" key="skill" class="skill-stage">
        <!-- 宣纸纹理 -->
        <div class="noise-texture"></div>

        <!-- 上方居中：切换门派 -->
        <div class="skill-back" @click="backToSect">切换门派</div>

        <!-- 微观诗词装饰 -->
        <div class="micro-poetry-layer">
          <div class="micro-poetry-box">
            <div class="micro-line micro-line--top-left">{{ currentQuotes.microQuote[0] }}</div>
            <div class="micro-line micro-line--bottom-right">{{ currentQuotes.microQuote[1] }}</div>
          </div>
        </div>

        <!-- 心法选择区域 -->
        <div class="skill-grid">
          <div
            v-for="(skill, i) in currentSkills"
            :key="skill"
            class="skill-item"
            @click="
              selectSkill(i);
              confirmSkill();
            "
          >
            <svg class="skill-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path v-for="(d, pi) in skillIconPaths[i]" :key="pi" fill="currentColor" :d="d" />
            </svg>
            <span class="skill-name">{{ skill }}</span>
          </div>
        </div>
      </div>

      <!-- 阶段：去罢（过渡页） -->
      <div v-else-if="stage === 'farewell'" key="farewell" class="farewell-stage">
        <!-- 宣纸纹理 -->
        <div class="noise-texture"></div>

        <!-- 音乐控件（与启封页一致） -->
        <div class="bgm-control">
          <svg
            v-show="isPlaying"
            class="bgm-curve"
            viewBox="0 0 100 30"
            preserveAspectRatio="none"
            @mousedown="onVolumeDragStart"
          >
            <defs>
              <linearGradient id="vol-fill-fw">
                <stop :offset="masterVolume" stop-color="currentColor" />
                <stop :offset="masterVolume" stop-color="currentColor" stop-opacity="0.15" />
              </linearGradient>
            </defs>
            <path d="M 0 15 Q 50 -5 100 15 Q 50 35 0 15 Z" fill="url(#vol-fill-fw)" />
          </svg>
          <span class="bgm-text" @click="toggleMusic">{{ isPlaying ? '止' : '奏' }}</span>
        </div>

        <!-- 微观诗词装饰 -->
        <div class="micro-poetry-layer">
          <div class="micro-poetry-box">
            <div class="micro-line micro-line--top-left">{{ currentQuotes.microQuote[0] }}</div>
            <div class="micro-line micro-line--bottom-right">{{ currentQuotes.microQuote[1] }}</div>
          </div>
        </div>

        <!-- 中央“去罢” -->
        <div class="farewell-center" @click="onFinalConfirm">
          <div class="farewell-text">去罢。</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ===== 基础 ===== */
.opening-container {
  font-family: KingHwaOldSong, serif;
  color: #1a1919;
  padding: 16px 0;
}

.stage-title {
  text-align: center;
  font-size: 1.2em;
  margin-bottom: 16px;
}

/* ===== 阶段1：选门派 =====
 * 以下样式基于 _react_template_ref.tsx 中的 Tailwind class 逐条翻译
 * [N] 标注对应 _extract_classes.py 输出的编号
 */

/* [0] w-screen h-screen bg-[#e8e6e1] text-[#111] overflow-hidden relative flex items-center justify-center select-none
 * 去掉底色 bg-[#e8e6e1]，改为透明 */
.sect-stage {
  container-type: size;
  width: 100%;
  aspect-ratio: 16 / 9;
  color: #111;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  /* 上下边缘渐变淡出，让被截断的诗句自然融入 */
  mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%);
}

/* [1] pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply + SVG noise */
.noise-texture {
  pointer-events: none;
  position: absolute;
  inset: 0;
  opacity: 0.06;
  mix-blend-mode: multiply;
  background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');
}

/* [2] absolute inset-0 flex items-center justify-center → Transition 内的门派场景容器 */
.sect-scene {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* [3] absolute inset-0 pointer-events-none overflow-hidden → 宏观诗词层 */
.macro-poetry-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

/* 宏观诗词共用：竖排 writing-mode, whitespace-nowrap */
.macro-line {
  position: absolute;
  writing-mode: vertical-rl;
  white-space: nowrap;
  opacity: 0.03;
  filter: blur(2.5px);
}

/* [4] absolute -top-[60%] left-[5%] text-[22vh] tracking-[0.2em] → 左上角 */
.macro-line--0 {
  top: -60%;
  left: 5%;
  font-size: 22cqh;
  letter-spacing: 0.2em;
}

/* [5] absolute top-[15%] left-[25%] text-[12vh] tracking-[0.5em] → 中偏左 */
.macro-line--1 {
  top: 15%;
  left: 25%;
  font-size: 12cqh;
  letter-spacing: 0.5em;
}

/* [6] absolute -bottom-[10%] right-[20%] text-[30vh] tracking-[0.1em] → 右下 */
.macro-line--2 {
  bottom: -10%;
  right: 20%;
  font-size: 30cqh;
  letter-spacing: 0.1em;
  opacity: 0.02; /* 覆盖共用的0.03，与BREATHING_CONFIG[2].opFrom一致 */
}

/* [7] absolute -top-[65%] right-[5%] text-[14vh] tracking-[0.3em] → 右上 */
.macro-line--3 {
  top: -65%;
  right: 5%;
  font-size: 14cqh;
  letter-spacing: 0.3em;
}

/* 门派图标装饰层（已注释，可恢复）
.sect-icon-layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
  opacity: 0.1;
}
.sect-icon-layer svg {
  width: 70cqh;
  height: 70cqh;
  transform: translateY(-5%);
}
*/

/* [8] absolute inset-0 flex items-center justify-center pointer-events-none z-10 → 微观诗词层 */
.micro-poetry-layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}

/* [9] relative w-[80vw] h-[80vh] → 微观诗词定位框 (h-[80vh]→用aspect-ratio替代) */
.micro-poetry-box {
  position: relative;
  width: 80cqw;
  height: 80cqh;
}

/* 微观诗词共用：竖排 */
.micro-line {
  position: absolute;
  writing-mode: vertical-rl;
}

/* [10] 微观诗词 · 左上
 * 调整指南：
 *   top/left      → 位置
 *   font-size     → 字号
 *   letter-spacing → 字间距
 *   opacity       → 透明度
 */
.micro-line--top-left {
  top: -5%; /* ← 上下位置 */
  left: 0; /* ← 左右位置 */
  font-size: 1.8cqh; /* ← 字号 */
  letter-spacing: 1em; /* ← 字间距 */
  opacity: 0.5; /* ← 透明度 */
}

/* [11] 微观诗词 · 右下（已统一为与左上相同的样式） */
.micro-line--bottom-right {
  bottom: -5%; /* ← 上下位置 */
  right: 0; /* ← 左右位置 */
  font-size: 1.8cqh; /* ← 字号 */
  letter-spacing: 1em; /* ← 字间距（原2em，已统一） */
  opacity: 0.5; /* ← 透明度（原0.4，已统一） */
}

/* [12] relative z-20 flex flex-col items-center justify-center → 核心视觉层 */
.core-visual {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* [13] text-[35vh] md:text-[40vh] text-[#111] leading-none tracking-widest drop-shadow-2xl → 门派名 */
.sect-name {
  font-size: 35cqh;
  color: #111;
  line-height: 1;
  letter-spacing: 0.1em;
  writing-mode: vertical-rl;
  filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));
}

/* 印章图片（定位参照：sect-scene，尺寸稳定不跳位）
 * 调整指南：
 *   bottom  → 距舞台底部的位置（%），增大向上移
 *   left    → 距舞台左侧的位置（%），增大向右移
 *   width   → 图片宽度
 *   transform: rotate() → 旋转角度
 *   opacity → 整体透明度
 */
.stamp {
  position: absolute;
  bottom: 8%; /* ← 调整上下位置 */
  left: 40%; /* ← 调整左右位置 */
  z-index: 30; /* 高于 core-visual(20)，确保可点击 */
  width: 5cqh; /* ← 调整大小 */
  height: auto;
  transform: rotate(0deg); /* ← 调整旋转角度 */
  opacity: 1; /* ← 调整透明度 */
  pointer-events: auto;
  cursor: pointer;
  transition:
    transform 0.3s ease,
    filter 0.3s ease;
}
.stamp:hover {
  transform: rotate(0deg) scale(1.08);
  filter: brightness(1.1);
}

/* [15] absolute inset-0 pointer-events-none flex items-center justify-between px-4 z-50 → 导航 */
.sect-nav {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  z-index: 50;
}

/* [16][17] p-4 text-[#111] opacity-20 hover:opacity-100 transition-opacity duration-500
 *          pointer-events-auto outline-none → 导航箭头 */
.sect-nav-arrow {
  padding: 16px;
  color: #111;
  opacity: 0.2;
  transition: opacity 0.5s;
  pointer-events: auto;
  outline: none;
  cursor: pointer;
  user-select: none;
  font-size: 3em;
}
.sect-nav-arrow:hover {
  opacity: 1;
}

/* ===== 阶段0：启封 ===== */
.unseal-stage {
  width: 100%;
  aspect-ratio: 16 / 9;
  container-type: size;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 无底色，与后续阶段保持一致的透明/噪点叠加 */
}

/* 音乐控件：极简古风 */
.bgm-control {
  position: absolute;
  top: 6cqh;
  right: 6cqw;
  z-index: 50;
  display: flex;
  flex-direction: row; /* 水平排列 */
  align-items: center;
  gap: 1cqw; /* 拉开间隔 */
  cursor: pointer;
  color: #111;
  opacity: 0.4;
  pointer-events: auto;
}
.bgm-text {
  font-family: KingHwaOldSong, serif;
  font-size: 3.5cqh;
  letter-spacing: 0.2em;
}
.bgm-curve {
  width: 12cqw; /* 加长 */
  height: 0.8cqh; /* 使曲线视觉本身明显 */
  padding: 2cqh 0; /* 扩大上下点击热区，不改变外观 */
  box-sizing: content-box; /* 让 padding 算在元素总高度之外，增加可点击区域 */
  opacity: 0.8;
}

/* 入门：屏幕中央 */
.unseal-center {
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
}
.unseal-text {
  font-family: KingHwaOldSong, serif;
  font-size: 20cqh;
  color: #111;
  opacity: 0.6;
  transition:
    transform 0.8s ease-out,
    opacity 0.8s ease;
  animation: unsealFloat 4s ease-in-out infinite alternate;
}
.unseal-center:hover .unseal-text {
  transform: scale(1.05);
  opacity: 1;
}

@keyframes unsealFloat {
  0% {
    transform: translateY(0.5cqh);
  }
  100% {
    transform: translateY(-0.5cqh);
  }
}

/* ===== 阶段1：选门派 ===== */
.skill-stage {
  width: 100%;
  aspect-ratio: 16 / 9;
  container-type: size;
  position: relative;
  overflow: hidden;
}

/* 切换门派 — 上方居中 */
.skill-back {
  position: absolute;
  top: 4%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  font-family: KingHwaOldSong, serif;
  font-size: 2cqh;
  color: #111;
  opacity: 0.35;
  cursor: pointer;
  user-select: none;
  letter-spacing: 0.3em;
  transition: opacity 0.3s;
  pointer-events: auto;
}
.skill-back:hover {
  opacity: 0.8;
}

/* 心法网格 — 居中 */
.skill-grid {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7cqw; /* ← 两个心法之间的间距 */
  pointer-events: none;
}

.skill-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5cqh;
  cursor: pointer;
  pointer-events: auto;
  transition:
    transform 0.3s,
    opacity 0.3s;
}
.skill-item:hover {
  transform: scale(1.08);
}
.skill-item:active {
  transform: scale(0.95);
}

/* 心法图标 SVG */
.skill-icon {
  width: 50cqh; /* ← 图标大小 */
  height: 50cqh;
  color: #111;
  opacity: 0.75;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
  transition: opacity 0.3s;
}
.skill-item:hover .skill-icon {
  opacity: 1;
}

/* 心法名 — 横排 */
.skill-name {
  font-family: KingHwaOldSong, serif;
  font-size: 4cqh; /* ← 文字大小 */
  color: #111;
  letter-spacing: 0.4em;
  text-indent: 0.4em;
  opacity: 0.7;
  transition: opacity 0.3s;
}
.skill-item:hover .skill-name {
  opacity: 1;
}

/* ===== 去罢（过渡页） ===== */
.farewell-stage {
  width: 100%;
  aspect-ratio: 16 / 9;
  container-type: size;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.farewell-center {
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
}
.farewell-text {
  font-family: KingHwaOldSong, serif;
  font-size: 12cqh;
  color: #111;
  opacity: 0.5;
  letter-spacing: 0.3em;
  transition:
    transform 0.8s ease-out,
    opacity 0.8s ease;
  animation: farewellFloat 4s ease-in-out infinite alternate;
}
.farewell-center:hover .farewell-text {
  transform: scale(1.05);
  opacity: 0.9;
}

@keyframes farewellFloat {
  0% {
    transform: translateY(0.5cqh);
  }
  100% {
    transform: translateY(-0.5cqh);
  }
}
</style>
