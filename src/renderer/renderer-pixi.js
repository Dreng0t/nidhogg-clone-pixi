import { Container, Graphics, Text } from 'pixi.js';

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
    Object.values(this.layers).forEach(l => this.world.addChild(l));
    app.stage.addChild(this.world);

    this.platformViews = [];
    this.actorViews = new Map();

    this.hud = new Text('', { fill: 0xffffff, fontSize: 16 });
    this.hud.x = 10; this.hud.y = 10;
    app.stage.addChild(this.hud);
  }

  initPlatforms(platforms) {
    if (this.platformViews.length) return;
    for (const p of platforms) {
      const g = new Graphics().beginFill(0x39424e).drawRoundedRect(p.x, p.y, p.w, p.h, 6).endFill();
      this.layers.platforms.addChild(g);
      this.platformViews.push(g);
    }
  }

  draw(snap) {
    this.initPlatforms(snap.platforms);

    // camera (center fighters)
    const viewW = this.app.renderer.width, viewH = this.app.renderer.height;
    this.world.x = Math.round(-snap.camera.x + viewW/2);
    this.world.y = Math.round(-snap.camera.y + viewH/2);

    // actors
    for (const a of snap.actors) {
      let v = this.actorViews.get(a.id);
      if (!v) {
        v = this._makeFighter(a.color);
        this.layers.actors.addChild(v);
        this.actorViews.set(a.id, v);
      }
      v.x = a.x; v.y = a.y; v.scale.x = a.facing;
      v.sword.rotation = a.sword.angle;
      v.hitbox.visible = !!a.hitbox;
      v.hitbox.clear();
      if (a.hitbox) v.hitbox.lineStyle(1, 0x00ffcc, 0.7).drawRect(a.hitbox.x - a.x, a.hitbox.y - a.y, a.hitbox.w, a.hitbox.h);
    }

    this.hud.text = `Player ${snap.score.player} – ${snap.score.bot} Bot`;
  }

  _makeFighter(color) {
    const c = new Container();
    const body = new Graphics().beginFill(color).drawRoundedRect(-14,-40,28,40,6).endFill();
    const sword = new Graphics().beginFill(0xdadada).drawRect(0,-2,42,4).endFill();
    sword.x = 12; sword.y = -28;
    const hitbox = new Graphics();

    c.addChild(body); c.addChild(sword); c.addChild(hitbox);
    c.sword = sword; c.hitbox = hitbox;
    return c;
  }
}
