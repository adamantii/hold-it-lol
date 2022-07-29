'use strict';

let toggleHovering = null;
let optionChanged = false;
const tabs = [
    {
        title: 'Convenience',
        items: [
            { key: 'auto-record', title: 'Auto-recording', description: 'Automatically start recording joined courtrooms (saving is manual).', preview: 'previews/placeholder.png' },
            { key: 'save-last-character', title: 'Remember last character', description: 'The last character you used (with the extension on) is selected by default in the next court.', preview: 'previews/placeholder.png' },
            { key: 'disable-testimony-shortcut', title: 'Disable T key', description: 'Turn off the "T" hotkey that toggles "give testimony".', preview: 'previews/placeholder.png' },
            // { key: 'merge-characters', title: 'Merge characters', description: 'Merge poses from multiple characters to work like a single character.', preview: 'previews/placeholder.png' },
            { key: 'menu-auto-close', title: 'Auto-closing menus', description: 'Automatically close formatting menus after you\'ve used them.', preview: 'previews/placeholder.png' },
            { key: 'menu-hover', title: 'Open menus by hovering', description: 'Open formatting menus by hovering over them instead of clicking.', preview: 'previews/placeholder.png' },
            { key: 'sound-insert', title: 'Sounds and music: Quick inserting', description: 'Add sounds just by clicking on them in the list (without pressing "insert tag")<br>(Hold "SHIFT" to suppress)', preview: 'previews/placeholder.png' },
        ],
    },
    {
        title: 'Messages',
        items: [
            { key: 'no-talk-toggle', title: '"No talking" toggle', description: 'Disables your character\'s talking animation, just like in Maker.', preview: 'previews/placeholder.png' },
            { key: 'comma-pause', title: 'Quickly typing pauses', description: 'Type , again after a , (or other punctuation marks) to add delays.<br>(Typing more , increases the delay.)', preview: 'previews/placeholder.png' },
            { key: 'ctrl-effects', title: 'Effect hotkeys', description: 'Quickly add the Flash and Shake tags by pressing CTRL + 1, CTRL + 2, or CTRL + 3.', preview: 'previews/placeholder.png' },
            { key: 'dual-button', title: 'Dual effect button', description: 'Insert both Flash and Shake at the same time.', preview: 'previews/placeholder.png' },
            { key: 'smart-pre', title: 'Smart pre-animate', description: 'Disables your pose\'s pre-animation until you use a different pose.', preview: 'previews/placeholder.png' },
            { key: 'smart-tn', title: 'Smart "to normal" poses', description: 'When switching to a new pose, automatically plays the previous pose\'s "to normal" when available.<br>(Lags less without Preload Resources.)', preview: 'previews/placeholder.png' },
        ],
    },
    {
        title: 'Interface',
        items: [
            { key: 'old-toggles', title: 'Classic toggles', description: 'Toggles like "Pre-animate" are accessible outside of a menu (as it was in the past).', preview: 'previews/placeholder.png' },
            { key: 'convert-chat-urls', title: 'Clickable chat links', description: 'URLs in chat messages become clickable. You can <i>also</i> right click to quickly save sounds & music.', preview: 'previews/placeholder.png' },
            { key: 'volume-sliders', title: 'Separate volume sliders', description: 'Adjust the volume of music and sound effects separately.', preview: 'previews/placeholder.png' },
            { key: 'fullscreen-evidence', title: 'Full screen in record', description: 'Mention full-screen evidence from the court record.', preview: 'previews/placeholder.png' },
            { key: 'spectator-preload', title: '"Preload Resources" while spectating', description: 'Toggle "Preload Resources" while spectating.', preview: 'previews/placeholder.png' },
        ],
    },
    {
        title: 'Moderation',
        items: [
            { key: 'remute', title: 'Automatic re-mute', description: '(Discord auth required) Automatically re-mutes a muted user if they rejoin.', preview: 'previews/placeholder.png' },
            { key: 'chat-moderation', title: 'Moderate from chat log', description: 'Quickly mute or ban using buttons next to their messages.', preview: 'previews/placeholder.png' },
            { key: 'list-moderation', title: 'Moderate from user list', description: 'Quickly mute, ban anyone or make them a moderator from the user list.', preview: 'previews/placeholder.png' },
            { key: 'mute-character', requires: 'list-moderation', title: 'Mute only character', description: 'Someone\'s character is laggy or unpleasant? Hide just the character, while still seeing their messages.', preview: 'previews/placeholder.png' },
        ],
    },
    {
        title: 'New features',
        items: [
            { key: 'testimony-mode', title: 'Roleplay testimony', description: 'A helpful witness testimony player for roleplay.', preview: 'previews/placeholder.png' },
            { key: 'bulk-evidence', title: 'Add evidence from table', description: 'Automatically add lots of evidence via a copy-pasted table from a document.<br>(Works with tables where each evidence takes up a row)', preview: 'previews/placeholder.png' },
            { key: 'now-playing', title: '"Now playing..." display', description: 'Shows the name given to the currently playing track.', preview: 'previews/placeholder.png' },
            //{key: 'dual-wield', title: 'Dual wield', description: 'Control two paired characters at the same time.', preview: 'previews/placeholder.png'},
            { key: 'tts', title: 'Text-to-speech', description: 'Plays messages using wacky text-to-speech voices.', preview: 'previews/placeholder.png' },
            //{ key: 'pose-icon-maker', title: 'Pose icons for all characters', description: 'All characters have pose icons. Hold "SHIFT"', preview: 'previews/placeholder.png' },
        ],
    },
];

function optionSet(key, value) {
    chrome.storage.local.get('options', function (result) {
        const options = result.options || {};
        options[key] = value;
        options['seen-tutorial'] = true;
        chrome.storage.local.set({ 'options': options });
    });
    console.log(key, value);
}

function createSwitch(onchange) {
    const label = document.createElement('div');
    label.className = 'hil-toggle';
    const input = document.createElement('input');
    input.setAttribute('type', 'checkbox');
    input.style.setProperty('display', 'none');

    label.set = function(val) {
        if (label.classList.contains('force-disabled')) return;
        if (input.checked == Boolean(val)) return;
        input.checked = val;
        toggleHovering = input.checked;
        document.body.style.cssText = 'cursor: pointer !important';
        onchange(input.checked);
    }

    label.addEventListener('mousedown', function (e) {
        label.set(!input.checked);
        e.preventDefault();
    });

    const span = document.createElement('span');
    span.className = 'switch';
    const handle = document.createElement('span');
    handle.className = 'handle';

    label.appendChild(input);
    label.appendChild(span);
    label.appendChild(handle);
    return label;
}

function createTabRow(tab) {
    const row = document.createElement('div');
    row.className = 'row hoverable row-tab';
    const title = document.createElement('span');
    title.textContent = tab.title;
    row.appendChild(title);

    const arrow = document.createElement('div');
    arrow.className = 'tab-arrow';
    arrow.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"></path></svg>';
    row.appendChild(arrow);

    return row;
}

function createTabSection(tab) {
    const section = document.createElement('div');
    section.className = 'tab-section';
    return section;
}

function createTab(tab) {
    const row = createTabRow(tab);
    const section = createTabSection(tab);
    row.addEventListener('click', function () {
        const expanded = !row.classList.contains('expanded');
        for (let expandedRow of document.querySelectorAll('.expanded')) {
            expandedRow.classList.remove('expanded');
            expandedRow.nextElementSibling.style.maxHeight = null;
        }
        if (expanded) {
            row.classList.add('expanded');
            section.style.maxHeight = section.scrollHeight + "px";
        }
    })
    return [row, section];
}

const requireeRows = new Map();
function createOptionRow(option, optionList) {
    const row = document.createElement('div');
    row.className = 'row hoverable row-option';
    
    if (option.requires !== undefined) {
        requireeRows.set(option.key, row);
        row.classList.add('row-disabled');
        const indent = document.createElement('div');
        indent.className = 'option-indent';
        row.appendChild(indent);
    }

    const titleContainer = document.createElement('div');
    titleContainer.className = 'label-container';
    row.appendChild(titleContainer);

    const title = document.createElement('div');
    const desc = document.createElement('div');
    title.className = 'option-label';
    desc.className = 'option-label option-desc';
    title.textContent = option.title;
    desc.innerHTML = option.description;
    titleContainer.appendChild(title);
    titleContainer.appendChild(desc);

    const requirees = [];
    for (let otherOption of optionList) {
        if (otherOption.requires !== option.key) continue;
        requirees.push(otherOption.key);
    }
    const isRequirement = requirees.length > 0;

    const optionSwitch = createSwitch(function(checked) {
        if (row.classList.contains('force-disabled')) return;
        optionSet(option.key, checked);
        optionChanged = true;
        if (isRequirement) requirees.forEach(function(key) {
            const optionRow = requireeRows.get(key);
            const disabledMethod = checked ? 'remove' : 'add';
            optionRow.classList[disabledMethod]('row-disabled');
            optionRow.querySelector('.hil-toggle').classList[disabledMethod]('force-disabled');
        });
    });
    if (option.requires !== undefined) optionSwitch.classList.add('force-disabled');
    row.appendChild(optionSwitch);

    row.addEventListener('mouseenter', function () {
        if (toggleHovering === null) return;
        optionSwitch.set(toggleHovering);
    })

    if (option.preview) {
        const preview = document.createElement('div');

        const previewHeader = document.createElement('div');
        preview.appendChild(previewHeader);
        const span = document.createElement('span');
        span.textContent = option.title;
        previewHeader.appendChild(span);

        const previewImg = document.createElement('img');
        preview.className = "preview";
        previewImg.src = option.preview;
        preview.appendChild(previewImg);

        row.addEventListener('mouseenter', function () {
            const left = optionSwitch.getClientRects()[0].right;
            if (left < window.innerWidth - 300) {
                preview.style.setProperty('--left', (left + 20) + 'px');
                const top = row.getClientRects()[0].top;
                preview.style.setProperty('top', (top > (window.innerHeight - previewImg.offsetHeight * 1.25) ? (window.innerHeight - previewImg.offsetHeight * 1.25) : top) + 'px');
            } else {
                preview.style.setProperty('--left', (window.innerWidth - 400) + 'px');
                const bottom = row.getClientRects()[0].bottom;
                preview.style.setProperty('top', (bottom < (window.innerHeight - previewImg.offsetHeight * 1.25) ? row.getClientRects()[0].bottom : row.getClientRects()[0].top - previewImg.offsetHeight * 1.25) + 'px');
            }
            previewHeader.style.setProperty('height', previewImg.offsetHeight / 4 + 'px');
            preview.style.opacity = "1";
        })
        row.addEventListener('mouseleave', function () {
            preview.style.opacity = null;
        })
        row.appendChild(preview);
    }

    return row;
}

function error(text) {
    const elem = document.querySelector('.error');
    elem.firstElementChild.textContent = text;
    elem.style.maxHeight = 'var(--header-height)';
}

let courtroomOpen = false;
if (chrome.storage !== undefined) {
    chrome.tabs.query(
        {
            "url": "*://objection.lol/courtroom/*"
        },
        function (tabs) {
            if (tabs.length > 0) courtroomOpen = true;
        }
    );
}

function main() {
    if (chrome.storage === undefined) {
        error('Please open this page from the pop-up or chrome://extensions to change options.');
        return;
    }

    document.addEventListener('mouseup', function () {
        toggleHovering = null;
        document.body.style.cssText = '';
        if (optionChanged && courtroomOpen) error('Reload your objection.lol/courtroom to see the changes.');
    });

    const mainDiv = document.querySelector('.main');
    const optionList = tabs.map(tab => tab.items).reduce((options, tab) => options.concat(tab), []);
    const optionSwitches = {};
    for (let tab of tabs) {
        const [tabRow, section] = createTab(tab);
        mainDiv.appendChild(tabRow);
        mainDiv.appendChild(section);
        for (let option of tab.items) {
            const optionRow = createOptionRow(option, optionList);
            section.appendChild(optionRow);
            optionSwitches[option.key] = optionRow.querySelector('input');
        }
    }
    chrome.storage.local.get('options', function (result) {
        const options = result.options || {};
        for (let key of Object.keys(optionSwitches)) {
            const input = optionSwitches[key];
            input.checked = options[key] !== undefined ? options[key] : false;
        }
        requireeRows.forEach(function(optionRow, key) {
            const option = optionList.find(option => option.key === key);
            if (!options[option.requires]) return;
            optionRow.classList.remove('row-disabled');
            optionRow.querySelector('.hil-toggle').classList.remove('force-disabled');
        })
    });
}
window.addEventListener('load', main);
