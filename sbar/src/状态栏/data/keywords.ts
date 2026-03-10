// ===== 关键词映射 + 条件地图 + 匹配函数 =====
// 从功能版 状态栏.html 提取，TypeScript 化

import { CITIES } from './cities';

export const KEYWORDS: Record<string, string[]> = {
  明教: ['明教'],
  昆仑: ['昆仑'],
  黑山林海: ['黑山林海'],
  恶人谷: ['恶人谷'],
  黑龙沼: ['黑龙沼'],
  衍天宗: ['衍天'],
  苍山洱海: ['苍山', '洱海'],
  无量山: ['无量山'],
  龙门荒漠: ['龙门荒漠'],
  融天岭: ['融天'],
  五毒: ['五毒', '五仙'],
  唐门: ['唐门'],
  成都: ['成都'],
  凌雪阁: ['凌雪阁'],
  白龙口: ['白龙口'],
  马嵬驿: ['马嵬'],
  黑戈壁: ['黑戈壁'],
  长安: ['长安'],
  枫华谷: ['枫华谷'],
  万花: ['万花'],
  纯阳: ['纯阳'],
  瞿塘峡: ['瞿塘峡'],
  银霜口: ['银霜口'],
  太原: ['太原'],
  苍云: ['苍云'],
  万灵山庄: ['万灵'],
  洛阳: ['洛阳'],
  阴山大草原: ['阴山大草原'],
  丐帮: ['丐帮'],
  五台山: ['五台山'],
  天策: ['天策'],
  浩气盟: ['浩气盟'],
  霸刀山庄: ['霸刀'],
  少林: ['少林'],
  巴陵县: ['巴陵'],
  洛道: ['洛道'],
  南屏山: ['南屏'],
  烂柯山: ['烂柯山'],
  稻香村: ['稻香村'],
  金水镇: ['金水镇'],
  七秀: ['七秀'],
  千岛湖: ['千岛湖'],
  晟江: ['晟江'],
  楚州: ['楚州'],
  长歌门: ['长歌门'],
  扬州: ['扬州'],
  藏剑山庄: ['藏剑'],
  百溪: ['百溪'],
  刀宗: ['刀宗'],
  北天药宗: ['药宗'],
  蔷薇列岛: ['蔷薇列岛'],
  洞天福地岛: ['洞天福地'],
  寇岛: ['寇岛'],
  龙泉府: ['龙泉府'],
  侠客岛: ['侠客岛'],
  经首道源岛: ['经首道源'],
  蓬莱: ['蓬莱'],
  鲲鹏岛: ['鲲鹏岛'],
};

interface ConditionalMap {
  zoneMap: string;
  keywords: string[];
  mode: 'all' | 'any';
  minYear?: number;
}

// 条件地图列表（按优先级排序，先匹配先生效）
export const CONDITIONAL_MAPS: ConditionalMap[] = [
  // 长安城子地图（AND 逻辑，最具体，优先级最高）
  { zoneMap: '长安城_长安东市.png', keywords: ['长安', '东市'], mode: 'all' },
  { zoneMap: '长安城_长安西市.png', keywords: ['长安', '西市'], mode: 'all' },
  // 长安城
  { zoneMap: '长安城.png', keywords: ['长安城'], mode: 'any' },
  // 狼牙堡
  { zoneMap: '狼牙堡·辉天堑.png', keywords: ['狼牙堡'], mode: 'any' },
  // 战乱版本
  { zoneMap: '长安·战乱.png', keywords: ['长安'], mode: 'any', minYear: 756 },
  { zoneMap: '洛阳·战乱.png', keywords: ['洛阳'], mode: 'any', minYear: 755 },
  { zoneMap: '枫华谷·战乱.png', keywords: ['枫华谷'], mode: 'any', minYear: 756 },
  // 乱世版本
  { zoneMap: '天策·乱世.png', keywords: ['天策'], mode: 'any', minYear: 756 },
  { zoneMap: '七秀·乱世.png', keywords: ['七秀'], mode: 'any', minYear: 758 },
  { zoneMap: '万花·乱世.png', keywords: ['万花'], mode: 'any', minYear: 758 },
  { zoneMap: '少林·乱世.png', keywords: ['少林'], mode: 'any', minYear: 758 },
  { zoneMap: '藏剑山庄·乱世.png', keywords: ['藏剑'], mode: 'any', minYear: 758 },
];

export function matchZoneMap(location: string, year: number): { zoneMap: string } | null {
  if (!location) return null;
  // 1. 先检查条件地图（优先级更高）
  for (const cm of CONDITIONAL_MAPS) {
    if (cm.minYear && year < cm.minYear) continue;
    const match =
      cm.mode === 'all'
        ? cm.keywords.every(kw => location.includes(kw))
        : cm.keywords.some(kw => location.includes(kw));
    if (match) return { zoneMap: cm.zoneMap };
  }
  // 2. 再走原有 CITIES + KEYWORDS 逻辑
  for (const c of CITIES) {
    if (!c.zoneMap) continue;
    const kws = KEYWORDS[c.name];
    if (kws && kws.some(kw => location.includes(kw))) return { zoneMap: c.zoneMap! };
  }
  return null;
}
