// src/renderer/renderer-pixi.js
import {
  Container,
  Text,
  Assets,
  AnimatedSprite,
  Graphics,
  Texture,
  Rectangle,
} from "pixi.js";

export class RendererPixi {
  constructor(app) {
    this.app = app;

    this.world = new Container();
    this.layers = {
      bg: new Container(),
      platforms: new Container(),
      actors: new Container(),
      fx: new Container(),
      ui: new Container(),
    };
    Object.values(this.layers).forEach((l) => this.world.addChild(l));
    app.stage.addChild(this.world);

    this.platformViews = [];
    this.actorViews = new Map();

    this.hud = new Text({
      text: "",
      style: { fill: 0xffffff, fontSize: 16 },
    });
    this.hud.x = 10;
    this.hud.y = 10;
    app.stage.addChild(this.hud);

    this.assetsReady = false;
    this.anims = {};
    this._loadStrips();
  }

  async _loadStrips() {
    const idleTex   = await Assets.load("/assets/idle.png");
    const runTex    = await Assets.load("/assets/run.png");
    const attackTex = await Assets.load("/assets/attack1.png");
    const hurtTex   = await Assets.load("/assets/hurt.png");

    // helper to slice a strip into frames
    const sliceStrip = (tex, frameCount) => {
      if (!tex || !tex.source || !frameCount) return [];
      const { width, height } = tex.source;
      const frameW = Math.floor(width / frameCount);
      const frames = [];
      for (let i = 0; i < frameCount; i++) {
        frames.push(
          new Texture({
            source: tex.source,
            frame: new Rectangle(i * frameW, 0, frameW, height),
          })
        );
      }
      return frames;
    };

    // ⚠️ adjust counts to your actual assets!
    this.anims.idle        = sliceStrip(idleTex,   10); // idle.png has 10 frames
    this.anims.run         = sliceStrip(runTex,   8);  // run.png has 8 frames
    this.anims.attack_stab = sliceStrip(attackTex, 6); // attack1.png has 6 frames
    this.anims.hitstun     = sliceStrip(hurtTex,   4); // hurt.png has 4 frames
    this.anims.dead        = this.anims.hitstun.length
      ? [this.anims.hitstun.at(-1)]
      : [];

    console.log("[anims] idle:", this.anims.idle.length,
                "run:", this.anims.run.length,
                "attack:", this.anims.attack_stab.length,
                "hurt:", this.anims.hitstun.length);

    this.assetsReady = true;
  }

  initPlatforms(platforms) {
    if (this.platformViews.length) return;
    for (const p of platforms) {
      const g = new Graphics()
        .fill(0x39424e)
        .roundRect(p.x, p.y, p.w, p.h, 6)
        .fill();
      this.layers.platforms.addChild(g);
      this.platformViews.push(g);
    }
  }

  draw(snap) {
    this.initPlatforms(snap.platforms);

    const viewW = this.app.renderer.width;
    const viewH = this.app.renderer.height;
    this.world.x = Math.round(-snap.camera.x + viewW / 2);
    this.world.y = Math.round(-snap.camera.y + viewH / 2);

    for (const a of snap.actors) {
      let v = this.actorViews.get(a.id);
      if (!v) {
        v = this._makeFighterView(a);
        this.layers.actors.addChild(v.root);
        this.actorViews.set(a.id, v);
      }

      v.root.x = a.x;
      v.root.y = a.y;
      v.root.scale.x = a.facing;

      this._applyState(v, a);

      v.hitbox.visible = !!a.hitbox;
      v.hitbox.clear();
      if (a.hitbox) {
        v.hitbox
          .setStrokeStyle({ width: 1, color: 0x00ffcc, alpha: 0.7 })
          .rect(a.hitbox.x - a.x, a.hitbox.y - a.y, a.hitbox.w, a.hitbox.h)
          .stroke();
      }
    }

    this.hud.text = `Player ${snap.score.player} – ${snap.score.bot} Bot`;
  }

  _makeFighterView(a) {
    const root = new Container();

    const placeholder = new Graphics()
      .fill(0xffc857)
      .roundRect(-14, -40, 28, 40, 6)
      .fill();
    root.addChild(placeholder);

    const hitbox = new Graphics();
    root.addChild(hitbox);

    return { root, anim: null, hitbox, placeholder, currentAnimKey: null };
  }

  _applyState(v, a) {
    const key =
      a.state === "attack"
        ? "attack_stab"
        : a.state === "run"
        ? "run"
        : a.state === "hitstun"
        ? "hitstun"
        : a.state === "dead"
        ? "dead"
        : "idle";

    if (!this.assetsReady) return;

    if (!v.anim) {
      const idleFrames = this.anims.idle;
      if (!idleFrames || !idleFrames.length) return;

      const anim = new AnimatedSprite(idleFrames);
      anim.anchor.set(0.5, 1.0);
      anim.animationSpeed = 0.12;
      anim.loop = true;
      anim.play();
      v.root.addChildAt(anim, 0);
      v.anim = anim;
      if (v.placeholder) v.placeholder.visible = false;
    }

    if (v.currentAnimKey !== key) {
      const frames = this.anims[key] && this.anims[key].length
        ? this.anims[key]
        : this.anims.idle;

      v.anim.textures = frames;
      v.anim.loop = !(key === "attack_stab" || key === "hitstun" || key === "dead");
      v.anim.animationSpeed =
        key === "run"
          ? 0.22
          : key === "attack_stab"
          ? 0.45
          : key === "hitstun"
          ? 0.1
          : 0.12;
      v.anim.gotoAndPlay(0);
      v.currentAnimKey = key;
    }
  }
}
