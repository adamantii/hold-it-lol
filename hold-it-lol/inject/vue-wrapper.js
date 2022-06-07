"use strict";

function main() {

    const socketStates = {
        options: undefined
    }
    window.socketStates = socketStates;
    socketStates.optionsLoaded = new Promise(function(resolve, reject) {
        socketStates.optionsLoadedResolve = resolve;
    });
    const DEBUGLOGS = true;
    const muteCharacters = {
        defense: {characterId: null, poseId: 1},
        prosecution: {characterId: null, poseId: 5},
        witness: {characterId: null, poseId: 142},
        counsel: {characterId: null, poseId: 45},
        judge: {characterId: null, poseId: 30},
        fallback: {characterId: null, poseId: 98},
    }

    const socket = document.querySelector('.v-main__wrap > div').__vue__.$socket;
    const roomInstance = document.querySelector('div.mx-auto.v-card--flat.v-sheet').parentElement.__vue__;
    const characterInstance = document.querySelector('.v-main__wrap > div > div.row > div:nth-child(1) > div').__vue__;
    const characterListInstance = document.querySelector('div.v-main__wrap > div > div.text-center').__vue__;
    const userInstance = document.querySelector('.v-main__wrap > div').__vue__;
    const poseInstance = document.querySelector('.col-sm-9.col-10 > div > div.swiper-container,.col-sm-9.col-10 > div > div.v-text-field').parentElement.__vue__;
    const frameInstance = document.querySelector('.court-container').parentElement.parentElement.__vue__;
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

    function createTooltip(text, anchorElement) {
        const tooltip = document.createElement('div');
        tooltip.className = 'v-tooltip__content hil-small-tooltip hil-hide';
        tooltip.textContent = text;
        tooltip.realign = function(newText = null) {
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
    window.addEventListener('message', function(event) {
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
        }
    });

    socketStates.optionsLoaded.then(function() {
        if (socketStates.options['testimony-mode']) socketStates['testimonyPoses'] = {};
        if (socketStates.options['mute-character']) socketStates['mutedCharUsers'] = {};

        if (socketStates.options['save-last-character']) {
            const storedId = localStorage['hil-last-character'];
            if (storedId >= 1000) {
                document.querySelector('.icon-character .v-image__image--cover').style.backgroundImage = 'url("/Images/Loading.gif")';
                let msLeft = 60000;
                const ccsLoadedInterval = setInterval(function() {
                    msLeft -= 50;
                    if (msLeft <= 0) clearInterval(ccsLoadedInterval);
                    if (characterListInstance.customList.length === 0) return;
                    characterListInstance.setCustomCharacter(storedId);
                    clearInterval(ccsLoadedInterval);
                }, 50);
            } else if (storedId > 1) {
                characterListInstance.setCharacter(storedId)
            }
            
            let lastId;
            setInterval(function() {
                if (characterInstance.currentCharacter.id !== lastId) {
                    lastId = characterInstance.currentCharacter.id;
                    localStorage['hil-last-character'] = lastId;
                }
            }, 100);
        }

        if (socketStates.options['tts']) {
            const dialogueBox = document.querySelector('.v-main div.chat-box');
            let lastProcessedFrame;
            new MutationObserver(function(mutations) {
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

        if (socketStates.options['list-moderation']) {
            function userActionButton(onclick, iconName, tooltipText = null, classText = '', cssText = '') {
                const button = document.createElement('button');
                button.className = classText + ' v-btn v-btn--has-bg hil-icon-button hil-themed ' + getTheme();
                if (cssText) button.style.cssText = cssText;
                
                button.appendChild(createIcon(iconName));
                
                if (onclick) button.addEventListener('click', () => onclick(button));
                if (tooltipText) {
                    button.addEventListener('mouseenter', function() {
                        if (button.tooltip === undefined) button.tooltip = createTooltip(tooltipText, button);
                        button.tooltip.realign();
                        button.tooltip.classList.remove('hil-hide');
                    });
                    button.addEventListener('mouseleave', () => button.tooltip.classList.add('hil-hide'));
                }

                return button;
            }

            function userActionButtonSet(usernameElement, constantId = false) {
                const container = document.createElement('div');
                container.className = 'hil-user-action-buttons';

                const initialId = getIDFromUsername(usernameElement.innerText);
                const getId = function() {
                    if (constantId) return initialId;
                    return getIDFromUsername(usernameElement.innerText);
                }

                const isMuted = muteInputInstance.selectedItems.find(item => item.username === usernameElement.innerText);
                const isCharacterMuted = initialId in socketStates['mutedCharUsers'];

                container.appendChild(userActionButton(function() {
                    const id = getId();
                    if (id === undefined) return;
                    
                    const mods = roomInstance.users.filter(user => user.isMod).map(user => user.id);
                    if (!mods.includes(id)) mods.push(id);
                    else mods.splice(mods.indexOf(id), 1);

                    socket.emit('set_mods', mods);
                }, 'crown', 'Make moderator', 'hil-userlist-mod', userInstance.currentUser.isOwner ? '' : 'display: none;'));

                container.appendChild(userActionButton(function() {
                    for (let label of document.querySelectorAll('.v-select--chips.v-text-field label')) {
                        if (label.textContent !== 'Banned Users') continue;
                        const banInputInstance = label.parentElement.parentElement.parentElement.parentElement.__vue__;
                        const id = getIDFromUsername(usernameElement.innerText, banInputInstance.items);
                        if (id === undefined) return;
                        banInputInstance.selectItem(id);
                        return;
                    }
                }, 'skull', 'Ban', 'hil-userlist-ban', userInstance.currentUser.isOwner || userInstance.currentUser.isMod ? '' : 'display: none;'));

                container.appendChild(userActionButton(function(button) {
                        const id = getId();
                        if (id === undefined) return;
                        muteInputInstance.selectItem(id);

                        const muted = !muteInputInstance.selectedItems.find(item => item.id === id); // Counter-intuitive but trust it
                        const mutedIndicatorMethod = muted ? 'add' : 'remove';
                        const unmutedIndicatorMethod = !muted ? 'add' : 'remove';
                        button.querySelector('i').classList[unmutedIndicatorMethod]('mdi-volume-off');
                        button.querySelector('i').classList[mutedIndicatorMethod]('mdi-volume-high');
                        container.parentElement.querySelector('.hil-user-action-icons .mdi-volume-off')?.classList[unmutedIndicatorMethod]('hil-hide');
                        button.tooltip?.realign(muted ? 'Unmute' : 'Mute');
                    },
                    isMuted ? 'volume-high' : 'volume-off',
                    isMuted ? 'Unmute' : 'Mute',
                    'hil-userlist-mute')
                );

                if (socketStates.options['mute-character']) container.appendChild(userActionButton(function(button) {
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
                        button.querySelector('i').classList[unmutedIndicatorMethod]('mdi-eye-off');
                        button.querySelector('i').classList[mutedIndicatorMethod]('mdi-eye');
                        container.parentElement.querySelector('.hil-user-action-icons .mdi-eye-off')?.classList[unmutedIndicatorMethod]('hil-hide');
                        button.tooltip?.realign(muted ? 'Show character' : 'Hide character');
                    },
                    isCharacterMuted ? 'eye' : 'eye-off',
                    isCharacterMuted ? 'Show character' : 'Hide character',
                    'hil-userlist-mute-char')
                );
                
                container.removeWithTooltips = function() {
                    container.querySelectorAll('.hil-icon-button').forEach(button => button.tooltip?.remove());
                    container.remove();
                }
                return container;
            }

            function userActionIconSet() {
                const container = document.createElement('div');
                container.className = 'hil-user-action-icons';
                // container.appendChild(createIcon('crown'));
                // container.appendChild(createIcon('skull'));
                container.appendChild(createIcon('volume-off', undefined, undefined, 'hil-hide'));
                if (socketStates.options['mute-character']) container.appendChild(createIcon('eye-off', undefined, undefined, 'hil-hide'));
                return container;
            }

            function processUserListItem(userItem) {
                const usernameElement = userItem.querySelector('.v-list-item__title');
                if (usernameElement.innerText === userInstance.currentUser.username) return;
                userItem.appendChild(userActionButtonSet(usernameElement, true));
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
            userListButton.addEventListener('click', function() {
                for (let title of document.querySelectorAll('.v-toolbar__title')) {
                    if (title.innerText !== 'Users') continue;

                    userList = title.parentElement.parentElement.parentElement.querySelector('.v-list');
                    for (let userItem of userList.children) {
                        processUserListItem(userItem);
                    }

                    new MutationObserver(function(mutations) {
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

            userInstance.$watch('currentUser', function(user) {
                if (!document.contains(userList)) return;
                
                if (user.isOwner) userList.querySelectorAll('.hil-userlist-mod').forEach(button => button.style.removeProperty('display'));
                else userList.querySelectorAll('.hil-userlist-mod').forEach(button => button.style.setProperty('display', 'none'));
                if (user.isOwner || user.isMod) userList.querySelectorAll('.hil-userlist-ban').forEach(button => button.style.removeProperty('display'));
                else userList.querySelectorAll('.hil-userlist-ban').forEach(button => button.style.setProperty('display', 'none'));
            }, { deep: true });
        }
    });


    const origOnevent = socket.onevent;
    socket.onevent = function(e) {
        if (DEBUGLOGS) console.log('event', e);
        const [ action, data ] = e.data;

        if (action === 'receive_message') {

            if (socketStates.options['tts'] && socketStates['tts-enabled']) data.frame.frameActions.push({ "actionId": 5 });
            if (socketStates.options['mute-character'] && data.userId in socketStates['mutedCharUsers']) {
                let muteCharacter;
                if (frameInstance.customCharacters[data.frame.characterId]) {
                    muteCharacter = muteCharacters[frameInstance.customCharacters[data.frame.characterId].side];
                } else if (data.frame.characterId === null) {
                    muteCharacter = muteCharacters[getPresetCharacterFromPose(data.frame.poseId).side];
                    // TODO: add extra condition for known paired character's side
                } else {
                    muteCharacter = muteCharacters.witness
                }
                data.frame.characterId = muteCharacter.characterId;
                data.frame.poseId = muteCharacter.poseId;
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
                        httpGetAsync(url).then(function(response) {
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

        }

        origOnevent(e);
    }

    const origEmit = socket.emit;
    socket.emit = function(action, data) {
        if (DEBUGLOGS) console.log('emit', action, data);
        let delay = 0;

        if (action === 'message') {
            if (socketStates['no-talk'] || data.text.includes('[##nt]')) data.doNotTalk = true;
            if (socketStates.options['smart-pre']) {
                if (data.poseAnimation) window.postMessage(['pre_animate_locked']);
                if (data.poseId === socketStates['prev-pre-pose']) data.poseAnimation = false;
            }
            if (socketStates.options['smart-tn'] && data.poseAnimation && socketStates['prev-char-id'] === characterInstance.currentCharacter.id && data.poseId !== socketStates['prev-pose']) {
                (function() {
                    let useTN = socketStates.options['tn-toggle-value'];
                    useTN = useTN === undefined ? true : useTN;
                    useTN = data.text.includes('[##tn]') ? !useTN : useTN;
                    if (!useTN) return;

                    if (socketStates.options['tn-toggle-on-screen'] && socketStates['prev-message'] !== undefined) {
                        const prevFrame = socketStates['prev-message'].frame;
                        if (prevFrame.text.match(/\[#evd[0-9]*?\]/g) || prevFrame.characterId !== data.characterId || (prevFrame.pairId === data.pairId && data.pairId !== null)) return;
                    }

                    const patterns = socketStates.options['smart-tn-patterns'] || ['TN'];
                    const charPoses = characterInstance.currentCharacter.poses;
                    const prevPoseName = charPoses.find(pose => pose.id === socketStates['prev-pose']).name;
                    const currentPoseName = charPoses.find(pose => pose.id === data.poseId).name;
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
                    const [ tnPoseName, distance ] = closestMatch(prevPoseName, tnPoses.map(pose => pose.name));
                    if (!tnPoseName) return;
                    const ratio = (prevPoseName.length + tnPoseName.length - distance) / (prevPoseName.length + tnPoseName.length);
                    if (ratio < 0.63) return;
                    const tnPoseId = charPoses.find(pose => pose.name === tnPoseName).id;
                    const tnFrame = JSON.parse(JSON.stringify(data));
                    tnFrame.poseId = tnPoseId;
                    tnFrame.text = '';
                    origEmit.call(socket, action, tnFrame);
                    delay = 1000;
                })();
            }
            if (socketStates.options['testimony-mode']) (function() {
                const match = /\[##tmid([0-9]+?)\]/g.exec(data.text);
                if (match === null) return;
                const statementId = parseInt(match[1]);

                if (socketStates.testimonyPoses[statementId]) {
                    data.poseId = socketStates.testimonyPoses[statementId];
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
            if (socketStates.options['smart-pre']) socketStates['prev-pre-pose'] = data.poseId;
            socketStates['prev-pose'] = data.poseId;
            socketStates['prev-char'] = characterInstance.currentCharacter.id;

            data.text = data.text.replaceAll(/\[##.*?\]/g, '');
        }

        if (delay === 0) origEmit.call(socket, action, data);
        else setTimeout(() => origEmit.call(socket, action, data), delay);
    }
}

main();
