const automator = require('miniprogram-automator');
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;

MiniProgram.prototype.checkVersion = async function checkVersion() {};

(async () => {
  const mp = await automator.connect({ wsEndpoint: process.env.WEAPP_WS || 'ws://127.0.0.1:9423' });
  await mp.reLaunch('/pages/game/game?level=101');
  await new Promise((r) => setTimeout(r, 2500));
  const page = await mp.currentPage();
  if ((await page.data()).showIntro) await page.callMethod('dismissIntro');
  await new Promise((r) => setTimeout(r, 800));
  await page.callMethod('_measureGameRects');
  await new Promise((r) => setTimeout(r, 600));
  const metrics = await page.callMethod('getLayoutMetrics');
  const data = await page.data();
  console.log('layoutStyle:', data.layoutStyle);
  console.log('metrics:', JSON.stringify(metrics, null, 2));
  await mp.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
