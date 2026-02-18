/**
 * TinyCat Renderer
 *
 * Canvas-based pixel art renderer. Draws sprites at 1:1 on a tiny canvas
 * and uses CSS scaling with image-rendering: pixelated for crisp results.
 */
(function () {
  'use strict';

  const { States } = window.TinyCat;

  const PIXEL_SCALE = 5;  // CSS pixels per sprite pixel
  const LERP_SPEED = 0.08;

  /** State labels shown below the cat */
  const stateLabels = {
    [States.IDLE]:        'idle',
    [States.STRETCHING]:  'stretch',
    [States.DRINKING]:    'drink',
    [States.POUNCE]:      'pounce!',
    [States.STARTLED]:    '!!',
    [States.FALLING]:     'whoa',
    [States.GROOMING]:    'groom',
    [States.DIZZY]:       '@_@',
    [States.SLEEP]:       'zzz',
    [States.ALERT_SLEEP]: 'z..?',
  };

  class Renderer {
    constructor() {
      this._currentState = States.IDLE;
      this._theme = 'black';

      // Start near bottom-right
      this._x = window.innerWidth - 120;
      this._y = window.innerHeight - 100;
      this._targetX = this._x;
      this._targetY = this._y;
      this._homeX = this._x;
      this._homeY = this._y;
      this._rotation = 0;

      this._canvas = null;
      this._ctx = null;
      this._container = null;
      this._labelEl = null;
      this._rafId = null;
      this._stateStartTime = 0;
    }

    get position() {
      // Approximate center of current sprite
      const sprite = this._getCurrentSprite();
      const hw = sprite ? (sprite.w * PIXEL_SCALE) / 2 : 24;
      const hh = sprite ? (sprite.h * PIXEL_SCALE) / 2 : 24;
      return { x: this._x + hw, y: this._y + hh };
    }

    mount() {
      if (this._container) return;

      const container = document.createElement('div');
      container.id = 'tinycat-container';

      const canvas = document.createElement('canvas');
      canvas.id = 'tinycat-canvas';

      const label = document.createElement('div');
      label.id = 'tinycat-label';
      label.textContent = 'idle';

      container.appendChild(canvas);
      container.appendChild(label);
      document.body.appendChild(container);

      this._canvas = canvas;
      this._ctx = canvas.getContext('2d');
      this._container = container;
      this._labelEl = label;

      this._drawSprite(States.IDLE);
      this._stateStartTime = Date.now();
      this._rafId = requestAnimationFrame(this._animate.bind(this));
    }

    unmount() {
      if (this._rafId) cancelAnimationFrame(this._rafId);
      if (this._container && this._container.parentNode) {
        this._container.parentNode.removeChild(this._container);
      }
      this._container = null;
      this._canvas = null;
      this._ctx = null;
    }

    setTheme(theme) {
      this._theme = theme;
      this._drawSprite(this._currentState);
    }

    setState(state) {
      if (state === this._currentState) return;
      this._currentState = state;
      this._stateStartTime = Date.now();
      this._drawSprite(state);
    }

    setTarget(x, y) {
      const sprite = this._getCurrentSprite();
      const hw = sprite ? (sprite.w * PIXEL_SCALE) / 2 : 24;
      const hh = sprite ? (sprite.h * PIXEL_SCALE) / 2 : 24;
      this._targetX = x - hw;
      this._targetY = y - hh;
    }

    goHome() {
      this._targetX = this._homeX;
      this._targetY = this._homeY;
    }

    _getCurrentSprite() {
      const { sprites, stateSprites } = window.TinyCat;
      let key = stateSprites[this._currentState];
      if (this._currentState === States.FALLING && this._theme === 'white') {
        key = 'scaredWhite';
      }
      return sprites[key] || sprites.idle;
    }

    _drawSprite(state) {
      if (!this._ctx) return;

      const { sprites, stateSprites, palettes } = window.TinyCat;

      let spriteKey = stateSprites[state];
      // White cat scared state uses normal eyes instead of startled white
      if (state === States.FALLING && this._theme === 'white') {
        spriteKey = 'scaredWhite';
      }

      const sprite = sprites[spriteKey] || sprites.idle;
      const palette = palettes[this._theme];

      // Resize canvas to sprite dimensions (1 canvas pixel = 1 grid cell)
      this._canvas.width = sprite.w;
      this._canvas.height = sprite.h;
      this._canvas.style.width = (sprite.w * PIXEL_SCALE) + 'px';
      this._canvas.style.height = (sprite.h * PIXEL_SCALE) + 'px';

      const ctx = this._ctx;
      ctx.clearRect(0, 0, sprite.w, sprite.h);

      for (let y = 0; y < sprite.h; y++) {
        const row = sprite.rows[y];
        for (let x = 0; x < sprite.w; x++) {
          const code = row[x];
          if (code === '0') continue;
          ctx.fillStyle = palette[parseInt(code)];
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Update label
      this._labelEl.textContent = stateLabels[state] || state;
    }

    _animate() {
      const state = this._currentState;
      const elapsed = Date.now() - this._stateStartTime;

      // Lerp position
      this._x += (this._targetX - this._x) * LERP_SPEED;
      this._y += (this._targetY - this._y) * LERP_SPEED;

      // Per-state motion effects
      let extraY = 0;
      let extraRotation = 0;

      switch (state) {
        case States.STARTLED:
          extraY = -Math.sin(elapsed / 600 * Math.PI) * 30;
          break;
        case States.FALLING:
          extraY = Math.min(elapsed * 0.15, 60);
          extraRotation = Math.sin(elapsed / 200) * 20;
          break;
        case States.DIZZY:
          extraY = Math.sin(elapsed / 300) * 8;
          extraRotation = Math.sin(elapsed / 200) * 15;
          break;
        case States.POUNCE:
          extraY = -Math.abs(Math.sin(elapsed / 200 * Math.PI)) * 10;
          break;
        case States.SLEEP:
        case States.ALERT_SLEEP:
          extraY = Math.sin(elapsed / 1500) * 2;
          break;
        case States.STRETCHING:
          extraY = Math.sin(elapsed / 500) * 4;
          break;
      }

      this._rotation += (extraRotation - this._rotation) * 0.15;

      this._container.style.transform =
        `translate(${this._x}px, ${this._y + extraY}px) rotate(${this._rotation}deg)`;

      this._rafId = requestAnimationFrame(this._animate.bind(this));
    }
  }

  window.TinyCat.Renderer = Renderer;
  window.TinyCat.PIXEL_SCALE = PIXEL_SCALE;
})();
