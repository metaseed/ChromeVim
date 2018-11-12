// setup long-lived connection
export const port = chrome.extension.connect({ name: 'main' });
port.onDisconnect.addListener(function() {
  window.portDestroyed = true;
  chrome.runtime.sendMessage = function() {};
  chrome.runtime.connect = function() {};
  Command.hide();
  removeListeners();
  Visual.exit();
  Find.clear();
  Command.destroy();
});

const _wrapper = function(FN, caller) {
  return function(action, args, callback) {
    if (typeof args === 'function') {
      callback = args;
      args = {};
    }
    (args = args || {}).action = action;
    FN.call(caller, args, typeof callback === 'function' ? callback : void 0);
  };
};
export const RUNTIME = _wrapper(chrome.runtime.sendMessage, chrome.runtime);
export const PORT = _wrapper(port.postMessage, port);
export const ECHO = function(action, args, callback) {
  args.action = 'echoRequest';
  args.call = action;
  port.postMessage(args, typeof callback === 'function' ? callback : void 0);
};

window.RUNTIME = RUNTIME;
window.PORT = PORT;
window.ECHO = ECHO;
