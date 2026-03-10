// ===== Mvu 数据桥接 =====
// 参考 变量\状态栏.html 的实现方式
// 负责从 Mvu 框架读取 stat_data 并转换为美化版所需格式

// ===== 类型定义 =====
export interface Affair {
  content: string;
  timeLimit: string;
  status: string;
}

export interface Character {
  name: string;
  trust: number;
  sect: string;
  relationship: string;
  affairs: Affair[];
}

export interface WorldInfo {
  year: string;
  date: string;
  timeName: string;
  timeNumber: string;
  location: string;
}

export interface MvuResult {
  worldInfo: WorldInfo;
  characters: Character[];
  gregorianYear: number;
}

// ===== 十二时辰映射表 =====
const SHICHEN_TABLE = [
  { name: '子时', start: 23, end: 1 },
  { name: '丑时', start: 1, end: 3 },
  { name: '寅时', start: 3, end: 5 },
  { name: '卯时', start: 5, end: 7 },
  { name: '辰时', start: 7, end: 9 },
  { name: '巳时', start: 9, end: 11 },
  { name: '午时', start: 11, end: 13 },
  { name: '未时', start: 13, end: 15 },
  { name: '申时', start: 15, end: 17 },
  { name: '酉时', start: 17, end: 19 },
  { name: '戌时', start: 19, end: 21 },
  { name: '亥时', start: 21, end: 23 },
];

/** 24h 时间 → 时辰名 */
function toShichen(timeStr?: string): { name: string; time: string } {
  if (!timeStr) return { name: '未知', time: '' };
  const parts = String(timeStr).split(':');
  const hour = parseInt(parts[0], 10);
  if (isNaN(hour)) return { name: '未知', time: timeStr };

  let name = '子时';
  for (const s of SHICHEN_TABLE) {
    if (s.start > s.end) {
      // 子时跨越 23-1
      if (hour >= s.start || hour < s.end) {
        name = s.name;
        break;
      }
    } else if (hour >= s.start && hour < s.end) {
      name = s.name;
      break;
    }
  }
  return { name, time: timeStr };
}

/** 从 stat_data.人物 对象 → Character[] 数组 */
function parseCharacters(renWu: Record<string, any> | undefined): Character[] {
  if (!renWu || typeof renWu !== 'object') return [];
  const result: Character[] = [];
  for (const [charName, info] of Object.entries(renWu)) {
    if (!info || typeof info !== 'object') continue;
    const affairs: Affair[] = [];
    if (info.事务 && typeof info.事务 === 'object') {
      for (const [taskName, taskInfo] of Object.entries(info.事务 as Record<string, any>)) {
        if (taskInfo && typeof taskInfo === 'object') {
          affairs.push({
            content: taskName,
            timeLimit: taskInfo.时限 || '',
            status: taskInfo.状态 || '',
          });
        }
      }
    }
    result.push({
      name: charName,
      trust: Number(info.亲近度) || 0,
      sect: info.归属 || '',
      relationship: info.关系 || '',
      affairs,
    });
  }
  return result;
}

/**
 * 主数据读取函数
 * 参考 变量\状态栏.html 第 826-831 行的实现：
 *   await waitGlobalInitialized("Mvu");
 *   const msgId = getCurrentMessageId();
 *   const data = Mvu.getMvuData({ type: "message", message_id: msgId });
 *   const stat = data.stat_data;
 *
 * 注意：调用此函数前，index.ts 已执行：
 *   await waitGlobalInitialized('Mvu');
 *   await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));
 */
export function readMvuData(): MvuResult | null {
  try {
    const msgId = getCurrentMessageId();
    const data = Mvu.getMvuData({ type: 'message', message_id: msgId });
    const stat = _.get(data, 'stat_data');
    if (!stat) return null;

    const world = stat.世界 || {};
    const shichen = toShichen(world.时间);

    const worldInfo: WorldInfo = {
      year: world.年代 || '',
      date: world.日期 || '',
      timeName: shichen.name,
      timeNumber: shichen.time,
      location: world.地点 || '',
    };

    const characters = parseCharacters(stat.人物);
    const gregorianYear = Number(world.公元年) || 745;

    return { worldInfo, characters, gregorianYear };
  } catch (e) {
    console.error('[mvu-bridge] 读取失败:', e);
    return null;
  }
}
