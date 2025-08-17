export class Input {
  constructor() {
    this.down = new Set();
    window.addEventListener('keydown', e => this.down.add(e.code));
    window.addEventListener('keyup',   e => this.down.delete(e.code));
  }
  get left()  { return this.down.has('ArrowLeft')  || this.down.has('KeyA'); }
  get right() { return this.down.has('ArrowRight') || this.down.has('KeyD'); }
  get up()    { return this.down.has('ArrowUp')    || this.down.has('KeyW'); }
  get stab()  { return this.down.has('Space'); }
  get reset() { return this.down.has('KeyR'); }
}
