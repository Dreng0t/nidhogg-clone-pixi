export class Fighter {
  constructor({ id, x, y, color }) {
    this.id = id;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.facing = 1; // 1 right, -1 left
    this.onGround = false;
    this.state = 'idle';
    this.hp = 3;
    this.color = color;

    this.attackTimer = 0;  // seconds remaining in attack
    this.iframes = 0;      // invulnerability after being hit
  }

  // ---- geometry
  bodyAABB() { return { x: this.x - 14, y: this.y - 40, w: 28, h: 40 }; }
  swordAABB() {
    // simple forward stab box during attack
    const len = 42, h = 10;
    const x0 = this.facing === 1 ? this.x + 12 : this.x - 12 - len;
    return { x: x0, y: this.y - 32, w: len, h };
  }

  thinkFromInput(input) {
    const MOVE = 260, JUMP = -720;
    this.vx = 0;
    if (input.left)  { this.vx = -MOVE; this.facing = -1; }
    if (input.right) { this.vx =  MOVE; this.facing =  1; }

    if (input.up && this.onGround) {
      this.vy = JUMP;
      this.onGround = false;
      this.state = 'jump';
    }

    if (input.stab && this.attackTimer <= 0) {
      this.attackTimer = 0.18;
      this.state = 'attack';
    }
  }

  aiChase(target, platforms) {
    // tiny bot brain
    const MOVE = 220, JUMP = -700;
    this.vx = Math.abs(target.x - this.x) > 8 ? (target.x > this.x ? MOVE : -MOVE) : 0;
    this.facing = target.x > this.x ? 1 : -1;

    // jump if target above and near mid platform center
    const mid = platforms[1]; // floor=0, mid=1
    const playerAbove = target.y < this.y - 40;
    const nearMid = Math.abs(this.x - (mid.x + mid.w/2)) < mid.w/2 + 50;
    if (playerAbove && this.onGround && nearMid) {
      this.vy = JUMP; this.onGround = false; this.state = 'jump';
    }

    if (Math.abs(target.x - this.x) < 40 && Math.abs(target.y - this.y) < 30 && this.attackTimer <= 0) {
      this.attackTimer = 0.18; this.state = 'attack';
    }
  }

  applyPhysics(dt, gravity=2000) {
    if (this.iframes > 0) this.iframes -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;

    this.vy += gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.onGround && Math.abs(this.vx) > 1 && this.state !== 'attack') this.state = 'run';
    if (!this.onGround && this.vy > 0 && this.state !== 'attack') this.state = 'fall';
    if (this.onGround && Math.abs(this.vx) <= 1 && this.attackTimer <= 0) this.state = 'idle';
  }

  collideOneWay(platforms) {
    // simple feet check
    const feetY = this.y; // bottom
    this.onGround = false;
    for (const p of platforms) {
      const withinX = this.x >= p.x && this.x <= p.x + p.w;
      const falling = this.vy >= 0;
      const above = feetY <= p.y + 10;
      const crossing = feetY + 4 >= p.y && feetY <= p.y + 20;
      if (withinX && falling && above && crossing) {
        this.y = p.y;
        this.vy = 0;
        this.onGround = true;
        return;
      }
    }
  }

  takeHit(fromDir) {
    if (this.iframes > 0) return;
    this.hp = Math.max(0, this.hp - 1);
    this.iframes = 0.5;
    this.vx = fromDir * 260;
    this.vy = -420;
    this.state = this.hp > 0 ? 'hitstun' : 'dead';
  }

  renderInfo() {
    return {
      id: this.id, x: this.x, y: this.y, facing: this.facing, hp: this.hp, state: this.state,
      sword: { angle: (this.attackTimer > 0 ? 0.35 : 0), x: this.facing === 1 ? 12 : -12, y: -28 },
      hitbox: this.attackTimer > 0 ? this.swordAABB() : null,
      color: this.color
    };
  }
}
