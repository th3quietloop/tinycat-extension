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
        [Events.CURSOR_FAST]:      500,
        [Events.DIRECTION_CHANGE]: 800,
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
      const cd = this._cooldownMs[event];
      if (cd) {
        const now = Date.now();
        const last = this._eventCooldowns[event] || 0;
        if (now - last < cd) return;
        this._eventCooldowns[event] = now;
      }

      this._sm.send(event);
    }

    _onStateEnter(state, _oldState) {
      if (CHASE_STATES.has(state)) {
        const offset = 40;
        this._renderer.setTarget(
          this._tracker.x - offset,
          this._tracker.y - offset
        );
      } else if (HOME_STATES.has(state)) {
        this._renderer.goHome();
      }
    }
  }

  window.TinyCat.Cat = Cat;
})();
