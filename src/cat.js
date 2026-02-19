/**
 * TinyCat Controller
 *
 * Wires together the state machine, cursor tracker, and renderer.
 * The cat lives in its corner and does its own thing. It reacts playfully
 * when the cursor comes to it, but never chases the cursor across the screen.
 */
(function () {
  'use strict';

  const { States, Events, StateMachine, CursorTracker, Renderer } = window.TinyCat;

  /** Cat returns to its home corner in these states */
  const HOME_STATES = new Set([
    States.IDLE, States.STRETCHING, States.DRINKING,
    States.GROOMING, States.SLEEP, States.ALERT_SLEEP,
  ]);

  /** Cat freezes in place (no position change) */
  const FREEZE_STATES = new Set([
    States.POUNCE, States.DIZZY, States.STARTLED, States.FALLING,
  ]);

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
        [Events.NEAR_CURSOR]:      1500,
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

    applySettings(settings) {
      if (settings.catSpeed !== undefined) {
        this._renderer.setSpeed(settings.catSpeed);
      }
      if (settings.idleTimeout !== undefined) {
        this._tracker.setIdleTimeout(settings.idleTimeout);
      }
      if (settings.disabledStates !== undefined) {
        this._sm.setDisabledStates(settings.disabledStates);
      }
    }

    _handleEvent(event) {
      // Track cursor proximity for purr visual (bypass cooldowns)
      if (event === Events.NEAR_CURSOR) {
        this._renderer.setCursorNear(true);
      } else if (event === Events.CURSOR_AWAY) {
        this._renderer.setCursorNear(false);
      }

      // Only notice fast cursor movements when nearby
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
      if (FREEZE_STATES.has(state)) {
        // Stay exactly where we are
        var pos = this._renderer.position;
        this._renderer.setTarget(pos.x, pos.y);
      } else if (HOME_STATES.has(state)) {
        this._renderer.goHome();
      }
    }
  }

  window.TinyCat.Cat = Cat;
})();
