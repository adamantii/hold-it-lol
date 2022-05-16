'use strict';

let toggleHovering = null;
let optionChanged = false;
const tabs = [
  {
    title: 'Simple, unobtrusive features',
    items: [
      {key: 'auto-record', title: 'Auto-recording', description: 'Automatically record all courtrooms.', preview: 'previews/placeholder.png'},
      {key: 'menu-auto-close', title: 'Auto-closing menus', description: 'Automatically close all formatting menus after you\'ve used them.', preview: 'previews/placeholder.png'},
      {key: 'menu-hover', title: 'Open menus by hovering', description: 'Open formatting menus by hovering over them as opposed to clicking.', preview: 'previews/placeholder.png'},
      //{key: 'chat-fix', title: 'Fixed chat log', description: 'Fixes selection and scrolling in the chat log.', preview: 'previews/placeholder.png', preview: 'previews/placeholder.png'},
      //{key: 'a-d-fix', title: 'Fixed A / D hotkeys', description: 'A and D properly cycle poses from left to right (when using pose icons).', preview: 'previews/placeholder.png'},
      {key: 'sound-search', title: 'Sounds and music: Fixed search', description: 'Makes the search list a bit quicker (Auto-focus as you type).', preview: 'previews/placeholder.png'},
      {key: 'auto-mute', title: 'Auto-mute users', description: 'Add a list of Discord usernames of unwanted users to automatically mute when they join.', preview: 'previews/placeholder.png'}, // TODO
      {key: 'convert-chat-urls', title: 'Clickable chat links', description: 'Chat log URLs become clickable. You can <i>also</i> right click to quickly save sounds & music!', preview: 'previews/placeholder.png'},
    ],
  },
  {
    title: 'Medium features',
    items: [
      {key: 'dual-button', title: 'Dual effect button', description: 'Insert both Flash and Shake at the same time.', preview: 'previews/placeholder.png'},
      {key: 'comma-pause', title: 'Quickly typing pauses', description: 'Type , again after a , (or other punctuation marks) to add delays.<br>(Typing more , increases the delay.)', preview: 'previews/placeholder.png'},
      {key: 'ctrl-effects', title: 'Effect hotkeys', description: 'Quickly add the Flash and Shake tags by pressing CTRL + 1, CTRL + 2, or CTRL + 3.', preview: 'previews/placeholder.png'},
      {key: 'sound-insert', title: 'Sounds and music: Quick inserting', description: 'Add sounds just by clicking on them in the list (without pressing "insert tag")<br>(Hold "SHIFT" to suppress)', preview: 'previews/placeholder.png'},
      {key: 'no-talk-toggle', title: '"No talking" toggle', description: 'Disables your character\'s talking animation, just like in Maker.', preview: 'previews/placeholder.png'},
      {key: 'smart-pre', title: 'Smart pre-animate', description: 'Disables your pose\'s pre-animation until you use a different pose.', preview: 'previews/placeholder.png'},
      {key: 'smart-tn', title: 'Smart "to normal" poses', description: 'When switching to a new pose, automatically plays the previous pose\'s "to normal" when available.', preview: 'previews/placeholder.png'},
    ],
},
{
    title: 'Major changes',
    items: [
        {key: 'testimony-mode', title: 'Testimony mode', description: 'A helpful witness testimony player for roleplay.', preview: 'previews/placeholder.png'},
        {key: 'bulk-evidence', title: 'Add evidence from table (Beta)', description: 'Automatically add lots of evidence via a copy-pasted table from a document.<br>(Works with tables where each evidence takes up a row)', preview: 'previews/placeholder.png'},
        {key: 'list-moderation', title: 'Moderate from user list', description: 'Quickly mute, ban anyone or make them a moderator from the user list.', preview: 'previews/placeholder.png'}, // TODO
        {key: 'mute-character', title: 'Mute only character', description: 'Someone\'s character is laggy or unpleasant? Hide just the character, while still seeing their messages.', preview: 'previews/placeholder.png'}, // TODO
        {key: 'now-playing', title: '"Now playing..." display', description: 'Shows info about the currently playing music.', preview: 'previews/placeholder.png'}, // TODO
        {key: 'custom-log', title: 'Extra chat log', description: 'A log storing more messages with extra info.', preview: 'previews/placeholder.png'}, // TODO
        //{key: 'dual-wield', title: 'Dual Wield', description: 'A mode that lets you control two paired characters at the same time.', preview: 'previews/placeholder.png'},
        //{key: 'chat-moderation', title: 'Mute/ban directly from chat', description: 'Be quick with your moderation by using mute & ban buttons next to user\'s messages.', preview: 'previews/placeholder.png'},
    ],
  },
];

function optionSet(key, value) {
  chrome.storage.local.get('options', function(result) {
    const options = result.options || {};
    options[key] = value;
    options['seen-tutorial'] = true;
    chrome.storage.local.set({'options': options});
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
    if (input.checked == Boolean(val)) return;
    input.checked = val;
    toggleHovering = input.checked;
    document.body.style.cssText = 'cursor: pointer !important';
    onchange(input.checked);
  }

  label.addEventListener('mousedown', function(e) {
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
  row.addEventListener('click', function() {
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

function createOptionRow(option) {
  const row = document.createElement('div');
  row.className = 'row hoverable row-option';
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

  const optionSwitch = createSwitch(function(checked) {
    optionSet(option.key, checked);
    optionChanged = true;
  });
  row.appendChild(optionSwitch);

  row.addEventListener('mouseenter', function() {
    if (toggleHovering === null) return;
    optionSwitch.set(toggleHovering);
  })

  if (option.preview) {
    const preview = document.createElement('div');

    const previewHeader = document.createElement('div');
    preview.appendChild(previewHeader);//
    const span = document.createElement('span');
    span.textContent = option.title;
    previewHeader.appendChild(span);

    const previewImg = document.createElement('img');
    preview.className = "preview";
    previewImg.src = option.preview;
    preview.appendChild(previewImg);

    row.addEventListener('mouseenter', function() {
      const left = optionSwitch.getClientRects()[0].right;
      if (left < window.innerWidth - 300) {
        preview.style.setProperty('--left', (left + 20) + 'px');
        const top = row.getClientRects()[0].top;
        preview.style.setProperty('top', (top > (window.innerHeight - previewImg.offsetHeight * 1.25) ? (window.innerHeight - previewImg.offsetHeight * 1.25) : top) + 'px');
      } else {
        preview.style.setProperty('--left', (window.innerWidth - 400) + 'px');
        preview.style.setProperty('top', row.getClientRects()[0].bottom + 'px');
      }
      previewHeader.style.setProperty('height', previewImg.offsetHeight / 4 + 'px');
      preview.style.opacity = "1";
    })
    row.addEventListener('mouseleave', function() {
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
    function(tabs) {
      if (tabs.length > 0) courtroomOpen = true;
    }
  );
}

function main() {
  if (chrome.storage === undefined) {
    error('Please open this page from the pop-up or chrome://extensions to change options.');
    return;
  }

  document.addEventListener('mouseup', function() {
    toggleHovering = null;
    document.body.style.cssText = '';
    if (optionChanged && courtroomOpen) error('Reload your objection.lol/courtroom to see the changes.');
  });

  const mainDiv = document.querySelector('.main');
  const optionSwitches = {};
  for (let tab of tabs) {
    const [tabRow, section] = createTab(tab);
    mainDiv.appendChild(tabRow);
    mainDiv.appendChild(section);
    for (let option of tab.items) {
      const optionRow = createOptionRow(option);
      section.appendChild(optionRow);
      optionSwitches[option.key] = optionRow.querySelector('input');
    }
  }
  chrome.storage.local.get('options', function(result) {
    const options = result.options || {};
    for (let key of Object.keys(optionSwitches)) {
      const input = optionSwitches[key];
      input.checked = options[key] !== undefined ? options[key] : false;
    }
  });
}
window.addEventListener('load', main);
