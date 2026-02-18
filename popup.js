document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle-enabled');
  const dot = document.getElementById('state-dot');
  const text = document.getElementById('state-text');

  // Load saved state
  chrome.storage.sync.get({ enabled: true }, (data) => {
    toggle.checked = data.enabled;
    updateDisplay(data.enabled);
  });

  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.sync.set({ enabled });
    updateDisplay(enabled);

    // Notify active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'tinycat:toggle',
          enabled,
        });
      }
    });
  });

  function updateDisplay(enabled) {
    dot.className = 'state-dot' + (enabled ? '' : ' off');
    text.textContent = enabled ? 'Active' : 'Disabled';
  }
});
