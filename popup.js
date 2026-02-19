document.addEventListener('DOMContentLoaded', function () {
  var DEFAULTS = {
    enabled: true,
    theme: 'black',
    catSpeed: 5,
    idleTimeout: 5,
    disabledStates: [],
  };

  // DOM refs
  var toggle = document.getElementById('toggle-enabled');
  var dot = document.getElementById('state-dot');
  var stateText = document.getElementById('state-text');
  var themeBlack = document.getElementById('theme-black');
  var themeWhite = document.getElementById('theme-white');
  var speedRange = document.getElementById('speed-range');
  var speedVal = document.getElementById('speed-val');
  var idleRange = document.getElementById('idle-range');
  var idleVal = document.getElementById('idle-val');
  var resetBtn = document.getElementById('reset-btn');
  var behaviorCbs = document.querySelectorAll('[data-state]');

  // Load saved settings
  chrome.storage.sync.get(DEFAULTS, function (data) {
    toggle.checked = data.enabled;
    updateDisplay(data.enabled);
    selectTheme(data.theme);
    speedRange.value = data.catSpeed;
    speedVal.textContent = data.catSpeed;
    idleRange.value = data.idleTimeout;
    idleVal.textContent = data.idleTimeout + 's';
    for (var i = 0; i < behaviorCbs.length; i++) {
      behaviorCbs[i].checked = data.disabledStates.indexOf(behaviorCbs[i].dataset.state) === -1;
    }
  });

  // Enable/disable toggle
  toggle.addEventListener('change', function () {
    var enabled = toggle.checked;
    chrome.storage.sync.set({ enabled: enabled });
    updateDisplay(enabled);
    sendToActiveTab({ type: 'tinycat:toggle', enabled: enabled });
  });

  // Theme buttons
  themeBlack.addEventListener('click', function () { setTheme('black'); });
  themeWhite.addEventListener('click', function () { setTheme('white'); });

  // Speed slider
  speedRange.addEventListener('input', function () {
    var val = parseInt(speedRange.value);
    speedVal.textContent = val;
    chrome.storage.sync.set({ catSpeed: val });
    sendSettings();
  });

  // Idle timeout slider
  idleRange.addEventListener('input', function () {
    var val = parseInt(idleRange.value);
    idleVal.textContent = val + 's';
    chrome.storage.sync.set({ idleTimeout: val });
    sendSettings();
  });

  // Behavior toggles
  for (var i = 0; i < behaviorCbs.length; i++) {
    behaviorCbs[i].addEventListener('change', function () {
      var disabled = getDisabledStates();
      chrome.storage.sync.set({ disabledStates: disabled });
      sendSettings();
    });
  }

  // Reset to defaults
  resetBtn.addEventListener('click', function () {
    chrome.storage.sync.set(DEFAULTS);
    toggle.checked = DEFAULTS.enabled;
    updateDisplay(DEFAULTS.enabled);
    selectTheme(DEFAULTS.theme);
    speedRange.value = DEFAULTS.catSpeed;
    speedVal.textContent = DEFAULTS.catSpeed;
    idleRange.value = DEFAULTS.idleTimeout;
    idleVal.textContent = DEFAULTS.idleTimeout + 's';
    for (var j = 0; j < behaviorCbs.length; j++) {
      behaviorCbs[j].checked = true;
    }
    sendToActiveTab({ type: 'tinycat:toggle', enabled: true });
    sendToActiveTab({ type: 'tinycat:theme', theme: 'black' });
    sendSettings();
  });

  function setTheme(theme) {
    chrome.storage.sync.set({ theme: theme });
    selectTheme(theme);
    sendToActiveTab({ type: 'tinycat:theme', theme: theme });
  }

  function selectTheme(theme) {
    themeBlack.classList.toggle('selected', theme === 'black');
    themeWhite.classList.toggle('selected', theme === 'white');
  }

  function updateDisplay(enabled) {
    dot.className = 'state-dot' + (enabled ? '' : ' off');
    stateText.textContent = enabled ? 'Active' : 'Disabled';
  }

  function getDisabledStates() {
    var disabled = [];
    for (var k = 0; k < behaviorCbs.length; k++) {
      if (!behaviorCbs[k].checked) {
        disabled.push(behaviorCbs[k].dataset.state);
      }
    }
    return disabled;
  }

  function sendSettings() {
    sendToActiveTab({
      type: 'tinycat:settings',
      settings: {
        catSpeed: parseInt(speedRange.value),
        idleTimeout: parseInt(idleRange.value),
        disabledStates: getDisabledStates(),
      },
    });
  }

  function sendToActiveTab(msg) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, msg);
      }
    });
  }
});
