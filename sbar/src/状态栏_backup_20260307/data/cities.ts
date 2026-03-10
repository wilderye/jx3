// ===== 城市坐标数据 =====
// 从功能版 状态栏.html 提取，TypeScript 化

// CDN 配置
export const MAP_CDN = 'https://testingcf.jsdelivr.net/gh/wilderye/jx3/map';
export const ZONE_CDN = MAP_CDN + '/zone_maps';

// 地图常量
export const MAP_W = 4920;
export const MAP_H = 3456;
export const TRAFFIC_LEFT = 1427;
export const TRAFFIC_TOP = 1033;
export const TRAFFIC_WIDTH = 2722;
export const ICON_SIZE = 90;
export const FONT_MAJOR = 22;
export const FONT_MINOR = 22;
export const LABEL_OFFSET_X = 30;
export const LABEL_OFFSET_Y = 0;
export const SCALE_MIN = 0.1;
export const SCALE_MAX = 1.2;
export const ZOOM_THRESHOLD = 0.6;

export interface City {
  name: string;
  file: string;
  x: number;
  y: number;
  major: boolean;
  zoneMap: string | null;
}

// 56 城市坐标
export const CITIES: City[] = [
  { name: '伊丽川', file: '伊丽川.png', x: 1185, y: 1060, major: false, zoneMap: null },
  { name: '明教', file: '明教.png', x: 1421, y: 1447, major: true, zoneMap: '明教.png' },
  { name: '河西瀚漠', file: '河西瀚漠.png', x: 1962, y: 1325, major: false, zoneMap: null },
  { name: '昆仑', file: '昆仑.png', x: 2154, y: 1943, major: false, zoneMap: '昆仑.png' },
  { name: '黑山林海', file: '黑山林海.png', x: 2179, y: 2830, major: false, zoneMap: '黑山林海.png' },
  { name: '恶人谷', file: '恶人谷.png', x: 2229, y: 1672, major: false, zoneMap: '恶人谷.png' },
  { name: '黑龙沼', file: '黑龙沼.png', x: 2253, y: 2456, major: false, zoneMap: '黑龙沼.png' },
  { name: '衍天宗', file: '衍天宗.png', x: 2328, y: 1466, major: false, zoneMap: '衍天宗.png' },
  { name: '苍山洱海', file: '苍山洱海.png', x: 2340, y: 2632, major: false, zoneMap: '苍山洱海.png' },
  { name: '南诏段氏', file: '南诏段氏.png', x: 2398, y: 2528, major: false, zoneMap: null },
  { name: '无量山', file: '无量山.png', x: 2397, y: 2756, major: false, zoneMap: '无量山.png' },
  { name: '龙门荒漠', file: '龙门荒漠.png', x: 2416, y: 1778, major: false, zoneMap: '龙门荒漠.png' },
  { name: '融天岭', file: '融天岭.png', x: 2430, y: 2434, major: false, zoneMap: '融天岭.png' },
  { name: '五毒', file: '五毒.png', x: 2494, y: 2740, major: true, zoneMap: '五毒.png' },
  { name: '唐门', file: '唐门.png', x: 2557, y: 2344, major: true, zoneMap: '唐门.png' },
  { name: '成都', file: '成都.png', x: 2600, y: 2257, major: true, zoneMap: '成都.png' },
  { name: '凌雪阁', file: '凌雪阁.png', x: 2642, y: 1991, major: false, zoneMap: '凌雪阁.png' },
  { name: '白龙口', file: '白龙口.png', x: 2709, y: 2408, major: false, zoneMap: '白龙口.png' },
  { name: '马嵬驿', file: '马嵬驿.png', x: 2704, y: 1929, major: false, zoneMap: '马嵬驿.png' },
  { name: '黑戈壁', file: '黑戈壁.png', x: 2786, y: 1232, major: false, zoneMap: '黑戈壁.png' },
  { name: '长安', file: '长安.png', x: 2790, y: 2029, major: true, zoneMap: '长安.png' },
  { name: '枫华谷', file: '枫华谷.png', x: 2832, y: 1927, major: false, zoneMap: '枫华谷.png' },
  { name: '帮会领地', file: '帮会领地.png', x: 2907, y: 2617, major: false, zoneMap: null },
  { name: '万花', file: '万花.png', x: 2893, y: 2116, major: true, zoneMap: '万花.png' },
  { name: '纯阳', file: '纯阳.png', x: 2926, y: 1981, major: true, zoneMap: '纯阳.png' },
  { name: '瞿塘峡', file: '瞿塘峡.png', x: 2974, y: 2245, major: false, zoneMap: '瞿塘峡.png' },
  { name: '银霜口', file: '银霜口.png', x: 2987, y: 2066, major: false, zoneMap: '银霜口.png' },
  { name: '太原', file: '太原.png', x: 3020, y: 1699, major: true, zoneMap: '太原.png' },
  { name: '苍云', file: '苍云.png', x: 3008, y: 1488, major: true, zoneMap: '苍云.png' },
  { name: '万灵山庄', file: '万灵山庄.png', x: 3028, y: 2783, major: false, zoneMap: '万灵山庄.png' },
  { name: '洛阳', file: '洛阳.png', x: 3027, y: 1945, major: true, zoneMap: '洛阳.png' },
  { name: '阴山大草原', file: '阴山大草原.png', x: 3045, y: 1149, major: false, zoneMap: '阴山大草原.png' },
  { name: '丐帮', file: '丐帮.png', x: 3109, y: 2333, major: true, zoneMap: '丐帮.png' },
  { name: '五台山', file: '五台山.png', x: 3092, y: 1444, major: false, zoneMap: '五台山.png' },
  { name: '天策', file: '天策.png', x: 3110, y: 1876, major: true, zoneMap: '天策.png' },
  { name: '浩气盟', file: '浩气盟.png', x: 3166, y: 2515, major: false, zoneMap: '浩气盟.png' },
  { name: '霸刀山庄', file: '霸刀山庄.png', x: 3186, y: 1571, major: false, zoneMap: '霸刀山庄.png' },
  { name: '少林', file: '少林.png', x: 3179, y: 1953, major: true, zoneMap: '少林.png' },
  { name: '巴陵县', file: '巴陵县.png', x: 3225, y: 2327, major: false, zoneMap: '巴陵县.png' },
  { name: '洛道', file: '洛道.png', x: 3348, y: 2049, major: false, zoneMap: '洛道.png' },
  { name: '南屏山', file: '南屏山.png', x: 3395, y: 2269, major: false, zoneMap: '南屏山.png' },
  { name: '烂柯山', file: '烂柯山.png', x: 3424, y: 2421, major: false, zoneMap: '烂柯山.png' },
  { name: '稻香村', file: '稻香村.png', x: 3418, y: 2134, major: false, zoneMap: '稻香村.png' },
  { name: '金水镇', file: '金水镇.png', x: 3449, y: 1956, major: false, zoneMap: '金水镇.png' },
  { name: '七秀', file: '七秀.png', x: 3472, y: 2056, major: true, zoneMap: '七秀.png' },
  { name: '千岛湖', file: '千岛湖.png', x: 3482, y: 2308, major: false, zoneMap: '千岛湖.png' },
  { name: '晟江', file: '晟江.png', x: 3546, y: 2188, major: false, zoneMap: '晟江.png' },
  { name: '楚州', file: '楚州.png', x: 3564, y: 1911, major: false, zoneMap: '楚州.png' },
  { name: '长歌门', file: '长歌门.png', x: 3563, y: 2241, major: false, zoneMap: '长歌门.png' },
  { name: '扬州', file: '扬州.png', x: 3619, y: 1994, major: true, zoneMap: '扬州.png' },
  { name: '永宁湾', file: '永宁湾.png', x: 3630, y: 2677, major: false, zoneMap: null },
  { name: '藏剑山庄', file: '藏剑山庄.png', x: 3653, y: 2200, major: true, zoneMap: '藏剑山庄.png' },
  { name: '百溪', file: '百溪.png', x: 3625, y: 2553, major: false, zoneMap: '百溪.png' },
  { name: '刀宗', file: '刀宗.png', x: 3842, y: 2219, major: false, zoneMap: '刀宗.png' },
  { name: '北天药宗', file: '北天药宗.png', x: 3846, y: 1155, major: false, zoneMap: '北天药宗.png' },
  { name: '蔷薇列岛', file: '蔷薇列岛.png', x: 3842, y: 2469, major: false, zoneMap: '蔷薇列岛.png' },
  { name: '洞天福地岛', file: '洞天福地岛.png', x: 3901, y: 2383, major: false, zoneMap: '洞天福地岛.png' },
  { name: '寇岛', file: '寇岛.png', x: 3941, y: 2650, major: false, zoneMap: '寇岛.png' },
  { name: '龙泉府', file: '龙泉府.png', x: 3949, y: 980, major: false, zoneMap: '龙泉府.png' },
  { name: '侠客岛', file: '侠客岛.png', x: 3983, y: 2533, major: false, zoneMap: '侠客岛.png' },
  { name: '经首道源岛', file: '经首道源岛.png', x: 4025, y: 2333, major: false, zoneMap: '经首道源岛.png' },
  { name: '蓬莱', file: '蓬莱.png', x: 4146, y: 2456, major: true, zoneMap: '蓬莱.png' },
  { name: '鲲鹏岛', file: '鲲鹏岛.png', x: 4150, y: 2246, major: false, zoneMap: '鲲鹏岛.png' },
];
