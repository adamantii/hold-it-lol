"use strict";

function main() {

    const socketStates = {
        options: undefined
    }
    socketStates.optionsLoaded = new Promise(function (resolve, reject) {
        socketStates.optionsLoadedResolve = resolve;
    });
    const muteCharacters = {
        defense: { characterId: 669437, poseId: 8525792 },
        prosecution: { characterId: 669438, poseId: 8525810 },
        witness: { characterId: 669439, poseId: 8525809 },
        counsel: { characterId: 669440, poseId: 8525795 },
        judge: { characterId: 669441, poseId: 8525794 },
        fallback: { characterId: 669439, poseId: 8525809 },
    }

    const socket = document.querySelector('.v-main__wrap > div').__vue__.$socket;
    const roomInstance = document.querySelector('div.mx-auto.v-card--flat.v-sheet').parentElement.__vue__;
    const toolbarInstance = document.querySelector('.mx-auto.v-card header').__vue__.$parent;
    const characterInstance = document.querySelector('.v-main__wrap > div > div.row > div:nth-child(1) > div').__vue__;
    const characterListInstance = document.querySelector('div.v-main__wrap > div > div.text-center').__vue__;
    const userInstance = document.querySelector('.v-main__wrap > div').__vue__;
    const poseInstance = document.querySelector('.col-sm-9.col-10 > div > div.swiper-container,.col-sm-9.col-10 > div > div.v-text-field').parentElement.__vue__;
    const frameInstance = document.querySelector('.court-container').parentElement.parentElement.__vue__;
    const chatInstance = document.querySelector('.chat').parentElement.__vue__;
    const getLastTabInstance = () => document.querySelector('.v-window.v-item-group.v-tabs-items').firstElementChild.lastElementChild.firstElementChild.__vue__;
    let muteInputInstance;
    for (let label of document.querySelectorAll('.v-select--chips.v-text-field label')) {
        if (label.textContent !== 'Muted Users') continue;
        muteInputInstance = label.parentElement.parentElement.parentElement.parentElement.__vue__;
        break;
    }

    const themeInput = getLabel('Dark Mode').parentElement.querySelector('input');
    function getTheme() {
        if (themeInput.ariaChecked == "true") {
            return 'theme--dark';
        } else {
            return 'theme--light';
        }
    }


    function compareShallow(a, b, keys) {
        for (const key of keys) {
            if (a[key] !== b[key]) {
                return false;
            }
        }
        return true;
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

    function createIcon(iconClass, fontPx = 24, styleText = '', classText = '') {
        const icon = document.createElement('i');
        icon.className = classText + ' hil-themed v-icon notranslate mdi ' + getTheme();
        icon.classList.add('mdi-' + iconClass);
        if (fontPx && fontPx !== 24) icon.style.cssText = 'font-size: ' + fontPx + 'px;'
        if (styleText) icon.style.cssText += styleText;
        return icon;
    }

    function getPresetCharacterFromPose(poseId) {
        const presetChar = characterListInstance.allCharacters.find(
            char => char.poses.find(
                pose => pose.id === poseId
            ) !== undefined
        );
        if (presetChar) return presetChar;
        else return null;
    }

    function getFrameCharacterId(frame) {
        if (frame.characterId >= 1000) return frame.characterId;

        return getPresetCharacterFromPose(frame.poseId).id;
    }

    function getMuteCharacter(charId, poseId) {
        let muteCharacter;
        if (frameInstance.customCharacters[charId]) {
            muteCharacter = muteCharacters[frameInstance.customCharacters[charId].side];
        } else if (charId < 1000) {
            muteCharacter = muteCharacters[characterListInstance.allCharacters[charId].side];
        } else if (charId === null) {
            muteCharacter = muteCharacters[getPresetCharacterFromPose(poseId).side];
        } else {
            muteCharacter = muteCharacters.fallback;
        }
        return muteCharacter
    }

    function preloadHiddenCharacters() {
        frameInstance.customCharacters[669437] = {
            "partial": true,
            "id": 669437,
            "name": "Hidden (Defense)",
            "namePlate": "Hidden",
            "side": "defense",
            "blipUrl": "/Audio/blip.wav",
            "iconUrl": null,
            "galleryImageUrl": null,
            "galleryAJImageUrl": null,
            "backgroundId": 189,
            "limitWidth": true,
            "alignment": null,
            "offsetX": 0,
            "offsetY": 0,
            "objectionVolume": 1,
            "poses": [
                {
                    "id": 8525792,
                    "name": "Stand",
                    "idleImageUrl": "https://cdn.discordapp.com/attachments/867018629089460234/984040162122149908/DefenseA.webp",
                    "speakImageUrl": "https://cdn.discordapp.com/attachments/867018629089460234/984040162369617951/DefenseB.webp",
                    "isSpeedlines": false,
                    "iconUrl": "",
                    "order": 0,
                    "musicFileName": "Trial",
                    "states": [],
                    "audioTicks": [],
                    "functionTicks": [],
                    "characterId": 669437
                }
            ],
            "bubbles": []
        };
        frameInstance.customCharacters[669438] = {
            "partial": true,
            "id": 669438,
            "name": "Hidden (Prosecution)",
            "namePlate": "Hidden",
            "side": "prosecution",
            "blipUrl": "/Audio/blip.wav",
            "iconUrl": null,
            "galleryImageUrl": null,
            "galleryAJImageUrl": null,
            "backgroundId": 194,
            "limitWidth": true,
            "alignment": null,
            "offsetX": 0,
            "offsetY": 0,
            "objectionVolume": 1,
            "poses": [
                {
                    "id": 8525810,
                    "name": "Stand",
                    "idleImageUrl": "https://cdn.discordapp.com/attachments/867018629089460234/984040162583535636/ProsecutionA.webp",
                    "speakImageUrl": "https://cdn.discordapp.com/attachments/867018629089460234/984040162805837874/ProsecutionB.webp",
                    "isSpeedlines": false,
                    "iconUrl": "",
                    "order": 0,
                    "musicFileName": "Trial",
                    "states": [],
                    "audioTicks": [],
                    "functionTicks": [],
                    "characterId": 669438
                }
            ],
            "bubbles": []
        };
        frameInstance.customCharacters[669439] = {
            "partial": true,
            "id": 669439,
            "name": "Hidden (Witness)",
            "namePlate": "Hidden",
            "side": "witness",
            "blipUrl": "/Audio/blip-female.wav",
            "iconUrl": null,
            "galleryImageUrl": null,
            "galleryAJImageUrl": null,
            "backgroundId": 197,
            "limitWidth": true,
            "alignment": null,
            "offsetX": 0,
            "offsetY": 0,
            "objectionVolume": 1,
            "poses": [
                {
                    "id": 8525809,
                    "name": "Stand",
                    "idleImageUrl": "https://cdn.discordapp.com/attachments/867018629089460234/984040163053285396/WitnessA.webp",
                    "speakImageUrl": "https://cdn.discordapp.com/attachments/867018629089460234/984040163288170537/WitnessB.webp",
                    "isSpeedlines": false,
                    "iconUrl": "",
                    "order": 0,
                    "musicFileName": "Trial",
                    "states": [],
                    "audioTicks": [],
                    "functionTicks": [],
                    "characterId": 669439
                }
            ],
            "bubbles": []
        };
        frameInstance.customCharacters[669440] = {
            "partial": true,
            "id": 669440,
            "name": "Hidden (Counsel)",
            "namePlate": "Hidden",
            "side": "counsel",
            "blipUrl": "/Audio/blip.wav",
            "iconUrl": null,
            "galleryImageUrl": null,
            "galleryAJImageUrl": null,
            "backgroundId": 187,
            "limitWidth": true,
            "alignment": null,
            "offsetX": 0,
            "offsetY": 0,
            "objectionVolume": 1,
            "poses": [
                {
                    "id": 8525795,
                    "name": "Stand",
                    "idleImageUrl": "https://cdn.discordapp.com/attachments/867018629089460234/984040163594362931/CounselA.webp",
                    "speakImageUrl": "https://cdn.discordapp.com/attachments/867018629089460234/984040163925696522/CounselB.webp",
                    "isSpeedlines": false,
                    "iconUrl": "",
                    "order": 0,
                    "musicFileName": "Trial",
                    "states": [],
                    "audioTicks": [],
                    "functionTicks": [],
                    "characterId": 669440
                }
            ],
            "bubbles": []
        };
        frameInstance.customCharacters[669441] = {
            "partial": true,
            "id": 669441,
            "name": "Hidden (Judge)",
            "namePlate": "Hidden",
            "side": "judge",
            "blipUrl": "/Audio/blip.wav",
            "iconUrl": null,
            "galleryImageUrl": null,
            "galleryAJImageUrl": null,
            "backgroundId": 192,
            "limitWidth": true,
            "alignment": null,
            "offsetX": 0,
            "offsetY": 0,
            "objectionVolume": 1,
            "poses": [
                {
                    "id": 8525794,
                    "name": "Stand",
                    "idleImageUrl": "https://cdn.discordapp.com/attachments/867018629089460234/984040164286418944/JudgeA.webp",
                    "speakImageUrl": "https://cdn.discordapp.com/attachments/867018629089460234/984040164701650944/JudgeB.webp",
                    "isSpeedlines": false,
                    "iconUrl": "",
                    "order": 0,
                    "musicFileName": "Trial",
                    "states": [],
                    "audioTicks": [],
                    "functionTicks": [],
                    "characterId": 669441
                }
            ],
            "bubbles": []
        };
    }

    function createTooltip(text, anchorElement) {
        const tooltip = document.createElement('div');
        tooltip.className = 'v-tooltip__content hil-small-tooltip hil-hide';
        tooltip.textContent = text;
        tooltip.realign = function (newText = null) {
            if (anchorElement === undefined) throw Error('Tooltip has no anchor anchorElement');
            if (newText !== null) tooltip.textContent = newText;
            const rect = anchorElement.getClientRects()[0];
            anchorElement.tooltip.style.left = (rect.x + rect.width / 2 - anchorElement.tooltip.clientWidth / 2) + 'px';
            anchorElement.tooltip.style.top = (rect.y + rect.height + 10) + 'px';
        }
        app.appendChild(tooltip);
        return tooltip;
    }

    function getIDFromUsername(username, userList = muteInputInstance.items) {
        return userList.find(user => user.username === username)?.id;
    }


    window.postMessage(['wrapper_loaded']);
    window.addEventListener('message', function (event) {
        const [action, data] = event.data;
        if (action === 'set_options') {
            socketStates.options = data;
            socketStates.optionsLoadedResolve();
        } else if (action === 'set_socket_state') {
            for (const key in data) {
                socketStates[key] = data[key];
            }
        } else if (action === 'clear_testimony_poses') {
            socketStates.testimonyPoses = {};
        } else if (action === 'clear_testimony_pose') {
            delete socketStates.testimonyPoses[data];
        } else if (action === 'pre_animate_toggled') {
            delete socketStates['prev-pre-pose'];
        } else if (action === 'fullscreen_button_added') {
            const presentButton = document.querySelector('[hil-button="present-evd"]');
            const fullscreenButton = document.querySelector('[hil-button="fullscreen-evd"]');
            presentButton.__vue__.$watch('classes', function () {
                fullscreenButton.className = presentButton.className;
            });
        }
    });

    socketStates.optionsLoaded.then(function () {
        if (socketStates.options['testimony-mode']) socketStates['testimonyPoses'] = {};
        if (socketStates.options['list-moderation'] && socketStates.options['mute-character']) socketStates['mutedCharUsers'] = {};
        if (socketStates.options['remute']) socketStates['mutedLeftCache'] = {};
        if (socketStates.options['mute-character']) {
            socketStates['hiddenLeftCache'] = {};
            preloadHiddenCharacters(frameInstance);
        }

        if (socketStates.options['save-last-character']) {
            const storedId = localStorage['hil-last-character-id'];
            if (storedId >= 1000) {
                characterListInstance.customList.push(JSON.parse(localStorage['hil-last-cc-json']));
                characterListInstance.setCustomCharacter(storedId);
            } else if (storedId > 1) {
                characterListInstance.setCharacter(storedId);
            }

            characterInstance.$watch('currentCharacter.id', function (id) {
                localStorage['hil-last-character-id'] = id;
                if (id < 1000) return;
                localStorage['hil-last-cc-json'] = JSON.stringify(characterInstance.currentCharacter);
            });
        }

        if (socketStates.options['tts']) {
            const dialogueBox = document.querySelector('.v-main div.chat-box');
            let lastProcessedFrame;
            new MutationObserver(function (mutations) {
                for (let mutation of mutations) {
                    if (dialogueBox.style.display !== '') continue;
                    if (frameInstance.frame === lastProcessedFrame) continue;
                    window.postMessage([
                        'talking_started',
                        {
                            plainText: frameInstance.plainText,
                            characterId: getFrameCharacterId(frameInstance.frame),
                            username: frameInstance.frame.username,
                        }
                    ]);
                    lastProcessedFrame = frameInstance.frame;
                }
            }).observe(
                dialogueBox,
                {
                    childList: true,
                    subtree: true,
                }
            );
        }

        if (socketStates.options['list-moderation'] || socketStates.options['chat-moderation']) {
            function userActionButton(onclick, iconName, tooltipText = null, classText = '', cssText = '') {
                const button = document.createElement('button');
                button.className = classText + ' v-btn v-btn--has-bg hil-icon-button hil-themed ' + getTheme();
                if (cssText) button.style.cssText = cssText;

                button.appendChild(createIcon(iconName));

                if (onclick) button.addEventListener('click', () => onclick(button));
                if (tooltipText) {
                    button.addEventListener('mouseenter', function () {
                        if (button.tooltip === undefined) button.tooltip = createTooltip(tooltipText, button);
                        button.tooltip.realign();
                        button.tooltip.classList.remove('hil-hide');
                    });
                    button.addEventListener('mouseleave', () => button.tooltip.classList.add('hil-hide'));
                }

                return button;
            }

            function userActionButtonSet(usernameGetter, constantId = false) {
                const container = document.createElement('div');
                container.className = 'hil-user-action-buttons';

                const initialId = getIDFromUsername(usernameGetter());
                container.dataset.userId = initialId;
                const getId = function () {
                    if (constantId) return initialId;
                    return getIDFromUsername(usernameGetter());
                }

                const isMod = roomInstance.users.find(user => user.id === initialId).isMod;
                const isMuted = muteInputInstance.selectedItems.find(item => item.username === usernameGetter());

                container.appendChild(userActionButton(function () {
                    const id = getId();
                    if (id === undefined) return;

                    const mods = roomInstance.users.filter(user => user.isMod).map(user => user.id);
                    if (!mods.includes(id)) mods.push(id);
                    else mods.splice(mods.indexOf(id), 1);

                    socket.emit('set_mods', mods);
                },
                    isMod ? 'account-arrow-down' : 'crown',
                    isMod ? 'Remove moderator' : 'Make moderator',
                    'hil-userlist-mod',
                    userInstance.currentUser.isOwner ? '' : 'display: none;')
                );

                container.appendChild(userActionButton(function () {
                    let banList = getLastTabInstance().getBanUsers.map(user => user.id);
                    banList = banList.filter(id => !roomInstance.users.map(user => user.id).includes(id));
                    banList.push(getId());
                    socket.emit('set_bans', banList);
                }, 'skull', 'Ban', 'hil-userlist-ban', userInstance.currentUser.isOwner || userInstance.currentUser.isMod ? '' : 'display: none;'));

                container.appendChild(userActionButton(function (button) {
                    const id = getId();
                    if (id === undefined) return;
                    muteInputInstance.selectItem(id);

                    const muted = !muteInputInstance.selectedItems.find(item => item.id === id); // Counter-intuitive but trust it
                    const mutedIndicatorMethod = muted ? 'add' : 'remove';
                    const unmutedIndicatorMethod = !muted ? 'add' : 'remove';
                    for (let button of document.querySelectorAll('div.hil-user-action-buttons[data-user-id="' + id + '"] .hil-userlist-mute')) {
                        button.querySelector('i').classList[unmutedIndicatorMethod]('mdi-volume-off');
                        button.querySelector('i').classList[mutedIndicatorMethod]('mdi-volume-high');
                        container.parentElement.querySelector('.hil-user-action-icons .mdi-volume-off')?.classList[unmutedIndicatorMethod]('hil-hide');
                        button.tooltip?.realign(muted ? 'Unmute' : 'Mute');
                    }
                },
                    isMuted ? 'volume-high' : 'volume-off',
                    isMuted ? 'Unmute' : 'Mute',
                    'hil-userlist-mute')
                );

                if (socketStates.options['mute-character']) {
                    const isCharacterMuted = initialId in socketStates['mutedCharUsers'];
                    container.appendChild(userActionButton(function (button) {
                        const id = getId();
                        if (id === undefined) return;

                        let muted = id in socketStates['mutedCharUsers'];
                        if (muted) delete socketStates['mutedCharUsers'][id];
                        if (!muted) socketStates['mutedCharUsers'][id] = true;

                        for (const mutedId in socketStates['mutedCharUsers']) {
                            if (muteInputInstance.items.find(item => item.id === Number(mutedId))) continue;
                            delete socketStates['mutedCharUsers'][mutedId];
                        }

                        muted = id in socketStates['mutedCharUsers'];
                        const mutedIndicatorMethod = muted ? 'add' : 'remove';
                        const unmutedIndicatorMethod = !muted ? 'add' : 'remove';
                        for (let button of document.querySelectorAll('div.hil-user-action-buttons[data-user-id="' + id + '"] .hil-userlist-mute-char')) {
                            button.querySelector('i').classList[unmutedIndicatorMethod]('mdi-eye-off');
                            button.querySelector('i').classList[mutedIndicatorMethod]('mdi-eye');
                            container.parentElement.querySelector('.hil-user-action-icons .mdi-eye-off')?.classList[unmutedIndicatorMethod]('hil-hide');
                            button.tooltip?.realign(muted ? 'Show character' : 'Hide character');
                        }
                    },
                        isCharacterMuted ? 'eye' : 'eye-off',
                        isCharacterMuted ? 'Show character' : 'Hide character',
                        'hil-userlist-mute-char')
                    );
                }

                container.removeWithTooltips = function () {
                    container.querySelectorAll('.hil-icon-button').forEach(button => button.tooltip?.remove());
                    container.remove();
                }
                return container;
            }

            function userActionIconSet() {
                const container = document.createElement('div');
                container.className = 'hil-user-action-icons';
                container.appendChild(createIcon('volume-off', undefined, undefined, 'hil-hide'));
                if (socketStates.options['mute-character']) container.appendChild(createIcon('eye-off', undefined, undefined, 'hil-hide'));
                return container;
            }

            if (socketStates.options['list-moderation']) {
                function processUserListItem(userItem) {
                    const usernameElement = userItem.querySelector('.v-list-item__title');
                    if (usernameElement.innerText === userInstance.currentUser.username) return;
                    userItem.appendChild(userActionButtonSet(() => usernameElement.innerText, true));
                    const icons = userActionIconSet();
                    userItem.appendChild(icons);
                    if (muteInputInstance.selectedItems.find(user => user.username === usernameElement.innerText)) {
                        icons.querySelector('.mdi-volume-off').classList.remove('hil-hide');
                    }
                    if (socketStates.options['mute-character'] && getIDFromUsername(usernameElement.innerText) in socketStates['mutedCharUsers']) {
                        icons.querySelector('.mdi-eye-off').classList.remove('hil-hide');
                    }
                }
                
                function reloadUserList() {
                    for (let userItem of userList.children) {
                        userItem.querySelector('.hil-user-action-buttons')?.removeWithTooltips();
                        userItem.querySelector('.hil-user-action-buttons')?.removeWithTooltips();
                        processUserListItem(userItem);
                    }
                }
                
                let userList;
                const userListButton = document.querySelector('.v-icon--left.mdi-account').parentElement.parentElement;
                userListButton.addEventListener('click', function () {
                    for (let title of document.querySelectorAll('.v-toolbar__title')) {
                        if (title.innerText !== 'Users') continue;
                        
                        userList = title.parentElement.parentElement.parentElement.querySelector('.v-list');
                        for (let userItem of userList.children) {
                            processUserListItem(userItem);
                        }
                        
                        new MutationObserver(function (mutations) {
                            for (let mutation of mutations) {
                                for (let node of mutation.addedNodes) {
                                    processUserListItem(node);
                                }
                                for (let node of mutation.removedNodes) {
                                    node.querySelector('.hil-user-action-buttons')?.removeWithTooltips();
                                    reloadUserList();
                                }
                            }
                        }).observe(
                            userList, { childList: true }
                        );
                        
                        break;
                    }
                });
                
                userInstance.$watch('currentUser', function (user) {
                    if (!document.contains(userList)) return;
                    
                    if (user.isOwner) userList.querySelectorAll('.hil-userlist-mod').forEach(button => button.style.removeProperty('display'));
                    else userList.querySelectorAll('.hil-userlist-mod').forEach(button => button.style.setProperty('display', 'none'));
                    if (user.isOwner || user.isMod) userList.querySelectorAll('.hil-userlist-ban').forEach(button => button.style.removeProperty('display'));
                    else userList.querySelectorAll('.hil-userlist-ban').forEach(button => button.style.setProperty('display', 'none'));
                }, { deep: true });
            }

            if (socketStates.options['chat-moderation']) {
                const chat = document.querySelector('.chat').firstElementChild;
                let gotTo100 = false;
                const chatObserver = new MutationObserver(function(mutations) {
                    for (let mutation of mutations) {
                        if (mutation.target !== chat && !mutation.target.matches('.v-list-item__content') && !mutation.target.parentElement.matches('.v-list-item__content')) continue;

                        if (chat.childElementCount === 100) {
                            if (gotTo100) {
                                chat.firstElementChild.querySelector('.hil-user-action-buttons')?.removeWithTooltips();
                                for (let buttons of chat.querySelectorAll('div.hil-user-action-buttons')) {
                                    buttons.parentElement.previousElementSibling.appendChild(buttons);
                                }
                            }
                            gotTo100 = true;
                        }
                        
                        const messageNode = chat.lastElementChild;
                        if (messageNode.querySelector('i').matches('.mdi-account,.mdi-crown,.mdi-account-tie')) {
                            const username = messageNode.querySelector('.v-list-item__title').innerText;
                            if (username === userInstance.currentUser.username) return;
                            messageNode.appendChild(userActionButtonSet(() => username, true));
                        }

                        break;
                    }
                });

                chatObserver.observe(chat, {
                    childList: true,
                    characterData: true,
                    subtree: true
                });
            }
        }

        if (socketStates.options['volume-sliders']) {
            function processVolumeSliders() {
                for (let elem of document.querySelectorAll('.v-input__slider .mdi-volume-source:not([hil-slider-processed="1"])')) {
                    elem.setAttribute('hil-slider-processed', '1');
                    const masterSliderContainer = elem.parentElement.parentElement.parentElement;

                    function customVolumeSlider(iconClass) {
                        const sliderContainer = masterSliderContainer.cloneNode(true);
                        sliderContainer.querySelector('.mdi-volume-source').classList.add(iconClass);
                        sliderContainer.querySelector('.mdi-volume-source').classList.remove('mdi-volume-source');
                        sliderContainer.querySelector('.v-slider__track-background').style.width = '100%';
                        masterSliderContainer.parentElement.appendChild(sliderContainer);
                        return sliderContainer;
                    }
                    const bgsSliderContainer = customVolumeSlider('mdi-volume-high');
                    const bgmSliderContainer = customVolumeSlider('mdi-music');
                    for (let child of masterSliderContainer.parentElement.children) {
                        child.style.marginBottom = '20px';
                    }
                    masterSliderContainer.parentElement.lastElementChild.style.removeProperty('margin-bottom');

                    const masterIcon = masterSliderContainer.querySelector('.mdi-volume-source');
                    masterIcon.classList.remove('mdi');
                    masterIcon.classList.remove('mdi-volume-source');
                    masterIcon.textContent = 'All';
                    masterIcon.style.fontSize = '120%';

                    let bgmVolume = 'hil-bgm-volume' in localStorage ? parseInt(localStorage['hil-bgm-volume']) : 100;
                    let bgsVolume = 'hil-bgs-volume' in localStorage ? parseInt(localStorage['hil-bgs-volume']) : 100;

                    function setSlider(value, sliderContainer, callback = null) {
                        if (value > 100) value = 100;
                        else if (value < 0) value = 0;
                        sliderContainer.querySelector('.v-slider__track-fill').style.width = value + '%';
                        sliderContainer.querySelector('.v-slider__thumb-container').style.left = value + '%';
                        sliderContainer.querySelector('.v-slider__thumb-label > div > span').textContent = value;
                        if (callback) callback(value);
                    }
                    function sliderEvent(event, sliderContainer, callback) {
                        const sliderRect = sliderContainer.querySelector('.v-slider').getClientRects()[0];
                        let value = Math.round((event.clientX - sliderRect.x) / sliderRect.width * 100);
                        setSlider(value, sliderContainer, callback);
                    }
                    function mouseDownListener(event, sliderContainer, callback) {
                        sliderContainer.querySelector('.v-slider__thumb-container').classList.add('v-slider__thumb-container--active');
                        const adjust = e => sliderEvent(e, sliderContainer, callback);
                        adjust(event);
                        document.addEventListener('mousemove', adjust);
                        document.addEventListener('mouseup', function () {
                            sliderContainer.querySelector('.v-slider__thumb-container').classList.remove('v-slider__thumb-container--active');
                            document.removeEventListener('mousemove', adjust);
                        }, { once: true });
                    }

                    function howlIsMusic(howl) {
                        return howl._loop || howl._src.slice(0, 13) === '/audio/music/';
                    }

                    bgmSliderContainer.querySelector('.v-slider').addEventListener('mousedown', function (event) {
                        mouseDownListener(event, bgmSliderContainer, function (value) {
                            bgmVolume = value;
                            localStorage['hil-bgm-volume'] = value;
                            for (let howl of Howler._howls) {
                                if (!howlIsMusic(howl)) continue;
                                howl.volume(howl._hilOrigVolume * bgmVolume / 100);
                            }
                        })
                    });
                    setSlider(bgmVolume, bgmSliderContainer);

                    bgsSliderContainer.querySelector('.v-slider').addEventListener('mousedown', function (event) {
                        mouseDownListener(event, bgsSliderContainer, function (value) {
                            bgsVolume = value;
                            localStorage['hil-bgs-volume'] = value;
                            for (let howl of Howler._howls) {
                                if (howlIsMusic(howl)) continue;
                                howl.volume(howl._hilOrigVolume * bgsVolume / 100);
                            }
                        })
                    });
                    setSlider(bgsVolume, bgsSliderContainer);

                    Howler._howls.push = function (...args) {
                        Array.prototype.push.call(Howler._howls, ...args);
                        for (let howl of Howler._howls) {
                            if (howl._hilProcessed) continue;
                            howl._hilProcessed = true;
                            const getHilVolume = howlIsMusic(howl) ? () => bgmVolume : () => bgsVolume;

                            howl._hilOrigVolume = howl.volume();
                            howl.volume(howl._hilOrigVolume * getHilVolume() / 100);
                            const origFade = howl.fade.bind(howl);
                            howl.fade = function (from, to, dur) {
                                origFade(from * getHilVolume() / 100, to * getHilVolume() / 100, dur);
                            }
                        }
                    };
                }
            }
            processVolumeSliders();
            window.addEventListener('message', function(event) {
                const action = event.data[0];
                if (action === 'room_spectated') processVolumeSliders();
            })
        }

        if (socketStates.options['disable-testimony-shortcut']) {
            const shortcutDiv = document.querySelector('.v-main__wrap > div');
            shortcutDiv.addEventListener('shortkey', function(event) {
                if (event.srcKey !== 't' || event.hilIgnore === true) return;
    
                const newEvent = new CustomEvent('shortkey');
                newEvent.srcKey = event.srcKey;
                newEvent.hilIgnore = true;
                shortcutDiv.dispatchEvent(newEvent);
            });
        }
    });


    const origOnevent = socket.onevent;
    socket.onevent = function (e) {
        const [action, data] = e.data;

        if (action === 'spectate_success') {
            socketStates.spectating = true;
        } else if (action === 'join_success' && socketStates.spectating) {
            location.reload();
        } else if (action === 'receive_message') {

            if (socketStates.options['tts'] && socketStates['tts-enabled']) data.frame.frameActions.push({ "actionId": 5 });
            if (socketStates.options['list-moderation'] && socketStates.options['mute-character']) {
                const unwatch = frameInstance.$watch('frame', function (frame) {
                    if (!compareShallow(frame, data.frame, ['text', 'poseId', 'bubbleType', 'username', 'mergeNext', 'doNotTalk', 'goNext', 'poseAnimation', 'flipped', 'backgroundId', 'characterId', 'popupId'])) return;
                    unwatch();

                    if (data.userId in socketStates['mutedCharUsers']) {
                        const muteCharacter = getMuteCharacter(frameInstance.character.id, frame.poseId);
                        if (frameInstance.pairConfig?.characterId === frameInstance.character.id) frameInstance.pairConfig.characterId = muteCharacter.characterId;
                        else if (frameInstance.pairConfig?.characterId2 === frameInstance.character.id) frameInstance.pairConfig.characterId2 = muteCharacter.characterId;
                        frame.characterId = muteCharacter.characterId;
                        frame.poseId = muteCharacter.poseId;
                    }

                    if (Object.values(muteCharacters).map(character => character.poseId).includes(frame.pairPoseId)) return;
                    const pairedUser = roomInstance.pairs.find(pair => pair.userId1 === data.userId)?.userId2 || roomInstance.pairs.find(pair => pair.userId2 === data.userId)?.userId1;
                    if (!(pairedUser in socketStates['mutedCharUsers'])) return;

                    const pairIs2 = frameInstance.character.id === frameInstance.pairConfig.characterId;
                    const muteCharacter = getMuteCharacter(pairIs2 ? frameInstance.pairConfig.characterId2 : frameInstance.pairConfig.characterId, frame.pairPoseId);
                    frameInstance.frame.pairPoseId = muteCharacter.poseId;
                    if (pairIs2) frameInstance.pairConfig.characterId2 = muteCharacter.characterId;
                    else frameInstance.pairConfig.characterId = muteCharacter.characterId;
                });
            }
            if (socketStates.options['now-playing']) {
                const musicSpan = document.querySelector('div.hil-tab-row-now-playing > span');
                const match = data.frame.text.match(/\[#bgm(?:[0-9]*?|s|d)\]/g);
                if (match !== null) {
                    const tag = match[match.length - 1].match(/\[#bgm(.*?)\]/)[1];
                    if (tag == 's') {
                        musicSpan.innerHTML = 'Now Playing: …';
                    } else if (tag == 'd') {
                        musicSpan.innerHTML = 'Now Playing: 😵‍💫';
                    } else if (parseInt(tag) !== NaN) {
                        const url = 'https://api.objection.lol/assets/music/get?id=' + tag;
                        httpGetAsync(url).then(function (response) {
                            const music = JSON.parse(response);
                            // const audioElement = document.createElement('audio');
                            // audioElement.src = music.url;
                            // socketStates['now-playing-duration'] = Math.round(audioElement.duration);

                            musicSpan.textContent = music.name ? '"' + music.name + '"' : 'Unnamed';

                            function updateNowPlaying() {
                                musicSpan.innerHTML = 'Now Playing: <b>' + musicSpan.innerHTML + '</b>';
                            }
                            updateNowPlaying();
                        })
                    }
                }
            }
            socketStates['prev-message'] = data;

        } else if (action === 'receive_plain_message') {
            window.postMessage(['plain_message', {
                text: data.text,
                userId: data.userId,
                username: roomInstance.users.find(user => user.id === data.userId).username,
            }]);
        } else if (action === 'user_left') {
            if (socketStates.options['remute'] && data.discordUsername) {
                if (muteInputInstance.selectedItems.find(user => user.id === data.id)) {
                    socketStates['mutedLeftCache'][data.discordUsername] = true;
                }
                if (socketStates.options['mute-character'] && data.id in socketStates['mutedCharUsers']) {
                    socketStates['hiddenLeftCache'][data.discordUsername] = true;
                }
            }
            if (socketStates.options['chat-moderation']) {
                for (let buttonContainer of document.querySelectorAll('div.hil-user-action-buttons[data-user-id="' + data.id + '"]')) {
                    buttonContainer.removeWithTooltips();
                }
            }
        } else if (action === 'set_mods') {
            for (let icon of document.querySelectorAll('.hil-userlist-mod > i.mdi-crown')) {
                const button = icon.parentElement;
                if (!data.includes(parseInt(button.parentElement.dataset.userId))) continue;
                icon.classList.add('mdi-account-arrow-down');
                icon.classList.remove('mdi-crown');
                button.tooltip?.realign('Remove moderator');
            }
            for (let icon of document.querySelectorAll('.hil-userlist-mod > i.mdi-account-arrow-down')) {
                const button = icon.parentElement;
                if (data.includes(parseInt(button.parentElement.dataset.userId))) continue;
                icon.classList.remove('mdi-account-arrow-down');
                icon.classList.add('mdi-crown');
                button.tooltip?.realign('Make moderator');
            }
        } else if (action === 'user_joined') {
            if (socketStates.options['remute'] && data.discordUsername) {
                function addJoinText(text) {
                    const checkLastMessage = () => {
                        if (chatInstance.messages[chatInstance.messages.length - 1].text.slice(0, -' joined.'.length) !== data.username) return false;
                        chatInstance.messages[chatInstance.messages.length - 1].text += ' ' + text;
                        return true;
                    }
                    if (checkLastMessage() === false) {
                        const unwatch = chatInstance.$watch('messages', function () {
                            if (checkLastMessage()) unwatch();
                        });
                    }
                }

                if (data.discordUsername in socketStates['mutedLeftCache']) {
                    muteInputInstance.selectItem(data.id);
                    delete socketStates['mutedLeftCache'][data.discordUsername];
                    addJoinText('(Automatically re-muted)');
                } else if (socketStates.options['mute-character'] && data.discordUsername in socketStates['hiddenLeftCache']) {
                    addJoinText('(Automatically re-hidden)');
                }
                if (socketStates.options['mute-character'] && data.discordUsername in socketStates['hiddenLeftCache']) {
                    socketStates['mutedCharUsers'][data.id] = true;
                    delete socketStates['hiddenLeftCache'][data.discordUsername];
                }
            }
        }

        origOnevent(e);
    }

    const origEmit = socket.emit;
    socket.emit = function (action, data) {
        let delay = 0;

        if (action === 'message') {
            if (socketStates['no-talk'] || data.frame.text.includes('[##nt]')) data.frame.doNotTalk = true;
            if (data.frame.text.includes('[##tm]')) data.testimony = true;
            if (socketStates.options['smart-pre']) {
                if (data.frame.poseAnimation) window.postMessage(['pre_animate_locked']);
                if (data.frame.poseId === socketStates['prev-pre-pose']) data.frame.poseAnimation = false;
            }
            if (socketStates.options['smart-tn'] && data.frame.poseAnimation && socketStates['prev-char'] === characterInstance.currentCharacter.id && data.frame.poseId !== socketStates['prev-pose']) {
                (function () {
                    let useTN = socketStates.options['tn-toggle-value'];
                    useTN = useTN === undefined ? true : useTN;
                    useTN = data.frame.text.includes('[##tn]') ? !useTN : useTN;
                    if (!useTN) return;

                    if (socketStates.options['tn-toggle-on-screen'] && socketStates['prev-message'] !== undefined) {
                        const prevFrame = socketStates['prev-message'].frame;
                        if (prevFrame.text.match(/\[#evd[0-9]*?\]/g) || prevFrame.characterId !== data.frame.characterId || (prevFrame.pairId === data.frame.pairId && data.frame.pairId !== null)) return;
                    }

                    const patterns = socketStates.options['smart-tn-patterns'] || ['TN'];
                    const charPoses = characterInstance.currentCharacter.poses;
                    const prevPoseName = charPoses.find(pose => pose.id === socketStates['prev-pose']).name;
                    const currentPoseName = charPoses.find(pose => pose.id === data.frame.poseId).name;
                    let poseIsTN = false;
                    for (let substr of patterns) {
                        if (prevPoseName.includes(substr)) poseIsTN = true;
                        if (currentPoseName.includes(substr)) poseIsTN = true;
                    }
                    if (poseIsTN) return;

                    let tnPoses = [];
                    for (let substr of patterns) {
                        tnPoses = tnPoses.concat(charPoses.filter(pose => pose.name.includes(substr)));
                    }
                    if (tnPoses.length === 0) return;
                    const [tnPoseName, distance] = closestMatch(prevPoseName, tnPoses.map(pose => pose.name));
                    if (!tnPoseName) return;
                    const ratio = (prevPoseName.length + tnPoseName.length - distance) / (prevPoseName.length + tnPoseName.length);
                    if (ratio < 0.63) return;
                    const tnPoseId = charPoses.find(pose => pose.name === tnPoseName).id;
                    const tnData = JSON.parse(JSON.stringify(data));
                    tnData.frame.poseId = tnPoseId;
                    tnData.frame.text = '';
                    origEmit.call(socket, action, tnData);
                    delay = 1000;
                })();
            }
            if (socketStates.options['testimony-mode']) (function () {
                const match = /\[##tmid([0-9]+?)\]/g.exec(data.frame.text);
                if (match === null) return;
                const statementId = parseInt(match[1]);

                if (socketStates.testimonyPoses[statementId]) {
                    data.frame.poseId = socketStates.testimonyPoses[statementId];
                } else {
                    socketStates.testimonyPoses[statementId] = poseInstance.currentPoseId;
                    window.postMessage([
                        'set_statement_pose_name',
                        {
                            id: statementId,
                            name: poseInstance.characterPoses.find(pose => pose.id === poseInstance.currentPoseId).name,
                        }
                    ]);
                }
            })();
            if (socketStates.options['smart-pre']) socketStates['prev-pre-pose'] = data.frame.poseId;
            socketStates['prev-pose'] = data.frame.poseId;
            socketStates['prev-char'] = characterInstance.currentCharacter.id;

            data.frame.text = data.frame.text.replaceAll(/\[##.*?\]/g, '');
        }

        if (delay === 0) origEmit.call(socket, action, data);
        else setTimeout(() => origEmit.call(socket, action, data), delay);
    }
}

main();
