export const mappingsActions = {
  lastUsedTab: function () {
    RUNTIME('lastUsedTab');
  },
  '<Nop>': function () { },
  toggleVisualMode: function () {
    Command.callOnCvimLoad(function () {
      Visual.caretModeActive = true;
      Visual.getTextNodes();
      Visual.lineMode = false;
      document.body.spellcheck = false;
      document.designMode = 'on';
      Visual.selection = document.getSelection();
      if (document.getSelection().type === 'Range') {
        return false;
      }
      if (Find.matches.length) {
        Visual.focusSearchResult();
      } else {
        var closestNode = Visual.closestNode();
        if (closestNode) {
          Visual.selection.setPosition(Visual.closestNode(), 0);
          HUD.display(' -- CARET -- ');
          Visual.scrollIntoView();
        } else {
          Visual.lineMode = false;
          Visual.visualModeActive = false;
          Visual.exit();
        }
      }
    });
  },
  toggleVisualLineMode: function () {
    if (Visual.caretModeActive || Visual.visualModeActive) {
      return false;
    }
    Visual.caretModeActive = true;
    Visual.getTextNodes();
    Visual.lineMode = true;
    document.body.spellcheck = false;
    document.designMode = 'on';
    Visual.selection = document.getSelection();
    if (document.getSelection().type === 'Range') {
      return false;
    }
    if (Find.matches.length) {
      Visual.focusSearchResult(true);
    }
  },
  openLastHint: function () {
    Hints.dispatchAction(Hints.lastClicked);
  },
  nextMatchPattern: function () {
    Hints.matchPatterns(settings.nextmatchpattern);
  },
  previousMatchPattern: function () {
    Hints.matchPatterns(settings.previousmatchpattern);
  },
  cancelWebRequest: function () {
    window.stop();
  },
  cancelAllWebRequests: function () {
    RUNTIME('cancelAllWebRequests');
  },
  percentScroll: function (repeats) {
    repeats = Mappings.repeats === '0' || Mappings.repeats === '' ? 0 : repeats;
    document.scrollingElement.scrollTop =
      ((document.body.scrollHeight - window.innerHeight) * repeats) / 100;
  },
  goToTab: function (repeats) {
    RUNTIME('goToTab', { index: repeats - 1 });
  },
  goToRootUrl: function () {
    RUNTIME('openLink', {
      url:
        location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : ''),
      tab: { pinned: null }
    });
  },
  goUpUrl: function (repeats) {
    var path =
      '/' +
      location.pathname
        .split('/')
        .filter(function (e) {
          return e;
        })
        .slice(0, -repeats)
        .join('/');
    if (path !== location.pathname) {
      RUNTIME('openLink', {
        url:
          location.protocol +
          '//' +
          location.hostname +
          (location.port ? ':' + location.port : '') +
          path,
        tab: { pinned: null }
      });
    }
  },
  nextFrame: function (repeats) {
    RUNTIME('focusFrame', { repeats: repeats });
  },
  rootFrame: function () {
    RUNTIME('focusFrame', { isRoot: true });
  },

  dumpBookmarksFolder: function (repeats, folderName) {
    PORT('dumpBookmarksFolder', {
      msg: {
        folder: folderName
      }
    });
  },

  loadBookmarksFolder: function (repeats, folderName) {
    PORT('loadBookmarksFolder', {
      msg: {
        folder: folderName
      }
    });
  },

  toggleBookmark: function () {
    PORT('toggleBookmark', {
      url: document.URL,
      title: document.title.replace(/^(\d{1,2})? /, '')
    });
    PORT('getBookmarks');
  },

  toggleBookmarkInFolder: function (repeats, folderName) {
    PORT('toggleBookmarkInFolder', {
      msg: {
        folder: folderName || 'later'
      }
    });
  },

  toggleBookmarksInFolder: function (repeats, folderName) {
    PORT('toggleBookmarksInFolder', {
      msg: {
        folder: folderName || 'later'
      }
    });
  },

  toggleDomainStylesheets: function (repeats, url) {
    RUNTIME('toggleDomainStylesheets', { url: url, hostname: getHostname(window.location.href) });
  },
  markMergeTab: function () {
    RUNTIME('mergeMarkTab', {
      msg: {}
    });
  },
  markMergeWindow: function () {
    RUNTIME('mergeMarkTab', {
      msg: {
        all: true
      }
    });
  },
  putMergeTabs: function () {
    RUNTIME('mergePutTab', {
      msg: {}
    });
  },
  myCloseWindowsOthers: function () {
    RUNTIME('myCloseTab', {
      msg: {
        otherWindows: true,
        type: 'otherWindows'
      }
    });
  },
  myCloseTabsLeft: function () {
    RUNTIME('myCloseTab', {
      msg: {
        type: 'closeLeft'
      }
    });
  },
  myCloseTabsRight: function () {
    RUNTIME('myCloseTab', {
      msg: {
        type: 'closeRight'
      }
    });
  },
  myCloseTabsOthers: function () {
    RUNTIME('myCloseTab', {
      msg: {
        type: 'closeOther'
      }
    });
  },
  myCloseTabsAllExcept: function () {
    RUNTIME('myCloseTab', {
      msg: {
        type: 'closeOther'
      }
    });
    RUNTIME('myCloseTab', {
      msg: {
        otherWindows: true,
        type: 'otherWindows'
      }
    });
  },
  windowUnpinAllTabs: function () {
    RUNTIME('unpinTabs', { msg: {} });
  },
  browserUnpinAllTabs: function () {
    RUNTIME('unpinTabs', {
      msg: {
        allWindows: true
      }
    });
  },

  toggleIncognitoTab: function () {
    RUNTIME('toggleIncognitoTab');
  },

  toggleIncognitoWindow: function () {
    RUNTIME('toggleIncognitoWindow');
  },

  closeTab: function (repeats) {
    RUNTIME('closeTab', { repeats: repeats });
  },
  closeLeftTab: function (repeats) {
    RUNTIME('closeLeftTab', { repeats: repeats });
  },
  closeRightTab: function (repeats) {
    RUNTIME('closeRightTab', { repeats: repeats });
  },
  closeLeftTabs: function () {
    RUNTIME('closeLeftTabs');
  },
  closeRightTabs: function () {
    RUNTIME('closeRightTabs');
  },
  pinTab: function () {
    RUNTIME('pinTab', { pinned: true });
  },
  togglePin: function () {
    RUNTIME('pinTab');
  },
  unpinTabs: function () {
    RUNTIME('pinTab', { pinned: false });
  },
  firstTab: function () {
    RUNTIME('firstTab');
  },
  lastTab: function () {
    RUNTIME('lastTab');
  },
  lastClosedTab: function (repeats) {
    RUNTIME('openLast', { repeats: repeats });
  },
  moveTabRight: function (repeats) {
    RUNTIME('moveTabRight', { repeats: repeats });
  },
  moveTabLeft: function (repeats) {
    RUNTIME('moveTabLeft', { repeats: repeats });
  },
  lastActiveTab: function () {
    RUNTIME('lastActiveTab');
  },
  reverseImage: function () {
    if (
      /\(\d+×\d+\)$/.test(document.title) === true &&
      document.body.firstChild.localName === 'img'
    ) {
      if (document.body.firstChild.src) {
        RUNTIME('openLinkTab', {
          active: false,
          url: 'https://www.google.com/searchbyimage?image_url=' + document.body.firstChild.src,
          noconvert: true
        });
        return;
      }
    } else {
      window.setTimeout(function () {
        Hints.create('image');
      }, 0);
    }
  },
  multiReverseImage: function () {
    window.setTimeout(function () {
      Hints.create('multiimage');
    }, 0);
  },
  toggleImageZoom: function () {
    if (/\.[a-z]+\s+\(\d+×\d+\)/i.test(document.title)) {
      var images = document.getElementsByTagName('img');
      if (images.length) {
        DOM.mouseEvent('click', images[0]);
      }
    }
  },
  zoomPageIn: function (repeats) {
    RUNTIME('zoomIn', { repeats: repeats }, function () {
      document.body.style.zoom =
        (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1) +
        settings.zoomfactor * repeats;
    });
  },
  zoomPageOut: function (repeats) {
    RUNTIME('zoomOut', { repeats: repeats }, function () {
      document.body.style.zoom =
        (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1) -
        settings.zoomfactor * repeats;
    });
  },
  zoomOrig: function () {
    RUNTIME('zoomOrig', null, function () {
      document.body.style.zoom = '1';
    });
  },
  scrollMatchTop: function () {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index]) {
      window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top * documentZoom);
    }
  },
  scrollMatchCenter: function () {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index]) {
      var scrollOffset = function () {
        return (
          this.matches[this.index].getBoundingClientRect().top * documentZoom +
          this.matches[this.index].offsetHeight -
          0.5 * window.innerHeight
        );
      }.call(Find);
      window.scrollBy(0, scrollOffset);
    }
  },
  scrollMatchBottom: function () {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index]) {
      var scrollOffset = function () {
        return (
          this.matches[this.index].getBoundingClientRect().top * documentZoom +
          this.matches[this.index].offsetHeight * documentZoom -
          window.innerHeight
        );
      }.call(Find);
      window.scrollBy(0, scrollOffset);
    }
  },
  openLastLinkInTab: function (repeats) {
    RUNTIME('openLastLinkInTab', { repeats: repeats });
  },
  openNextLinkInTab: function (repeats) {
    RUNTIME('openNextLinkInTab', { repeats: repeats });
  },
  scrollDown: function (repeats) {
    Scroll.scroll('down', repeats);
  },
  scrollUp: function (repeats) {
    Scroll.scroll('up', repeats);
  },
  scrollDownHalfScreen: function (repeats) {
    Scroll.scroll('pageDown', repeats);
  },
  scrollFullPageDown: function (repeats) {
    Scroll.scroll('fullPageDown', repeats);
  },
  scrollUpHalfScreen: function (repeats) {
    Scroll.scroll('pageUp', repeats);
  },
  scrollFullPageUp: function (repeats) {
    Scroll.scroll('fullPageUp', repeats);
  },
  scrollLeft: function (repeats) {
    Scroll.scroll('left', repeats);
  },
  scrollRight: function (repeats) {
    Scroll.scroll('right', repeats);
  },
  scrollToTop: function () {
    Scroll.scroll('top');
  },
  scrollToBottom: function () {
    Scroll.scroll('bottom');
  },
  scrollToLeft: function () {
    Scroll.scroll('leftmost');
  },
  scrollToRight: function () {
    Scroll.scroll('rightmost');
  },
  lastScrollPosition: function () {
    if (!Scroll.lastPosition) {
      return;
    }
    var currentPosition = [
      document.scrollingElement.scrollLeft,
      document.scrollingElement.scrollTop
    ];
    window.scrollTo.apply(null, Scroll.lastPosition);
    Scroll.lastPosition = currentPosition;
  },
  previousScrollPosition: function () {
    Scroll.previousHistoryState();
  },
  nextScrollPosition: function () {
    Scroll.nextHistoryState();
  },
  goToMark: function () {
    settings.localMarks = settings.localMarks || {};
    settings.localMarks[getHostname(window.location.href)] =
      settings.localMarks[getHostname(window.location.href)] || {};

    var key = Mappings.lastCommand.queue.slice(-1);
    if (settings.localMarks[getHostname(window.location.href)].hasOwnProperty(key)) {
      Scroll.positions[key] = settings.localMarks[getHostname(window.location.href)][key];
      Scroll.lastPosition = [
        document.scrollingElement.scrollLeft,
        document.scrollingElement.scrollTop
      ];
      window.scrollTo.apply(null, Scroll.positions[key]);
    } else {
      Status.setMessage('Mark not set', 1, 'error');
    }
  },
  setMark: function () {
    var mark = Mappings.lastCommand.queue.slice(-1);
    var pos = [document.scrollingElement.scrollLeft, document.scrollingElement.scrollTop];
    Scroll.positions[mark] = pos;

    // save position in settings
    // TODO(hbt) ENHANCE add localMarks to settings in options.js same as domainStylesheets -- refactor goToMark
    settings.localMarks = settings.localMarks || {};
    settings.localMarks[getHostname(window.location.href)] =
      settings.localMarks[getHostname(window.location.href)] || {};
    settings.localMarks[getHostname(window.location.href)][mark] = pos;
    PORT('syncSettings', { settings: settings });
    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: settings,
      sendSettings: true
    });
  },
  createHint: function () {
    Hints.create();
  },
  openHintInTab: function () {
    Hints.create('inTab');
  },
  createTabbedHint: function () {
    Hints.create('tabbed');
  },
  createActiveTabbedHint: function () {
    Hints.create('tabbedActive');
  },
  createMultiHint: function () {
    Hints.create('multi');
  },
  createHintWindow: function () {
    Hints.create('window');
  },
  createEditHint: function () {
    Hints.create('edit');
  },
  createHoverHint: function () {
    Hints.create('hover');
  },
  createUnhoverHint: function () {
    Hints.create('unhover');
  },
  createScriptHint: function (repeats, scriptName) {
    Hints.scriptFunction = scriptName;
    if (settings.FUNCTIONS.hasOwnProperty(scriptName)) {
      Hints.create('script');
    }
  },
  openUrlExternalEditor: function () {
    PORT('editWithVim', {
      text: window.location.href,
      callback: 'openUrlExternalEditorCallback'
    });
  },
  yankUrl: function () {
    Hints.create('yank');
  },
  multiYankUrl: function () {
    Hints.create('multiyank');
  },
  fullImageHint: function () {
    Hints.create('fullimage');
  },
  yankTabUrl: function () {
    RUNTIME('getRootUrl', function (url) {
      Clipboard.copy(url);
      Status.setMessage(url, 2);
    });
  },
  yankFrameUrl: function () {
    Clipboard.copy(document.URL);
    Status.setMessage(document.URL, 2);
  },
  yankWindowUrls: function () {
    PORT('yankWindowUrls');
  },
  yankHighlight: function () {
    var selection = document.getSelection();
    if (selection.type === 'Range' && selection.toString() !== '') {
      Clipboard.copy(selection.toString());
      return;
    }
    var match = Find.matches[Find.index];
    if (match) {
      Clipboard.copy(match.textContent);
    }
  },
  openPaste: function () {
    Clipboard.paste(false);
  },
  openPasteTab: function (repeats) {
    for (var i = 0; i < repeats; ++i) {
      Clipboard.paste(true);
    }
  },
  nextCompletionResult: function () {
    if (Command.commandBarFocused()) Search.nextResult(false);
  },
  previousCompletionResult: function () {
    if (Command.commandBarFocused()) Search.nextResult(true);
  },
  addQuickMark: function () {
    Marks.addQuickMark(Mappings.lastCommand.queue.slice(-1));
  },
  openQuickMark: function (repeats) {
    Marks.openQuickMark(
      Mappings.lastCommand.queue.slice(-1),
      {
        tab: {}
      },
      repeats
    );
  },
  openQuickMarkTabbed: function (repeats) {
    Marks.openQuickMark(
      Mappings.lastCommand.queue.slice(-1),
      {
        tab: { tabbed: true }
      },
      repeats
    );
  },
  openQuickMarkWindowed: function (repeats) {
    Marks.openQuickMark(
      Mappings.lastCommand.queue.slice(-1),
      {
        tab: { newWindow: true }
      },
      repeats
    );
  },
  insertMode: function () {
    Command.callOnCvimLoad(function () {
      HUD.display(' -- INSERT -- ');
    });
    insertMode = true;
  },
  reloadTab: function () {
    RUNTIME('reloadTab', { nocache: false });
  },
  reloadTabIgnoreCache: function () {
    RUNTIME('reloadTab', { nocache: true });
  },
  reloadAllButCurrent: function () {
    RUNTIME('reloadAllTabs', { nocache: false, current: true });
  },
  reloadAllTabs: function () {
    RUNTIME('reloadAllTabs', { nocache: false, current: false });
  },
  nextSearchResult: function (repeats) {
    if (Find.matches.length) {
      Find.search(Find.mode || '/', repeats);
    } else if (Find.lastSearch !== void 0 && typeof Find.lastSearch === 'string') {
      Find.highlight({
        base: document.body,
        mode: Find.mode || '/',
        search: Find.lastSearch,
        setIndex: true,
        executeSearch: false
      });
      Find.search(Find.mode || '/', +(Find.mode === '?'));
    }
  },
  previousSearchResult: function (repeats) {
    if (Find.matches.length) {
      Find.search(Find.mode || '?', -repeats);
    } else if (Find.lastSearch !== void 0 && typeof Find.lastSearch === 'string') {
      Find.highlight({
        base: document.body,
        mode: Find.mode || '?',
        search: Find.lastSearch,
        setIndex: true,
        executeSearch: false
      });
      Find.search(Find.mode || '?', -(Find.mode !== '?'));
    }
  },
  tabDetachWithChildren: function (r) {
    RUNTIME('tabDetachWithChildren');
  },
  tabGoToParent: function (r) {
    RUNTIME('tabGoToParent', { repeats: r });
  },
  nextTab: function (r) {
    RUNTIME('nextTab', { repeats: r });
  },
  previousTab: function (r) {
    RUNTIME('previousTab', { repeats: r });
  },
  goBack: function (repeats) {
    history.go(-1 * repeats);
  },
  goForward: function (repeats) {
    history.go(1 * repeats);
  },

  _switchDomain: function (direction, repeats) {
    RUNTIME('getHistoryStates', null, function (response) {
      if (response.links.length === 0) return;

      var curDomain = new URL(response.links[response.state]).hostname;

      var searchSpace =
        direction > 0
          ? response.links.slice(response.state)
          : response.links.slice(0, response.state + 1).reverse();

      for (var i = 1, domainDistance = 0; i < searchSpace.length; i++) {
        var targetDomain = new URL(searchSpace[i]).hostname;
        if (targetDomain !== curDomain) {
          if (++domainDistance >= repeats) {
            history.go(i * (direction > 0 ? 1 : -1));
            break;
          }
        }
      }
    });
  },
  previousDomain: function (repeats) {
    this._switchDomain(-1, repeats);
  },
  nextDomain: function (repeats) {
    this._switchDomain(1, repeats);
  },

  goToLastInput: function () {
    if (this.inputElements && this.inputElementsIndex && this.inputElements[this.inputElementsIndex]) {
      this.inputElements[this.inputElementsIndex].focus();
      if (document.activeElement.select) {
        document.activeElement.select();
      }
    }
  },
  goToInput: function (repeats) {
    this.inputElements = [];
    var allInput = document.querySelectorAll('input,textarea,*[contenteditable]');
    for (var i = 0, l = allInput.length; i < l; i++) {
      if (
        DOM.isEditable(allInput[i]) &&
        DOM.isVisible(allInput[i]) &&
        DOM.isInView(allInput[i]) &&
        allInput[i].id !== 'cVim-command-bar-input'
      ) {
        this.inputElements.push(allInput[i]);
      }
    }
    if (this.inputElements.length === 0) {
      return false;
    }

    this.inputElementsIndex = (repeats % this.inputElements.length) - 1;
    if (this.inputElementsIndex < 0) {
      this.inputElementsIndex = this.inputElements.length - 1;
    }

    this.inputFocused = true;
    var elementFocus = this.inputElements[this.inputElementsIndex];
    elementFocus.focus();
    DOM.mouseEvent('hover', elementFocus);
    DOM.mouseEvent('click', elementFocus);
    if (elementFocus === document.activeElement) {
      if (document.activeElement.select) {
        document.activeElement.select();
      }
      if (!document.activeElement.hasAttribute('readonly')) {
        document.getSelection().modify('extend', 'right', 'lineboundary');
      }
    }
  },
  shortCuts: function (command, repeats) {
    commandMode = true;
    if (command.indexOf('@%') !== -1) {
      RUNTIME(
        'getRootUrl',
        function (url) {
          this.shortCuts(command.split('@%').join(url), repeats);
        }.bind(this)
      );
      return;
    }
    return window.setTimeout(function () {
      var shouldComplete = !/<cr>(\s+)?$/i.test(command);
      command = command
        .replace(/^:/, '')
        .replace(/<cr>(\s+)?$/i, '')
        .replace(/<space>/gi, ' ');
      if (!shouldComplete) {
        Command.execute(command, repeats);
        return;
      }
      Command.show(false, command, shouldComplete);
      this.queue = '';
      this.repeats = '';
    }, 0);
  },
  openSearchBar: function () {
    Find.lastIndex = Find.index;
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      Command.lastScrollTop = document.scrollingElement.scrollTop;
    }
    commandMode = true;
    Find.previousMatches = Find.matches.length > 0;
    return Command.show('/');
  },
  openSearchBarReverse: function () {
    Find.lastIndex = Find.index;
    commandMode = true;
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      Command.lastScrollTop = document.scrollingElement.scrollTop;
    }
    Find.previousMatches = Find.matches.length > 0;
    return Command.show('?');
  },
  openLinkSearchBar: function () {
    Find.lastIndex = Find.index;
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      Command.lastScrollTop = document.scrollingElement.scrollTop;
    }
    commandMode = true;
    Find.previousMatches = Find.matches.length > 0;
    return Command.show('$');
  },
  openCommandBar: function () {
    commandMode = true;
    return Command.show(false, '', settings.completeonopen);
  },
  repeatCommand: function (repeats) {
    if (this.hasOwnProperty(Mappings.lastCommand.fn)) {
      this[Mappings.lastCommand.fn].call(
        this,
        Mappings.lastCommand.repeats * repeats,
        Mappings.lastCommand.params
      );
    }
  },
  quitChrome: function () {
    PORT('quitChrome');
  },
  passKeys: function (repeats) {
    Mappings.keyPassesLeft = repeats;
  },
  enterPassMode: function () {
    passMode = true;
    Status.setMessage('Entering pass-mode', 1);
  },
  exitPassMode: function () {
    passMode = false;
    Status.setMessage('Exited pass-mode', 1);
  },
  resetScrollFocus: function () {
    window.resetScrollFocus();
  },
  clearSearchHighlight: function () {
    Find.clear();
    HUD.hide();
  },
  toggleMute: function () {
    RUNTIME('toggleMute');
  },
  exportSettings: function () {
    var content = JSON.stringify(settings);
    var uriContent = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
    var a = document.createElement('a');
    a.href = uriContent;
    a.download = 'cvim-settings.json';
    a.click();
  },
  viewSourceExternalEditor: function () {
    RUNTIME('viewSourceExternalEditor', { url: window.location.href });
  },
  hideDownloadsShelf: function () {
    RUNTIME('hideDownloadsShelf');
  },
  openLastDownload: function () {
    // TODO(hbt) ENHANCE add counter support where it would download the the second last download for example
    RUNTIME('openLastDownloadedFile');
  },
  pauseDownloads: () => {
    RUNTIME('pauseDownloads');
  },
  resumeDownloads: () => {
    RUNTIME('resumeDownloads');
  },
  cancelDownloads: () => {
    RUNTIME('cancelDownloads');
  },
  restartLastDownload: () => {
    RUNTIME('restartLastDownload');
  },
  copyURLDownloads: () => {
    RUNTIME('copyURLDownloads', function (o) {
      console.log(o);
    });
  },
  makeLinks: () => {
    // TODO(hbt) ENHANCE only load linkify deps on demand instead of having 3 js files in manifest loaded every time
    linkifyElement(document.body);
  }
};

(function () {
  var replaceURLNumber = function (callback) {
    var url = document.URL.replace(/\b\d+\b/, callback);
    if (url !== document.URL) RUNTIME('openLink', { url: url, tab: { tabbed: false } });
  };
  var replaceURLLastNumber = function (repeats) {
    if (document.location.href.match(/(.*?)(\d+)(\D*)$/)) {
      var pre = RegExp.$1,
        number = RegExp.$2,
        post = RegExp.$3;
      var newNumber = parseInt(number, 10) + repeats;
      var newNumberStr = String(newNumber > 0 ? newNumber : 0);
      if (number.match(/^0/)) {
        // add 0009<C-a> should become 0010
        while (newNumberStr.length < number.length) {
          newNumberStr = '0' + newNumberStr;
        }
      }

      var url = pre + newNumberStr + post;
      RUNTIME('openLink', { url: url, tab: { tabbed: false } });
    }
  };
  mappingsActions.incrementURLPath = function (repeats) {
    replaceURLNumber(function (e) {
      return +e + repeats;
    });
  };
  mappingsActions.incrementURLFirstPath = function (repeats) {
    Mappings.actions.incrementURLPath(repeats);
  };
  mappingsActions.decrementURLPath = function (repeats) {
    replaceURLNumber(function (e) {
      return Math.max(0, +e - repeats);
    });
  };
  mappingsActions.decrementURLFirstPath = function (repeats) {
    Mappings.actions.decrementURLPath(repeats);
  };
  mappingsActions.incrementURLLastPath = function (repeats) {
    replaceURLLastNumber(repeats);
  };
  mappingsActions.decrementURLLastPath = function (repeats) {
    replaceURLLastNumber(repeats * -1);
  };
})();
