/**
 * TinyCat Pixel Art Sprites
 *
 * Encoded pixel grids for all 10 cat states, extracted from TinyCat.pen.
 * Each grid cell maps to a color palette index:
 *   0 = transparent
 *   1 = body
 *   2 = accent (inner ear, nose, tongue)
 *   3 = eye (normal)
 *   4 = belly
 *   5 = eye (wide/startled - white)
 *   6 = eye (dizzy - gold)
 *
 * Two color palettes: black cat (for light BGs) and white cat (for dark BGs).
 */
(function () {
  'use strict';

  const palettes = {
    black: {
      1: '#2A2520',
      2: '#F28B82',
      3: '#A8D8A8',
      4: '#3D3835',
      5: '#FFFFFF',
      6: '#FFD700',
    },
    white: {
      1: '#E8E4DE',
      2: '#F28B82',
      3: '#7BC6C6',
      4: '#FFFFFF',
      5: '#FFFFFF',
      6: '#FFD700',
    },
  };

  // Each sprite: { w, h, rows[] }
  // Rows are strings of digit chars; '0' = transparent, '1'-'6' = palette color.
  const sprites = {

    idle: {
      w: 9, h: 11,
      rows: [
        '010000010',
        '012000210',
        '011111110',
        '113111311',
        '111121111',
        '011111110',
        '001111100',
        '011444110',
        '011444110',
        '101111100',
        '001101100',
      ],
    },

    tracking: {
      w: 9, h: 11,
      rows: [
        '010000010',
        '012000210',
        '011111110',
        '111311131',
        '111112111',
        '011111110',
        '001111100',
        '011444110',
        '011444110',
        '101111100',
        '001101100',
      ],
    },

    stalking: {
      w: 12, h: 7,
      rows: [
        '100010000000',
        '120210000000',
        '131310000000',
        '112110000000',
        '011144411100',
        '011111111111',
        '011001100110',
      ],
    },

    pounce: {
      w: 11, h: 8,
      rows: [
        '01001000000',
        '01221000000',
        '13131000000',
        '11211000000',
        '11144411100',
        '01111111001',
        '10000000010',
        '10000000001',
      ],
    },

    startled: {
      w: 11, h: 11,
      rows: [
        '01000000100',
        '01200002100',
        '01111111100',
        '11511151110',
        '11112111110',
        '01111111100',
        '11111111100',
        '11144441110',
        '11144441110',
        '11111111100',
        '01100011000',
      ],
    },

    // Scared/peeking — black cat variant (white wide eyes)
    scared: {
      w: 6, h: 8,
      rows: [
        '010010',
        '020020',
        '111110',
        '151151',
        '111111',
        '111110',
        '110000',
        '110000',
      ],
    },

    // Scared/peeking — white cat variant (normal teal eyes)
    scaredWhite: {
      w: 6, h: 8,
      rows: [
        '010010',
        '020020',
        '111110',
        '131131',
        '111111',
        '111110',
        '110000',
        '110000',
      ],
    },

    grooming: {
      w: 10, h: 10,
      rows: [
        '0100001000',
        '0120021000',
        '0111111000',
        '1111111000',
        '1112111010',
        '0111111020',
        '0114441100',
        '0114441110',
        '1011111100',
        '0011001100',
      ],
    },

    dizzy: {
      w: 9, h: 11,
      rows: [
        '010000010',
        '012000210',
        '011111110',
        '116111611',
        '111121111',
        '011111110',
        '001111100',
        '011444110',
        '011444110',
        '101111100',
        '001101100',
      ],
    },

    sleep: {
      w: 11, h: 7,
      rows: [
        '10001000000',
        '11111000000',
        '11111100000',
        '11114444110',
        '11114444111',
        '01111111110',
        '01100001100',
      ],
    },

    alert: {
      w: 9, h: 11,
      rows: [
        '010000010',
        '012000210',
        '011111110',
        '113111311',
        '111121111',
        '011111110',
        '011111100',
        '011444110',
        '011444110',
        '011111100',
        '001101100',
      ],
    },

  };

  /** Maps state machine state names to sprite keys. */
  const stateSprites = {
    idle:       'idle',
    stretching: 'tracking',
    drinking:   'stalking',
    pounce:     'pounce',
    startled:   'startled',
    falling:    'scared',
    grooming:   'grooming',
    dizzy:      'dizzy',
    sleep:      'sleep',
    alertSleep: 'alert',
  };

  /**
   * Per-sprite animation configs. Each entry defines:
   *   fps     — frame advance rate
   *   frames  — array of patch arrays; each patch is {x, y, c} overriding the
   *             base sprite pixel at (x,y) with palette code c ('0' = clear)
   *   overlay — optional 'zzz' or 'stars' DOM overlay effect
   *
   * null = no sprite animation (CSS motion only).
   */
  const animations = {

    // Breathing blink — eyes close on frame 3
    idle: {
      fps: 1.5,
      frames: [
        [],
        [],
        [],
        [{ x: 2, y: 3, c: '1' }, { x: 6, y: 3, c: '1' }],
      ],
    },

    // Eyes scan right → center → blink while stretching
    tracking: {
      fps: 1.2,
      frames: [
        [],
        [{ x: 3, y: 3, c: '1' }, { x: 7, y: 3, c: '1' }, { x: 2, y: 3, c: '3' }, { x: 6, y: 3, c: '3' }],
        [{ x: 3, y: 3, c: '1' }, { x: 7, y: 3, c: '1' }, { x: 2, y: 3, c: '3' }, { x: 6, y: 3, c: '3' }],
        [{ x: 3, y: 3, c: '1' }, { x: 7, y: 3, c: '1' }],
        [],
        [],
      ],
    },

    // Slow blink while crouched
    stalking: {
      fps: 1.5,
      frames: [
        [],
        [],
        [],
        [{ x: 1, y: 2, c: '1' }, { x: 3, y: 2, c: '1' }],
      ],
    },

    // Quick squint mid-lunge
    pounce: {
      fps: 3,
      frames: [
        [],
        [{ x: 1, y: 2, c: '1' }, { x: 3, y: 2, c: '1' }],
        [],
      ],
    },

    // Too short for sprite frames — CSS jump only
    startled: null,

    // Nervous blink while peeking (black cat — wide white eyes)
    scared: {
      fps: 2,
      frames: [
        [],
        [{ x: 1, y: 3, c: '1' }, { x: 4, y: 3, c: '1' }],
        [],
      ],
    },

    // Nervous blink while peeking (white cat — teal eyes)
    scaredWhite: {
      fps: 2,
      frames: [
        [],
        [{ x: 1, y: 3, c: '1' }, { x: 4, y: 3, c: '1' }],
        [],
      ],
    },

    // Tongue lick cycle — tongue moves up to paw and back
    grooming: {
      fps: 2,
      frames: [
        [],
        [{ x: 8, y: 5, c: '0' }, { x: 8, y: 4, c: '2' }],
        [{ x: 8, y: 5, c: '0' }, { x: 8, y: 4, c: '2' }],
        [],
      ],
    },

    // Dizzy eyes cross inward + orbiting stars
    dizzy: {
      fps: 2.5,
      overlay: 'stars',
      frames: [
        [],
        [{ x: 2, y: 3, c: '1' }, { x: 6, y: 3, c: '1' }, { x: 3, y: 3, c: '6' }, { x: 5, y: 3, c: '6' }],
        [],
        [{ x: 2, y: 3, c: '1' }, { x: 6, y: 3, c: '1' }, { x: 3, y: 3, c: '6' }, { x: 5, y: 3, c: '6' }],
      ],
    },

    // Ear twitch + floating Z's
    sleep: {
      fps: 0.8,
      overlay: 'zzz',
      frames: [
        [],
        [{ x: 0, y: 0, c: '0' }],
        [],
      ],
    },

    // Drowsy eye open/close cycle + floating Z's
    alert: {
      fps: 1,
      overlay: 'zzz',
      frames: [
        [],
        [],
        [{ x: 2, y: 3, c: '1' }, { x: 6, y: 3, c: '1' }],
        [{ x: 2, y: 3, c: '1' }, { x: 6, y: 3, c: '1' }],
        [{ x: 2, y: 3, c: '1' }, { x: 6, y: 3, c: '1' }],
        [],
      ],
    },

  };

  window.TinyCat = window.TinyCat || {};
  window.TinyCat.palettes = palettes;
  window.TinyCat.sprites = sprites;
  window.TinyCat.stateSprites = stateSprites;
  window.TinyCat.animations = animations;
})();
