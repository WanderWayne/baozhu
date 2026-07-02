declare const wx: any;

type AudioMap = Record<string, string>;

export class AudioService {
  private bgm: any = null;
  private sfxVolume = 0;
  private bgmVolume = 0;
  private readonly map: AudioMap;

  constructor(audioMap: AudioMap) {
    this.map = audioMap;
  }

  playBgm(key: string): void {
    const src = this.map[key];
    if (!src || !wx?.createInnerAudioContext) return;
    if (this.bgm) {
      this.bgm.stop();
      this.bgm.destroy();
    }
    this.bgm = wx.createInnerAudioContext();
    this.bgm.src = src;
    this.bgm.loop = true;
    this.bgm.volume = this.bgmVolume;
    this.bgm.play();
  }

  stopBgm(): void {
    if (!this.bgm) return;
    this.bgm.stop();
  }

  playSfx(key: string): void {
    const src = this.map[key];
    if (!src || !wx?.createInnerAudioContext) return;
    const sfx = wx.createInnerAudioContext();
    sfx.src = src;
    sfx.volume = this.sfxVolume;
    sfx.play();
    sfx.onEnded(() => sfx.destroy());
  }

  setBgmVolume(v: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, v));
    if (this.bgm) this.bgm.volume = this.bgmVolume;
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v));
  }
}

