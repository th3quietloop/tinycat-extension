/**
 * TinyCat Cursor Tracker
 *
 * Tracks mouse position, computes speed/direction, detects idle periods,
 * fast movements, circular motion, and sharp direction changes.
 * Emits state-machine events via a callback.
 */
(function () {
  'use strict';

  const { Events } = window.TinyCat;

  /** Thresholds (tweakable via settings later) */
  const DEFAULTS = {
    fastSpeedThreshold:    18,   // px per sample — "fast" cursor
    dirChangeAngle:        120,  // degrees — sharp direction reversal
    mediumIdleMs:          8000, // idle before stretching/drinking
    longIdleMs:            30000,// idle before sleep
    nearDistance:           150,  // px — "near the cat"
    awayDistance:           350,  // px — "away from the cat"
    circularSamples:       30,   // samples to detect circular motion
    circularAngleSum:      500,  // cumulative degrees suggesting circles
    fastBurstWindow:       5000, // ms window for repeated-fast detection
    fastBurstCount:        5,    // bursts in window → repeatedFast
    sampleInterval:        1000 / 60, // ~16ms
  };

  class CursorTracker {
    /**
     * @param {Function} emit – called with (eventName) when a trigger fires
     * @param {Function} getCatPos – returns {x, y} of the cat's current position
     */
    constructor(emit, getCatPos) {
      this._emit = emit;
      this._getCatPos = getCatPos;
      this._config = { ...DEFAULTS };

      // Position state
      this.x = window.innerWidth / 2;
      this.y = window.innerHeight / 2;
      this.speed = 0;
      this.angle = 0;

      // Internal tracking
      this._prevX = this.x;
      this._prevY = this.y;
      this._prevAngle = 0;
      this._lastMoveTime = Date.now();
      this._idleEmitted = { medium: false, long: false };
      this._angleSamples = [];
      this._fastBursts = [];

      // Bind handlers
      this._onMouseMove = this._onMouseMove.bind(this);
      this._onClick = this._onClick.bind(this);
      this._tick = this._tick.bind(this);

      this._started = false;
    }

    start() {
      if (this._started) return;
      this._started = true;
      document.addEventListener('mousemove', this._onMouseMove, { passive: true });
      document.addEventListener('click', this._onClick, true);
      this._rafId = requestAnimationFrame(this._tick);
    }

    stop() {
      this._started = false;
      document.removeEventListener('mousemove', this._onMouseMove);
      document.removeEventListener('click', this._onClick, true);
      if (this._rafId) cancelAnimationFrame(this._rafId);
    }

    _onMouseMove(e) {
      this.x = e.clientX;
      this.y = e.clientY;
      this._lastMoveTime = Date.now();
      this._idleEmitted = { medium: false, long: false };
    }

    _onClick() {
      this._emit(Events.CLICK);
    }

    _tick() {
      if (!this._started) return;

      const dx = this.x - this._prevX;
      const dy = this.y - this._prevY;
      this.speed = Math.sqrt(dx * dx + dy * dy);

      if (this.speed > 0.5) {
        this.angle = Math.atan2(dy, dx) * (180 / Math.PI);
        this._checkDirectionChange();
        this._checkSpeed();
        this._trackCircularMotion();
        this._emit(Events.CURSOR_MOVE);
      }

      this._checkIdle();
      this._checkProximity();

      this._prevX = this.x;
      this._prevY = this.y;
      this._prevAngle = this.angle;

      this._rafId = requestAnimationFrame(this._tick);
    }

    _checkSpeed() {
      if (this.speed >= this._config.fastSpeedThreshold) {
        this._emit(Events.CURSOR_FAST);
        this._recordFastBurst();
      }
    }

    _recordFastBurst() {
      const now = Date.now();
      this._fastBursts.push(now);
      // Prune old bursts
      this._fastBursts = this._fastBursts.filter(
        t => now - t < this._config.fastBurstWindow
      );
      if (this._fastBursts.length >= this._config.fastBurstCount) {
        this._emit(Events.REPEATED_FAST);
        this._fastBursts = [];
      }
    }

    _checkDirectionChange() {
      let delta = Math.abs(this.angle - this._prevAngle);
      if (delta > 180) delta = 360 - delta;
      if (delta >= this._config.dirChangeAngle && this.speed > 4) {
        this._emit(Events.DIRECTION_CHANGE);
      }
    }

    _trackCircularMotion() {
      let delta = this.angle - this._prevAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      this._angleSamples.push(delta);

      if (this._angleSamples.length > this._config.circularSamples) {
        this._angleSamples.shift();
      }
      if (this._angleSamples.length === this._config.circularSamples) {
        const sum = this._angleSamples.reduce((a, b) => a + Math.abs(b), 0);
        if (sum >= this._config.circularAngleSum) {
          this._emit(Events.CIRCULAR_MOTION);
          this._angleSamples = [];
        }
      }
    }

    _checkIdle() {
      const elapsed = Date.now() - this._lastMoveTime;

      if (elapsed >= this._config.longIdleMs && !this._idleEmitted.long) {
        this._idleEmitted.long = true;
        this._emit(Events.LONG_IDLE);
      } else if (elapsed >= this._config.mediumIdleMs && !this._idleEmitted.medium) {
        this._idleEmitted.medium = true;
        this._emit(Events.MEDIUM_IDLE);
      }
    }

    _checkProximity() {
      const catPos = this._getCatPos();
      if (!catPos) return;

      const dx = this.x - catPos.x;
      const dy = this.y - catPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this._config.nearDistance) {
        this._emit(Events.NEAR_CURSOR);
      } else if (dist > this._config.awayDistance) {
        this._emit(Events.CURSOR_AWAY);
      }
    }
  }

  window.TinyCat.CursorTracker = CursorTracker;
})();
