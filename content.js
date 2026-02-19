/**
 * TinyCat Content Script — Entry Point
 */
(function () {
  'use strict';

  if (window.__tinyCatLoaded) return;
  window.__tinyCatLoaded = true;

  var cat = new window.TinyCat.Cat();

  // Load settings and start
  chrome.storage.sync.get({
    enabled: true,
    theme: 'black',
    catSpeed: 5,
    idleTimeout: 5,
    disabledStates: [],
  }, function (data) {
    if (data.enabled) {
      cat.start();
      cat.setTheme(data.theme);
      cat.applySettings({
        catSpeed: data.catSpeed,
        idleTimeout: data.idleTimeout,
        disabledStates: data.disabledStates,
      });
    }
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === 'tinycat:toggle') {
      if (msg.enabled) {
        cat.start();
      } else {
        cat.stop();
      }
    }
    if (msg.type === 'tinycat:theme') {
      cat.setTheme(msg.theme);
    }
    if (msg.type === 'tinycat:settings') {
      cat.applySettings(msg.settings);
    }
  });
})();
