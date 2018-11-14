import { defaultMappings, defaultInsertMappings } from './mappings-default.mjs';
import { mappingsActions } from './mappings-actions.mjs';

var insertMappings = new Trie(),
  mappingTrie = new Trie(),
  currentTrieNode = mappingTrie;

export const Mappings = {
  repeats: '',
  queue: '',
  lastCommand: {
    fn: '',
    queue: '',
    repeatStr: '',
    repeats: 1
  }
};
window.Mappings = Mappings;
window.currentTrieNode = currentTrieNode;

Mappings.defaults = defaultMappings;

Mappings.defaultsClone = Object.clone(Mappings.defaults);

Mappings.actions = mappingsActions;

Mappings.insertDefaults = defaultInsertMappings;

Mappings.insertFunctions = (function() {
  var selection = document.getSelection();

  function modify() {
    if (arguments.length === 3) {
      selection.modify.apply(selection, arguments);
      return;
    }
    selection.modify
      .bind(selection, selection.type === 'Range' ? 'extend' : 'move')
      .apply(null, arguments);
  }

  function deleteSelection() {
    if (selection.type === 'Range' && selection.toString().length !== 0) {
      document.execCommand('delete', false, 0);
      return true;
    }
    return false;
  }
  // window.element = null;
  return {
    __setElement__: function(e) {
      element = e;
    },
    __getElement__: function() {
      return element;
    },
    editWithVim: function() {
      var value = element.value || element.innerHTML;
      var text = value.substr(0, element.selectionStart);
      var line = 1 + text.replace(/[^\n]/g, '').length;
      var column = 1 + text.replace(/[^]*\n/, '').length;
      var __ = window._;
      var mid = __.uniqueId('mouseless');
      $(element).addClass(mid);
      PORT('editWithVim', {
        text: value,
        line: line,
        column: column,
        elementId: mid
      });
    },
    forwardChar: modify.bind(null, 'right', 'character'),
    backwardChar: modify.bind(null, 'left', 'character'),
    backwardWord: function() {
      if (element.value !== void 0) {
        var text = element.value
          .split('')
          .reverse()
          .join('');
        var len = text.length;
        var start = len - element.selectionStart;
        var end = text.slice(start).match(/[\s\n]*[a-zA-Z_0-9]+|(\n|[^a-zA-Z_0-9])+/);
        end = start + (end ? end[0].length : 0);
        element.selectionStart = len - end;
        element.selectionEnd = len - end;
        return;
      }
      modify('left', 'word');
    },
    forwardWord: function() {
      if (element.value !== void 0) {
        var start = element.selectionStart;
        var end = element.value.slice(start).match(/[a-zA-Z_0-9]+[\s\n]*|(\n|[^a-zA-Z_0-9])+/);
        end = start + (end ? end[0].length : 0);
        element.selectionStart = end;
        element.selectionEnd = end;
        return;
      }
      modify('right', 'word');
    },
    deleteToBeginning: function() {
      modify('extend', 'left', 'lineboundary');
      if (!deleteSelection()) {
        modify('extend', 'left', 'character');
        deleteSelection();
      }
    },
    deleteToEnd: function() {
      modify('extend', 'right', 'lineboundary');
      deleteSelection();
      modify('move', 'right', 'lineboundary');
    },
    beginningOfLine: function() {
      modify('left', 'lineboundary');
    },
    beginningOfLineOrSelectAll: function() {
      var selection = function() {
        var s = [element.selectionStart, element.selectionEnd];
        return {
          start: Math.min.apply(null, s),
          end: Math.max.apply(null, s)
        };
      };
      var s = selection();
      this.beginningOfLine();
      if (s.start === selection().start) {
        this.selectAll();
      }
      if (s.end === selection().end) {
        this.beginningOfLine();
      }
    },
    endOfLine: function() {
      modify('right', 'lineboundary');
    },
    deleteWord: function() {
      modify('extend', 'left', 'word');
      deleteSelection();
    },
    deleteForwardWord: function() {
      if (element.value !== void 0) {
        var start = element.selectionStart;
        var end = element.value.slice(start).match(/[a-zA-Z_0-9]+[\s\n]*|(\n|[^a-zA-Z_0-9])\1*/);
        end = start + (end ? end[0].length : 0);
        element.selectionStart = start;
        element.selectionEnd = end;
      } else {
        modify('extend', 'right', 'word');
      }
      deleteSelection();
    },
    deleteChar: function() {
      modify('extend', 'left', 'character');
      deleteSelection();
    },
    deleteForwardChar: function() {
      modify('extend', 'right', 'character');
      deleteSelection();
    },
    forwardLine: function() {
      modify('move', 'right', 'line');
    },
    backwardLine: function() {
      modify('move', 'left', 'line');
    },
    selectAll: function() {
      if (element.select) {
        element.select();
      }
    }
  };
})();

Mappings.insertCommand = function(modifier, callback) {
  var value = insertMappings.findValue(this.splitMapping(modifier));
  if (value) {
    callback(true);
    if (this.insertFunctions[value]) {
      this.insertFunctions.__setElement__(document.activeElement);
      this.insertFunctions[value]();
    } else if (this.actions[value]) {
      this.actions[value]();
    }
  }
};

Mappings.splitMapping = function(string) {
  var blocks = [].slice.call(string.match(/<[^>]+>/g) || []);
  var split = [];
  for (var i = 0; i < string.length; i++) {
    if (string.slice(i).indexOf(blocks[0]) === 0) {
      i += blocks[0].length - 1;
      split.push(blocks.shift());
    } else {
      split.push(string.charAt(i));
    }
  }
  return split;
};

Mappings.parseLine = function(line) {
  var map = Utils.compressArray(line.split(/ +/));
  if (map.length) {
    switch (map[0]) {
      case 'unmapAll':
        mappingTrie.children = {};
        return;
      case 'iunmapAll':
        insertMappings.children = {};
        return;
      case 'map':
      case 'remap':
        if (map[1] === map[2]) {
          return;
        }
        map[1] = map[1].replace(/<leader>/gi, settings.mapleader);
        mappingTrie.removeByKey(this.splitMapping(map[1]));
        mappingTrie.insert(this.splitMapping(map[1]), map.slice(2).join(' '));
        return;
      case 'imap':
      case 'iremap':
        if (map[1] === map[2]) {
          return;
        }
        insertMappings.removeByKey(map[1]);
        return insertMappings.insert(
          this.splitMapping(map[1]),
          insertMappings.findValue(this.splitMapping(map[2])) ||
            map
              .slice(2)
              .join(' ')
              .replace(/\s+".*/, '')
        );
      case 'iunmap':
        map.slice(1).forEach(
          function(unmap) {
            insertMappings.removeByKey(this.splitMapping(unmap));
          }.bind(this)
        );
        return;
      case 'unmap':
        map.slice(1).forEach(
          function(unmap) {
            mappingTrie.removeRecursiveByKey(this.splitMapping(unmap));
          }.bind(this)
        );
        return;
      case 'call':
        waitForLoad(function() {
          map = Utils.trim(map.slice(1).join(' '));
          if (map[0] === ':') {
            Command.execute(map.slice(1).replace(/<CR>/i, ''), 1);
          } else if (Mappings.actions[map]) {
            ECHO('callMapFunction', {
              name: map
            });
          } else {
            ECHO('eval', {
              name: map.replace(/\(.*/, ''),
              args: map.replace(/[^(]+/, '') || '()'
            });
          }
        });
        break;
    }
  }
};

Mappings.parseCustom = function(config, updateSiteMappings) {
  this.defaults.forEach(function(e) {
    mappingTrie.insert(Mappings.splitMapping(e[0]), e[1]);
  });
  this.insertDefaults.forEach(function(e) {
    insertMappings.insert(Mappings.splitMapping(e[0]), e[1]);
  });
  Utils.split(config, '\n').forEach(function(e) {
    Mappings.parseLine(e);
  });

  if (updateSiteMappings && settings.sites) {
    for (var key in settings.sites) {
      if (matchLocation(document.URL, key)) {
        Command.addSettingBlock(settings.sites[key]);
      }
    }
  }
};

Mappings.executeSequence = function(c, r) {
  if (!c.length) {
    return;
  }
  if (/^\d+/.test(c)) {
    r = c.match(/^\d+/)[0];
    c = c.replace(/^\d+/, '');
    this.repeats = r;
    if (!c.length) {
      return;
    }
  }
  var com = c[0];
  this.queue += com;
  this.queue = this.queue.slice(0, -1);
  if (Hints.active) {
    Hints.handleHint(com);
  } else if (Visual.caretModeActive || Visual.visualModeActive) {
    Visual.action(com);
  } else {
    this.convertToAction(com);
  }
  if (!commandMode && !DOM.isEditable(document.activeElement)) {
    setTimeout(function() {
      Mappings.executeSequence(c.substring(1), r);
    });
  } else {
    setTimeout(function() {
      document.activeElement.value += c.substring(1);
    });
  }
};

Mappings.handleEscapeKey = function() {
  this.queue = '';
  this.repeats = '';
  currentTrieNode = mappingTrie;

  if (commandMode) {
    if (Command.type === 'search') {
      PORT('cancelIncSearch', {
        search: Command.input.value
      });
    }
    Command.hideData();
    Command.hide();
    return;
  }

  // TODO(hbt) ENHANCE review where else Dom.isEditable is used + if it has similar bugs as #61
  if (document.activeElement) {
    document.activeElement.blur();
    this.actions.inputFocused = false;
  }
  if (DOM.isEditable(document.activeElement)) {
    if (document.getSelection().type === 'Range') {
      document.getSelection().collapseToEnd();
      return;
    }
    this.actions.inputFocused = false;
    document.activeElement.blur();
    return;
  }

  if (Hints.active) {
    return Hints.hideHints(false, false);
  }

  if (insertMode) {
    insertMode = false;
    HUD.hide();
    return;
  }

  if (Hints.lastHover) {
    DOM.mouseEvent('unhover', Hints.lastHover);
    Hints.lastHover = null;
    return;
  }

  if (Find.matches.length) {
    Find.clear();
    document.activeElement.blur();
    HUD.hide();
    return;
  }

  // default Chrome behavior (#248)
  window.stop();
};

Mappings.nonRepeatableCommands = [];

Mappings.clearQueue = function() {
  currentTrieNode = mappingTrie;
  this.queue = this.repeats = '';
  this.validMatch = false;
};

Mappings.shouldPrevent = function(key) {
  if (key === '<Esc>' || key === '<C-[>' || Hints.active) {
    return true;
  }
  if (
    /^[0-9]$/.test(key) &&
    !(currentTrieNode.hasKey(key) && this.repeats === '') &&
    !(key === '0' && this.repeats === '')
  ) {
    return true;
  }
  if (!currentTrieNode.hasKey(key)) {
    if (currentTrieNode.getKey('*')) {
      return true;
    }
  } else {
    return true;
  }
  return false;
};

Mappings.convertToAction = function(key) {
  if (key === '<Esc>' || key === '<C-[>') {
    this.handleEscapeKey();
    return false;
  }
  if (Hints.active) {
    Hints.handleHint(key);
    return true;
  }

  if (
    /^[0-9]$/.test(key) &&
    !(currentTrieNode.hasKey(key) && this.repeats === '') &&
    !(key === '0' && this.repeats === '')
  ) {
    this.repeats += key;
    return;
  }

  this.queue += key;
  if (!currentTrieNode.hasKey(key)) {
    if (currentTrieNode.getKey('*')) {
      currentTrieNode = currentTrieNode.getKey('*');
    } else {
      this.clearQueue();
      return false;
    }
  } else {
    currentTrieNode = currentTrieNode.getKey(key);
    this.validMatch = true;
  }

  var mapVal = currentTrieNode.value || '';
  var actionParams;
  (function() {
    if (mapVal.charAt(0) !== ':') {
      mapVal = mapVal.replace(/\([^)]+\)/, function(e) {
        actionParams = e.slice(1, -1);
        return '';
      });
    }
  })();

  if (mapVal) {
    if (/^\d+\D/.test(mapVal)) {
      this.repeats = +mapVal.replace(/\D.*/g, '') || 1;
      mapVal = mapVal.replace(/^\d+/, '');
    }
    settings.debug && console.log(mapVal);
    for (
      var mapLinks = [mapVal];
      !this.actions[mapVal] && mapVal.charAt(0) !== ':';
      mapLinks.push(mapVal)
    ) {
      mapVal = mappingTrie.findValue(this.splitMapping(mapVal));
      if (mapVal === null) {
        this.clearQueue();
        return false;
      }
      if (~mapLinks.indexOf(mapVal)) {
        Status.setMessage('recursive mapping detected', void 0, 'error');
        this.clearQueue();
        return false;
      }
    }
    if (mapVal !== 'repeatCommand' && this.nonRepeatableCommands.indexOf(mapVal) === -1) {
      this.lastCommand.queue = this.queue;
      this.lastCommand.repeats = +this.repeats || 1;
      this.lastCommand.fn = mapVal;
      this.lastCommand.params = actionParams;
      this.lastCommand.repeatStr = this.repeats;
    }
    if (mapVal.charAt(0) === ':') {
      this.actions.shortCuts(mapVal, this.lastCommand.repeats);
    } else {
      if (mapVal !== 'repeatCommand') {
        this.actions[mapVal](+this.repeats || 1, actionParams);
        RUNTIME('updateLastCommand', {
          data: JSON.stringify(this.lastCommand)
        });
      } else {
        this.actions.repeatCommand(+this.repeats || 1);
      }
    }
    this.clearQueue();
  }

  return true;
};
