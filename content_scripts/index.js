(async () => {
  const src = chrome.extension.getURL('content_scripts/main.mjs');
  const contentScript = await import(src);
  contentScript.main();
  window.esmLoaded = true;
})();
