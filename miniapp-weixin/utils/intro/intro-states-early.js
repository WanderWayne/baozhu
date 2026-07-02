let ITEM_ICONS = {};
try {
  ITEM_ICONS = (require('../../data/items.js') || {}).ITEMS || {};
} catch (e) {
  ITEM_ICONS = {};
}

function iconFor(name, fallback) {
  const def = ITEM_ICONS[name];
  return (def && def.icon) ? def.icon : fallback;
}

module.exports = function attachIntroStatesEarly(IntroSystem) {
  IntroSystem.prototype.initDotIdle = function initDotIdle() {
    this.patchUI({ dotVisible: true, dotOpacity: 1 });
  };

  IntroSystem.prototype.initDoorExpand = function initDoorExpand() {
    this.playSFX('click-dot');
    this.patchUI({ dotVisible: false, dotOpacity: 0, flashClass: 'flash' });
    this.setDoorOpacity(0);

    this.schedule(() => {
      this.playSFX('hum');
      this.setDoorClass('breathing');
      this.setDoorOpacity(1);
      this.patchUI({ flashClass: 'fade-out' });
      this.createAllParticles();
    }, 700);

    this.schedule(() => {
      this.showNarrative('这是...?');
      this.setState('doorBreath');
    }, 2200);
  };

  IntroSystem.prototype.createAllParticles = function createAllParticles() {
    for (let i = 0; i < this.config.ambientParticles; i += 1) {
      this.addParticle(false);
    }
    for (let i = 0; i < this.config.linkedClusterCount; i += 1) {
      this.addLinkedCluster();
    }
  };

  IntroSystem.prototype.initDoorBreath = function initDoorBreath() {
    if (!this.doorModes.has('breathing')) {
      this.addDoorClass('breathing');
    }

    this.schedule(() => {
      this.hideNarrative();
      this.patchUI({ inventoryVisible: true });
      this.schedule(() => this.setState('spawnRice'), 800);
    }, 6000);
  };

  IntroSystem.prototype.initSpawnRice = function initSpawnRice() {
    this.createItem('糯米', iconFor('糯米', '🍚'), true, false);
    this.showNarrative('拖动它...');
    this.setState('waitRicePlaced');
  };

  IntroSystem.prototype.initRicePlacedPulse = function initRicePlacedPulse() {
    this.playSFX('wave');
    const rice = this.items.find((i) => i.name === '糯米');
    if (rice) {
      this.emitPulseWave(rice.x + rice.width / 2, rice.y + rice.height / 2, true);
      rice.isGolden = false;
      this.updateItemVisual(rice);
    }

    this.schedule(() => {
      this.showNarrative('...很好.......');
      this.schedule(() => this.setState('spawnBrewing'), 1200);
    }, 600);
  };

  IntroSystem.prototype.initSpawnBrewing = function initSpawnBrewing() {
    this.createItem('酿造', iconFor('酿造', '🏺'), true, false, false);
    this.schedule(() => {
      this.hideNarrative();
      this.setState('waitSynthesis');
    }, 300);
  };

  IntroSystem.prototype.initFirstSynthesis = function initFirstSynthesis() {
    this.hideNarrative();
    const rice = this.items.find((i) => i.name === '糯米');
    const brewing = this.items.find((i) => i.name === '酿造');
    if (!rice || !brewing) return;

    const riceCenterX = rice.x + rice.width / 2;
    const riceCenterY = rice.y + rice.height / 2;
    const brewingCenterX = brewing.x + brewing.width / 2;
    const brewingCenterY = brewing.y + brewing.height / 2;
    const centerX = (riceCenterX + brewingCenterX) / 2;
    const centerY = (riceCenterY + brewingCenterY) / 2;
    this.synthesisCenterX = centerX;
    this.synthesisCenterY = centerY;

    const popDistance = 50;
    const angle = Math.atan2(brewingCenterY - riceCenterY, brewingCenterX - riceCenterX);
    rice.animTarget = {
      x: centerX - Math.cos(angle) * popDistance - rice.width / 2,
      y: centerY - Math.sin(angle) * popDistance - rice.height / 2,
    };
    brewing.animTarget = {
      x: centerX + Math.cos(angle) * popDistance - brewing.width / 2,
      y: centerY + Math.sin(angle) * popDistance - brewing.height / 2,
    };
    rice.animPhase = 'popApart';
    brewing.animPhase = 'popApart';
    rice.spinAngle = 0;
    brewing.spinAngle = 0;

    this.schedule(() => {
      rice.animPhase = 'spinning';
      brewing.animPhase = 'spinning';
      rice.spinStart = this.now();
      brewing.spinStart = this.now();

      this.schedule(() => {
        rice.animPhase = 'dash';
        brewing.animPhase = 'dash';
        rice.animTarget = { x: centerX - rice.width / 2, y: centerY - rice.height / 2 };
        brewing.animTarget = { x: centerX - brewing.width / 2, y: centerY - brewing.height / 2 };

        this.schedule(() => {
          this.playSFX('craft-normal');
          this.flashWhite(centerX, centerY);
          rice.hidden = true;
          brewing.hidden = true;
          this.items = this.items.filter((i) => i.name !== '糯米' && i.name !== '酿造');
          this.createSynthesisResult('酒酿', iconFor('酒酿', '🍶'), centerX, centerY, false);

          this.schedule(() => this.showNarrative('这，就是合成...'), 600);
          this.schedule(() => {
            this.hideNarrative();
            this.addDoorClass('active');
            this.setState('offerToDoor');
          }, 3500);
        }, 200);
      }, 600);
    }, 250);
  };

  IntroSystem.prototype.initOfferToDoor = function initOfferToDoor() {
    this.hideNarrative();
    this.playSFX('door-absorb');

    if (this.synthesisResult) {
      this.synthesisResult.animPhase = 'offering';
      let tx = this.centerX - this.synthesisResult.width / 2;
      let ty = this.centerY - 100;
      tx = this.centerX - this.synthesisResult.width / 2;
      ty = this.centerY - 16 - this.synthesisResult.height / 2;
      this.synthesisResult.animTarget = { x: tx, y: ty };
    }

    this.addDoorClass('absorbing');

    this.schedule(() => {
      if (this.synthesisResult) {
        this.synthesisResult.opacity = 0;
        this.synthesisResult.scale = 0.3;
        this.syncItemsToPage();
      }

      this.schedule(() => {
        if (this.synthesisResult) {
          this.synthesisResult.hidden = true;
          this.synthesisResult = null;
        }
        this.items.forEach((item) => { item.hidden = true; });
        this.items = [];
        this.removeDoorClass('absorbing');
        this.addDoorClass('releasing');
        this.playBGM('bgm-intro');
        this.syncItemsToPage();
        this.setState('blueWash');
      }, 900);
    }, 2000);
  };
};
