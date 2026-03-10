import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import type { MvuResult } from './utils/mvu-bridge';
import { readMvuData } from './utils/mvu-bridge';

// Mvu 数据存储，供 Vue 应用通过 provide/inject 使用
let mvuData: MvuResult | null = null;

async function init() {
  // 参考 变量\状态栏.html：先等待 Mvu 初始化，再等待 stat_data 就绪
  await waitGlobalInitialized('Mvu');
  await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));

  // 读取 Mvu 数据
  mvuData = readMvuData();
}

$(() => {
  init().then(() => {
    const app = createApp(App);
    // 通过 provide 注入 Mvu 数据，App.vue 通过 inject 接收
    app.provide('mvuData', mvuData);
    app.mount('#app');
  });
});
