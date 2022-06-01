'use strict';


chrome.webNavigation.onHistoryStateUpdated.addListener(e => {
    chrome.tabs.sendMessage( e.tabId, ["courtroom_state_loaded"] );
}, {url: [{urlMatches: ".*objection\\.lol\\/courtroom\\/..*"}]});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const [ action, data ] = request;
    if (action === 'create-asset-context-menu') {
        function callback() {
            chrome.runtime.lastError;
        }
        chrome.contextMenus.create({
            id: 'hil-save-sound',
            title: 'Add as Sound',
            contexts: ['link'],
        }, callback);
        chrome.contextMenus.create({
            id: 'hil-save-music',
            title: 'Add as Music',
            contexts: ['link'],
        }, callback);
    }
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    chrome.tabs.sendMessage(tab.id, ["save-asset", info]);
});
