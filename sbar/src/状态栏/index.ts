import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import { readMvuData, writeMvuVariable } from './utils/mvu-bridge';

async function init() {
  // 参考 变量\状态栏.html：先等待 Mvu 初始化，再等待 stat_data 就绪
  await waitGlobalInitialized('Mvu');
  await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));

  // 读取 Mvu 数据，reactive() 包装使编辑后 Vue 能自动重渲染
  const raw = readMvuData();
  if (!raw) throw new Error('[index.ts] readMvuData 返回 null');
  const mvuData = reactive(raw);

  return mvuData;
}

$(() => {
  init().then(mvuData => {
    const app = createApp(App);
    app.provide('mvuData', mvuData);
    app.provide('writeMvuVariable', writeMvuVariable);
    app.mount('#app');
  });
});
