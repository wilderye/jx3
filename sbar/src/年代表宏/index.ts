import timelineRaw from './timeline.json?raw';

/**
 * 年代表宏脚本
 *
 * 将 745~762 年的年代表数据注册为自定义宏 {{年代表::公元年}}
 * 在 EJS 世界书条目或其他位置使用 {{年代表::755}} 即可获取对应年份的年代表内容
 */

const TIMELINE: Record<string, string> = JSON.parse(timelineRaw);

$(() => {
  // 注册自定义宏：{{年代表::公元年}}
  const { unregister } = registerMacroLike(/\{\{年代表::(\d+)\}\}/gi, (_context, _substring, year: string) => {
    return TIMELINE[year] ?? '';
  });

  // 共享年代表数据到全局，供状态栏等前端界面通过 window.parent 访问
  (window as any).TIMELINE_DATA = TIMELINE;
  initializeGlobal('Timeline', TIMELINE);

  console.info('[年代表宏] 已注册，覆盖年份: 745~762');

  // 卸载时取消注册
  $(window).on('pagehide', () => {
    unregister();
    console.info('[年代表宏] 已取消注册');
  });
});
