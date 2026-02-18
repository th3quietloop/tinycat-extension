/**
 * TinyCat State Machine
 *
 * Pure state machine with no side effects. Accepts events, evaluates
 * transition guards, and returns the next state.
 *
 * States and transitions derived from the TinyCat.pen state diagram.
 */
(function () {
  'use strict';

  const States = Object.freeze({
    IDLE:        'idle',
    STRETCHING:  'stretching',
    DRINKING:    'drinking',
    POUNCE:      'pounce',
    STARTLED:    'startled',
    FALLING:     'falling',
    GROOMING:    'grooming',
    DIZZY:       'dizzy',
    SLEEP:       'sleep',
    ALERT_SLEEP: 'alertSleep',
  });

  const Events = Object.freeze({
    CURSOR_MOVE:       'cursorMove',
    CURSOR_FAST:       'cursorFast',
    CURSOR_IDLE:       'cursorIdle',
    CLICK:             'click',
    DIRECTION_CHANGE:  'directionChange',
    CIRCULAR_MOTION:   'circularMotion',
    LONG_IDLE:         'longIdle',
    MEDIUM_IDLE:       'mediumIdle',
    NEAR_CURSOR:       'nearCursor',
    CURSOR_AWAY:       'cursorAway',
    ANIMATION_DONE:    'animationDone',
    REPEATED_FAST:     'repeatedFast',
  });

  /**
   * Transition table.
   * Each key is a state. Value is an array of { event, target, guard? }.
   * First matching transition wins (order matters for priority).
   */
  const transitions = {
    [States.IDLE]: [
      { event: Events.CLICK,           target: States.STARTLED },
      { event: Events.DIRECTION_CHANGE,target: States.STARTLED },
      { event: Events.CURSOR_FAST,     target: States.POUNCE },
      { event: Events.LONG_IDLE,       target: States.SLEEP },
      { event: Events.MEDIUM_IDLE,     target: States.STRETCHING,
        guard: () => Math.random() < 0.5 },
      { event: Events.MEDIUM_IDLE,     target: States.DRINKING },
    ],

    [States.STRETCHING]: [
      { event: Events.CLICK,           target: States.STARTLED },
      { event: Events.CURSOR_FAST,     target: States.POUNCE },
      { event: Events.ANIMATION_DONE,  target: States.IDLE },
    ],

    [States.DRINKING]: [
      { event: Events.CLICK,           target: States.STARTLED },
      { event: Events.CURSOR_FAST,     target: States.POUNCE },
      { event: Events.ANIMATION_DONE,  target: States.IDLE },
    ],

    [States.POUNCE]: [
      { event: Events.REPEATED_FAST,   target: States.DIZZY },
      { event: Events.ANIMATION_DONE,  target: States.IDLE },
    ],

    [States.STARTLED]: [
      { event: Events.ANIMATION_DONE,  target: States.FALLING },
    ],

    [States.FALLING]: [
      { event: Events.ANIMATION_DONE,  target: States.GROOMING,
        guard: () => Math.random() < 0.6 },
      { event: Events.ANIMATION_DONE,  target: States.IDLE },
    ],

    [States.GROOMING]: [
      { event: Events.CLICK,           target: States.STARTLED },
      { event: Events.ANIMATION_DONE,  target: States.IDLE },
    ],

    [States.DIZZY]: [
      { event: Events.ANIMATION_DONE,  target: States.IDLE },
    ],

    [States.SLEEP]: [
      { event: Events.NEAR_CURSOR,     target: States.ALERT_SLEEP },
      { event: Events.CLICK,           target: States.STARTLED },
    ],

    [States.ALERT_SLEEP]: [
      { event: Events.NEAR_CURSOR,     target: States.IDLE },
      { event: Events.CLICK,           target: States.STARTLED },
      { event: Events.CURSOR_AWAY,     target: States.SLEEP },
      { event: Events.LONG_IDLE,       target: States.SLEEP },
    ],
  };

  /** Duration (ms) each timed state plays before emitting ANIMATION_DONE. */
  const stateDurations = {
    [States.STRETCHING]:  3000,
    [States.DRINKING]:    3500,
    [States.POUNCE]:      800,
    [States.STARTLED]:    600,
    [States.FALLING]:     1000,
    [States.GROOMING]:    4000,
    [States.DIZZY]:       2500,
  };

  class StateMachine {
    constructor() {
      this._state = States.IDLE;
      this._listeners = [];
      this._timer = null;
    }

    get state() {
      return this._state;
    }

    /**
     * Register a callback for state changes.
     * Callback receives (newState, oldState).
     */
    onChange(fn) {
      this._listeners.push(fn);
    }

    /**
     * Send an event to the machine. If a valid transition exists,
     * the state changes and listeners are notified.
     * Returns true if a transition occurred.
     */
    send(event) {
      const candidates = transitions[this._state];
      if (!candidates) return false;

      for (const t of candidates) {
        if (t.event !== event) continue;
        if (t.guard && !t.guard()) continue;

        const oldState = this._state;
        this._state = t.target;
        this._clearTimer();
        this._startTimerIfNeeded();
        this._notify(this._state, oldState);
        return true;
      }
      return false;
    }

    /** Force-set state (for initialization or debugging). */
    reset(state) {
      const old = this._state;
      this._state = state || States.IDLE;
      this._clearTimer();
      this._startTimerIfNeeded();
      if (this._state !== old) {
        this._notify(this._state, old);
      }
    }

    _startTimerIfNeeded() {
      const duration = stateDurations[this._state];
      if (duration) {
        this._timer = setTimeout(() => {
          this.send(Events.ANIMATION_DONE);
        }, duration);
      }
    }

    _clearTimer() {
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }
    }

    _notify(newState, oldState) {
      for (const fn of this._listeners) {
        fn(newState, oldState);
      }
    }
  }

  // Export on shared namespace
  window.TinyCat = window.TinyCat || {};
  window.TinyCat.States = States;
  window.TinyCat.Events = Events;
  window.TinyCat.StateMachine = StateMachine;
  window.TinyCat.stateDurations = stateDurations;
})();
