export const defaultInsertMappings = [
  ['<C-y>', 'deleteWord'],
  ['<C-p>', 'deleteForwardWord'],
  ['<C-i>', 'beginningOfLine'],
  ['<C-e>', 'endOfLine'],
  ['<C-u>', 'deleteToBeginning'],
  ['<C-o>', 'deleteToEnd'],
  ['<C-f>', 'forwardChar'],
  ['<C-b>', 'backwardChar'],
  ['<C-j>', 'forwardLine'],
  ['<C-k>', 'backwardLine'],
  ['<C-l>', 'forwardWord'],
  ['<C-h>', 'backwardWord']
];

export const defaultMappings = [
  /*
   ** help
   */
  ['<F1>', ':help<CR>'],

  /*
   ** vim
   */
  ['i', 'insertMode'],
  ['v', 'toggleVisualMode'],
  ['V', 'toggleVisualLineMode'],
  ['n', 'nextSearchResult'],
  ['N', 'previousSearchResult'],
  ['/', 'openSearchBar'],
  ['?', 'openSearchBarReverse'],
  [':', 'openCommandBar'],
  ['.', 'repeatCommand'],
  ['%', 'percentScroll'],
  ["'*", 'goToMark'],
  [';*', 'setMark'],
  //
  // scroll
  //
  ['j', 'scrollDown'],
  ['<A-s>', 'scrollDown'],
  ['k', 'scrollUp'],
  ['<A-w>', 'scrollUp'],
  ['gg', 'scrollToTop'], // <Home>
  ['G', 'scrollToBottom'], // <End>
  ['h', 'scrollLeft'],
  ['<A-a>', 'scrollLeft'],
  ['l', 'scrollRight'],
  ['<A-d>', 'scrollRight'],
  ['0', 'scrollToLeft'], // to the most left (begin)
  ['$', 'scrollToRight'], // to the most right (end)

  ['<A-PageUp>', 'scrollUpHalfScreen'], // note: C-U is mapped to view-source-code of page by default.
  //* space or PgDn: scroll down full screen
  ['<A-PageDown>', 'scrollDownHalfScreen'], // note: C-D is mapped to bookmap this page by default.
  //* S-space or PgUp: scroll up full screen

  //
  // paste
  //
  ['p', 'openPaste'], // google the yanked text
  ['P', 'openPasteTab'],

  //
  // yank
  //
  ['yy', 'yankTabUrl'],
  ['yt', 'yankTabUrl'],
  ['yw', 'yankWindowUrls'],
  ['yf', 'yankFrameUrl'],
  ['yh', 'yankHighlight'],

  ['zt', 'scrollMatchTop'],
  ['zb', 'scrollMatchBottom'],
  ['zz', 'scrollMatchCenter'],

  /*
   ** search
   */
  ['b', ':bookmarks '], // search in bookmarks
  ['T', ':buffer '], // search in all tabs across windows
  //* C-h: show chrome history page
  ['I', ':history '], // search in history

  // ['<Esc>', 'cancelWebRequest'],
  //* Esc: stop loading(chrome default)
  ['<BS>', 'cancelAllWebRequests'],

  /*
   ** addressBar
   */
  //* Search term + Enter: Search with default search engine
  //* Search engine name then Tab: Search using a different search engine
  //* Site name then C-Enter: Add www. and .com to a site name, and open it in the current tab
  //* Search term + A-Enter: Open a new tab and perform a Google search
  //* Address + A-Enter: Open address in a new tab
  //* C-l or A-d or F6: Jump to the address bar
  //* C-k or C-e: Trigger search from anywhere on the page with default engine
  //* Down arrow to highlight + S-Delete: Remove predictions from your address bar

  /*
   ** close
   */
  ['ct', 'closeTab'], // <C-w>
  //* C-S-w: close window
  //* C-S-q: Quit chrome
  ['c[', 'closeLeftTab'],
  ['c]', 'closeRightTab'],
  ['c{', 'closeLeftTabs'],
  ['c}', 'closeRightTabs'],

  /*
   ** remove?
   */
  ['r', 'reloadTab'], // <C-r or F5>
  ['R', 'reloadTabIgnoreCache'], // <C-S-r>
  ['gr', 'reloadAllButCurrent'],

  /*
   ** open
   */
  //* A-Home: homepage
  ['oo', ':tabnew @%<CR>'], // Open again. Note: @% is current tab address
  ['O', ':open '],
  ['oc', 'lastClosedTab'], // <C-S-t>
  //* C-n: newWindow
  //* C-S-n: newWindowIncognito
  ['oq*', 'openQuickMark'],
  ['otq*', 'openQuickMarkTabbed'],
  ['owq*', 'openQuickMarkWindowed'],

  /*
   ** add
   */
  ['at', ':tabnew <CR>'], // <C-t>
  ['aq*', 'addQuickMark'], // Quickmark is an array of web links; We could config defuat quickmark in settings

  /*
   ** move
   */
  ['mo', ':tabdetach<cr>'], // Move Out
  ['mco', 'tabDetachWithChildren'], // Move with Children Out
  ['mi', ':tabattach '], // move in
  ['mr', 'moveTabRight'], // move right
  ['>', 'moveTabRight'], // move right
  ['ml', 'moveTabLeft'], // move left
  ['<', 'moveTabLeft'], // move left

  /*
   ** display hint. note: if hint is hidden by another.
   ** If hide, press Alt to switch it to top.
   ** Press and hold the space key to temporarily hide the hints, release to show again.
   */
  ['f', 'displayHint'], // fast hint
  ['D', 'displayHintForOpenInSameTab'], // i.e.: want to directly open a link in same tab when in google search results
  ['da', 'repeatLastHintAction'], // |s is used by last-scroll-position command.
  ['dt', 'displayHintForOpenInInactiveTab'], // show hint and to new inactive tab
  ['dT', 'displayHintForOpenInActiveTab'], // show hint and to new active tab
  ['dmt', 'displayMutipleHint'],
  ['dw', 'displayHintForOpenInNewWindow'],
  ['dh', 'displayHintForHover'],
  ['dH', 'displayHintForUnhover'],
  ['di', 'displayHintForImageSearch'],
  ['dmi', 'displayHintForMutipleImageSearch'],
  ['dy', 'displayHintForUrlYank'],
  ['dmy', 'displayHintForMutipleUrlYank'],

  /*
   ** iteration in collection or tree
   **
   ** {: fist or root
   ** }: last or last leaf
   ** ]: next
   ** [: previous
   ** t: to
   ** |: time based last used(active)
   **
   ** note:
   ** all command could be prefix with numbers to repeat.
   ** the prefix number for 'to' command is the object index in collection
   */
  [']]', 'nextMatchPattern'], // next page, click the "next" link on the page (see nextmatchpattern)
  ['[[', 'previousMatchPattern'], // previous page, click the "back" link on the page (see previousmatchpattern)
  [']t', 'nextTab'], // <C-Tab>
  ['[t', 'previousTab'], // <C-S-Tab>
  ['[d', 'previousDomain'],
  [']d', 'nextDomain'],
  ['{t', 'firstTab'],
  ['}t', 'lastTab'], // <C-9>
  [']f', 'nextFrame'],
  ['{f', 'rootFrame'],
  ['{u', 'goToRootUrl'],
  ['[u', 'goUpUrl'],
  [']i', 'goToInput'],
  ['|i', 'goToLastInput'],
  ['{s', 'setScrollFocusToMainPage'],
  ['|s', 'lastScrollPosition'],
  ['[s', 'previousScrollPosition'],
  [']s', 'nextScrollPosition'],
  ['[h', 'openLastLinkInTab'],
  [']h', 'openNextLinkInTab'],

  // todo: add function like right click on back and forward toobar button.
  //* [H: to show back histories; workaround: S-A-t right click;
  //* ]H: to show forward histories

  //* S-A-t: first item in toolbar. note: if focus on history button, right click to show a link list
  //* F10: last item in toolbar
  ['H', 'goBack'], // <A-Left> note: defaut chrome shortcut is better if input box has focus.
  ['[h', 'goBack'], // <A-left>
  ['L', 'goForward'], // <A-right>
  [']h', 'goForward'], // <A-right>

  ['|T', 'lastUsedTab'], // by time across windows
  ['|t', 'lastActiveTab'], // last active tab in window
  ['tt', 'goToTab'], // <C-number> number+tt: goto tab number
  ['tb', 'toggleBookmark'], // Toggle Bookmark in other bookmarks folder
  //* C-d: add bookmark and show add-bookmark dialog
  //* C-S-d: bookmark window tabs and show bookmark-all-tabs dialog
  ['tlb', 'toggleBookmarkInFolder'], // Toggle Later Bookmark. note: the default folder name is 'Other bookmarks/later'
  ['twlb', 'toggleBookmarksInFolder'], // Toggle Window Later Bookmark. note: all bookmarks in window. (default folder name is 'Other bookmarks/later')
  //
  // others that reuse 'to' command
  //
  ['tg', ':tabnew google '],
  ['tm', 'toggleMute'],
  ['tp', 'togglePin'],

  /*
   ** browser views
   */
  ['<C-S-x>', ':chrome extensions!<cr>'],
  ['<C-S-s>', ':viewsource!<CR>'], // <C-u>
  //* C-o: open file
  //* C-S-i: chrome inspect
  //* C-S-j: chrome console
  //* C-S-m: Browse Chrome as a guest
  //* C-S-Del: clear browser
  //* C-S-b: toggle bookmarks bar
  //* C-S-o: show bookmark manager
  //* C-S-n: new incognito window
  //* A-f: chrome menu
  //* C-j: download page
  //* S-Esc: task manager
  //* S-A-t: first item in toolbar
  //* F6: focus to unfocused dialog
  //* C-f: find bar
  //* C-p: print
  //* C-s: save

  /*
   ** miscellaneous
   */
  ['gj', 'hideDownloadsShelf'],
  ['g+', 'incrementURLPath'],
  ['g-', 'decrementURLPath'],

  ['z<Enter>', 'toggleImageZoom'],
  ['zi', 'zoomPageIn'], // <C-=>
  ['zo', 'zoomPageOut'], // <C-->
  ['z0', 'zoomOrig'] // <C-0>
];
