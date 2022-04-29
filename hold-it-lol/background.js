'use strict';


/*chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {urlContains : 'objection.lol/courtroom'},
      })
      ],
          actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});*/

chrome.webNavigation.onHistoryStateUpdated.addListener(e => {
  console.log('trole');
  chrome.tabs.sendMessage( e.tabId, {action: "loaded"} );
}, {url: [{urlMatches: ".*objection\\.lol\\/courtroom\\/..*"}]});

