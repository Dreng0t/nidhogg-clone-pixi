import { Application } from 'pixi.js';
import { Input } from './engine/input.js';
import { Game } from './game/game.js';
import { RendererPixi } from './renderer/renderer-pixi.js';

async function boot() {
  const app = new Application();
  await app.init({ width: 960, height: 540, background: 0x101418, antialias: true });
  document.body.appendChild(app.canvas);

  const input = new Input();
  const game = new Game({ input });
  const renderer = new RendererPixi(app);

  // fixed-step loop
  let acc = 0, last = performance.now(), FIXED = 1/120;
  app.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(0.033, (now - last)/1000);
    last = now; acc += dt;

    while (acc >= FIXED) { game.update(FIXED); acc -= FIXED; }
    renderer.draw(game.snapshot());

    if (input.reset && game.over === true) game.restart();
  });
}
boot();
