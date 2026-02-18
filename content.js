/**
 * TinyCat Content Script — Entry Point
 */
(function () {
  'use strict';

  if (window.__tinyCatLoaded) return;
  window.__tinyCatLoaded = true;

  const cat = new window.TinyCat.Cat();

  // Load settings and start
  chrome.storage.sync.get({ enabled: true, theme: 'black' }, (settings) => {
    if (settings.enabled) {
      cat.start();
      cat.setTheme(settings.theme);
    }
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((msg) => {
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
  });
})();
