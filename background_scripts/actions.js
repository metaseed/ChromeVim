var Quickmarks = {};

Actions = (function() {
  var lastCommand = null;
  var markedTabs = [];

  var openTab = function(options, times) {
    times = +times || 1;
    var doOpen = function() {
      for (var i = 0; i < times; ++i) chrome.tabs.create(options);
    };
    if (options.active) setTimeout(doOpen, 80);
    else doOpen();
  };

  var _ = {};

  _.updateLastCommand = function(o) {
    lastCommand = o.request.data;
    if (!lastCommand) {
      return;
    }
    activePorts.forEach(function(port) {
      port.postMessage({
        type: 'updateLastCommand',
        data: o.request.data
      });
    });
  };

  _.getRootUrl = function(o) {
    o.callback(o.sender.tab.url);
  };

  _.viewSource = function(o) {
    o.url = 'view-source:' + o.sender.tab.url;
    _.openLink(o);
  };

  _.viewSourceExternalEditor = function(o) {
    $.ajax({
      url: o.url
    }).done(function(data) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://127.0.0.1:' + settings.vimport);
      xhr.send(
        JSON.stringify({
          data: data,
          line: 0,
          column: 0
        })
      );
    });
  };

  _.openLink = function(o) {
    var i;
    if (o.request.tab.newWindow) {
      for (i = 0; i < o.request.repeats; ++i) {
        chrome.windows.create({
          url: o.url,
          focused: o.request.tab.active,
          incognito: o.request.tab.incognito,
          state: 'maximized'
        });
      }
    } else if (o.request.tab.tabbed) {
      openTab(
        {
          url: o.url,
          active: o.request.tab.active,
          pinned: o.request.tab.pinned,
          index: getTabOrderIndex(o.sender.tab)
        },
        o.request.repeats
      );
    } else {
      chrome.tabs.update({
        url: o.url,
        pinned: o.request.tab.pinned || o.sender.tab.pinned
      });
    }
  };

  _.openLinkTab = function(o) {
    if (!o.sender.tab) {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tab) {
        openTab(
          {
            url: o.url,
            active: o.request.active,
            pinned: o.request.pinned,
            index: getTabOrderIndex(tab[0])
          },
          o.request.repeats
        );
      });
    } else {
      openTab(
        {
          url: o.url,
          active: o.request.active,
          pinned: o.request.pinned,
          index: getTabOrderIndex(o.sender.tab),
          openerTabId: o.sender.tab.id
        },
        o.request.repeats
      );
    }
  };

  _.tabDetachWithChildren = function(o) {
    function getChildrenRecursively(tabs, tabId) {
      let _ = window._;
      let childrenTabs = _.filter(tabs, tab => {
        return tab.openerTabId == tabId;
      });

      var grandChildren = [];
      _.each(childrenTabs, function(childrenTab) {
        grandChildren.push(getChildrenRecursively(tabs, childrenTab.id));
      });

      let ret = _.flatten([childrenTabs, grandChildren]);
      return ret;
    }

    chrome.tabs.query({ currentWindow: true }, function(tabs) {
      var childrenTabs = getChildrenRecursively(tabs, o.sender.tab.id);
      let _ = window._;
      var sortedTabs = _.sortBy(childrenTabs, 'index');
      var sortedTabIds = _.pluck(sortedTabs, 'id');

      chrome.windows.create(
        {
          tabId: o.sender.tab.id,
          incognito: o.sender.tab.incognito,
          state: 'maximized'
        },
        function(window) {
          chrome.tabs.move(sortedTabIds, { windowId: window.id, index: -1 });
        }
      );
    });
  };

  _.tabGoToParent = function(o) {
    // TODO(hbt) ENHANCE add repeat
    var ctab = o.sender.tab;
    if (ctab && ctab.openerTabId) {
      _.goToTab({ request: { id: ctab.openerTabId } });
    }
  };

  _.addFrame = function(o) {
    Frames.add(o.sender.tab.id, o.port, o.request.isCommandFrame);
  };

  _.portCallback = (function() {
    var callbacks = {};

    var retval = function(o) {
      callbacks[o.request.id](Object.clone(o.request));
      delete callbacks[o.request.id];
    };

    retval.addCallback = function(callback) {
      var id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      callbacks[id] = callback;
      return id;
    };

    return retval;
  })();

  _.focusFrame = function(o) {
    if (o.request.isRoot) {
      var frame = Frames.get(o.sender.tab.id);
      if (frame) frame.focus(0);
    } else {
      Frames.get(o.sender.tab.id).focusNext();
    }
  };

  _.syncSettings = function(o) {
    if (o.request.settings.hud === false && settings.hud === true) {
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
          chrome.tabs.sendMessage(tab.id, { action: 'hideHud' });
        });
      });
    }
    for (var key in o.request.settings) {
      settings[key] = o.request.settings[key];
    }
    Options.sendSettings();
  };

  _.openLinksWindow = function(o) {
    var urls = o.request.urls;
    if (!o.request.noconvert) {
      urls = urls.map(function(e) {
        return Utils.toSearchURL(e);
      });
    }
    for (var i = 0; i < o.request.repeats; i++) {
      chrome.windows.create(
        {
          url: urls[0],
          focused: o.request.focused,
          incognito: o.request.incognito
        },
        function(win) {
          for (var i = 1; i < urls.length; i++) {
            chrome.tabs.create({
              url: urls[i],
              windowId: win.id,
              state: 'maximized'
            });
          }
        }
      );
    }
  };

  _.openLinkWindow = function(o) {
    for (var i = 0; i < o.request.repeats; ++i) {
      chrome.windows.create({
        url: o.url,
        focused: o.request.focused,
        incognito: o.request.incognito,
        state: 'maximized'
      });
    }
  };

  _.closeTab = function(o) {
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
      var sortedIds = tabs.map(function(e) {
        return e.id;
      });
      var base = o.sender.tab.index;
      if (o.request.repeats > sortedIds.length - base) {
        base -= o.request.repeats - (sortedIds.length - base);
      }
      if (base < 0) {
        base = 0;
      }
      chrome.tabs.remove(sortedIds.slice(base, base + o.request.repeats));
    });
  };

  (function() {
    var closeTab = function(o, n) {
      chrome.tabs.query({ currentWindow: true }, function(tabs) {
        tabs = tabs.map(function(e) {
          return e.id;
        });
        chrome.tabs.remove(
          tabs.slice(o.sender.tab.index + (n < 0 ? n : 1), o.sender.tab.index + (n < 0 ? 0 : 1 + n))
        );
      });
    };
    _.closeLeftTab = function(o) {
      closeTab(o, -o.request.repeats);
    };
    _.closeRightTab = function(o) {
      closeTab(o, o.request.repeats);
    };
    _.closeLeftTabs = function(o) {
      closeTab(o, -o.sender.tab.index);
    };
    _.closeRightTabs = function(o) {
      chrome.tabs.query({ currentWindow: true }, function(tabs) {
        closeTab(o, tabs.length - o.sender.tab.index);
      });
    };
  })();

  /**
   * migrated from vrome
   * could be improved by making the pinned a setting i.e protectpinnedtab
   * when on, pinned tabs cant be closed
   */
  (_.myCloseTab = function(o) {
    // TODO(hbt) ENHANCE refactor myCloseTabXXX implementation -- ref https://github.com/hbt/mouseless/commit/97533a4787a7b50e233fe6879d0c8c5707fd71d6
    var _ = window._;
    var tab = o.sender.tab;
    var cond = o.request.msg.type;
    var msg = o.request.msg;
    msg.count = o.request.repeats;
    if (msg.count == 1) {
      delete msg.count;
    }

    if (cond || msg.count > 1) {
      chrome.windows.getAll(
        {
          populate: true
        },
        function(windows) {
          if (msg.otherWindows) {
            // filter windows  without pinned tabs
            windows = _.filter(windows, function(w) {
              if (w.id === tab.windowId) return false;
              else {
                var noPinned = true;
                _.each(w.tabs, function(v) {
                  if (v.pinned) {
                    noPinned = false;
                  }
                });
                return noPinned;
              }
            });
          } else {
            // limit to current window
            windows = _.filter(windows, function(w) {
              return w.id === tab.windowId;
            });
          }

          _.each(windows, function(w) {
            var tabs = w.tabs;
            tabs = _.filter(tabs, function(v) {
              var closeMap = {
                closeOther: v.id == tab.id || v.pinned,
                closeLeft: v.id == tab.id || v.pinned || tab.index < v.index,
                closeRight: v.id == tab.id || v.pinned || tab.index > v.index,
                closePinned: !v.pinned,
                closeUnPinned: v.pinned,
                otherWindows: v.windowId == tab.windowId || v.pinned,
                count: v.index >= tab.index
              };
              return !closeMap[cond];
            });
            _.each(tabs, function(v, k) {
              if (msg.count && k > msg.count) return;
              chrome.tabs.remove(v.id);
            });
          });
        }
      );
    } else {
      if (!tab.pinned) {
        chrome.tabs.remove(tab.id);
      }
    }
  }),
    (_.toggleIncognitoTab = function(o) {
      var tab = o.sender.tab;

      if (tab.incognito) {
        chrome.windows.create(
          {
            url: tab.url,
            incognito: false,
            state: 'maximized'
          },
          function(window) {}
        );
      } else {
        chrome.windows.create(
          {
            url: tab.url,
            incognito: true,
            state: 'maximized'
          },
          function(window) {}
        );
      }
    });

  _.toggleIncognitoWindow = function(o) {
    var _ = window._;

    chrome.windows.getCurrent({ populate: true }, function(window) {
      var urls = _.map(window.tabs, function(tab) {
        return tab.url;
      });
      chrome.windows.create({
        url: urls,
        incognito: !window.incognito,
        state: window.state
      });
    });
  };

  (_.unpinTabs = function(o) {
    var _ = window._;
    var msg = o.request.msg;

    var tab = o.sender.tab;

    chrome.windows.getAll(
      {
        populate: true
      },
      function(windows) {
        if (!msg.allWindows) {
          windows = _.filter(windows, function(w) {
            return w.id === tab.windowId;
          });
        }
        _.each(windows, function(w) {
          var tabs = _.filter(w.tabs, function(v) {
            return v.pinned;
          });

          // no unpinned, then pin all of them
          var pinned = false;
          if (tabs.length === 0) {
            tabs = w.tabs;
            pinned = true;
          }

          _.each(tabs, function(t) {
            chrome.tabs.update(t.id, { pinned: pinned }, function(new_tab) {});
          });
        });
      }
    );
  }),
    (_.mergeMarkTab = function(o) {
      var tab = o.sender.tab;
      var _ = window._;
      var msg = o.request.msg;

      // add tab or all tabs in window as marked_tabs
      chrome.tabs.query(
        {
          windowId: tab.windowId
        },
        function(tabs) {
          tabs = _.filter(tabs, function(v) {
            return !v.pinned;
          });

          // limit to current tab
          if (!msg.all) {
            tabs = [tab];
          }

          var title = '';
          _.each(tabs, function(v) {
            markedTabs = _.uniq(markedTabs);

            // toggle marked/unmarked
            var posi = _.indexOf(markedTabs, v.id);

            if (posi === -1) {
              // mark it
              markedTabs.push(v.id);
              title = markedTabs.length + ' Tab(s) marked ';
            } else {
              // unmark it
              delete markedTabs[posi];

              // remove null entries
              markedTabs = _.select(markedTabs, function(vid) {
                return vid != null;
              });

              title = tabs.length + ' Tab(s) unmarked';
              if (markedTabs.length) title += ' -- ' + markedTabs.length + ' Tab(s) still marked';
            }
          });

          //Post(tab, {
          //  action: "CmdBox.set",
          //  title: title,
          //  timeout: 4000
          //})
        }
      );
    }),
    (_.mergePutTab = function(o) {
      var tab = o.sender.tab;
      var _ = window._;

      if (markedTabs.length > 0) {
        chrome.tabs.move(
          markedTabs,
          {
            windowId: tab.windowId,
            index: tab.index + 1
          },
          function(tmp) {
            //Post(tab, {
            //  action: "CmdBox.set",
            //  title: tmp.length + ' Tab(s) moved',
            //  timeout: 4000
            //})
            markedTabs = [];
          }
        );
      }
    }),
    (_.getWindows = function(o) {
      var _ret = {};
      chrome.windows.getAll(function(info) {
        info = info
          .filter(function(e) {
            return e.type === 'normal' && e.id !== o.sender.tab.windowId;
          })
          .map(function(e) {
            _ret[e.id] = [];
            return e.id;
          });
        chrome.tabs.query({}, function(tabs) {
          tabs = tabs.filter(function(e) {
            return info.indexOf(e.windowId) !== -1;
          });
          for (var i = 0; i < tabs.length; i++) {
            if (_ret.hasOwnProperty(tabs[i].windowId)) {
              _ret[tabs[i].windowId].push(tabs[i].title);
            }
          }
          o.callback(_ret);
        });
      });
      return true;
    });

  _.moveTab = function(o) {
    if (o.request.windowId === o.sender.tab.windowId) {
      return;
    }
    chrome.windows.getAll(function(info) {
      info = info
        .filter(function(e) {
          return e.type === 'normal';
        })
        .map(function(e) {
          return e.id;
        });
      var repin = function() {
        chrome.tabs.update(
          o.sender.tab.id,
          {
            pinned: o.sender.tab.pinned,
            active: true
          },
          function(tab) {
            chrome.windows.update(tab.windowId, {
              focused: true
            });
          }
        );
      };
      if (info.indexOf(parseInt(o.request.windowId)) !== -1) {
        chrome.tabs.move(
          o.sender.tab.id,
          {
            windowId: parseInt(o.request.windowId),
            index: -1
          },
          repin
        );
      } else {
        chrome.tabs.query({ currentWindow: true }, function(tabs) {
          if (tabs.length > 1) {
            chrome.windows.create(
              {
                tabId: o.sender.tab.id,
                incognito: o.sender.tab.incognito,
                focused: true,
                state: 'maximized'
              },
              repin
            );
          }
        });
      }
    });
  };

  _.closeWindow = function(o) {
    chrome.windows.remove(o.sender.tab.windowId);
  };

  _.openLastLinkInTab = function(o) {
    if (TabHistory[o.sender.tab.id] === void 0) {
      return;
    }
    var hist = TabHistory[o.sender.tab.id];
    if (hist.links[hist.state - o.request.repeats] !== void 0) {
      openTab({ url: hist.links[hist.state - o.request.repeats] });
    }
  };

  _.openNextLinkInTab = function(o) {
    if (TabHistory[o.sender.tab.id] === void 0) {
      return;
    }
    var hist = TabHistory[o.sender.tab.id];
    if (hist.links[hist.state + o.request.repeats] !== void 0) {
      openTab({ url: hist.links[hist.state + o.request.repeats] });
    }
  };

  _.getHistoryStates = function(o) {
    if (TabHistory[o.sender.tab.id] === void 0) {
      return o.callback({ links: [] });
    }
    o.callback(TabHistory[o.sender.tab.id]);
  };

  _.reloadTab = function(o) {
    chrome.tabs.reload({
      bypassCache: o.request.nocache
    });
  };

  _.reloadAllTabs = function(o) {
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(function(tab) {
        if (!/^chrome:\/\//.test(tab.url)) {
          if (o.request.current && tab.windowId === o.sender.tab.windowId) {
          } else {
            chrome.tabs.reload(tab.id);
          }
        }
      });
    });
  };

  _.nextTab = function(o) {
    getTab(o.sender.tab, false, o.request.repeats, false, false);
  };

  _.previousTab = function(o) {
    getTab(o.sender.tab, true, o.request.repeats, false, false);
  };

  _.firstTab = function(o) {
    getTab(o.sender.tab, false, false, true, false);
  };

  _.lastTab = function(o) {
    getTab(o.sender.tab, false, false, false, true);
  };

  _.clearHistory = function() {
    History.clear();
    History.saveCommandHistory();
    History.sendToTabs();
  };

  _.appendHistory = function(o) {
    if (o.sender.tab.incognito === false) {
      History.append(o.request.value, o.request.type);
      History.sendToTabs();
    }
  };

  _.pinTab = function(o) {
    chrome.tabs.update(o.sender.tab.id, {
      pinned: o.request.pinned !== void 0 ? o.request.pinned : !o.sender.tab.pinned
    });
  };

  _.copy = function(o) {
    Clipboard.copy(o.request.text);
  };

  _.goToTab = function(o) {
    var id = o.request.id,
      index = o.request.index;
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
      if (id) {
        return chrome.tabs.get(id, function(tabInfo) {
          chrome.windows.update(tabInfo.windowId, { focused: true }, function() {
            chrome.tabs.update(id, { active: true, highlighted: true });
          });
        });
      } else if (index !== void 0) {
        chrome.tabs.update(index < tabs.length ? tabs[index].id : tabs.slice(-1)[0].id, {
          active: true
        });
      }
    });
  };

  (function() {
    var move = function(o, by) {
      chrome.tabs.query({ currentWindow: true }, function(tabs) {
        var ptabs = tabs.filter(function(e) {
          return e.pinned;
        });
        chrome.tabs.move(o.sender.tab.id, {
          index: Math.min(
            o.sender.tab.pinned ? ptabs.length - 1 : ptabs.length + tabs.length - 1,
            Math.max(o.sender.tab.pinned ? 0 : ptabs.length, o.sender.tab.index + by)
          )
        });
      });
    };
    _.moveTabRight = function(o) {
      move(o, o.request.repeats);
    };
    _.moveTabLeft = function(o) {
      move(o, -o.request.repeats);
    };
  })();

  _.openPasteTab = function(o) {
    var paste = Clipboard.paste();
    if (!paste) {
      return;
    }
    paste = paste.split('\n').filter(function(e) {
      return e.trim();
    });
    for (var i = 0; i < o.request.repeats; ++i) {
      for (var j = 0, l = paste.length; j < l; ++j) {
        openTab({
          url: Utils.toSearchURL(paste[j].trim(), o.request.engineUrl),
          index: getTabOrderIndex(o.sender.tab)
        });
      }
    }
  };

  _.openPaste = function(o) {
    var paste = Clipboard.paste();
    if (!paste) {
      return;
    }
    paste = paste.split('\n')[0];
    chrome.tabs.update({
      url: Utils.toSearchURL(paste.trim(), o.request.engineUrl)
    });
  };

  _.getPaste = function(o) {
    o.callback(Clipboard.paste());
  };

  _.createSession = function(o) {
    sessions[o.request.name] = {};
    chrome.tabs.query(
      {
        currentWindow: true
      },
      function(tabs) {
        tabs.forEach(function(tab) {
          if (tab && tab.index !== void 0) {
            sessions[o.request.name][tab.index] = tab;
          }
        });
        chrome.storage.local.set({ sessions: sessions });
        o.callback(
          Object.keys(sessions).map(function(e) {
            return [
              e,
              Object.keys(sessions[e]).length.toString() +
                ' tab' +
                (Object.keys(sessions[e]).length === 1 ? '' : 's')
            ];
          })
        );
      }
    );
    return true;
  };

  _.openBookmarkFolder = function(o) {
    Bookmarks.getFolderLinks(o.request.path, Links.multiOpen);
  };

  _.deleteSession = function(o) {
    delete sessions[o.request.name];
    chrome.storage.local.set({
      sessions: sessions
    });
  };

  _.lastActiveTab = function(o) {
    if (ActiveTabs[o.sender.tab.windowId] !== void 0) {
      chrome.tabs.update(ActiveTabs[o.sender.tab.windowId].shift(), { active: true });
    }
  };

  _.openSession = function(o) {
    if (sessions.hasOwnProperty(o.request.name)) {
      var tabs = Object.keys(sessions[o.request.name])
        .sort()
        .map(function(e) {
          return sessions[o.request.name][e];
        });
      if (!o.request.sameWindow) {
        chrome.windows.create(
          {
            url: 'chrome://newtab',
            state: 'maximized'
          },
          function(tabInfo) {
            chrome.tabs.update(tabInfo.tabs[0].id, { url: tabs[0].url, pinned: tabs[0].pinned });
            tabs.slice(1).forEach(function(tab) {
              openTab({
                url: tab.url,
                pinned: tab.pinned,
                windowId: tabInfo.tabs[0].windowId,
                index: tab.index
              });
            });
          }
        );
      } else {
        chrome.tabs.query({ currentWindow: true }, function(tabInfo) {
          var windowLength = tabInfo.length;
          tabs.forEach(function(tab) {
            openTab({
              url: tab.url,
              pinned: tab.pinned,
              active: false,
              index: windowLength + tab.index
            });
          });
        });
      }
    }
  };

  _.openLast = function(o) {
    if (o.sender.tab.incognito) return;
    var stepBackFN = Sessions.nativeSessions
      ? chrome.sessions.restore.bind(chrome.sessions)
      : Sessions.stepBack.bind(Sessions, o.sender);
    for (var i = 0; i < o.request.repeats; i++) {
      stepBackFN();
    }
  };

  _.isNewInstall = function(o) {
    if (o.sender.tab.id === Updates.tabId && Updates.displayMessage) {
      Updates.displayMessage = false;
      Updates.tabId = null;
      o.callback(Updates.installMessage);
    }
  };

  _.cancelAllWebRequests = function() {
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
      tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'cancelAllWebRequests' });
      });
    });
  };

  _.hideDownloadsShelf = function() {
    chrome.downloads.setShelfEnabled(false);
    chrome.downloads.setShelfEnabled(true);
  };

  _.updateMarks = function(o) {
    Quickmarks = o.request.marks;
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
      for (var i = 0, l = tabs.length; i < l; ++i) {
        if (tabs[i].id !== o.sender.tab.id) {
          chrome.tabs.sendMessage(tabs[i].id, { action: 'updateMarks', marks: o.request.marks });
        }
      }
    });
  };

  _.getChromeSessions = function(o) {
    o.callback(Sessions.recentlyClosed);
  };

  _.restoreChromeSession = function(o) {
    var sessionIds = Sessions.recentlyClosed.map(function(e) {
      return e.id;
    });
    if (sessionIds.indexOf(o.request.sessionId) !== -1) {
      chrome.sessions.restore(o.request.sessionId);
    }
  };

  // chrome.tabs.zoom features: Chrome >= 38 (beta + dev)
  (function() {
    var zoom = function(o, scale, override, repeats) {
      if (chrome.tabs.getZoom === void 0) {
        return o.callback(false);
      }
      chrome.tabs.getZoom(o.sender.tab.id, function(zoomFactor) {
        chrome.tabs.setZoomSettings(
          o.sender.tab.id,
          {
            scope: 'per-tab'
          },
          function() {
            chrome.tabs.setZoom(o.sender.tab.id, override || zoomFactor + scale * repeats);
          }
        );
      });
    };

    _.zoomIn = function(o) {
      zoom(o, settings.zoomfactor, null, o.request.repeats);
    };

    _.zoomOut = function(o) {
      zoom(o, -settings.zoomfactor, null, o.request.repeats);
    };

    _.zoomOrig = function(o) {
      zoom(o, null, 1.0, 1);
    };
  })();

  _.duplicateTab = function(o) {
    for (var i = 0; i < o.request.repeats; i++) {
      chrome.tabs.duplicate(o.sender.tab.id);
    }
  };

  _.lastUsedTab = function() {
    if (LastUsedTabs.length === 2) {
      chrome.tabs.query({}, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
          if (LastUsedTabs[0] === tabs[i].id) {
            chrome.tabs.update(LastUsedTabs[0], { active: true });
            break;
          }
        }
      });
    }
  };

  _.runScript = function(o) {
    chrome.tabs.executeScript(
      o.sender.tab.id,
      {
        code: o.request.code,
        runAt: 'document_start'
      },
      function() {
        if (!chrome.runtime.lastError) {
          return true;
        }
      }
    );
  };

  // Port actions

  _.sendLastSearch = function() {
    if (!_.lastSearch) {
      return;
    }
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'updateLastSearch', value: _.lastSearch });
      });
    });
  };

  _.updateLastSearch = function(o) {
    if (!o.request.value) return;
    _.lastSearch = o.request.value;
    _.sendLastSearch();
  };

  _.injectCSS = function(o) {
    chrome.tabs.insertCSS(o.sender.tab.id, { code: o.request.css }, function() {
      // prevent the background script from throwing exceptions
      // when trying to insert CSS into unsupported URLs (chrome://*, etc)
      if (!chrome.runtime.lastError) {
        return true;
      }
    });
  };

  _.getBookmarks = function(o) {
    Bookmarks.getMarks(function(marks) {
      o.callback({ type: 'bookmarks', bookmarks: marks });
    });
  };

  _.searchHistory = function(o) {
    History.retrieveSearchHistory(o.request.search, o.request.limit || 4, function(results) {
      o.callback({ type: 'history', history: results });
    });
  };

  _.getTopSites = function(o) {
    Sites.getTop(function(results) {
      o.callback({ type: 'topsites', sites: results });
    });
  };

  _.getQuickMarks = function(o) {
    o.callback({ type: 'quickMarks', marks: Quickmarks });
  };

  _.getBuffers = function(o) {
    chrome.tabs.query({}, function(tabs) {
      var otherWindows = [];
      tabs = tabs.filter(function(e) {
        if (e.windowId === o.sender.tab.windowId) return true;
        otherWindows.push(e);
        return false;
      });
      tabs = tabs.concat(otherWindows);

      var buffers = tabs.map(function(e, i) {
        var title = e.title;
        if (settings.showtabindices) {
          title = title.replace(new RegExp('^' + (e.index + 1) + ' '), '');
        }
        return [i + 1 + ': ' + title, e.url, e.id];
      });

      o.callback({
        type: 'buffers',
        buffers: tabs.map(function(e, i) {
          var title = e.title;
          if (settings.showtabindices) {
            title = title.replace(new RegExp('^' + (e.index + 1) + ' '), '');
          }
          return [i + 1 + ': ' + title, e.url, e.id];
        })
      });
    });
  };

  _.getSessionNames = function(o) {
    o.callback({
      type: 'sessions',
      sessions: Object.keys(sessions).map(function(e) {
        return [
          e,
          Object.keys(sessions[e]).length.toString() +
            ' tab' +
            (Object.keys(sessions[e]).length === 1 ? '' : 's')
        ];
      })
    });
  };

  _.retrieveAllHistory = function(o) {
    o.callback({ type: 'commandHistory', history: History.commandHistory });
  };

  _.getBookmarkPath = function(o) {
    chrome.bookmarks.getTree(function(marks) {
      Bookmarks.getPath(marks[0].children, o.request.path, function(e) {
        o.callback({ type: 'bookmarkPath', path: e });
      });
    });
  };

  _.getLastCommand = function(o) {
    if (lastCommand) {
      o.callback({ type: 'updateLastCommand', data: lastCommand });
    }
  };

  _.getSettings = function(o) {
    Options.refreshSettings(function() {
      o.callback({
        type: 'sendSettings',
        settings: o.request.reset ? defaultSettings : settings
      });
    });
  };

  _.setIconEnabled = function(o) {
    chrome.browserAction.setIcon(
      {
        path: 'icons/38.png',
        tabId: o.sender.tab.id
      },
      function() {
        return chrome.runtime.lastError;
      }
    );
  };

  _.getFilePath = function(o) {
    Files.getPath(o.request.path, function(data) {
      o.callback(data);
    });
    return true;
  };

  _.getBlacklisted = function(o) {
    Popup.getBlacklisted(function() {
      o.callback(true);
    });
  };

  _.editWithVim = function(o) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:' + settings.vimport);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var method = o.request.callback || 'editWithVim';
        o.callback({ type: method, text: xhr.responseText, elementId: o.request.elementId });
      }
    };
    xhr.send(
      JSON.stringify({
        data: '' + (o.request.text || ''),
        line: o.request.line || 0,
        column: o.request.column || 0
      })
    );
  };

  _.httpRequest = function(o) {
    httpRequest(o.request.request).then(function(res) {
      o.callback({ type: 'httpRequest', id: o.request.id, text: res });
    });
  };

  _.quitChrome = function() {
    chrome.windows.getAll({ populate: false }, function(windowList) {
      windowList.forEach(function(e) {
        chrome.windows.remove(e.id);
      });
    });
  };

  _.parseRC = function(o) {
    o.callback({ type: 'parseRC', config: RCParser.parse(o.request.config) });
  };

  _.showCommandFrame = function(o) {
    Frames.get(o.sender.tab.id).focusedId = o.request.frameId;
    chrome.tabs.sendMessage(o.sender.tab.id, {
      action: o.request.action,
      search: o.request.search,
      value: o.request.value,
      complete: o.request.complete
    });
  };

  _.markActiveFrame = function(o) {
    var frame = Frames.get(o.sender.tab.id);
    if (frame) {
      frame.focusedId = o.request.frameId;
    }
  };

  _.hideCommandFrame = function(o) {
    chrome.tabs.sendMessage(
      o.sender.tab.id,
      {
        action: o.request.action
      },
      function() {
        var frame = Frames.get(o.sender.tab.id);
        if (frame) {
          frame.focus(frame.focusedId, true);
        }
      }
    );
  };

  _.callFind = function(o) {
    chrome.tabs.sendMessage(o.sender.tab.id, {
      action: o.request.action,
      command: o.request.command,
      params: o.request.params
    });
  };

  _.setFindIndex = function(o) {
    chrome.tabs.sendMessage(o.sender.tab.id, {
      action: o.request.action,
      index: o.request.index
    });
  };

  _.yankWindowUrls = function(o) {
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
      Clipboard.copy(
        tabs
          .map(function(tab) {
            return tab.url;
          })
          .join('\n')
      );
      o.callback(tabs.length);
    });
  };

  _.doIncSearch = function(o) {
    chrome.tabs.sendMessage(o.sender.tab.id, o.request);
  };

  _.cancelIncSearch = function(o) {
    chrome.tabs.sendMessage(o.sender.tab.id, o.request);
  };

  _.echoRequest = function(o) {
    chrome.tabs.sendMessage(o.sender.tab.id, o.request);
  };

  _.loadLocalConfig = function(o) {
    var path =
      o.request.path ||
      'file://' + settings.configpath.split('~').join(settings.homedirectory || '~');
    httpRequest({ url: path }).then(
      function(data) {
        var added = window.parseConfig(data);
        if (added.error) {
          console.error(
            'parse error on line %d of cVimrc: %s',
            added.error.lineno,
            added.error.message
          );
          o.callback({
            code: -2,
            error: added.error,
            config: settings
          });
          return;
        }
        added = added.value;
        added.localconfig = added.localconfig || false;
        var oldSettings = Object.clone(settings);
        var settingsClone = Object.clone(defaultSettings);
        added.localconfig = oldSettings.localconfig;
        Object.merge(settingsClone, added);
        if (oldSettings.localconfig) {
          Object.merge(settings, oldSettings);
          Object.merge(settings, added);
          Options.saveSettings({
            settings: Object.clone(settings),
            sendSettings: false
          });
          Options.sendSettings();
        } else {
          Object.merge(settings, added);
          settings.RC = oldSettings.RC;
          Options.sendSettings();
        }
        o.callback({
          code: 0,
          error: null,
          config: settings
        });
      },
      function() {
        o.callback({
          code: -1,
          error: null,
          config: settings
        });
      }
    );
    return true;
  };

  _.toggleMute = function(o) {
    chrome.tabs.update(o.sender.tab.id, { muted: !o.sender.tab.mutedInfo.muted });
  };

  _.pauseDownloads = function(o) {
    chrome.downloads.search(
      {
        state: 'in_progress'
      },
      function(downloads) {
        downloads.forEach(download => {
          chrome.downloads.pause(download.id);
        });
      }
    );
  };

  _.openLastDownloadedFile = function(o) {
    // Note(hbt) partial implementation - view http://stackoverflow.com/questions/26775564/how-to-open-a-downloaded-file
    chrome.downloads.search(
      {
        exists: true,
        state: 'complete'
      },
      function(dlds) {
        // sort dlds by end time
        let sortedDlds = window._.sortBy(dlds, v => {
          return v.endTime;
        });
        let last = sortedDlds.pop();
        chrome.downloads.open(last.id);
      }
    );
  };

  _.resumeDownloads = function(o) {
    chrome.downloads.search(
      {
        state: 'in_progress'
      },
      function(downloads) {
        downloads.forEach(download => {
          chrome.downloads.resume(download.id);
        });
      }
    );
  };

  _.cancelDownloads = function(o) {
    chrome.downloads.search(
      {
        state: 'in_progress'
      },
      function(downloads) {
        downloads.forEach(download => {
          chrome.downloads.cancel(download.id);
        });
      }
    );
  };

  _.copyURLDownloads = function(o) {
    chrome.downloads.search(
      {
        state: 'in_progress'
      },
      function(downloads) {
        var urls = [];
        downloads.forEach(download => {
          urls.push(download.finalUrl);
        });
        Clipboard.copy(urls.join('\n'));
      }
    );
  };

  _.restartLastDownload = function(o) {
    chrome.downloads.search({}, function(downloads) {
      var last = downloads.pop();
      chrome.downloads.download({
        url: last.finalUrl
      });
    });
  };

  _.toggleDomainStylesheets = function(o) {
    var styleurl = o.request.url;
    var hostname = o.request.hostname;
    var tab = o.sender.tab;

    settings.domainStylesheets[hostname] = settings.domainStylesheets[hostname] || {};

    // toggle
    if (settings.domainStylesheets[hostname] === styleurl) {
      settings.domainStylesheets[hostname] = '';
      delete settings.domainStylesheets[hostname];
    } else {
      settings.domainStylesheets[hostname] = styleurl;
    }

    Options.saveSettings({
      settings: settings
    });

    chrome.tabs.reload(tab.id);
  };

  _.dumpBookmarksFolder = function(o) {
    // TODO(hbt) NEXT abstract url in settings and flag as experimental -- 2 locations
    let url =
      'http://localhost:7077/rest-begin-folder-edit.php?folder_name=' + o.request.msg.folder;
    $.ajax({
      url: url,
      async: false
    }).done(function(data) {
      // TODO(hbt) NEXT add confirm msg (status bar) everythign went well
    });
  };

  _.loadBookmarksFolder = function(o) {
    var _ = window._;

    {
      function deepPluck(obj, k) {
        let ret = [];

        if (_.isArray(obj)) {
          _.each(obj, function(i) {
            ret.push(deepPluck(i, k));
          });
        } else if (_.isObject(obj) && _.has(obj, k)) {
          ret.push(obj[k]);
        }

        if (_.isObject(obj)) {
          _.each(_.keys(obj), function(key) {
            ret.push(deepPluck(obj[key], k));
          });
        }

        return _.flatten(ret);
      }

      function emptyExistingFolder(folder, callback) {
        chrome.bookmarks.search(
          {
            title: folder
          },
          function(marks) {
            console.assert(marks.length === 1, 'folder is the only one with that name');

            var omark = marks[0];

            chrome.bookmarks.removeTree(marks[0].id, function() {
              chrome.bookmarks.create(
                {
                  parentId: omark.parentId,
                  title: omark.title,
                  index: omark.index
                },
                function() {
                  callback();
                }
              );
            });
          }
        );
      }

      function loadEditedBookmarks(folder) {
        function getBookmarksJSON() {
          let ret = '';
          let url = 'http://localhost:7077/rest-finish-folder-edit.php';
          $.ajax({
            url: url,
            async: false
          }).done(function(data) {
            ret = JSON.parse(data);
            console.assert(_.isObject(ret.roots), 'bookmarks loaded properly');
          });
          return ret;
        }

        function loadBookmarksIntoFolder(marks, folder) {
          function createMark(mark, folderId, index) {
            if (mark.type === 'folder') {
              chrome.bookmarks.create(
                {
                  parentId: folderId,
                  title: mark.name,
                  index: index
                },
                function(nmark) {
                  if (mark.children) {
                    _.each(mark.children, (child, index) => {
                      createMark(child, nmark.id, index);
                    });
                  }
                }
              );
            }

            if (mark.type === 'url') {
              chrome.bookmarks.create(
                {
                  parentId: folderId,
                  title: mark.name,
                  url: mark.url,
                  index: index
                },
                function(nmark) {}
              );
            }
          }

          {
            chrome.bookmarks.search(
              {
                title: folder
              },
              function(smarks) {
                console.assert(smarks.length === 1, 'folder is the only one with that name');
                let folderId = smarks[0].id;

                _.each(marks, (mark, index) => {
                  createMark(mark, folderId, index);
                });
              }
            );
          }
        }

        function getBookmarksByFolderName(allmarks, folder) {
          var children = deepPluck(allmarks.roots, 'children');
          var child = _.select(children, child => {
            return child.type == 'folder' && child.name == folder;
          });
          console.assert(
            _.isArray(child) && child[0].children.length > 0,
            'found folder and it has data'
          );
          return child[0].children;
        }

        {
          let allmarks = getBookmarksJSON();
          let bmarks = getBookmarksByFolderName(allmarks, folder);
          loadBookmarksIntoFolder(bmarks, folder);
        }
      }
    }

    {
      emptyExistingFolder(o.request.msg.folder, function() {
        loadEditedBookmarks(o.request.msg.folder);
      });
    }
  };

  _.toggleBookmark = function(o) {
    var url = o.request.url,
      title = o.request.title;
    chrome.bookmarks.search({ url: url }, function(results) {
      if (!results.length) {
        chrome.bookmarks.create({ url: url, title: title });
      } else if (results[0].parentId === '2') {
        chrome.bookmarks.remove(results[0].id);
      }
    });
  };

  _.toggleBookmarksInFolder = function(o) {
    var __ = window._;
    chrome.tabs.get(o.sender.tab.id, function(tab) {
      chrome.tabs.getAllInWindow(tab.windowId, function(tabs) {
        __.each(tabs, function(tab) {
          var o2 = {};
          o2.request = o.request;
          o2.sender = { tab: tab };
          o2.callback = o.callback;
          _.toggleBookmarkInFolder(o2);
        });
      });
    });
  };

  _.toggleBookmarkInFolder = function(o) {
    // TODO(hbt) ENHANCE refactor to remove vrome msg object
    var _ = window._;
    var msg = o.request.msg;
    var tab = o.sender.tab;

    chrome.bookmarks.search(
      {
        title: msg.folder
      },
      function(collection) {
        var _folder = collection[0];
        if (!_folder)
          chrome.bookmarks.create({ title: msg.folder }, folder => toggleInFolder(folder));
        else toggleInFolder(_folder);
        function toggleInFolder(folder) {
          chrome.bookmarks.getChildren(folder.id, children => {
            // fix inconsistent trailing slash in urls
            var tabUrl = tab.url;
            tabUrl = removeTrailingSlash(tabUrl);

            function removeTrailingSlash(url) {
              if (url && url.endsWith('/')) {
                url = url.substring(0, url.length - 1);
              }
              return url;
            }

            children = _.map(children, child => {
              child.url = removeTrailingSlash(child.url);
              return child;
            });

            // toggle
            var children = _.indexBy(children, 'url');

            if (_.keys(children).includes(tabUrl)) {
              var b = children[tabUrl];
              chrome.bookmarks.remove(b.id, function() {
                o.callback({
                  type: 'Status.setMessage',
                  text: 'removed bookmark from ' + msg.folder
                });
              });
            } else {
              // Note(hbt) for some reason tab information is missing title -- displays url instead
              chrome.tabs.get(tab.id, function(tab2) {
                var title = tab2.title;
                title = title.trim();
                if (settings.showtabindices) {
                  // remove first word
                  title = title.substr(title.indexOf(' ') + 1);
                }

                chrome.bookmarks.create(
                  {
                    parentId: folder.id,
                    url: tabUrl,
                    title: title
                  },
                  function() {
                    o.callback({
                      type: 'Status.setMessage',
                      text: 'added bookmark to ' + msg.folder
                    });
                  }
                );
              });
            }
          });
        }
      }
    );
  };

  return function(_request, _sender, _callback, _port) {
    var action = _request.action;
    if (!_.hasOwnProperty(action) || typeof _[action] !== 'function') return;

    var o = {
      request: _request,
      sender: _sender,
      callback: _callback,
      port: _port
    };
    o.request.repeats = Math.max(~~o.request.repeats, 1);

    if (o.request.url && !o.request.noconvert) {
      o.url = Utils.toSearchURL(o.request.url);
    } else if (o.request.url) {
      o.url = o.request.url;
    } else {
      o.url = settings.defaultnewtabpage ? 'chrome://newtab' : '../pages/blank.html';
    }

    if (!o.sender.tab && action !== 'openLinkTab') return;

    return _[action](o);
  };
})();
