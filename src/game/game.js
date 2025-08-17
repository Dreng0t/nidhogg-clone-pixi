import { Fighter } from './fighter.js';

export class Game {
  constructor({ input }) {
    // platforms: simple two-level layout
    this.platforms = [
      { x: 40,  y: 500, w: 880, h: 16 }, // floor
      { x: 260, y: 340, w: 440, h: 12 }  // mid
    ];

    this.player = new Fighter({ id:'player', x:140, y:this.platforms[0].y, color:0xffc857 });
    this.bot    = new Fighter({ id:'bot',    x:820, y:this.platforms[0].y, color:0x89cff0 });

    this.input = input;
    this.gameOver = false;
    this.playerWins = 0;
    this.botWins = 0;
  }

  update(dt) {
    if (this.gameOver) return;

    // inputs/AI
    this.player.thinkFromInput(this.input);
    this.bot.aiChase(this.player, this.platforms);

    // physics
    this.player.applyPhysics(dt);
    this.bot.applyPhysics(dt);

    // collisions
    this.player.collideOneWay(this.platforms);
    this.bot.collideOneWay(this.platforms);

    // combat
    this.handleCombat();

    // round end?
    if (this.player.hp <= 0 || this.bot.hp <= 0) {
      if (this.player.hp <= 0) this.botWins++;
      if (this.bot.hp <= 0) this.playerWins++;
      this.respawnAfterDelay();
    }
  }

  handleCombat() {
    const pHB = this.player.attackTimer > 0 ? this.player.swordAABB() : null;
    const bHB = this.bot.attackTimer    > 0 ? this.bot.swordAABB()    : null;
    const pBB = this.player.bodyAABB();
    const bBB = this.bot.bodyAABB();

    if (pHB && overlap(pHB, bBB) && this.bot.iframes <= 0) {
      this.bot.takeHit(this.player.facing);
    }
    if (bHB && overlap(bHB, pBB) && this.player.iframes <= 0) {
      this.player.takeHit(this.bot.facing);
    }
  }

  respawnAfterDelay() {
    this.gameOver = true;
    setTimeout(() => {
      // soft reset round
      this.player.x = 140; this.player.y = this.platforms[0].y;
      this.bot.x    = 820; this.bot.y    = this.platforms[0].y;
      this.player.vx = this.player.vy = this.bot.vx = this.bot.vy = 0;
      this.player.hp = this.bot.hp = 3;
      this.player.state = this.bot.state = 'idle';
      this.gameOver = false;
    }, 1500);
  }

  restart() {
    this.playerWins = 0; this.botWins = 0;
    this.player.hp = this.bot.hp = 3;
    this.player.x = 140; this.bot.x = 820;
    this.player.y = this.bot.y = this.platforms[0].y;
    this.player.vx = this.player.vy = this.bot.vx = this.bot.vy = 0;
    this.player.state = this.bot.state = 'idle';
    this.gameOver = false;
  }

  snapshot() {
    const camX = (this.player.x + this.bot.x)/2;
    const camY = (this.player.y + this.bot.y)/2;
    return {
      camera: { x: camX, y: camY },
      platforms: this.platforms,
      actors: [ this.player.renderInfo(), this.bot.renderInfo() ],
      score: { player: this.playerWins, bot: this.botWins },
      over: this.gameOver
    };
  }
}

function overlap(a,b){ return a && b && a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
