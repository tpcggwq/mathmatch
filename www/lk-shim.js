(function(){
  // Minimal LK compatibility layer using PIXI and simple helpers.
  if (window.LK) return;

  const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x87ceeb,
    antialias: true
  });
  document.getElementById('game').appendChild(app.view);

  const stage = app.stage;
  const registry = {
    shapes: {},
    sounds: {}
  };

  function createRoundedRectTexture(width, height, color){
    const g = new PIXI.Graphics();
    g.beginFill(color);
    g.drawRoundedRect(0,0,width,height, Math.min(width,height)*0.08);
    g.endFill();
    const tex = app.renderer.generateTexture(g);
    g.destroy(true);
    return tex;
  }

  class Container extends PIXI.Container {
    attachAsset(key, opts){
      const def = registry.shapes[key];
      if(!def) throw new Error('Unknown asset: '+key);
      const sprite = new PIXI.Sprite(def.texture);
      sprite.anchor.set(opts && opts.anchorX || 0, opts && opts.anchorY || 0);
      this.addChild(sprite);
      return sprite;
    }
  }
  window.Container = Container;

  class Text2 extends PIXI.Text {
    constructor(text, opts){
      const style = new PIXI.TextStyle({
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: (opts && opts.size) || 48,
        fill: (opts && opts.fill) || 0x000000,
        align: 'center',
        fontWeight: '700',
        wordWrap: true,
        wordWrapWidth: 1600
      });
      super(text, style);
    }
    setText(t){ this.text = t; }
  }
  window.Text2 = Text2;

  function makeInteractive(container){
    container.interactive = true;
    container.on('pointerdown', function(e){
      const pos = e.data.global;
      if (container.down) container.down(pos.x, pos.y, container);
    });
  }

  const LK = {
    init: {
      shape: function(key, opts){
        const texture = createRoundedRectTexture(opts.width, opts.height, opts.color || 0x999999);
        registry.shapes[key] = { texture };
      },
      sound: function(key){
        try {
          registry.sounds[key] = new Howl({ src: [] });
        } catch(err) {
          registry.sounds[key] = { play: function(){} };
        }
      }
    },
    getAsset: function(key, opts){
      const c = new Container();
      const s = c.attachAsset(key, opts || {});
      return c.removeChild(s), s; // return sprite directly like in usage
    },
    getSound: function(key){
      return registry.sounds[key] || { play: function(){} };
    },
    setTimeout: function(fn, ms){ return setTimeout(fn, ms); },
    setScore: function(){ /* no-op for shim scoreboard */ },
    Game: function(opts){
      stage.interactive = true;
      stage.hitArea = new PIXI.Rectangle(0,0, app.renderer.width, app.renderer.height);
      const api = new Container();
      stage.addChild(api);
      api.addChild = function(child){
        makeInteractive(child);
        return Container.prototype.addChild.call(api, child);
      };
      api.removeChild = function(child){
        return Container.prototype.removeChild.call(api, child);
      };
      return api;
    }
  };
  window.LK = LK;

  // Simple tween helper compatible with expected API
  function tween(target, to, opts){
    const duration = (opts && opts.duration) || 500;
    const easing = (opts && opts.easing) || function(t){ return t; };
    const from = {};
    Object.keys(to).forEach(k => { from[k] = target[k] || 0; });
    const start = performance.now();
    function step(now){
      const t = Math.min(1, (now - start)/duration);
      const e = easing(t);
      Object.keys(to).forEach(k => { target[k] = from[k] + (to[k]-from[k]) * e; });
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  tween.easeOut = function(t){ return 1 - Math.pow(1 - t, 3); };
  window.tween = tween;
})();


