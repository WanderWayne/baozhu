const automator = require('miniprogram-automator');
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;

MiniProgram.prototype.checkVersion = async function checkVersion() {};

(async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9423' });
  const page = await mp.currentPage();
  const d = await page.data();
  const btns = await page.$$('button');
  const texts = [];
  for (const b of btns) {
    try {
      texts.push(await b.text());
    } catch (_) {}
  }
  console.log(
    JSON.stringify(
      {
        path: page.path,
        data: {
          showCanvas: d.showCanvas,
          loadError: d.loadError,
          codexText: d.codexText,
          fragmentText: d.fragmentText,
          codexPercent: d.codexPercent,
          fragmentPercent: d.fragmentPercent,
          tasksVisible: d.tasksVisible,
          settingsVisible: d.settingsVisible,
        },
        buttons: texts,
      },
      null,
      2
    )
  );
  await mp.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
