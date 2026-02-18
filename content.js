/**
 * TinyCat Content Script — Entry Point
 *
 * Boots the cat on every page. Loads settings from chrome.storage
 * and initializes the Cat controller.
 */
(function () {
  'use strict';

  // Avoid double-injection
  if (window.__tinyCatLoaded) return;
  window.__tinyCatLoaded = true;

  const cat = new window.TinyCat.Cat();

  // Check if extension is enabled (default: true)
  chrome.storage.sync.get({ enabled: true }, (settings) => {
    if (settings.enabled) {
      cat.start();
    }
  });

  // Listen for enable/disable messages from popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'tinycat:toggle') {
      if (msg.enabled) {
        cat.start();
      } else {
        cat.stop();
      }
    }
  });
})();
