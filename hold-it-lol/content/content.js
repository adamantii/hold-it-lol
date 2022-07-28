'use strict';
// Beware: spaghetti code, all mushed into a single file oh noes



const DEFAULT_TRANSITION = 'transition: .28s cubic-bezier(.4,0,.2,1);';

const MENUS_NOT_AUTO_CLOSE = ['Text Color'];
const SELECTORS_MENU_HOVER = ['.menuable__content__active', 'div.v-sheet.secondary', 'button.v-app-bar__nav-icon', '.mb-2.col-sm-4.col-md-6.col-lg-3.col-6'];
const PAUSE_PUNCTUATION = '.,!?:;';
const URL_REGEX = /((?:http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+(?:[\-\.]{1}[a-z0-9]+)*\.[a-z]{1,5}(?::[0-9]{1,5})?(?:\/.*?)?\w)(\W*?(?:\s|$))/gi;

const TAG_PAUSE_100 = '[#p100]';
const TAG_MUSIC_FADE_OUT = '[#bgmfo]';
const TAG_MUSIC_STOP = '[#bgms]';
const STOP_MUSIC_TEXT = '[Stop Music]';
const TEXT_EFFECT_DUAL_TITLE = 'Both Effects';
const TEXT_EFFECT_DUAL_DESCRIPTION = 'Perform flash and shake at a certain point';
const TEXT_EFFECT_FLASH_TITLE = 'Flash';
const TEXT_EFFECT_FLASH_DESCRIPTION = 'Perform flash at a certain point';
const UNDEFINED_POSE_NAME = 'Pose stored';
const EVIDENCE_MAX_LENGTH_NAME = 20;
const EVIDENCE_MAX_LENGTH_DESC = 300;
const EVIDENCE_DESC_SEPARATOR = ' | ';
const EVIDENCE_DESC_TOO_LONG = '… (View doc to read more)';

const sel = document.getSelection();
// let currentSelectionState = {};
let states = {};
let modifierKeys = {};
let theme;
let textArea;

let options;
let optionsLoaded = new Promise(function(resolve, reject) {
    chrome.storage.local.get('options', function(result) {
        options = result.options || {};
        resolve(options);
    });
});


function clickOff() { app.firstElementChild.click(); }

function testRegex(str, re) {
    const match = str.match(re);
    return match !== null && match[0] == match.input;
}

function httpGetAsync(url) {
    return new Promise((resolve, reject) => {
        const XMLHttp = new XMLHttpRequest();
        XMLHttp.onreadystatechange = function () {
            if (XMLHttp.readyState == 4 && XMLHttp.status == 200) resolve(XMLHttp.responseText);
        }
        XMLHttp.open("GET", url, true);
        XMLHttp.send(null);
    });
}

function getLabel(innerText) {
    return [].find.call(document.querySelectorAll('label'), label => label.innerText === innerText);
}

function setValue(elem, text) {
    elem.value = text;
    elem.dispatchEvent(new Event('input'));
}
function insertValue(elem, text, index) {
    const value = elem.value;
    setValue(elem, value.slice(0, index) + text + value.slice(index));
}
function insertReplaceValue(elem, text, index, index2 = null) {
    index2 = index2 ? index2 : index;
    setValue(elem, textArea.value.slice(0, index) + text + textArea.value.slice(index2));
    textArea.selectionStart = index + text.length;
    textArea.selectionEnd = textArea.selectionStart;
}
function insertTag(tag) {
    const end = textArea.selectionEnd;
    const text = textArea.value;
    insertValue(textArea, tag, end);

    textArea.selectionStart = textArea.selectionEnd = end + tag.length;
    textArea.focus();
}

function getInputContent() {
    return app.querySelector('.menuable__content__active:not([role="menu"])');
}

function createIcon(iconClass, fontPx = 24, styleText = '', classText = '') {
    const icon = document.createElement('i');
    icon.className = classText + ' hil-themed v-icon notranslate mdi ' + theme;
    icon.classList.add('mdi-' + iconClass);
    if (fontPx && fontPx !== 24) icon.style.cssText = 'font-size: ' + fontPx + 'px;'
    if (styleText) icon.style.cssText += styleText;
    return icon;
}

function createButton(listener, text, classText, styleText) {
    const button = document.createElement('button');
    button.className = 'v-btn v-btn--has-bg v-size--default hil-row-btn hil-themed ' + theme;
    if (classText) button.className += ' ' + classText;
    if (styleText) button.style.cssText = styleText;
    button.innerText = text;

    if (listener) button.addEventListener('click', listener);

    return button
}
function primaryButton(listener, classText, styleText, child) {
    const button = document.createElement('button');
    button.className = 'v-btn v-btn--depressed v-size--small primary ' + theme;
    if (classText) button.className += ' ' + classText;
    if (styleText) button.style.cssText += styleText;
    if (child) button.appendChild(child);

    if (listener) button.addEventListener('click', listener);

    return button;
}
function iconToggleButton(listenerCheck, text, classText, styleText, defaultEnabled = false) {
    function toggle(enabled){
        if (enabled) {
            button.classList.add('success');
            button.firstElementChild.classList.remove('mdi-close');
            button.firstElementChild.classList.add('mdi-check');
        } else {
            button.classList.remove('success');
            button.firstElementChild.classList.add('mdi-close');
            button.firstElementChild.classList.remove('mdi-check');
        }
    }
    const button = createButton(function() {
        const enabled = listenerCheck();
        toggle(enabled);
    }, text, classText, styleText);
    button.prepend(createIcon('close', 18, 'margin-right: 8px;'));
    if (defaultEnabled) toggle(true);
    return button;
}

function injectScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.dataset.hilIgnore = '1';
    (document.head || document.documentElement).appendChild(script);
}

// function updateSelectionState() {
//     currentSelectionState.baseNodeDiv = sel.baseNode && (sel.baseNode.nodeType == 1 ? sel.baseNode : sel.baseNode.parentElement);
//     currentSelectionState.baseOffset = sel.baseOffset;
//     currentSelectionState.extentNodeDiv = sel.extentNode && (sel.extentNode.nodeType == 1 ? sel.extentNode : sel.extentNode.parentElement);
//     currentSelectionState.extentOffset = sel.extentOffset;
// }

function optionSet(key, value) {
    options[key] = value;
    chrome.storage.local.get({ 'options': {} }, function (result) {
        const options = result.options;
        options[key] = value;
        chrome.storage.local.set({ 'options': options });
    });
}

function kindaRandomChoice(array, seed = null) {
    if (seed === null) seed = Math.random();
    const x = Math.sin(seed++) * 10000; 
    const random = x - Math.floor(x);
    const i = Math.floor(random * array.length);
    return array[i];
}



function onLoad(options) {


    console.log('holdit.lol v0.7 beta - running onLoad()');
    
    if (options['smart-tn']) injectScript(chrome.runtime.getURL('inject/closest-match/closest-match.js'));
    if (options['testimony-mode'] || options['no-talk-toggle'] || options['smart-pre'] || options['smart-tn'] || options['now-playing'] || options['list-moderation'] || options['mute-character'] || options['fullscreen-evidence']) injectScript(chrome.runtime.getURL('inject/vue-wrapper.js'));

    const showTutorial = !options['seen-tutorial'] || !(Object.values(options).filter(x => x).length > 1);

    const app = document.getElementById('app');
    textArea = document.querySelector('.frameTextarea');
    const textValue = text => setValue(textArea, text);
    const textButton = textArea.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector('.v-btn--has-bg.primary');
    const chatBox = document.querySelector('.chat');
    const chat = chatBox.firstElementChild;

    const mainWrap = document.querySelector('.v-main__wrap');
    const row1 = mainWrap.firstElementChild.firstElementChild.firstElementChild;
    const row2 = mainWrap.firstElementChild.firstElementChild.lastElementChild;

    let musicPlaying = false;


    const themeInput = getLabel('Dark Mode').parentElement.querySelector('input');
    if (themeInput.ariaChecked == "true") {
        theme = 'theme--dark';
    } else {
        theme = 'theme--light';
    }

    function themeUpdate() {
        if (themeInput.ariaChecked == "true") {
            theme = 'theme--dark';
        } else {
            theme = 'theme--light';
        }

        const elems = document.querySelectorAll('.hil-themed');
        for (let elem of elems) {
            elem.classList.remove('theme--dark');
            elem.classList.remove('theme--light');
            elem.classList.add(theme);
        }
        for (let elem of document.querySelectorAll('.hil-themed-text')) {
            if (theme == 'theme--dark') {
                elem.style.color = '#fff';
            } else {
                elem.style.color = '#000';
            }
        }
    }
    themeInput.parentElement.parentElement.addEventListener('click', themeUpdate);

    document.body.classList.add('hil-themed');
    document.body.classList.add(theme);


    const textBacklog = [];
    function sendText(text, persistent = false) {
        const oldValue = textArea.value;
        if (!textButton.classList.contains('v-btn--disabled')) {
            setValue(textArea, text);
            textButton.click();
            setValue(textArea, oldValue);
        } else if (persistent) {
            textBacklog.push(text);
        }
    }
    let textButtonObserver = new MutationObserver(function (mutations) {
        for (let mutation of mutations) {
            if (!textButton.classList.contains('v-btn--disabled') && textBacklog.length > 0) {
                const text = textBacklog.shift();
                sendText(text);
            }

        }
    });
    textButtonObserver.observe(textButton, { attributes: true, attributeFilter: ['class'] });


    let helperToggle;
    let helperDiv;
    let helperVisible = false;
    let toggleHelperDiv;
    if (showTutorial || options['testimony-mode'] || options['now-playing'] || options['smart-tn'] || options['tts']) {
        helperToggle = createIcon('dots-horizontal', 28, 'opacity: 70%; margin-top: 15px; right: calc(-100% + 46px); cursor: pointer;');
        row2.appendChild(helperToggle);

        helperDiv = document.createElement('div');
        helperDiv.className = 'hil-hide';
        helperDiv.style.cssText = 'transform: translateY(-10px); padding: 0 8px 0px;' + DEFAULT_TRANSITION;
        row2.appendChild(helperDiv);

        helperToggle.addEventListener('click', function () {
            toggleHelperDiv(!helperVisible)
        });

        toggleHelperDiv = function (visible) {
            helperVisible = visible;
            if (helperVisible) {
                helperDiv.classList.remove('hil-hide');
                helperDiv.style.removeProperty('transform');
            } else {
                helperDiv.classList.add('hil-hide');
                helperDiv.style.transform = 'translateY(-10px)';
            }
        }
    }


    if (showTutorial) {
        if (!options['seen-tutorial']) {
            toggleHelperDiv(true);
        }

        const div = document.createElement('div');
        div.style.cssText = 'width: 60%; text-align: center; margin: 0 auto; font-weight: 300;';

        const img = document.createElement('img');
        img.src = 'https://cdn.discordapp.com/attachments/873624494810484817/916742603339341824/holdit.png';
        img.style.width = '100%';
        div.appendChild(img);

        if (!options['seen-tutorial']) div.innerHTML += '<span style="font-weight: 400;">Thank you for installing Hold It.lol!</span><br>';
        div.innerHTML += '<span>Click on the </span><img src="https://cdn.discordapp.com/attachments/873624494810484817/916750432368480326/icon32.png" style="height: 24px;vertical-align: middle;user-select: all;"><span> icon in the </span><span style="font-weight: 400;">top-right of your browser</span><span> to check out your </span><span style="font-weight: 400;">Options</span><span>.</span>'

        helperDiv.appendChild(div);
    };


    function createRow(parent, transparent = false) {
        const div = document.createElement('div');
        div.className = 'hil-row';
        parent.appendChild(div);
        return div;
    }


    if (options['now-playing']) {
        const row = createRow(helperDiv);
        row.classList.add('hil-tab-row-now-playing');
        const span = document.createElement('span');
        span.innerHTML = 'Now Playing: …';
        row.appendChild(span);
    }


    const TabState = {
        NONE: {
            enabled: true,
            onEnable: function() {
                tabSeparator.classList.add('hil-hide');
            },
            onDisable: function() {
                tabSeparator.classList.remove('hil-hide');
            }
        },
        TESTIMONY: {},
        TN: {},
        TTS: {},
    }
    const tabRow = createRow(helperDiv);

    const tabSeparator = document.createElement('hr');
    tabSeparator.className = 'hil-row-separator hil-hide';
    helperDiv.appendChild(tabSeparator);
    
    const contentRow = createRow(helperDiv);
    contentRow.classList.add('hil-content-row')
    let tabState = TabState.NONE;
    function setState(state) {
        if (tabState.onDisable) tabState.onDisable();
        if (tabState.contentDiv) {
            tabState.contentDiv.classList.add('hil-hide');
        }
        if (tabState.tabButton) tabState.tabButton.classList.remove('hil-btn-tab-active');
        tabState.enabled = false;
        tabState = state;
        if (tabState.onEnable) tabState.onEnable();
        if (tabState.contentDiv) {
            tabState.contentDiv.classList.remove('hil-hide');
        }
        if (tabState.tabButton) tabState.tabButton.classList.add('hil-btn-tab-active');
        tabState.enabled = true;
    }
    function createTabDiv(state) {
        const div = document.createElement('div');
        div.className = 'hil-tab-content hil-hide';
        state.contentDiv = div;
        contentRow.appendChild(div);
        return div;
    }
    function createTabButton(state, text) {
        const button = createButton(function () {
            if (!state.enabled) setState(state);
            else setState(TabState.NONE);
        }, text, '', 'flex: 1 1 auto;max-width: 10rem;');
        tabRow.appendChild(button);
        state.tabButton = button;
        return button;
    }


    if (options['testimony-mode']) {
        const tabDiv = createTabDiv(TabState.TESTIMONY);
        const testimonyRow = createRow(tabDiv);

        const testimonyArea = document.createElement('textarea');
        testimonyArea.className = 'hil-themed-text';
        testimonyArea.style.cssText = 'display: none; width: 100%; height: 600px; resize: none; overflow: auto; padding: 5px; margin: 0; border: #552a2e 1px solid;';
        testimonyArea.placeholder = "Paste your testimony here.\nSeparate statements with line breaks.";
        textArea.parentElement.appendChild(testimonyArea);

        const testimonyDiv = document.createElement('div');
        testimonyDiv.className = 'hil-themed-text';
        testimonyDiv.style.cssText = 'display: none; width: 100%; height: 600px; overflow: auto; padding: 5px 0px; margin: 0; border: #7f3e44 1px solid;';
        textArea.parentElement.appendChild(testimonyDiv);

        let statements;
        let currentStatement;
        let statementCache = {};
        let lastStatementId = 0;
        function resetCache() {
            statementCache = {};
            lastStatementId = 0;
            window.postMessage(['clear_testimony_poses']);
        }
        
        let musicPlaying = false;
        
        let auto = false;
        let red = false;
        let crossExam = false;

        const primaryDiv = document.createElement('div');
        primaryDiv.style.cssText = 'display: none;' + DEFAULT_TRANSITION;

        let testimonyLocked = false;
        const lockTestimony = primaryButton(function () {
            if (!testimonyLocked && testimonyArea.value == "") return;
            testimonyLocked = !testimonyLocked;
            if (testimonyLocked) {

                lockTestimony.firstElementChild.classList.remove('mdi-check');
                lockTestimony.firstElementChild.classList.add('mdi-close');
                primaryDiv.style.display = 'block';

                testimonyArea.value = testimonyArea.value.trim();
                currentStatement = undefined;
                statements = testimonyArea.value.split('\n').filter(e => e.trim());

                let toResetCache = true;
                for (let statement of statements) {
                    if (!(statement in statementCache)) continue;
                    toResetCache = false;
                    break;
                }
                if (toResetCache) resetCache();

                testimonyDiv.textContent = '';
                for (let i = 0; i < statements.length; i++) {
                    const statement = statements[i];

                    const div = document.createElement('div');
                    div.style.cssText = 'position: relative; padding: 0px 0px 16px 5px; cursor: pointer; margin-bottom: 9px;' + DEFAULT_TRANSITION;
                    div.dataset.statement = i;

                    div.addEventListener('click', function () {
                        if (div.querySelector(':scope .pose-message:hover')) return;
                        toStatement(i);
                    });

                    div.appendChild(document.createElement('span'));
                    div.lastElementChild.innerText = statement;

                    const pose = document.createElement('div');
                    pose.className = 'hil-themed pose-message v-messages v-messages__message ' + theme;
                    pose.style.cssText = 'position: absolute;';
                    if (statement in statementCache) {
                        let poseName = statementCache[statement].poseName;
                        if (!poseName) poseName = UNDEFINED_POSE_NAME;
                        pose.innerText = poseName;
                        pose.dataset.pose = poseName;
                    }
                    pose.addEventListener('mouseenter', () => { if (pose.dataset.pose) pose.innerText = 'Click to clear pose'; });
                    pose.addEventListener('mouseleave', () => { if (pose.dataset.pose) pose.innerText = pose.dataset.pose; });
                    pose.addEventListener('click', () => {
                        pose.dataset.pose = '';
                        pose.innerText = '';
                        if (statementCache[statement] === undefined) return;
                        delete statementCache[statement].poseName;
                        window.postMessage([
                            'clear_testimony_pose',
                            statementCache[statement].id,
                        ]);
                    });
                    div.appendChild(pose);

                    testimonyDiv.appendChild(div);
                    setTimeout(function () {
                        div.style.marginBottom = '20px';
                        div.style.padding = '5px';
                    }, 1);
                }

                if (red && testimonyDiv.childElementCount != 0) {
                    testimonyDiv.firstElementChild.firstElementChild.style.color = '#f00';
                    testimonyDiv.lastElementChild.firstElementChild.style.color = '#f00';
                }

                testimonyArea.style.display = 'none';
                testimonyDiv.style.display = 'block';

            } else {

                lockTestimony.firstElementChild.classList.add('mdi-check');
                lockTestimony.firstElementChild.classList.remove('mdi-close');
                primaryDiv.style.display = 'none';

                testimonyArea.style.display = 'block';
                testimonyDiv.style.display = 'none';

            }
        }, '', 'display: none; background-color: #7f3e44 !important; margin: 0 4px;', createIcon('check'));
        textButton.parentElement.parentElement.insertBefore(lockTestimony, textButton.parentElement);

        const buttonNextStatement = primaryButton(undefined, '', 'background-color: #552a2e !important; margin-left: 4px;', createIcon('send'));
        const buttonPrevStatement = primaryButton(undefined, '', 'background-color: #552a2e !important; margin-left: 4px;', createIcon('send', 24, 'transform: scaleX(-1);'));
        primaryDiv.appendChild(buttonPrevStatement);
        primaryDiv.appendChild(buttonNextStatement);

        textButton.parentElement.parentElement.appendChild(primaryDiv);


        TabState.TESTIMONY.onEnable = function() {
            textArea.style.display = 'none';

            textButton.parentElement.style.display = 'none';
            lockTestimony.style.display = 'flex';
            if (testimonyLocked) {
                primaryDiv.style.display = 'flex';
                testimonyDiv.style.display = 'block';
            } else {
                testimonyArea.style.display = 'block';
            }
        }
        TabState.TESTIMONY.onDisable = function() {
            testimonyArea.style.display = 'none';
            testimonyDiv.style.display = 'none';
            textArea.style.display = 'block';

            textButton.parentElement.style.display = 'block';
            lockTestimony.style.display = 'none';
            primaryDiv.style.display = 'none';
        }
        createTabButton(TabState.TESTIMONY, 'Testimony Mode');


        const inputRow = createRow(tabDiv);
        function testimonyInput(id, placeholder, onchange = undefined) {
            const input = document.createElement('input');
            input.id = id;
            input.autocomplete = 'on';
            input.className = 'hil-themed hil-row-textbox v-size--default v-sheet--outlined hil-themed-text ' + theme;
            input.style.width = '10rem';
            input.placeholder = placeholder;
    
            input.addEventListener('click', () => input.setSelectionRange(0, input.value.length));
            if (onchange) input.addEventListener('change', onchange);
    
            inputRow.appendChild(input);
            return input;
        }
        const musicInput = testimonyInput('hil-tm-music', 'Testimony music', () => musicPlaying = false);
        const selectInput = testimonyInput('hil-tm-select', 'Cross-exam click sound');

        function inputToTag(value, tagName) {
            const match = value.match(/[0-9]+/g)
            if (match && ('[#' + tagName + '0]').includes(value.replaceAll(/[0-9]+/g, '0'))) {
                const id = match[0];
                return '[#' + tagName + id + ']';
            } else {
                return '';
            }
        }

        testimonyRow.appendChild(iconToggleButton(function() {
            red = !red;
            if (testimonyDiv.childElementCount > 0) {
                if (red) {
                    testimonyDiv.firstElementChild.firstElementChild.style.color = '#f00';
                    testimonyDiv.lastElementChild.firstElementChild.style.color = '#f00';
                } else {
                    testimonyDiv.firstElementChild.firstElementChild.style.removeProperty('color');
                    testimonyDiv.lastElementChild.firstElementChild.style.removeProperty('color');
                }
            }
            return red;
        }, 'Red Beginning/End', 'hil-testiony-btn'));
        testimonyRow.appendChild(iconToggleButton(function() { return crossExam = !crossExam; }, 'Cross-exam mode', 'hil-testiony-btn'));
        testimonyRow.appendChild(iconToggleButton(function() { return auto = !auto; }, 'Use < > from chat', 'hil-testiony-btn'));


        function setElemPoseName(statementElem, name) {
            statementElem.querySelector('div.pose-message').innerText = name;
            statementElem.querySelector('div.pose-message').dataset.pose = name;
        }

        function toStatement(statement) {
            let statementElem;
            if (currentStatement != statement) {
                currentStatement = statement;

                let added = false;
                let removed = false;
                for (let elem of testimonyDiv.children) {
                    if (!removed && elem.style.backgroundColor != '') {
                        elem.style.removeProperty('background-color');
                        removed = true;
                    } else if (!added && elem.dataset.statement == String(currentStatement)) {
                        elem.style.backgroundColor = '#552a2e';
                        statementElem = elem;
                        added = true;
                    }
                    if (removed && added) break;
                }
            } else {
                for (let elem of testimonyDiv.children) {
                    if (elem.dataset.statement != String(currentStatement)) continue;
                    statementElem = elem;
                    break;
                }
            }

            const statementText = statements[statement];
            const music = inputToTag(musicInput.value, 'bgm');
            const continueSound = inputToTag(selectInput.value, 'bgs');

            let text = statementText;

            let preText;
            if (red && (statement == 0 || statement == statements.length - 1)) {
                text = '[##nt][#/r]' + text + '[/#]';
            } else if (crossExam) {
                text = text.replaceAll(/\[#.*?\]/g, '');
                text = text.replaceAll('[/#]', '');
                text = continueSound + '[#/g]' + text + '[/#]';
            }
            if (!crossExam) {
                text = '[##tm]' + text;
            }

            if (!crossExam && statement == statements.length - 1) {
                if (red) {
                    text = TAG_MUSIC_FADE_OUT + text;
                    musicPlaying = false;
                } else {
                    text = text + TAG_MUSIC_FADE_OUT;
                    musicPlaying = false;
                }
            } else if (!musicPlaying && music && (!red || statement != 0)) {
                text = music + text;
                musicPlaying = true;
            } else if (!crossExam && statement == 0 && music) {
                text = TAG_MUSIC_STOP + text;
                musicPlaying = false;
            }

            if (statementCache[statementText] === undefined) {
                statementCache[statementText] = {
                    id: lastStatementId
                }
                lastStatementId += 1;
            } else if (statementCache[statementText].poseName) {
                setElemPoseName(statementElem, statementCache[statementText].poseName);
            }

            text = '[##tmid' + statementCache[statementText].id + ']' + text;
            sendText(text);
        }

        window.addEventListener('message', function(event) {
            const [action, data] = event.data;
            if (action !== 'set_statement_pose_name') return;
            const statementText = Object.keys(statementCache).find(text => statementCache[text].id === data.id);
            const statementObj = statementCache[statementText];
            statementObj.poseName = data.name;

            if (!testimonyLocked) return;

            for (let statementElem of testimonyDiv.children) {
                if (statementElem.querySelector('span').innerText !== statementText) continue;
                setElemPoseName(statementElem, data.name);
            }            
        });

        function loopTo(statement) { toStatement(statement); }

        function nextStatement() {
            const edges = crossExam && red && statements.length > 1;
            if (currentStatement == undefined) {
                toStatement(0);
            } else if (currentStatement >= statements.length - (edges ? 2 : 1)) {
                loopTo(edges ? 1 : 0);
            } else {
                toStatement(currentStatement + 1);
            }
        }
        function prevStatement() {
            const edges = crossExam && red && statements.length > 1;
            if (currentStatement == undefined) {
                toStatement(statements.length - 1);
            } else if (currentStatement <= edges ? 1 : 0) {
                loopTo(statements.length - (edges ? 2 : 1));
            } else {
                toStatement(currentStatement - 1);
            }
        }

        buttonNextStatement.addEventListener('click', nextStatement);
        buttonPrevStatement.addEventListener('click', prevStatement);

        let characterObserver = new MutationObserver(function (mutations) {
            for (let mutation of mutations) {
                if (mutation.attributeName != "style" || mutation.oldValue == undefined) continue;

                const oldIcon = mutation.oldValue.match(/background-image: (url\(\".*?\"\));/)[1];
                const newIcon = mutation.target.style.backgroundImage;
                if (oldIcon !== newIcon) {
                    resetCache();
                    for (let elem of document.querySelectorAll('.pose-message')) {
                        elem.dataset.pose = '';
                        elem.innerText = '';
                    }
                };
            }
        });

        new MutationObserver(function (mutations, observer) {
            for (let mutation of mutations) {
                for (let node of mutation.addedNodes) {
                    if (!node.matches('div.v-image__image[style*="background-image:"]')) continue;

                    characterObserver.observe(node, {
                        attributes: true,
                        attributeOldValue: true
                    });

                    observer.disconnect();
                }
            }
        }).observe(document.querySelector('div.col-sm-3.col-2 div.icon-character'), { childList: true });

        states.testimonyArrow = function(arrow) {
            if (TabState.TESTIMONY.enabled && testimonyLocked && auto) {
                if (arrow == '>') nextStatement();
                else if (arrow == '<') prevStatement();
            }
        }
        states.testimonyIndex = function(statement) {
            if (TabState.TESTIMONY.enabled && testimonyLocked && auto) {
                let statementI = statement - 1;
                if (red) statementI += 1;
                let max = statements.length;
                if (red) max -= 1;
                if (statementI < 0 || statementI >= max) return;
                toStatement(statementI);
            }
        }
    }



    if (options['smart-tn']) {
        createTabButton(TabState.TN, 'TN animations');
        const tnDiv = createTabDiv(TabState.TN);
        const tnRow = createRow(tnDiv);
        
        const description = document.createElement('span');
        description.textContent = 'TN pose name keywords:'
        description.style.margin = 'auto 10px';
        description.style.whiteSpace = 'nowrap';
        tnRow.appendChild(description);

        // const patternInputs = document.createElement('div');
        // patternInputs.style.display = 'flex';
        // tnRow.appendChild(patternInputs);
        function addPatternInput(value = '') {
            const input = document.createElement('input');
            input.className = 'hil-themed hil-row-textbox v-size--default v-sheet--outlined hil-tn-pattern hil-themed-text ' + theme;
            input.placeholder = 'TN';
            input.value = value;
            input.addEventListener('click', () => input.setSelectionRange(0, input.value.length));
            input.addEventListener('change', onPatternsUpdate);
            tnRow.appendChild(input);
            return input;
        }
        function onPatternsUpdate() {
            const patterns = [];
            const toRemove = [];
            for (let input of tnRow.querySelectorAll('input')) {
                if (input.value === '') {
                    toRemove.push(input);
                    continue;
                }
                patterns.push(input.value);
            }
            toRemove.forEach(elem => elem.remove());
            addPatternInput('');

            optionSet('smart-tn-patterns', patterns);
            window.postMessage([
                'set_options',
                options
            ]);
        }

        const patterns = options['smart-tn-patterns'] || ['TN'];
        for (let pattern of patterns) {
            addPatternInput(pattern);
        }
        addPatternInput('');

        const optionsRow = createRow(tnDiv);
        optionsRow.appendChild(iconToggleButton(function() {
            optionSet('tn-toggle-on-screen', !options['tn-toggle-on-screen']);
            window.postMessage([
                'set_options',
                options
            ]);
            return options['tn-toggle-on-screen'];
        }, 'Only TN when character is on screen', '', '', options['tn-toggle-on-screen'] !== undefined ? options['tn-toggle-on-screen'] : true));
    }



    const menuTitles = {};
    const assetWindowButtons = {};
    let dualEffectMode = false;

    function premakeMenus() {
        if (!document.querySelector('div.v-dialog__content > div.v-dialog > div.v-card.v-sheet:not(.v-card--flat)')) {
            document.body.classList.add('hil-loading-menus');
        }

        document.querySelector('.v-btn__content .mdi-menu').click();
        document.querySelector('.v-btn__content .mdi-cog').click();
        document.querySelector('.v-btn__content .mdi-bookshelf').click();

        for (let span of document.querySelectorAll('span.v-btn__content')) {
            if (span.textContent === ' Preload Resources ') {
                span.parentElement.previousElementSibling.firstElementChild.firstElementChild.click();
                break;
            }
        }

        const buttons = document.querySelector('.mdi-palette').parentElement.parentElement.parentElement.querySelectorAll('button');
        for (let button of buttons) {
            button.click();

            if (options['menu-hover']) {
                button.addEventListener('mouseenter', function () {
                    let toFocus = false;
                    if (document.activeElement == textArea) toFocus = true;
                    button.click();
                    if (toFocus) textArea.focus();
                });
            }
        }

        setTimeout(function () {

            const courtRecordContainer = [...document.querySelectorAll('span.my-auto')].find(span => span.textContent === ' Court Record ')?.parentElement;
            [...courtRecordContainer.querySelectorAll('.v-btn__content')].find(span => span.textContent === ' Close ')?.click();

            const menus = app.querySelectorAll(':scope > div[role="menu"]');
            for (let menu of menus) {
                const titleElem = menu.querySelector('.v-list-item__title') || menu.querySelector('.v-label');
                if (titleElem != null) {
                    const title = titleElem.innerText;
                    menuTitles[title] = menu;

                    if (options['menu-auto-close'] && !MENUS_NOT_AUTO_CLOSE.includes(title)) {
                        for (let button of menu.querySelectorAll('.v-btn:not(.success)')) {
                            if (button.querySelector('span.v-btn__content').textContent.slice(0, 6) === 'Manage') continue;
                            button.addEventListener('click', clickOff);
                        }
                    }
                };

                if (true) { // sound-search
                    for (let input of menu.querySelectorAll('input[type="text"]')) {
                        input.addEventListener('input', function () {
                            const inputContent = getInputContent();
                            if (inputContent) {
                                inputContent.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 40 }));
                            }
                        });
                    }
                }
            }

            for (let button of buttons) button.click();


            if (options['dual-button']) {
                function flashButtonListener(strength) {
                    if (dualEffectMode) {
                        setTimeout(function () {
                            const pos = textArea.selectionEnd;
                            const tag = '[#s' + strength + ']';
                            insertValue(textArea, tag, pos);
                        }, 1)
                    }
                }
                const flashButtons = menuTitles['Flash'].querySelectorAll('button');
                flashButtons[0].addEventListener('click', () => flashButtonListener('s'));
                flashButtons[1].addEventListener('click', () => flashButtonListener('m'));
                flashButtons[2].addEventListener('click', () => flashButtonListener('l'));
            }


            if (options['sound-insert']) {
                for (let menuTitle of ['Sound', 'Music']) {
                    const menu = menuTitles[menuTitle];
                    const combobox = menu.querySelector('[role="combobox"]');
                    assetWindowButtons[menuTitle] = menu.querySelector('.indigo');
                    const input = combobox.querySelector('input[type="text"]');
                    let defaultOption;
                    input.addEventListener('focus', function () {
                        defaultOption = input.value;
                    })
                    let menuObserver = new MutationObserver(function () {
                        setTimeout(function () {
                            if (!(combobox.ariaExpanded == "false" && input.value != defaultOption && !modifierKeys.shift)) return;
                            menu.querySelector('.v-btn.primary').click();
                            textArea.focus();
                        }, 1);
                    });
                    menuObserver.observe(combobox, {
                        attributes: true,
                        attributeFilter: ['aria-expanded']
                    });
                }
            }
        }, 1);
    }
    premakeMenus();



    const menuButtonFlash = document.querySelector('button .mdi-white-balance-sunny').parentElement.parentElement;
    const menuButtonShake = document.querySelector('button .mdi-vibrate').parentElement.parentElement;
    let menuButtonDual;

    if (options['dual-button']) {
        function configureDualButton() {

            menuButtonDual = menuButtonShake.cloneNode(true);
            {
                const icon = menuButtonDual.querySelector('i');
                icon.classList.remove('mdi-vibrate');
                icon.classList.add('mdi-blur-radial');
            }

            function listener(button, title, description) {
                const menu = menuTitles['Flash'];
                const rect = button.getBoundingClientRect();
                menu.style.left = rect.right + 'px';
                menu.style.top = rect.top + 'px';

                const titleDiv = menuTitles['Flash'].querySelector('.v-list-item__title');
                titleDiv.textContent = title;
                titleDiv.nextElementSibling.textContent = description;
            }

            const eventName = options['menu-hover'] ? 'mouseenter' : 'click';

            menuButtonFlash.addEventListener(eventName, function () {
                listener(menuButtonFlash, TEXT_EFFECT_FLASH_TITLE, TEXT_EFFECT_FLASH_DESCRIPTION);
                dualEffectMode = false;
            });

            menuButtonDual.addEventListener(eventName, function () {
                menuButtonFlash.click();
                listener(menuButtonDual, TEXT_EFFECT_DUAL_TITLE, TEXT_EFFECT_DUAL_DESCRIPTION);
                dualEffectMode = true;
            });

            menuButtonShake.parentElement.insertBefore(menuButtonDual, menuButtonShake.nextElementSibling);

        }
        configureDualButton();
    }

    setTimeout(() => {
        for (let label of document.querySelectorAll('label')) {
            if (label.textContent !== 'Pre-animate') continue;

            const preToggle = label.parentElement.parentElement.parentElement;
            const toggles = preToggle.parentElement;
            const testimonyToggle = toggles.parentElement.querySelector(':scope > .v-input--switch');
            toggles.classList.add('hil-message-toggles');

            if (options['no-talk-toggle'] || options['smart-tn']) {
                const activeToggleClasses = ['v-input--is-label-active', 'v-input--is-dirty', 'primary--text'];

                if (options['smart-pre']) {
                    const preToggle = label.parentElement.parentElement.parentElement;
                    const preToggleThumb = preToggle.querySelector('.v-input--switch__thumb');
                    preToggle.addEventListener('click', function() {
                        window.postMessage(['pre_animate_toggled']);
                    });
                    window.addEventListener('message', function(event) {
                        const action = event.data[0];
                        if (action !== 'pre_animate_locked') return;
                        preToggleThumb.className += ' mdi mdi-lock hil-toggle-thumb-lock';
                        preToggleThumb.classList.remove('v-input--switch__thumb');
                    });
                    new MutationObserver(function () {
                        if (!preToggleThumb.classList.contains('hil-toggle-thumb-lock')) return;
                        preToggleThumb.classList.remove('hil-toggle-thumb-lock');
                        preToggleThumb.classList.remove('mdi-lock');
                        preToggleThumb.classList.remove('mdi');
                        preToggleThumb.classList.add('v-input--switch__thumb');
                    }).observe(document.querySelector('.col-sm-9.col-10 > div > div.swiper-container,.col-sm-9.col-10 > div > div.v-text-field').parentElement, {
                        childList: true,
                        subtree: true,
                        characterData: true,
                        attributeFilter: [ 'class' ],
                    });
                }

                const flipToggle = label.parentElement.parentElement.parentElement.nextElementSibling;
                
                function createToggle(onchange, text, checked = false) {
                    const newToggle = flipToggle.cloneNode(true);

                    for (let elem of [newToggle, ...newToggle.querySelectorAll('*')]) {
                        if (elem.className.includes('theme--')) elem.classList.add('hil-themed');
                    }
                    
                    const input = newToggle.querySelector('input');
                    input.removeAttribute('id');
                    const label = newToggle.querySelector('label');
                    label.removeAttribute('for')
                    label.textContent = text;
                    
                    newToggle.addEventListener('click', function() {
                        input.checked = !input.checked;
                        input.ariaChecked = input.checked;
                        if (input.checked) {
                            activeToggleClasses.forEach(cls => newToggle.classList.add(cls));
                            newToggle.querySelectorAll('.v-input--selection-controls__input div').forEach(div => div.classList.add('primary--text'));
                        } else {
                            activeToggleClasses.forEach(cls => newToggle.classList.remove(cls));
                            newToggle.querySelectorAll('.v-input--selection-controls__input div').forEach(div => div.classList.remove('primary--text'));
                        }
                        onchange(input.checked);
                    });

                    if (checked) {
                        activeToggleClasses.forEach(cls => newToggle.classList.add(cls));
                        newToggle.querySelectorAll('.v-input--selection-controls__input div').forEach(div => div.classList.add('primary--text'));
                    }

                    return newToggle;
                }

                const toggleData = [];
                options['no-talk-toggle'] && toggleData.push({label: 'No Talking', checked: false, onchange: function(checked) {
                    window.postMessage(['set_socket_state', {
                            [ 'no-talk' ]: checked
                        }]);
                }});
                options['smart-tn'] && toggleData.push({label: 'TN-animate', checked: options['tn-toggle-value'], onchange: function(checked) {
                    optionSet('tn-toggle-value', checked);
                    window.postMessage([
                        'set_options',
                        options
                    ]);
                }});
                for (let i = 0; i < toggleData.length; i++) {
                    const { label, checked, onchange } = toggleData[i];
                    const toggle = createToggle(function(checked) {
                        onchange(checked);
                    }, label, checked);

                    if (i !== toggleData.length - 1) toggle.classList.add('mr-4');
                    flipToggle.parentElement.appendChild(toggle);
                }
            }

            toggles.appendChild(testimonyToggle);
            for (let toggle of toggles.children) {
                toggle.style.cssText = 'margin-right:16px!important';
            }

            if (options['old-toggles']) {
                const optionsIcon = document.querySelector('.v-btn__content .v-icon.mdi-cog');
                optionsIcon.classList.remove('mdi-cog');
                optionsIcon.classList.add('mdi-tooltip-image');

                new MutationObserver(function () {
                    if (optionsIcon.classList.contains('mdi-cog')) {
                        optionsIcon.classList.remove('mdi-cog');
                        optionsIcon.classList.add('mdi-tooltip-image');
                    }
                }).observe(optionsIcon, { attributes: true, attributeFilter: ['class'] });

                optionsIcon.parentElement.parentElement.parentElement.parentElement.parentElement.prepend(toggles);
            }

            break;
        }

        if (options['fullscreen-evidence']) {
            for (let span of document.querySelectorAll('.v-btn__content')) {
                if (span.textContent !== ' Present ') continue;

                const presentButton = span.parentElement;
                presentButton.setAttribute('hil-button', 'present-evd');
                const fullscreenButton = presentButton.cloneNode(true);
                fullscreenButton.setAttribute('hil-button', 'fullscreen-evd');
                presentButton.parentElement.prepend(fullscreenButton);
                window.postMessage(['fullscreen_button_added']);

                fullscreenButton.removeAttribute('disabled');
                fullscreenButton.querySelector('i').classList.remove('mdi-hand-pointing-up');
                fullscreenButton.querySelector('i').classList.add('mdi-fit-to-screen');
                fullscreenButton.querySelector('span').lastChild.textContent = 'Show full';
                fullscreenButton.addEventListener('click', function () {
                    presentButton.click();
                    setTimeout(function() {
                        const text = textArea.value;
                        const match = text.match(/\[#evdi[0-9]+\]$/);
                        if (!match) return;
                        textArea.value = text.slice(0, match.index) + match[0].replace('[#evdi', '[#evd');
                    }, 1);
                });

                break;
            }
        }
    }, 1);


    if (options['comma-pause']) {
        function commaAutoPause() {
            textArea.addEventListener('input', function () {
                const typeIndex = textArea.selectionStart - 1;
                const value = textArea.value;
                const character = value[typeIndex];
                if (character == ',') {
                    if (PAUSE_PUNCTUATION.includes(value[typeIndex - 1])) {
                        const tag = TAG_PAUSE_100;
                        insertReplaceValue(textArea, tag, typeIndex, typeIndex + 1);
                    } else {
                        const match = value.slice(0, typeIndex).match(/\[#p([0-9]*)\]$/);
                        if (match) {
                            let n = Number(match[1]) + 100;
                            n = n < 5000 ? n : 5000;
                            const tag = '[#p' + n + ']';
                            textValue(value.slice(0, typeIndex - match[0].length) + tag + value.slice(typeIndex + 1));
                            textArea.selectionStart = typeIndex + tag.length - match[0].length;
                            textArea.selectionEnd = textArea.selectionStart;
                        }
                    }
                }
            });
        }
        commaAutoPause();
    }



    if (options['ctrl-effects']) {
        function check(event, keyCodeMax = 51, keyCodeMin = 49) {
            return (event.ctrlKey || event.metaKey) && event.keyCode >= keyCodeMin && event.keyCode <= keyCodeMax;
        }

        document.addEventListener('keydown', function (event) {
            if (check(event, 52)) {
                event.preventDefault();
            }
        })

        textArea.addEventListener('keydown', function (event) {
            if (check(event, 51)) {
                const pos = textArea.selectionEnd;
                let strength;
                switch (event.keyCode) {
                    case 49:
                        strength = 's';
                        break;
                    case 51:
                        strength = 'l';
                        break;
                    default:
                        strength = 'm';
                }
                const tag = '[#f' + strength + '][#s' + strength + ']';
                insertValue(textArea, tag, pos);
                textArea.selectionEnd = pos + tag.length;
                textArea.selectionStart = textArea.selectionEnd;
            }
        })
    }



    if (options['bulk-evidence']) {
        let buttonRow;
        for (let i of document.querySelectorAll('.mdi-restart')) {
            if (i.parentElement.textContent != " Clear ") continue;
            buttonRow = i.parentElement.parentElement.parentElement;
            break;
        }
        const inputRow = buttonRow.parentElement.parentElement.firstElementChild;
        const evidenceList = buttonRow.parentElement.parentElement.nextElementSibling.nextElementSibling;

        const tabButton = document.createElement('div');
        tabButton.className = 'hil-evidence-button v-btn v-btn--plain v-size--small primary--text ' + theme;
        tabButton.style.cssText = 'margin-left: 32px; cursor: pointer';
        const tabSpan = document.createElement('span');
        tabSpan.className = 'v-btn__content';
        tabSpan.textContent = 'Import From Table';
        const tabDiv = document.createElement('div');
        tabDiv.className = 'hil-evidence-card hil-hide hil-themed ' + theme;
        tabButton.appendChild(tabSpan);
        buttonRow.appendChild(tabButton);
        app.appendChild(tabDiv);

        let tabOpen = false;
        document.addEventListener('click', function () {
            if (!tabOpen && document.querySelector('.hil-evidence-button:hover')) {
                tabOpen = true;
                tabDiv.classList.remove('hil-hide');
                const box = tabButton.getClientRects()[0];
                tabDiv.style.top = buttonRow.getClientRects()[0].bottom + 'px';
                tabDiv.style.left = (box.left + box.width / 2 - tabDiv.clientWidth / 2) + 'px';
                return;
            }
            if (document.querySelector('.hil-evidence-card:hover')) return;
            tabOpen = false;
            tabDiv.classList.add('hil-hide');
        });


        tabDiv.innerHTML = '<div class="hil-evidence-title">Paste a table here</div><div id="hil-evidence-area" class="hil-themed ' + theme + '" contenteditable="true"></div><div class="hil-evidence-submit v-btn hil-themed ' + theme + '">Submit</div><div class="hil-evidence-error error--text"></div>';
        const pasteArea = tabDiv.querySelector('#hil-evidence-area');
        const error = tabDiv.querySelector('.hil-evidence-error');

        pasteArea.addEventListener("input", function () {
            for (let table of pasteArea.querySelectorAll(':not(:scope) > table')) {
                pasteArea.appendChild(table);
            }
            for (let table of pasteArea.querySelectorAll('table')) {
                if (table.querySelector('thead')) table.querySelector('thead').remove();
                if (table.querySelector('tfoot')) table.querySelector('tfoot').remove();
                const tbody = table.querySelector('tbody');
                if (tbody) {
                    while (tbody.children.length > 0) {
                        table.appendChild(tbody.children[0]);
                    }
                }

                for (let child of table.querySelectorAll(':scope > :not(tr):not(td):not(th)')) child.remove();
            }
            for (let node of pasteArea.childNodes) {
                if (node.nodeType == 1 && node.nodeName == 'TABLE') continue;
                node.remove();
            }
            for (let elem of pasteArea.querySelectorAll('.hil-evd-warning')) elem.classList.remove('hil-evd-warning');
            for (let elem of pasteArea.querySelectorAll('.hil-evd-error')) elem.classList.remove('hil-evd-error');
            for (let elem of pasteArea.querySelectorAll('.hil-evd-row')) elem.classList.remove('hil-evd-row');
            error.textContent = '';
        });


        const evidenceButton = buttonRow.firstElementChild;
        const evidenceBacklog = [];
        let adding = false;
        function addEvidence(name, image, desc) {
            if (!evidenceButton.classList.contains('v-btn--loading') && !adding) {
                const currentImgs = [].map.call(evidenceList.children, (elem) => elem.querySelector('.v-image__image')?.style.backgroundImage);
                if (currentImgs.includes('url("' + image + '")')) image += '?';

                setValue(inputRow.querySelector(':scope > :nth-child(1) input'), name);
                setValue(inputRow.querySelector(':scope > :nth-child(2) input'), image);
                setValue(inputRow.querySelector(':scope > :nth-child(5) textarea'), desc);
                adding = true;
                setTimeout(() => {
                    evidenceButton.click();
                    adding = false;
                }, 0);
            } else {
                evidenceBacklog.push([name, image, desc]);
            }
        }

        const evidenceButtonObserver = new MutationObserver(function (mutations) {
            for (let mutation of mutations) {
                if (!evidenceButton.classList.contains('v-btn--loading') && evidenceBacklog.length > 0) {
                    const tuple = evidenceBacklog.shift();
                    addEvidence(...tuple);
                }

            }
        });
        evidenceButtonObserver.observe(evidenceButton, { attributes: true, attributeFilter: ['class'] });


        const button = tabDiv.querySelector('.hil-evidence-submit');
        button.addEventListener('click', function () {

            const tableCellContents = [];
            for (let table of pasteArea.querySelectorAll(':scope > table')) {
                const rows = table.querySelectorAll(':scope > tr');
                const cellContentLengths = { 0: 0, 1: 0, 2: 0 };
                const cellContents = { contents: [] };
                tableCellContents.push(cellContents);
                for (let i = 0; i < rows.length; i++) {
                    const anchorRow = rows[i];
                    if (anchorRow.childElementCount < 2 || anchorRow.querySelector('img') == null) {
                        anchorRow.classList.add('hil-evd-warning');
                        continue;
                    };

                    let maxRowSpan = 1;
                    for (let cell of anchorRow.children) {
                        if (cell.rowSpan > maxRowSpan) maxRowSpan = cell.rowSpan;
                    }
                    anchorRow.classList.add('hil-evd-row');


                    const contents = {};
                    for (let j = 0; j < anchorRow.childElementCount; j++) {
                        const index = j > 2 ? 2 : j;
                        const cell = anchorRow.children[j];
                        if (cell.querySelector('img')) {
                            contents[index] = cell.querySelector('img').src;
                            continue;
                        }
                        cellContentLengths[index] = cellContentLengths[index] + cell.innerText.length;
                        if (j > 2) {
                            contents[index] += EVIDENCE_DESC_SEPARATOR + cell.innerText;
                        } else {
                            contents[index] = cell.innerText;
                        }
                    }
                    for (let j = 0; j < maxRowSpan - 1; j++) {
                        const row = rows[i + j + 1];
                        const childrenContents = [].map.call(row.children, td => td.innerText);
                        contents[2] += EVIDENCE_DESC_SEPARATOR + childrenContents.join(EVIDENCE_DESC_SEPARATOR);
                        const childrenLengths = childrenContents.map(text => text.length);
                        for (length in childrenLengths) {
                            cellContentLengths[2] += length;
                        }
                    }

                    cellContents.contents.push(contents);


                    i += maxRowSpan - 1;
                }
                let indexLengths = Object.keys(cellContentLengths).map(key => [key, cellContentLengths[key]]);
                indexLengths = indexLengths.sort((a, b) => a[1] - b[1]);
                cellContents.imageIndex = Number(indexLengths[0][0]);
                cellContents.nameIndex = Number(indexLengths[1][0]);
                cellContents.descIndex = Number(indexLengths[2][0]);


                const names = table.querySelectorAll(':scope > .hil-evd-row > :nth-child(' + (cellContents.nameIndex + 1) + ')');
                for (let i = 0; i < names.length; i++) {
                    const nameElem = names[i];
                    const text = nameElem.textContent;
                    if (text.length > EVIDENCE_MAX_LENGTH_NAME) {
                        nameElem.classList.add('hil-evd-error');
                        nameElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        error.textContent = 'Name on row ' + i + " can\'t be longer than " + EVIDENCE_MAX_LENGTH_NAME + '!';
                        return;
                    }
                }

            }

            for (let table of tableCellContents) {
                for (let tuple of table.contents) {
                    let name = tuple[table.nameIndex];
                    let image = tuple[table.imageIndex];
                    let descOrig = tuple[table.descIndex]
                    let desc = descOrig.replace(/\s\s+/g, ' ');

                    if (image.slice(-3) == '=s0') {
                        image = image.slice(0, -3);
                    }
                    if (desc.length > EVIDENCE_MAX_LENGTH_DESC) {
                        const cutDesc = descOrig.replace(/(\s)\s+/g, '$1').slice(0, EVIDENCE_MAX_LENGTH_DESC - EVIDENCE_DESC_TOO_LONG.length);

                        let cut;
                        if (cutDesc.lastIndexOf('\n') > 0) cut = cutDesc.lastIndexOf('\n');
                        else if (cutDesc.lastIndexOf(' ') > 0) cut = cutDesc.lastIndexOf(' ');
                        else cut = cutDesc.length;

                        desc = desc.slice(0, cut) + EVIDENCE_DESC_TOO_LONG;
                    }

                    addEvidence(name, image, desc);
                }
            }

        });
    }


    if (options['sound-insert']) {
        function checkModifierKeys(event) {
            modifierKeys.shift = event.shiftKey;
        }
        document.addEventListener('keydown', checkModifierKeys);
        document.addEventListener('keyup', checkModifierKeys);
    }


    const chatObserver = new MutationObserver(function () {
        if (options['convert-chat-urls']) {
            for (let messageNode of chat.children) {
                const messageIcon = messageNode.querySelector('i');
                if (!messageIcon.matches('.mdi-account,.mdi-crown,.mdi-account-tie')) continue;

                const messageTextDiv = messageNode.querySelector('.chat-text');
                const html = messageTextDiv.innerHTML;
                if (html.includes('</a>')) continue;

                const match = html.match(URL_REGEX);
                if (match === null) continue;

                let url = match[0];
                if (url.match('http:\/\/') !== null) url = 'https' + url.slice(4);
                else if (url.match('https:\/\/') === null) url = 'https://' + url;
                messageTextDiv.innerHTML = html.replaceAll(
                    URL_REGEX,
                    '<a target="_blank" href="' + url + '">$1</a>$2',
                );
            }
        }

        const messageNode = chat.lastElementChild;
        const messageIcon = messageNode.querySelector('i');
        const messageTextDiv = messageNode.querySelector('.chat-text');
        const messageText = messageTextDiv.innerText;

        if (musicPlaying && messageText.includes(STOP_MUSIC_TEXT)) {
            musicPlaying = false;
        }

        if (options['testimony-mode']) {
            if (testRegex(messageText, '[> ]*') && messageText.indexOf('>') !== -1) states.testimonyArrow('>');
            else if (testRegex(messageText, '[< ]*') && messageText.indexOf('<') !== -1) states.testimonyArrow('<');
            else if (testRegex(messageText, '<[0-9]*?>')) states.testimonyIndex(Number(messageText.slice(1, -1)));
        }

        if (options['tts'] && states.ttsEnabled && states.ttsReadLogs && !messageIcon.matches('.mdi-account,.mdi-crown,.mdi-account-tie')) {
            chrome.runtime.sendMessage(["tts-speak", {text: messageNode.innerText.replaceAll('\n', ' ')}]);
        }

        // if (options['chat-fix']) {
        //     if (chatBox.scrollTop + chatBox.clientHeight > chatBox.scrollHeight - 25) {
        //         chatBox.scrollTop = chatBox.scrollHeight
        //     } else {
        //         chatBox.scrollTop -= messageNode.clientHeight
        //     }

        //     const baseNodeDiv = currentSelectionState.baseNodeDiv;
        //     const extentNodeDiv = currentSelectionState.extentNodeDiv;
        //     if (
        //         chat.children.length == 100 &&
        //         chat.contains(baseNodeDiv) &&
        //         chat.contains(extentNodeDiv) &&
        //         baseNodeDiv != null &&
        //         baseNodeDiv.parentElement.parentElement.parentElement.parentElement == chatBox
        //     ) {
        //         const newBaseAndExtent = [];
        //         for (let node of [baseNodeDiv, extentNodeDiv]) {
        //             const isChatText = node.matches('.chat-text');
        //             const prevMessage = node.parentElement.parentElement.previousElementSibling.lastElementChild;
        //             if (isChatText && prevMessage.querySelector('.chat-text')) {
        //                 newBaseAndExtent.push(prevMessage.querySelector('.chat-text').firstChild);
        //             } else {
        //                 newBaseAndExtent.push(prevMessage.firstElementChild.firstChild);
        //             }
        //         }
        //         sel.setBaseAndExtent(newBaseAndExtent[0], currentSelectionState.baseOffset, newBaseAndExtent[1], currentSelectionState.extentOffset)
        //     }
        // }
    });

    chatObserver.observe(chat, {
        childList: true,
        characterData: true,
        subtree: true
    });

    {
        let joinDialogShown = false;
        new MutationObserver(function (mutations, observer) {
            for (let mutation of mutations) {
                for (let node of mutation.removedNodes) {
                    if (node.nodeType !== 1) continue;
                    const headline = node.querySelector('.headline');
                    if (!headline || headline.textContent != "Join Courtroom") continue;
                    if (options['auto-record']) document.querySelector('i.mdi-video').click();
                    observer.disconnect();
                    
                    const spectating = !document.querySelector('.frameTextarea');
                    if (spectating) {
                        for (let span of document.querySelectorAll('span.v-btn__content')) {
                            if (span.textContent !== 'Join Room') continue;
                            span.parentElement.parentElement.parentElement.firstElementChild.firstElementChild.firstElementChild.firstElementChild.click();
                            break;
                        }
                        setTimeout(clickOff, 1);
                        window.postMessage(["room_spectated"])
                    };
                }
                if (joinDialogShown) continue;
                for (let node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (!node.firstElementChild?.firstElementChild?.matches('div.v-card.v-sheet:not(.v-card--flat)')) continue;
                    node.classList.add('hil-join-dialog');
                    document.body.classList.remove('hil-loading-menus');
                    joinDialogShown = true;
                }
            }
        }).observe(app, {
            childList: true,
        });
    }


    if (options['convert-chat-urls']) {
        chrome.runtime.sendMessage(["create-asset-context-menu"]);
        chrome.runtime.onMessage.addListener(function(event) {
            const [ action, data ] = event;
            if (action == "save-asset") {
                let buttonTitle;
                if (data.menuItemId == 'hil-save-sound') buttonTitle = 'Sound';
                if (data.menuItemId == 'hil-save-music') buttonTitle = 'Music';
                if (!buttonTitle) return;
                assetWindowButtons[buttonTitle].click();

                setTimeout(function() {
                    for (let label of document.querySelectorAll('.v-window-item--active label')) {
                        if (label.textContent !== 'URL') continue;
                        const input = label.parentElement.querySelector('input');
                        input.value = data.linkUrl;
                        input.dispatchEvent(new Event('input'));
                        setTimeout(() => label.parentElement.parentElement.parentElement.parentElement.previousElementSibling.querySelector('input').focus(), 25); // TODO
                    }
                }, 250);
            }
        });
    }

    if (options['tts']) {
        chrome.runtime.sendMessage(["tts-get-voices"], function(voices) {
            createTabButton(TabState.TTS, 'Text-to-speech');
            const tabDiv = createTabDiv(TabState.TTS);
            const tabRow = createRow(tabDiv);
            tabRow.classList.add('hil-tab-row-tts');

            states.ttsEnabled = false;
            let ttsReadNames = true;
            states.ttsReadLogs = true;
            tabRow.appendChild(iconToggleButton(function() {
                states.ttsEnabled = !states.ttsEnabled;
                window.postMessage(['set_socket_state', {
                    [ 'tts-enabled' ]: states.ttsEnabled
                }]);
                return states.ttsEnabled
            }, 'Speech enabled', '', 'min-width: 33%;'));
            tabRow.appendChild(iconToggleButton(function() { return ttsReadNames = !ttsReadNames; }, 'Names', '', '', true));
            tabRow.appendChild(iconToggleButton(function() { return states.ttsReadLogs = !states.ttsReadLogs; }, 'Logs', '', '', true));
            
            if (voices.length > 0) {
                const voiceDropdownButton = document.createElement('div');
                voiceDropdownButton.className = 'v-btn v-btn--has-bg v-size--default hil-row-btn hil-voice-dropdown hil-themed ' + theme;
                voiceDropdownButton.innerText = 'Voices used';
                tabRow.appendChild(voiceDropdownButton);
                
                voices.sort(function(voiceA, voiceB) {
                    const keyA = (voiceA.lang + voiceA.voiceName);
                    const keyB = (voiceB.lang + voiceB.voiceName);
                    if (keyA < keyB) return -1;
                    if (keyA > keyB) return 1;
                    return 0;
                });
                
                const voiceDropdown = document.createElement('div');
                voiceDropdown.className = 'hil-checkbox-list';
                voiceDropdown.style.cssText = 'opacity: 0; display: none;';
                for (let voice of voices) {
                    const item = document.createElement('div');
                    item.className = 'hil-themed ' + theme;
                    
                    const i = document.createElement('i');
                    i.className = 'v-icon notranslate mdi mdi-checkbox-blank-outline hil-themed ' + theme;
                    item.appendChild(i);
                    
                    const span = document.createElement('span');
                    span.textContent = '(' + voice.lang + ') ' + voice.voiceName;
                    item.appendChild(span);
                    
                    voice.uses = 0;
                    voice.enabled = false;
                    function onclick() {
                        voice.enabled = !voice.enabled;
                        if (voice.enabled) {
                            item.className += ' hil-active primary--text';
                            i.classList.remove('mdi-checkbox-blank-outline');
                            i.className += ' primary--text mdi-checkbox-marked';
                        } else {
                            item.classList.remove('primary--text');
                            item.classList.remove('hil-active');
                            i.classList.remove('primary--text');
                            i.classList.remove('mdi-checkbox-marked');
                            i.classList.add('mdi-checkbox-blank-outline');
                        }
                    }
                    item.addEventListener('click', onclick);
                    if (voice.lang.slice(0, 2) === 'en') onclick();
                    
                    voiceDropdown.appendChild(item);
                }
                voiceDropdownButton.appendChild(voiceDropdown);
                const firstActive = voiceDropdown.querySelector('.hil-active');
                if (firstActive) voiceDropdown.scrollTop = firstActive.offsetTop;

                voiceDropdownButton.addEventListener('mouseenter', function() {
                    voiceDropdown.style.removeProperty('display');
                    setTimeout(function() {
                        voiceDropdown.style.removeProperty('opacity');
                    }, 0);
                });
                voiceDropdownButton.addEventListener('mouseleave', function() {
                    voiceDropdown.style.setProperty('opacity', '0');
                    setTimeout(function() {
                        voiceDropdown.style.setProperty('display', 'none');
                    }, 280);
                });
            }
                
            const characterVoices = {};
            window.addEventListener('message', function(event) {
                if (!states.ttsEnabled) return;

                const [action, data] = event.data;
                if (action === 'plain_message') {
                    console.log(data.username + ' writes; ' + data.text);
                    chrome.runtime.sendMessage(["tts-speak", {text: data.username + ' writes; ' + data.text}]);
                } else if (action === 'talking_started') {

                    let text = data.plainText;
                    if (ttsReadNames) text = data.username + ' says; ' + text;

                    if (voices.length > 0 === false) {
                        chrome.runtime.sendMessage(["tts-speak", {text: text}]);
                        return;
                    }
                    if (data.characterId in characterVoices === false || characterVoices[data.characterId].voiceObj.enabled === false) {
                        const enabledVoices = voices.filter(voice => voice.enabled);
                        let minUses = enabledVoices.reduce(function(min, current) {
                            return Math.min(min, current.uses);
                        }, Infinity);
                        const availableVoices = enabledVoices.filter(voice => voice.uses === minUses);

                        let chosenVoice = kindaRandomChoice(enabledVoices, data.characterId);
                        if (!availableVoices.includes(chosenVoice)) chosenVoice = kindaRandomChoice(availableVoices, data.characterId);
                        chosenVoice.uses += 1;
                        const pitch = Math.random() * (1.15 - 0.85) + 0.85;
                        characterVoices[data.characterId] = {
                            voiceName: chosenVoice.voiceName,
                            pitch,
                            voiceObj: chosenVoice,
                        };
                    }
                    const { voiceName, pitch } = characterVoices[data.characterId];
                    chrome.runtime.sendMessage(["tts-speak", {text, voiceName, pitch}]);
                    
                }
            });
        });
    }


    themeUpdate();


}



window.addEventListener('message', function(event) {
    const [action, data] = event.data;
    
    if (action === 'wrapper_loaded') {
        optionsLoaded.then(function(options) {
            window.postMessage([
                'set_options',
                options
            ]);
        });
    }
});


window.addEventListener('load', tryMain);

chrome.runtime.onMessage.addListener(function(event) {
    const [ action, data ] = event;
    if (action == "courtroom_state_loaded") {
        tryMain();
    }
});

function tryMain() {
    if (document.querySelector('.frameTextarea')) {
        optionsLoaded.then(function(options) {
            onLoad(options);
        })
    }
}
