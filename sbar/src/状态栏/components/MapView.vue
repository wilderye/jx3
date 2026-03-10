<template>
  <div class="char-content-enter" style="height: 100%">
    <!-- ===== 区域地图视图 ===== -->
    <div v-if="zoneMap" ref="zoneWrapRef" class="map-wrap">
      <button class="zone-back-btn" @click="onZoneBack">〈</button>
      <div
        class="zone-inner"
        :style="{
          position: 'absolute',
          width: '1024px',
          height: '896px',
          transformOrigin: '0 0',
          willChange: 'transform',
        }"
      >
        <img
          :src="ZONE_CDN + '/' + encodeURIComponent(zoneMap)"
          :alt="zoneMap"
          draggable="false"
          :style="{ width: '1024px', height: '896px', display: 'block', pointerEvents: 'none' }"
        />
      </div>
    </div>

    <!-- ===== 世界地图视图 ===== -->
    <div v-else ref="wrapRef" class="map-wrap">
      <div class="map-inner">
        <!-- 世界地图底图 -->
        <img class="map-base" :src="MAP_CDN + '/worldmap.jpg'" draggable="false" />
        <!-- 交通线覆盖层 -->
        <img
          class="map-traffic"
          :src="MAP_CDN + '/traffic.png'"
          draggable="false"
          :style="{
            position: 'absolute',
            left: TRAFFIC_LEFT + 'px',
            top: TRAFFIC_TOP + 'px',
            width: TRAFFIC_WIDTH + 'px',
          }"
        />
        <!-- 56 城市图标+名称 -->
        <template v-for="(c, i) in CITIES" :key="c.name">
          <div
            :class="'city-icon' + (c.zoneMap ? ' clickable' : '')"
            :style="{
              position: 'absolute',
              left: c.x + 'px',
              top: c.y + 'px',
              width: ICON_SIZE + 'px',
              height: ICON_SIZE + 'px',
            }"
            @click="onCityClick(i)"
          >
            <img
              :src="MAP_CDN + '/icons/' + encodeURIComponent(c.file)"
              :alt="c.name"
              loading="lazy"
              :style="{ width: ICON_SIZE + 'px', height: ICON_SIZE + 'px', pointerEvents: 'none' }"
            />
          </div>
          <div
            class="city-name"
            :style="{
              position: 'absolute',
              left: c.x + LABEL_OFFSET_X + 'px',
              top: c.y + LABEL_OFFSET_Y + 'px',
              fontSize: (c.major ? FONT_MAJOR : FONT_MINOR) + 'px',
            }"
          >
            {{ c.name }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CITIES,
  FONT_MAJOR,
  FONT_MINOR,
  ICON_SIZE,
  LABEL_OFFSET_X,
  LABEL_OFFSET_Y,
  MAP_CDN,
  MAP_W,
  SCALE_MAX,
  SCALE_MIN,
  TRAFFIC_LEFT,
  TRAFFIC_TOP,
  TRAFFIC_WIDTH,
  ZONE_CDN,
  ZOOM_THRESHOLD,
} from '../data/cities';
import { CONDITIONAL_MAPS, KEYWORDS, matchZoneMap } from '../data/keywords';

const props = defineProps<{
  location: string;
  year: number;
}>();

// ===== 状态 =====
const zoneMap = ref<string | null>(null);

// ===== Refs =====
const wrapRef = ref<HTMLElement>();
const zoneWrapRef = ref<HTMLElement>();

// 世界地图拖拽/缩放状态（用对象引用避免响应式开销）
const state = {
  scale: 0.15,
  tx: 0,
  ty: 0,
  drag: false,
  lx: 0,
  ly: 0,
  moved: false,
  td: 0,
  tx2: 0,
  ty2: 0,
  initialized: false,
};

// 区域地图拖拽/缩放状态
const zoneState = {
  scale: 1,
  tx: 0,
  ty: 0,
  drag: false,
  lx: 0,
  ly: 0,
  moved: false,
  td: 0,
  tx2: 0,
  ty2: 0,
  initialized: false,
};

// ===== 世界地图引擎 =====
function applyTransform() {
  if (!wrapRef.value) return;
  const inner = wrapRef.value.querySelector('.map-inner') as HTMLElement | null;
  if (inner) {
    inner.style.transform = `translate(${state.tx}px,${state.ty}px) scale(${state.scale})`;
  }
  wrapRef.value.classList.toggle('zoom-high', state.scale >= ZOOM_THRESHOLD);
}

function zoomMap(factor: number, cx?: number, cy?: number) {
  const wrap = wrapRef.value;
  if (!wrap) return;
  if (cx === undefined) {
    cx = wrap.clientWidth / 2;
    cy = wrap.clientHeight / 2;
  }
  const ns = Math.max(SCALE_MIN, Math.min(SCALE_MAX, state.scale * factor));
  const r = ns / state.scale;
  state.tx = cx! - (cx! - state.tx) * r;
  state.ty = cy! - (cy! - state.ty) * r;
  state.scale = ns;
  applyTransform();
}

// 世界地图初始化 + 事件绑定
watch(
  zoneMap,
  () => {
    if (zoneMap.value) return;
    // 等 DOM 挂载
    nextTick(() => {
      const wrap = wrapRef.value;
      if (!wrap || state.initialized) return;
      state.initialized = true;
      const ww = wrap.clientWidth;
      const wh = wrap.clientHeight;
      const fitScale = ww / MAP_W;
      state.scale = fitScale * 2.2;
      state.tx = ww / 2 - 3000 * state.scale;
      state.ty = wh / 2 - 2200 * state.scale;
      applyTransform();
    });
  },
  { immediate: true },
);

// 世界地图事件监听
watch(
  zoneMap,
  val => {
    if (val) return;
    nextTick(() => {
      const wrap = wrapRef.value;
      if (!wrap) return;
      const s = state;

      function onMouseDown(e: MouseEvent) {
        s.drag = true;
        s.moved = false;
        s.lx = e.clientX;
        s.ly = e.clientY;
      }
      function onMouseMove(e: MouseEvent) {
        if (!s.drag) return;
        const dx = e.clientX - s.lx,
          dy = e.clientY - s.ly;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) s.moved = true;
        s.tx += dx;
        s.ty += dy;
        s.lx = e.clientX;
        s.ly = e.clientY;
        applyTransform();
      }
      function onMouseUp() {
        s.drag = false;
      }
      function onWheel(e: WheelEvent) {
        e.preventDefault();
        const r = wrap!.getBoundingClientRect();
        zoomMap(e.deltaY < 0 ? 1.15 : 0.87, e.clientX - r.left, e.clientY - r.top);
      }
      function getDist(e: TouchEvent) {
        return Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
      function getMid(e: TouchEvent) {
        return {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
      function onTouchStart(e: TouchEvent) {
        // 触碰按钮（如城市图标）时不拦截，让 click 事件正常合成
        const t = e.target as HTMLElement;
        if (t.closest('button') || t.closest('.city-icon.clickable')) return;
        e.preventDefault();
        if (e.touches.length === 1) {
          s.drag = true;
          s.moved = false;
          s.tx2 = e.touches[0].clientX;
          s.ty2 = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          s.drag = false;
          s.td = getDist(e);
          const m = getMid(e);
          s.tx2 = m.x;
          s.ty2 = m.y;
        }
      }
      function onTouchMove(e: TouchEvent) {
        e.preventDefault();
        if (e.touches.length === 1 && s.drag) {
          const dx = e.touches[0].clientX - s.tx2,
            dy = e.touches[0].clientY - s.ty2;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) s.moved = true;
          s.tx += dx;
          s.ty += dy;
          s.tx2 = e.touches[0].clientX;
          s.ty2 = e.touches[0].clientY;
          applyTransform();
        } else if (e.touches.length === 2) {
          const d = getDist(e),
            m = getMid(e),
            r = wrap!.getBoundingClientRect();
          zoomMap(d / s.td, m.x - r.left, m.y - r.top);
          s.tx += m.x - s.tx2;
          s.ty += m.y - s.ty2;
          s.td = d;
          s.tx2 = m.x;
          s.ty2 = m.y;
          applyTransform();
        }
      }
      function onTouchEnd(e: TouchEvent) {
        if (!e.touches.length) s.drag = false;
      }

      wrap.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      wrap.addEventListener('wheel', onWheel, { passive: false });
      wrap.addEventListener('touchstart', onTouchStart, { passive: false });
      wrap.addEventListener('touchmove', onTouchMove, { passive: false });
      wrap.addEventListener('touchend', onTouchEnd);

      onWatcherCleanup(() => {
        wrap.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        wrap.removeEventListener('wheel', onWheel);
        wrap.removeEventListener('touchstart', onTouchStart);
        wrap.removeEventListener('touchmove', onTouchMove);
        wrap.removeEventListener('touchend', onTouchEnd);
      });
    });
  },
  { immediate: true },
);

// ===== 城市点击 → 区域地图 =====
function onCityClick(idx: number) {
  if (state.moved) return;
  const c = CITIES[idx];
  if (!c || !c.zoneMap) return;
  // 检查条件替代版本（战乱/乱世）
  let finalZoneMap = c.zoneMap;
  for (const cm of CONDITIONAL_MAPS) {
    if (!cm.minYear) continue;
    if (props.year < cm.minYear) continue;
    const kws = KEYWORDS[c.name];
    if (kws && kws.some(kw => cm.keywords.some(ck => ck === kw))) {
      finalZoneMap = cm.zoneMap;
      break;
    }
  }
  zoneMap.value = finalZoneMap;
}

// 返回世界地图
function onZoneBack() {
  zoneMap.value = null;
  state.initialized = false;
  zoneState.initialized = false;
}

// 自动匹配：首次进入时根据 location 显示区域地图
onMounted(() => {
  if (!props.location) return;
  const matched = matchZoneMap(props.location, props.year);
  if (matched && matched.zoneMap) {
    zoneMap.value = matched.zoneMap;
  }
});

// ===== 区域地图引擎 =====
function applyZoneTransform() {
  if (!zoneWrapRef.value) return;
  const inner = zoneWrapRef.value.querySelector('.zone-inner') as HTMLElement | null;
  if (inner) {
    inner.style.transform = `translate(${zoneState.tx}px,${zoneState.ty}px) scale(${zoneState.scale})`;
  }
}

function zoneZoom(factor: number, cx?: number, cy?: number) {
  const wrap = zoneWrapRef.value;
  if (!wrap) return;
  if (cx === undefined) {
    cx = wrap.clientWidth / 2;
    cy = wrap.clientHeight / 2;
  }
  const ns = Math.max(0.2, Math.min(3, zoneState.scale * factor));
  const r = ns / zoneState.scale;
  zoneState.tx = cx! - (cx! - zoneState.tx) * r;
  zoneState.ty = cy! - (cy! - zoneState.ty) * r;
  zoneState.scale = ns;
  applyZoneTransform();
}

// 区域地图初始化 + 事件绑定
watch(zoneMap, val => {
  if (!val) return;
  nextTick(() => {
    const wrap = zoneWrapRef.value;
    if (!wrap) return;
    const zs = zoneState;

    // 初始化位置
    if (!zs.initialized) {
      zs.initialized = true;
      const ZONE_W = 1024,
        ZONE_H = 896;
      const ww = wrap.clientWidth,
        wh = wrap.clientHeight;
      zs.scale = Math.max(ww / ZONE_W, wh / ZONE_H);
      zs.tx = (ww - ZONE_W * zs.scale) / 2;
      zs.ty = (wh - ZONE_H * zs.scale) / 2;
      applyZoneTransform();
    }

    // 事件绑定
    function onMouseDown(e: MouseEvent) {
      zs.drag = true;
      zs.moved = false;
      zs.lx = e.clientX;
      zs.ly = e.clientY;
    }
    function onMouseMove(e: MouseEvent) {
      if (!zs.drag) return;
      const dx = e.clientX - zs.lx,
        dy = e.clientY - zs.ly;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) zs.moved = true;
      zs.tx += dx;
      zs.ty += dy;
      zs.lx = e.clientX;
      zs.ly = e.clientY;
      applyZoneTransform();
    }
    function onMouseUp() {
      zs.drag = false;
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const r = wrap!.getBoundingClientRect();
      zoneZoom(e.deltaY < 0 ? 1.15 : 0.87, e.clientX - r.left, e.clientY - r.top);
    }
    function getDist(e: TouchEvent) {
      return Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
    function getMid(e: TouchEvent) {
      return {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
    function onTouchStart(e: TouchEvent) {
      // 触碰返回按钮时不拦截，让 click 事件正常合成
      const t = e.target as HTMLElement;
      if (t.closest('button')) return;
      e.preventDefault();
      if (e.touches.length === 1) {
        zs.drag = true;
        zs.moved = false;
        zs.tx2 = e.touches[0].clientX;
        zs.ty2 = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        zs.drag = false;
        zs.td = getDist(e);
        const m = getMid(e);
        zs.tx2 = m.x;
        zs.ty2 = m.y;
      }
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (e.touches.length === 1 && zs.drag) {
        const dx = e.touches[0].clientX - zs.tx2,
          dy = e.touches[0].clientY - zs.ty2;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) zs.moved = true;
        zs.tx += dx;
        zs.ty += dy;
        zs.tx2 = e.touches[0].clientX;
        zs.ty2 = e.touches[0].clientY;
        applyZoneTransform();
      } else if (e.touches.length === 2) {
        const d = getDist(e),
          m = getMid(e),
          r = wrap!.getBoundingClientRect();
        zoneZoom(d / zs.td, m.x - r.left, m.y - r.top);
        zs.tx += m.x - zs.tx2;
        zs.ty += m.y - zs.ty2;
        zs.td = d;
        zs.tx2 = m.x;
        zs.ty2 = m.y;
        applyZoneTransform();
      }
    }
    function onTouchEnd(e: TouchEvent) {
      if (!e.touches.length) zs.drag = false;
    }

    wrap.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    wrap.addEventListener('wheel', onWheel, { passive: false });
    wrap.addEventListener('touchstart', onTouchStart, { passive: false });
    wrap.addEventListener('touchmove', onTouchMove, { passive: false });
    wrap.addEventListener('touchend', onTouchEnd);

    onWatcherCleanup(() => {
      wrap.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      wrap.removeEventListener('wheel', onWheel);
      wrap.removeEventListener('touchstart', onTouchStart);
      wrap.removeEventListener('touchmove', onTouchMove);
      wrap.removeEventListener('touchend', onTouchEnd);
    });
  });
});
</script>
