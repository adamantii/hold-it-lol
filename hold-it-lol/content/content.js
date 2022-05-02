'use strict';
// Beware: spaghetti code, all mushed into a single file oh noes



const DEFAULT_TRANSITION = 'transition: .15s cubic-bezier(.25,.8,.5,1);';

const MENUS_NOT_AUTO_CLOSE = ['Text Color'];
const SELECTORS_MENU_HOVER = ['.menuable__content__active', 'div.v-sheet.secondary', 'button.v-app-bar__nav-icon', '.mb-2.col-sm-4.col-md-6.col-lg-3.col-6'];
const PAUSE_PUNCTUATION = '.,!?:;';

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
let currentSelectionState = {};
let modifierKeys = {};
let theme;
let textArea;


function clickOff() { app.click(); }

function testRegex(str, re) {
    const match = str.match(re);
    return match[0] == match.input;
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

function makeIcon(iconClass, fontPx, styleText) {
    const icon = document.createElement('i');
    icon.className = 'helper-themed v-icon notranslate mdi ' + theme;
    icon.classList.add(iconClass);
    icon.style.cssText = 'font-size: ' + fontPx + 'px;'
    if (styleText) icon.style.cssText += styleText;
    return icon;
}

function makeButton(listener, text, classText, styleText) {
    const button = document.createElement('button');
    button.className = 'v-btn v-btn--has-bg v-size--default helper ' + theme;
    if (classText) button.className += ' ' + classText;
    button.style.cssText = 'height: 100%; font-weight: normal; text-transform: none; text-overflow: clip;' + DEFAULT_TRANSITION;
    if (styleText) button.style.cssText += styleText;
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

function updateSelectionState() {
    currentSelectionState.baseNodeDiv = sel.baseNode && (sel.baseNode.nodeType == 1 ? sel.baseNode : sel.baseNode.parentElement);
    currentSelectionState.baseOffset = sel.baseOffset;
    currentSelectionState.extentNodeDiv = sel.extentNode && (sel.extentNode.nodeType == 1 ? sel.extentNode : sel.extentNode.parentElement);
    currentSelectionState.extentOffset = sel.extentOffset;
}

function optionSet(key, value) {
    chrome.storage.local.get({ 'options': {} }, function (result) {
        const options = result.options;
        options[key] = value;
        chrome.storage.local.set({ 'options': options });
    });
}



function onload(options) {


    console.log('holdit.lol - running onload()');

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


    const themeInput = row2.querySelector('.pa-2 .mt-2 .col-12').children[1].querySelector('input');
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

        const elems = document.querySelectorAll('.helper-themed');
        for (let elem of elems) {
            elem.classList.remove('theme--dark');
            elem.classList.remove('theme--light');
            elem.classList.add(theme);
        }
        for (let elem of document.querySelectorAll('.helper-themed-text')) {
            if (theme == 'theme--dark') {
                elem.style.color = '#fff';
            } else {
                elem.style.color = '#000';
            }
        }
    }
    themeInput.parentElement.parentElement.addEventListener('click', themeUpdate);


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
    if (showTutorial || options['testimony-mode']) {
        helperToggle = makeIcon('mdi-dots-horizontal', 28, 'opacity: 70%; margin-top: 15px; right: calc(-100% + 46px); cursor: pointer;');
        row2.appendChild(helperToggle);

        helperDiv = document.createElement('div');
        helperDiv.style.cssText = 'display: none; transform: translateY(-10px); opacity: 0%; padding: 0 8px 0px;' + DEFAULT_TRANSITION;
        row2.appendChild(helperDiv);

        helperToggle.addEventListener('click', function () {
            toggleHelperDiv(!helperVisible)
        });

        toggleHelperDiv = function (visible) {
            helperVisible = visible;
            if (helperVisible) {
                helperDiv.style.display = 'block';
                setTimeout(() => {
                    helperDiv.style.opacity = '100%';
                    helperDiv.style.removeProperty('transform');
                }, 1);
            } else {
                helperDiv.style.opacity = '0%';
                helperDiv.style.transform = 'translateY(-10px)';
                setTimeout(() => helperDiv.style.display = 'none', 300);
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


    function makeRow(cssText = '') {
        const div = document.createElement('div');
        div.style.cssText = 'position: relative; display: flex; align-items: stretch; margin-bottom: 20px;' + cssText;
        helperDiv.appendChild(div);
        return div;
    }



    let testimonyFuncs = {};
    if (options['testimony-mode']) {
        const buttonCSS = 'flex: 1 1 auto;background-color: #552a2e;padding: 0 8px;font-size: small;';
        const buttonWidth = '130.75';

        const testimonyRow = makeRow('height: 30px');
        let testimonyMode = false;

        const testimonyArea = document.createElement('textarea');
        testimonyArea.className = 'helper-themed-text';
        testimonyArea.style.cssText = 'display: none; width: 100%; height: 600px; resize: none; overflow: auto; padding: 5px; margin: 0; border: #552a2e 1px solid;';
        testimonyArea.placeholder = "Paste your testimony here.\nSeparate statements with line breaks.";
        textArea.parentElement.appendChild(testimonyArea);

        const testimonyDiv = document.createElement('div');
        testimonyDiv.className = 'helper-themed-text';
        testimonyDiv.style.cssText = 'display: none; width: 100%; height: 600px; overflow: auto; padding: 5px 0px; margin: 0; border: #7f3e44 1px solid;';
        textArea.parentElement.appendChild(testimonyDiv);

        let origText;
        let statements;
        let poseElems = {};
        let poseNames = {};
        let currentStatement;

        let musicPlaying = false;
        let origColor;

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
                origText = statements.join('\n');

                let resetPoses = true;
                for (let statement of statements) {
                    if (!(statement in poseElems)) continue;
                    resetPoses = false;
                    break;
                }
                if (resetPoses) {
                    poseElems = {};
                    poseNames = {};
                }

                testimonyDiv.textContent = '';
                for (let i = 0; i < statements.length; i++) {
                    const statement = statements[i];

                    const div = document.createElement('div');
                    div.style.cssText = 'position: relative; padding: 0px 5px; cursor: pointer;' + DEFAULT_TRANSITION;
                    div.dataset.statement = i;

                    div.addEventListener('click', function () {
                        if (div.querySelector(':scope .pose-message:hover')) return;
                        toStatement(i);
                    });

                    div.appendChild(document.createElement('span'));
                    div.lastElementChild.innerText = statement;

                    const pose = document.createElement('div');
                    pose.className = 'helper pose-message v-messages v-messages__message ' + theme;
                    pose.style.cssText = 'position: absolute;';
                    if (statement in poseElems) {
                        let poseName = poseNames[statement];
                        if (!poseName) poseName = UNDEFINED_POSE_NAME;
                        pose.innerText = poseName;
                        pose.dataset.pose = poseName;
                    }
                    pose.addEventListener('mouseenter', () => { if (pose.dataset.pose) pose.innerText = 'Click to clear pose'; });
                    pose.addEventListener('mouseleave', () => { if (pose.dataset.pose) pose.innerText = pose.dataset.pose; });
                    pose.addEventListener('click', () => {
                        pose.dataset.pose = '';
                        pose.innerText = '';
                        delete poseElems[statement];
                        delete poseNames[statement];
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
        }, '', 'display: none; background-color: #7f3e44 !important; margin: 0 4px;', makeIcon('mdi-check', 24));
        textButton.parentElement.parentElement.insertBefore(lockTestimony, textButton.parentElement);

        const buttonNextStatement = primaryButton(undefined, '', 'background-color: #552a2e !important; margin-left: 4px;', makeIcon('mdi-send', 24));
        const buttonPrevStatement = primaryButton(undefined, '', 'background-color: #552a2e !important; margin-left: 4px;', makeIcon('mdi-send', 24, 'transform: scaleX(-1);'));
        primaryDiv.appendChild(buttonPrevStatement);
        primaryDiv.appendChild(buttonNextStatement);

        textButton.parentElement.parentElement.appendChild(primaryDiv);


        const configDiv = document.createElement('div');
        configDiv.style.cssText = 'display: none;flex: 1 1 auto;opacity: 0%;' + DEFAULT_TRANSITION;

        const toggleButton = makeButton(function () {
            testimonyMode = !testimonyMode;
            if (testimonyMode) {

                toggleButton.innerText = 'Default Mode';
                textArea.style.display = 'none';
                configDiv.style.display = 'flex';
                musicInput.style.display = 'block';
                setTimeout(() => {
                    configDiv.style.opacity = '100%';
                    musicInput.style.opacity = '100%';
                }, 1);

                textButton.parentElement.style.display = 'none';
                lockTestimony.style.display = 'flex';
                if (testimonyLocked) {
                    primaryDiv.style.display = 'flex';
                    testimonyDiv.style.display = 'block';
                } else {
                    testimonyArea.style.display = 'block';
                }

            } else {

                toggleButton.innerText = 'Testimony Mode';
                testimonyArea.style.display = 'none';
                testimonyDiv.style.display = 'none';
                textArea.style.display = 'block';
                configDiv.style.opacity = '0%';
                musicInput.style.opacity = '0%';
                setTimeout(() => {
                    configDiv.style.display = 'none';
                    musicInput.style.display = 'none';
                }, 300);

                textButton.parentElement.style.display = 'block';
                lockTestimony.style.display = 'none';
                primaryDiv.style.display = 'none';

            }
        }, 'Testimony Mode', '', 'margin-right:10px;flex: 1 1 auto;max-width: ' + buttonWidth + 'px;');
        testimonyRow.appendChild(toggleButton);
        testimonyRow.appendChild(configDiv);


        const musicInput = document.createElement('input');
        musicInput.className = 'helper music-input v-size--default v-sheet--outlined helper-themed-text ' + theme;
        musicInput.style.cssText = 'display: none; opacity: 0%; position: absolute; top: calc(100% + 10px); height: 100%; width: ' + buttonWidth + 'px; text-align: center; border-radius: 4px; font-size: 0.875rem; overflow: hidden;' + DEFAULT_TRANSITION;
        musicInput.placeholder = 'Witness music tag';

        musicInput.addEventListener('click', () => musicInput.setSelectionRange(0, musicInput.value.length));
        musicInput.addEventListener('change', () => musicPlaying = false);

        testimonyRow.appendChild(musicInput);


        const buttonAuto = makeButton(function () {
            auto = !auto;
            if (auto) {
                buttonAuto.firstElementChild.classList.remove('mdi-close');
                buttonAuto.firstElementChild.classList.add('mdi-check');
            } else {
                buttonAuto.firstElementChild.classList.add('mdi-close');
                buttonAuto.firstElementChild.classList.remove('mdi-check');
            }
        }, 'Use < > from chat', '', buttonCSS);

        const buttonRed = makeButton(function () {
            red = !red;
            if (red) {
                buttonRed.firstElementChild.classList.remove('mdi-close');
                buttonRed.firstElementChild.classList.add('mdi-check');
                if (testimonyDiv.childElementCount == 0) return;
                testimonyDiv.firstElementChild.firstElementChild.style.color = '#f00';
                testimonyDiv.lastElementChild.firstElementChild.style.color = '#f00';
            } else {
                buttonRed.firstElementChild.classList.add('mdi-close');
                buttonRed.firstElementChild.classList.remove('mdi-check');
                if (testimonyDiv.childElementCount == 0) return;
                testimonyDiv.firstElementChild.firstElementChild.style.removeProperty('color');
                testimonyDiv.lastElementChild.firstElementChild.style.removeProperty('color');
            }
        }, 'Red Beginning/End', '', buttonCSS);

        const buttonCrossExam = makeButton(function () {
            crossExam = !crossExam;
            if (crossExam) {
                buttonCrossExam.firstElementChild.classList.remove('mdi-close');
                buttonCrossExam.firstElementChild.classList.add('mdi-check');
            } else {
                buttonCrossExam.firstElementChild.classList.add('mdi-close');
                buttonCrossExam.firstElementChild.classList.remove('mdi-check');
            }
        }, 'Cross-exam mode', '', buttonCSS);

        for (let button of [buttonAuto, buttonRed, buttonCrossExam]) {
            button.prepend(makeIcon('mdi-close', 18, 'margin-right: 8px;'));
            configDiv.appendChild(button);
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
            const music = musicInput.value;

            let text = statementText;

            let colorTag;
            if (red && (statement == 0 || statement == statements.length - 1)) {
                colorTag = '[#/r]';
            } else if (crossExam) {
                colorTag = '[#/g]';
                text = text.replaceAll(/\[#.*?\]/g, '');
            }
            if (colorTag) {
                text = colorTag + text + '[/#]';
            }

            if (statement == statements.length - 1) {
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
            } else if (statement == 0 && music) {
                text = TAG_MUSIC_STOP + text;
                musicPlaying = false;
            }

            if (poseElems[statementText]) {
                poseElems[statementText].click();
            } else {
                if (document.querySelector('img.pointer-item.p-image.selected')) {

                    const elem = document.querySelector('img.pointer-item.p-image.selected');
                    if (elem) {
                        statementElem.querySelector('div.pose-message').dataset.pose = UNDEFINED_POSE_NAME;

                        poseElems[statementText] = elem;
                        elem.dispatchEvent(new Event('mouseenter'));
                        setTimeout(function () {
                            if (testimonyDiv.querySelector('div[style*="background-color:"]') === statementElem && document.querySelector('img.pointer-item.p-image.selected') === elem) {
                                let poseName = document.querySelector('div.v-tooltip__content.menuable__content__active').firstElementChild.innerText.trim();
                                poseNames[statementText] = poseName;
                                statementElem.querySelector('div.pose-message').innerText = poseName;
                                statementElem.querySelector('div.pose-message').dataset.pose = poseName;
                                elem.dispatchEvent(new Event('mouseleave'));
                            } else if (statementElem.querySelector('div.pose-message').dataset.pose == UNDEFINED_POSE_NAME) {
                                statementElem.querySelector('div.pose-message').innerText = UNDEFINED_POSE_NAME;
                            }
                        }, 500);
                    }

                } else if (document.querySelector('.v-text-field--outlined.v-text-field--is-booted:not(.v-autocomplete)')) {

                    const elemInput = document.querySelector('.v-text-field--outlined.v-text-field--is-booted:not(.v-autocomplete)');
                    const elem = document.querySelector('.v-list[data-' + Object.keys(elemInput.dataset)[0] + '] .v-list-item--active');
                    poseElems[statementText] = elem;
                    let poseName = elem.querySelector(':scope .v-list-item__title').textContent.trim();
                    poseNames[statementText] = poseName;
                    statementElem.querySelector('div.pose-message').innerText = poseName;
                    statementElem.querySelector('div.pose-message').dataset.pose = poseName;

                }
                statementElem.style.paddingBottom = '16px';
                statementElem.style.marginBottom = '9px';
            }

            sendText(text);
        }

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

                const oldValue = mutation.oldValue.match(/background-image: (url\(\".*?\"\));/)[1];
                const newValue = mutation.target.style.backgroundImage;
                if (oldValue !== newValue) {
                    poseElems = {};
                    poseNames = {};
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

        testimonyFuncs.arrow = function(arrow) {
            if (testimonyMode && testimonyLocked && auto) {
                if (arrow == '>') nextStatement();
                else if (arrow == '<') prevStatement();
            }
        }
        testimonyFuncs.index = function(statement) {
            if (testimonyMode && testimonyLocked && auto) {
                const statementI = statement - 1;
                if (statementI < 0 || statementI >= statements.length) return;
                toStatement(statementI);
            }
        }
    }



    const menuTitles = {};
    let dualEffectMode = false;
    updateSelectionState();

    function premakeMenus() {
        const separateButtons = [];
        separateButtons.push(document.querySelector('.v-btn__content .mdi-menu'));
        for (let button of separateButtons) {
            button.click();
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

            const menus = app.querySelectorAll(':scope > div[role="menu"]');
            for (let menu of menus) {
                const titleElem = menu.querySelector('.v-list-item__title') || menu.querySelector('.v-label');
                if (titleElem != null) {
                    const title = titleElem.innerText;
                    menuTitles[title] = menu;

                    if (options['menu-auto-close'] && !MENUS_NOT_AUTO_CLOSE.includes(title)) {
                        for (let button of menu.querySelectorAll('.v-btn:not(.success)')) {
                            button.addEventListener('click', clickOff);
                        }
                    }
                };

                if (options['sound-search']) {
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
                    const combobox = menuTitles[menuTitle].querySelector('[role="combobox"]');
                    const input = combobox.querySelector('input[type="text"]');
                    let defaultOption;
                    input.addEventListener('focus', function () {
                        defaultOption = input.value;
                    })
                    let menuObserver = new MutationObserver(function () {
                        setTimeout(function () {
                            if (!(combobox.ariaExpanded == "false" && input.value != defaultOption && !modifierKeys.shift)) return;
                            menuTitles[menuTitle].querySelector('.v-btn.primary').click();
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
            if (i.parentElement.textContent != " Reset ") continue;
            buttonRow = i.parentElement.parentElement.parentElement;
            break;
        }
        const inputRow = buttonRow.parentElement.parentElement.firstElementChild;
        const evidenceList = buttonRow.parentElement.parentElement.nextElementSibling.nextElementSibling;

        const tabButton = document.createElement('div');
        tabButton.className = 'evidence-button v-btn v-btn--plain theme--dark v-size--small primary--text';
        tabButton.style.cssText = 'margin-left: 32px; cursor: pointer';
        const tabSpan = document.createElement('span');
        tabSpan.className = 'v-btn__content';
        tabSpan.textContent = 'Import From Table';
        const tabDiv = document.createElement('div');
        tabDiv.style.cssText = 'z-index: 1; position: fixed; width: 400px; background-color: #121212; transition: opacity 0.2s; opacity: 0; display: none; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.8), 0 6px 20px 0 rgba(0, 0, 0, 0.8);';
        tabDiv.className = 'evidence-tab';
        tabButton.appendChild(tabSpan);
        buttonRow.appendChild(tabButton);
        buttonRow.appendChild(tabDiv);

        let tabOpen = false;
        document.addEventListener('click', function () {
            if (!tabOpen && document.querySelector('.evidence-button:hover')) {
                tabOpen = true;
                tabDiv.style.display = 'block';
                setTimeout(() => tabDiv.style.opacity = '1', 0);
                const box = tabButton.getClientRects()[0];
                tabDiv.style.top = buttonRow.getClientRects()[0].bottom + 'px';
                tabDiv.style.left = (box.left + box.width / 2 - tabDiv.clientWidth / 2) + 'px';
                return;
            }
            if (document.querySelector('.evidence-tab:hover')) return;
            tabOpen = false;
            tabDiv.style.opacity = '0';
            setTimeout(() => tabDiv.style.display = 'none', 200);
        });


        tabDiv.innerHTML = '<div class="evidence-title">Paste a table here</div><div id="evidence-area" contenteditable="true"></div><div class="evidence-submit v-btn theme--dark">Submit</div><div class="evidence-error error--text"></div>';
        const pasteArea = tabDiv.querySelector('#evidence-area');
        const error = tabDiv.querySelector('.evidence-error');

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
            for (let elem of pasteArea.querySelectorAll('.evd-warning')) elem.classList.remove('evd-warning');
            for (let elem of pasteArea.querySelectorAll('.evd-error')) elem.classList.remove('evd-error');
            for (let elem of pasteArea.querySelectorAll('.evd-row')) elem.classList.remove('evd-row');
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
                setValue(inputRow.querySelector(':scope > :nth-child(3) input'), desc);
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


        const button = tabDiv.querySelector('.evidence-submit');
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
                        anchorRow.classList.add('evd-warning');
                        continue;
                    };

                    let maxRowSpan = 1;
                    for (let cell of anchorRow.children) {
                        if (cell.rowSpan > maxRowSpan) maxRowSpan = cell.rowSpan;
                    }
                    anchorRow.classList.add('evd-row');


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


                const names = table.querySelectorAll(':scope > .evd-row > :nth-child(' + (cellContents.nameIndex + 1) + ')');
                for (let i = 0; i < names.length; i++) {
                    const nameElem = names[i];
                    const text = nameElem.textContent;
                    if (text.length > EVIDENCE_MAX_LENGTH_NAME) {
                        nameElem.classList.add('evd-error');
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



    if (options['chat-fix']) {
        document.addEventListener('selectionchange', function () {
            updateSelectionState();
        })
    }


    if (options['sound-insert']) {
        function checkModifierKeys(event) {
            modifierKeys.shift = event.shiftKey;
        }
        document.addEventListener('keydown', checkModifierKeys);
        document.addEventListener('keyup', checkModifierKeys);
    }


    const chatObserver = new MutationObserver(function () {
        const messageNode = chat.lastElementChild;
        const messageText = messageNode.lastElementChild.lastElementChild.innerText;

        if (musicPlaying && messageText.includes(STOP_MUSIC_TEXT)) {
            musicPlaying = false;
        }

        if (options['testimony-mode']) {
            if (testRegex(messageText, '[> ]*') && messageText.indexOf('>') !== -1) testimonyFuncs.arrow('>');
            else if (testRegex(messageText, '[< ]*') && messageText.indexOf('<') !== -1) testimonyFuncs.arrow('<');
            else if (testRegex(messageText, '<[0-9]*?>')) testimonyFuncs.index(Number(messageText.slice(1, -1)));
        }

        if (options['chat-fix']) {
            if (chatBox.scrollTop + chatBox.clientHeight > chatBox.scrollHeight - 25) {
                chatBox.scrollTop = chatBox.scrollHeight
            } else {
                chatBox.scrollTop -= messageNode.clientHeight
            }

            const baseNodeDiv = currentSelectionState.baseNodeDiv;
            const extentNodeDiv = currentSelectionState.extentNodeDiv;
            if (
                chat.children.length == 100 &&
                chat.contains(baseNodeDiv) &&
                chat.contains(extentNodeDiv) &&
                baseNodeDiv != null &&
                baseNodeDiv.parentElement.parentElement.parentElement.parentElement == chatBox
            ) {
                const newBaseAndExtent = [];
                for (let node of [baseNodeDiv, extentNodeDiv]) {
                    const isChatText = node.matches('.chat-text');
                    const prevMessage = node.parentElement.parentElement.previousElementSibling.lastElementChild;
                    if (isChatText && prevMessage.querySelector('.chat-text')) {
                        newBaseAndExtent.push(prevMessage.querySelector('.chat-text').firstChild);
                    } else {
                        newBaseAndExtent.push(prevMessage.firstElementChild.firstChild);
                    }
                }
                sel.setBaseAndExtent(newBaseAndExtent[0], currentSelectionState.baseOffset, newBaseAndExtent[1], currentSelectionState.extentOffset)
            }
        }
    });

    chatObserver.observe(chat, {
        childList: true,
        characterData: true,
        subtree: true
    });



    if (options['auto-record']) {
        const appObserver = new MutationObserver(function (mutationRecord, observer) {
            for (let mutation of mutationRecord) {
                for (let node of mutation.removedNodes) {
                    const headline = node.querySelector('.headline');
                    if (!headline || headline.textContent != "Join Courtroom") continue;

                    document.querySelector('i.mdi-video').click();
                    observer.disconnect();
                }
            }
        });

        appObserver.observe(app, {
            childList: true,
        });
    }


    themeUpdate();


}



function tryMain() {
    if (document.querySelector('.frameTextarea')) {
        chrome.storage.local.get(['options'], function (result) {
            const options = result.options || {};
            onload(options);
        });
    }
}

window.addEventListener('load', tryMain);

chrome.runtime.onMessage.addListener(data => {
    if (data.action == "loaded") {
        tryMain();
    }
    /*if (data.action == "add-evidence-list") {
      const firstTuple = data.tuples.shift();
      evidenceBacklog.push(...data.tuples);
      addEvidence(...firstTuple);
    }*/
});