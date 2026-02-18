document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle-enabled');
  const dot = document.getElementById('state-dot');
  const text = document.getElementById('state-text');
  const themeBlack = document.getElementById('theme-black');
  const themeWhite = document.getElementById('theme-white');

  // Load saved state
  chrome.storage.sync.get({ enabled: true, theme: 'black' }, (data) => {
    toggle.checked = data.enabled;
    updateDisplay(data.enabled);
    selectTheme(data.theme);
  });

  // Enable/disable toggle
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.sync.set({ enabled });
    updateDisplay(enabled);
    sendToActiveTab({ type: 'tinycat:toggle', enabled });
  });

  // Theme buttons
  themeBlack.addEventListener('click', () => setTheme('black'));
  themeWhite.addEventListener('click', () => setTheme('white'));

  function setTheme(theme) {
    chrome.storage.sync.set({ theme });
    selectTheme(theme);
    sendToActiveTab({ type: 'tinycat:theme', theme });
  }

  function selectTheme(theme) {
    themeBlack.classList.toggle('selected', theme === 'black');
    themeWhite.classList.toggle('selected', theme === 'white');
  }

  function updateDisplay(enabled) {
    dot.className = 'state-dot' + (enabled ? '' : ' off');
    text.textContent = enabled ? 'Active' : 'Disabled';
  }

  function sendToActiveTab(msg) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, msg);
      }
    });
  }
});
