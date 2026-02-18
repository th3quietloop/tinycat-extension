/**
 * TinyCat Renderer
 *
 * Canvas-based pixel art renderer with per-state sprite animations,
 * CSS motion effects, and DOM overlays (floating Z's, orbiting stars).
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
      this._overlayEl = null;
      this._rafId = null;
      this._stateStartTime = 0;

      // Animation frame tracking
      this._frameIndex = 0;
      this._lastFrameTime = 0;
      this._currentSpriteKey = 'idle';
    }

    get position() {
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

      const overlay = document.createElement('div');
      overlay.id = 'tinycat-overlay';

      const label = document.createElement('div');
      label.id = 'tinycat-label';
      label.textContent = 'idle';

      container.appendChild(canvas);
      container.appendChild(overlay);
      container.appendChild(label);
      document.body.appendChild(container);

      this._canvas = canvas;
      this._ctx = canvas.getContext('2d');
      this._container = container;
      this._labelEl = label;
      this._overlayEl = overlay;

      this._frameIndex = 0;
      this._lastFrameTime = Date.now();
      this._stateStartTime = Date.now();
      this._drawFrame();
      this._updateOverlay();
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
      this._overlayEl = null;
    }

    setTheme(theme) {
      this._theme = theme;
      this._currentSpriteKey = this._getSpriteKey();
      this._drawFrame();
    }

    setState(state) {
      if (state === this._currentState) return;
      this._currentState = state;
      this._stateStartTime = Date.now();
      this._frameIndex = 0;
      this._lastFrameTime = Date.now();
      this._currentSpriteKey = this._getSpriteKey();
      this._drawFrame();
      this._updateOverlay();
      this._labelEl.textContent = stateLabels[state] || state;
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

    // --- Private helpers ---

    _getSpriteKey() {
      const { stateSprites } = window.TinyCat;
      let key = stateSprites[this._currentState];
      if (this._currentState === States.FALLING && this._theme === 'white') {
        key = 'scaredWhite';
      }
      return key;
    }

    _getCurrentSprite() {
      const { sprites } = window.TinyCat;
      return sprites[this._currentSpriteKey] || sprites.idle;
    }

    _getAnimation() {
      const { animations } = window.TinyCat;
      return animations[this._currentSpriteKey] || null;
    }

    /** Draw the base sprite with current animation frame patches applied. */
    _drawFrame() {
      if (!this._ctx) return;

      const { sprites, palettes } = window.TinyCat;
      const sprite = sprites[this._currentSpriteKey] || sprites.idle;
      const palette = palettes[this._theme];
      const anim = this._getAnimation();

      // Resize canvas to sprite dimensions (1 canvas px = 1 grid cell)
      this._canvas.width = sprite.w;
      this._canvas.height = sprite.h;
      this._canvas.style.width = (sprite.w * PIXEL_SCALE) + 'px';
      this._canvas.style.height = (sprite.h * PIXEL_SCALE) + 'px';

      const ctx = this._ctx;
      ctx.clearRect(0, 0, sprite.w, sprite.h);

      // Draw base sprite
      for (let y = 0; y < sprite.h; y++) {
        const row = sprite.rows[y];
        for (let x = 0; x < sprite.w; x++) {
          const code = row[x];
          if (code === '0') continue;
          ctx.fillStyle = palette[parseInt(code)];
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Apply animation frame patches
      if (anim && anim.frames && anim.frames.length > 0) {
        const patches = anim.frames[this._frameIndex % anim.frames.length];
        for (let i = 0; i < patches.length; i++) {
          const p = patches[i];
          if (p.c === '0') {
            ctx.clearRect(p.x, p.y, 1, 1);
          } else {
            ctx.fillStyle = palette[parseInt(p.c)];
            ctx.fillRect(p.x, p.y, 1, 1);
          }
        }
      }
    }

    // --- Overlay management ---

    _updateOverlay() {
      if (!this._overlayEl) return;
      this._overlayEl.innerHTML = '';

      const anim = this._getAnimation();
      if (!anim || !anim.overlay) return;

      if (anim.overlay === 'zzz') {
        this._createZzzOverlay();
      } else if (anim.overlay === 'stars') {
        this._createStarsOverlay();
      }
    }

    _createZzzOverlay() {
      var delays = [0, 0.7, 1.4];
      var sizes = [12, 10, 8];
      for (var i = 0; i < 3; i++) {
        var z = document.createElement('span');
        z.className = 'tinycat-zzz';
        z.textContent = 'z';
        z.style.animationDelay = delays[i] + 's';
        z.style.fontSize = sizes[i] + 'px';
        this._overlayEl.appendChild(z);
      }
    }

    _createStarsOverlay() {
      for (var i = 0; i < 2; i++) {
        var star = document.createElement('span');
        star.className = 'tinycat-star';
        star.textContent = '\u2605';
        star.style.animationDelay = (i * -0.6) + 's';
        this._overlayEl.appendChild(star);
      }
    }

    // --- Animation loop ---

    _animate() {
      var state = this._currentState;
      var elapsed = Date.now() - this._stateStartTime;
      var now = Date.now();

      // Advance sprite animation frame
      var anim = this._getAnimation();
      if (anim && anim.frames && anim.frames.length > 0 && anim.fps > 0) {
        var frameDuration = 1000 / anim.fps;
        if (now - this._lastFrameTime >= frameDuration) {
          this._frameIndex = (this._frameIndex + 1) % anim.frames.length;
          this._lastFrameTime = now;
          this._drawFrame();
        }
      }

      // Lerp position
      this._x += (this._targetX - this._x) * LERP_SPEED;
      this._y += (this._targetY - this._y) * LERP_SPEED;

      // Per-state motion effects
      var extraX = 0;
      var extraY = 0;
      var extraRotation = 0;

      switch (state) {
        case States.IDLE:
          extraY = Math.sin(elapsed / 800) * 2;
          break;
        case States.STRETCHING:
          extraY = Math.sin(elapsed / 500) * 4;
          break;
        case States.DRINKING:
          extraX = Math.sin(elapsed / 400) * 2;
          break;
        case States.POUNCE:
          extraY = -Math.abs(Math.sin(elapsed / 200 * Math.PI)) * 10;
          break;
        case States.STARTLED:
          extraY = -Math.sin(elapsed / 600 * Math.PI) * 30;
          break;
        case States.FALLING:
          extraY = Math.min(elapsed * 0.15, 60);
          extraX = Math.sin(elapsed / 50) * 2;
          extraRotation = Math.sin(elapsed / 200) * 20;
          break;
        case States.GROOMING:
          extraY = Math.sin(elapsed / 300) * 1.5;
          break;
        case States.DIZZY:
          extraY = Math.sin(elapsed / 300) * 8;
          extraRotation = Math.sin(elapsed / 200) * 15;
          break;
        case States.SLEEP:
        case States.ALERT_SLEEP:
          extraY = Math.sin(elapsed / 1500) * 2;
          break;
      }

      this._rotation += (extraRotation - this._rotation) * 0.15;

      this._container.style.transform =
        'translate(' + (this._x + extraX) + 'px, ' + (this._y + extraY) + 'px) rotate(' + this._rotation + 'deg)';

      this._rafId = requestAnimationFrame(this._animate.bind(this));
    }
  }

  window.TinyCat.Renderer = Renderer;
  window.TinyCat.PIXEL_SCALE = PIXEL_SCALE;
})();
