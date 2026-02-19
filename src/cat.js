/**
 * TinyCat Controller
 *
 * Wires together the state machine, cursor tracker, and renderer.
 * Decides how each state affects the cat's target position and behavior.
 */
(function () {
  'use strict';

  const { States, Events, StateMachine, CursorTracker, Renderer } = window.TinyCat;

  const CHASE_STATES = new Set([States.POUNCE]);

  const HOME_STATES = new Set([
    States.IDLE, States.STRETCHING, States.DRINKING,
    States.GROOMING, States.SLEEP, States.ALERT_SLEEP,
  ]);

  /** Cat freezes in place (no position change) */
  const FREEZE_STATES = new Set([States.DIZZY]);

  /** Only notice fast cursor within this range (px) */
  const FAST_NOTICE_RANGE = 250;

  class Cat {
    constructor() {
      this._sm = new StateMachine();
      this._renderer = new Renderer();
      this._tracker = new CursorTracker(
        this._handleEvent.bind(this),
        () => this._renderer.position
      );

      this._eventCooldowns = {};
      this._cooldownMs = {
        [Events.CURSOR_FAST]:      2000,
        [Events.NEAR_CURSOR]:      1000,
        [Events.CURSOR_AWAY]:      2000,
        [Events.MEDIUM_IDLE]:      1000,
        [Events.CIRCULAR_MOTION]:  2000,
      };

      this._sm.onChange((newState, oldState) => {
        this._renderer.setState(newState);
        this._onStateEnter(newState, oldState);
      });
    }

    start() {
      this._renderer.mount();
      this._tracker.start();
      this._sm.reset(States.IDLE);
    }

    stop() {
      this._tracker.stop();
      this._renderer.unmount();
    }

    setTheme(theme) {
      this._renderer.setTheme(theme);
    }

    _handleEvent(event) {
      // Only notice fast cursor movements when they're nearby
      if (event === Events.CURSOR_FAST || event === Events.REPEATED_FAST) {
        var catPos = this._renderer.position;
        var dx = this._tracker.x - catPos.x;
        var dy = this._tracker.y - catPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > FAST_NOTICE_RANGE) return;
      }

      var cd = this._cooldownMs[event];
      if (cd) {
        var now = Date.now();
        var last = this._eventCooldowns[event] || 0;
        if (now - last < cd) return;
        this._eventCooldowns[event] = now;
      }

      this._sm.send(event);
    }

    _onStateEnter(state, _oldState) {
      if (CHASE_STATES.has(state)) {
        var offset = 40;
        this._renderer.setTarget(
          this._tracker.x - offset,
          this._tracker.y - offset
        );
      } else if (FREEZE_STATES.has(state)) {
        // Stay exactly where we are — set target to current position
        var pos = this._renderer.position;
        this._renderer.setTarget(pos.x, pos.y);
      } else if (HOME_STATES.has(state)) {
        this._renderer.goHome();
      }
    }
  }

  window.TinyCat.Cat = Cat;
})();
