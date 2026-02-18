/**
 * TinyCat Renderer
 *
 * Renders the cat as a colored placeholder shape on screen.
 * Each state has a distinct color and shape. The cat smoothly
 * interpolates toward its target position.
 */
(function () {
  'use strict';

  const { States } = window.TinyCat;

  /** Visual config per state: color, size, label, shape adjustments */
  const stateVisuals = {
    [States.IDLE]:        { color: '#F5A623', label: 'idle',       scale: 1.0 },
    [States.STRETCHING]:  { color: '#F5C469', label: 'stretch',    scale: 1.0, scaleX: 1.3, scaleY: 0.75 },
    [States.DRINKING]:    { color: '#69B5F5', label: 'drink',      scale: 0.9 },
    [States.POUNCE]:      { color: '#FFD700', label: 'pounce!',    scale: 1.3 },
    [States.STARTLED]:    { color: '#FF6B6B', label: '!!',         scale: 1.4 },
    [States.FALLING]:     { color: '#FF4444', label: 'whoa',       scale: 1.1 },
    [States.GROOMING]:    { color: '#C9A0DC', label: 'groom',      scale: 0.95 },
    [States.DIZZY]:       { color: '#FFEE58', label: '@_@',        scale: 1.1 },
    [States.SLEEP]:       { color: '#9C9B99', label: 'zzz',        scale: 0.85 },
    [States.ALERT_SLEEP]: { color: '#B8B7B5', label: 'z..?',       scale: 0.9 },
  };

  const CAT_SIZE = 48;
  const LERP_SPEED = 0.08;

  class Renderer {
    constructor() {
      this._currentState = States.IDLE;
      // Start near bottom-right
      this._x = window.innerWidth - 120;
      this._y = window.innerHeight - 100;
      this._targetX = this._x;
      this._targetY = this._y;
      this._homeX = this._x;
      this._homeY = this._y;
      this._rotation = 0;
      this._targetRotation = 0;

      this._el = null;
      this._labelEl = null;
      this._earL = null;
      this._earR = null;
      this._eyeL = null;
      this._eyeR = null;
      this._rafId = null;
      this._stateStartTime = 0;
    }

    get position() {
      return { x: this._x + CAT_SIZE / 2, y: this._y + CAT_SIZE / 2 };
    }

    mount() {
      // Guard against double-mount
      if (this._container) return;

      // Container
      const container = document.createElement('div');
      container.id = 'tinycat-container';

      // Cat body
      const el = document.createElement('div');
      el.id = 'tinycat-body';

      // Ears
      this._earL = document.createElement('div');
      this._earL.className = 'tinycat-ear tinycat-ear-l';
      this._earR = document.createElement('div');
      this._earR.className = 'tinycat-ear tinycat-ear-r';
      el.appendChild(this._earL);
      el.appendChild(this._earR);

      // Eyes
      const face = document.createElement('div');
      face.className = 'tinycat-face';
      this._eyeL = document.createElement('div');
      this._eyeL.className = 'tinycat-eye';
      this._eyeR = document.createElement('div');
      this._eyeR.className = 'tinycat-eye';
      face.appendChild(this._eyeL);
      face.appendChild(this._eyeR);
      el.appendChild(face);

      // State label (debug)
      const label = document.createElement('div');
      label.id = 'tinycat-label';
      label.textContent = 'idle';

      container.appendChild(el);
      container.appendChild(label);
      document.body.appendChild(container);

      this._el = el;
      this._container = container;
      this._labelEl = label;

      this._applyVisuals(States.IDLE);
      this._stateStartTime = Date.now();
      this._rafId = requestAnimationFrame(this._animate.bind(this));
    }

    unmount() {
      if (this._rafId) cancelAnimationFrame(this._rafId);
      if (this._container && this._container.parentNode) {
        this._container.parentNode.removeChild(this._container);
      }
      this._container = null;
      this._el = null;
    }

    setState(state) {
      if (state === this._currentState) return;
      this._currentState = state;
      this._stateStartTime = Date.now();
      this._applyVisuals(state);
    }

    /** Set where the cat should move toward. */
    setTarget(x, y) {
      this._targetX = x - CAT_SIZE / 2;
      this._targetY = y - CAT_SIZE / 2;
    }

    /** Move target back to home/rest position. */
    goHome() {
      this._targetX = this._homeX;
      this._targetY = this._homeY;
    }

    _applyVisuals(state) {
      const v = stateVisuals[state] || stateVisuals[States.IDLE];
      this._el.style.backgroundColor = v.color;
      this._el.style.setProperty('--cat-color', v.color);
      this._labelEl.textContent = v.label;

      const sx = (v.scaleX || 1) * v.scale;
      const sy = (v.scaleY || 1) * v.scale;
      this._el.style.setProperty('--cat-sx', sx);
      this._el.style.setProperty('--cat-sy', sy);
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
          // Jump up
          extraY = -Math.sin(elapsed / 600 * Math.PI) * 30;
          break;
        case States.FALLING:
          // Fall down with tumble
          extraY = Math.min(elapsed * 0.15, 60);
          extraRotation = Math.sin(elapsed / 200) * 20;
          break;
        case States.DIZZY:
          // Wobble
          extraY = Math.sin(elapsed / 300) * 8;
          extraRotation = Math.sin(elapsed / 200) * 15;
          break;
        case States.POUNCE:
          // Bounce on arrival
          extraY = -Math.abs(Math.sin(elapsed / 200 * Math.PI)) * 10;
          break;
        case States.SLEEP:
        case States.ALERT_SLEEP:
          // Gentle breathing
          extraY = Math.sin(elapsed / 1500) * 2;
          break;
        case States.STRETCHING:
          // Stretch pulse
          extraY = Math.sin(elapsed / 500) * 4;
          break;
      }

      // Apply transform
      this._rotation += (extraRotation - this._rotation) * 0.15;
      const sx = this._el.style.getPropertyValue('--cat-sx') || 1;
      const sy = this._el.style.getPropertyValue('--cat-sy') || 1;

      this._container.style.transform =
        `translate(${this._x}px, ${this._y + extraY}px) rotate(${this._rotation}deg)`;
      this._el.style.transform = `scale(${sx}, ${sy})`;

      // Eye tracking — look toward cursor center
      this._updateEyes();

      this._rafId = requestAnimationFrame(this._animate.bind(this));
    }

    _updateEyes() {
      // Eyes point toward the cursor direction relative to cat center
      if (!this._cursorX) return;
      const cx = this._x + CAT_SIZE / 2;
      const cy = this._y + CAT_SIZE / 2;
      const dx = (this._cursorX - cx);
      const dy = (this._cursorY - cy);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) return;

      const maxOffset = 3;
      const ox = (dx / dist) * maxOffset;
      const oy = (dy / dist) * maxOffset;

      const isSleeping = this._currentState === States.SLEEP;
      const pupilStyle = `translate(${isSleeping ? 0 : ox}px, ${isSleeping ? 0 : oy}px)`;
      this._eyeL.style.setProperty('--pupil-x', `${isSleeping ? 0 : ox}px`);
      this._eyeL.style.setProperty('--pupil-y', `${isSleeping ? 0 : oy}px`);
      this._eyeR.style.setProperty('--pupil-x', `${isSleeping ? 0 : ox}px`);
      this._eyeR.style.setProperty('--pupil-y', `${isSleeping ? 0 : oy}px`);

      // Squint when sleeping
      const scaleY = isSleeping ? 0.15 : 1;
      this._eyeL.style.setProperty('--eye-squint', scaleY);
      this._eyeR.style.setProperty('--eye-squint', scaleY);
    }

    /** Called by Cat controller to pass cursor position for eye tracking */
    setCursorPos(x, y) {
      this._cursorX = x;
      this._cursorY = y;
    }
  }

  window.TinyCat.Renderer = Renderer;
  window.TinyCat.CAT_SIZE = CAT_SIZE;
})();
