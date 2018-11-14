'use strict';

chrome.management.getSelf(extension => {
  if (extension && !extension.enabled) {
    chrome.management.setEnabled(extension.id, true);
  }
});
