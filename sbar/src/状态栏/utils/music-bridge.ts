// ===== 音乐播放器 API 桥接 =====
// 封装与后台脚本 musicPlayerAPI 的两阶段握手逻辑，
// 供 App.vue 在 onMounted 中调用。

// ===== 类型定义 =====

/** 后台传来的完整状态快照 */
export interface FullStatePayload {
  currentItem: { title: string; artist?: string; cover?: string } | null;
  playbackState: 'STOPPED' | 'PLAYING' | 'PAUSED';
  playbackMode: 'list' | 'single' | 'random';
  masterVolume: number;
  playlist: Array<{ title: string; artist?: string; cover?: string }>;
  isTransitioning: boolean;
}

/** 前端使用的精简状态（由 App.vue 维护的响应式对象） */
export interface MusicPlayerState {
  isApiReady: boolean;
  isPlaying: boolean;
  masterVolume: number;
  hasQueue: boolean;
}

/** 后台 API 对象的类型 */
export interface MusicPlayerAPI {
  requestInitialization(): Promise<void>;
  getCurrentState(): FullStatePayload;
  togglePlayPause(): void;
  playNext(): void;
  playPrev(): void;
  setLiveVolume(volume: number): void;
  persistVolumeAndBroadcast(volume: number): void;
  onFullStateUpdate(callback: (payload: FullStatePayload) => void): () => void;
  onTimeUpdate(callback: (payload: { currentTime: number; duration: number }) => void): () => void;
}

// ===== 两阶段握手 =====

/**
 * [阶段一] 发现 API 对象。
 * 轮询 top.musicPlayerAPI 是否挂载，超时则 reject。
 */
function findApiObject(timeoutMs = 10000): Promise<MusicPlayerAPI> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (typeof (top as any).musicPlayerAPI === 'object' && (top as any).musicPlayerAPI !== null) {
        clearInterval(interval);
        resolve((top as any).musicPlayerAPI as MusicPlayerAPI);
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error('连接后台脚本失败。请确认角色卡的脚本开关已打开。若已打开请刷新页面重试。'));
      }
    }, 250);
  });
}

/**
 * 主初始化函数：两阶段握手。
 * 成功返回 API 实例，失败抛异常。
 */
export async function initializeMusicPlayer(): Promise<MusicPlayerAPI> {
  // --- 阶段一：发现 API 对象 ---
  console.log('[music-bridge] 阶段一：寻找后台 API 对象...');
  const api = await findApiObject();
  console.log('[music-bridge] 阶段一完成，API 对象已找到。');

  // --- 阶段二：等待后台就绪 ---
  console.log('[music-bridge] 阶段二：请求后台初始化...');
  await Promise.race([
    api.requestInitialization(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('后台脚本初始化超时。如果这是您第一次加载角色卡，请尝试刷新页面。')), 10000),
    ),
  ]);
  console.log('[music-bridge] 阶段二完成，后台已就绪。');

  return api;
}

/**
 * 从 FullStatePayload 提取前端需要的精简状态。
 */
export function extractPlayerState(payload: FullStatePayload): Omit<MusicPlayerState, 'isApiReady'> {
  return {
    isPlaying: payload.playbackState === 'PLAYING',
    masterVolume: payload.masterVolume,
    hasQueue: payload.currentItem !== null,
  };
}
