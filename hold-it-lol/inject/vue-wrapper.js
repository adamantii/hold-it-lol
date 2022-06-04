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
    // const optionsInstance = document.querySelector('div.mx-auto.v-card--flat.v-sheet').parentElement.__vue__;
    const characterInstance = document.querySelector('.v-main__wrap > div > div.row > div:nth-child(1) > div').__vue__;
    const characterListInstance = document.querySelector('div.v-main__wrap > div > div.text-center').__vue__;
    const userInstance = document.querySelector('.v-main__wrap > div').__vue__;
    const poseInstance = document.querySelector('.col-sm-9.col-10 > div > div.swiper-container,.col-sm-9.col-10 > div > div.v-text-field').parentElement.__vue__;
    const frameInstance = document.querySelector('.court-container').parentElement.parentElement.__vue__;
    let muteInputInstance;
    for (let label of document.querySelectorAll('.v-input--dense.v-text-field label')) {
        if (label.textContent !== 'Muted Users') continue;
        muteInputInstance = label.parentElement.parentElement.parentElement.parentElement.__vue__;
        break;
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
        } else if (action === 'user_mute') {
            const item = muteInputInstance.items.find(item => item.username === data);
            muteInputInstance.selectItem(item);
        } else if (action === 'user_ban') {
            const item = muteInputInstance.items.find(item => item.username === data);
            if (!item) return;
            socket.emit('set_bans', socketStates['bans'].concat(item.id));
        } else if (action === 'user_mod') {
            const item = muteInputInstance.items.find(item => item.username === data);
            if (!item) return;
            const mods = socketStates['mods'];
            if (mods.includes(item.id)) {
                mods.splice(mods.indexOf(item.id), 1);
            } else {
                mods.push(item.id);
            }
            socket.emit('set_mods', mods);
        } else if (action === 'user_mute_char') {
            const item = muteInputInstance.items.find(item => item.username === data);
            if (!item) return;
            if (socketStates['mutedCharUsers'].includes(item.id)) {
                socketStates['mutedCharUsers'].splice(socketStates['mutedCharUsers'].indexOf(item.id), 1);
            } else {
                socketStates['mutedCharUsers'].push(item.id);
            }
            const presentUsers = muteInputInstance.items.filter(item => socketStates['mutedCharUsers'].includes(item.id));
            socketStates['mutedCharUsers'] = presentUsers.map(user => user.id);
            window.postMessage([
                'set_muted_char_usernames',
                presentUsers.map(user => user.username),
            ]);
        }
    });

    socketStates.optionsLoaded.then(function() {
        if (socketStates.options['testimony-mode']) socketStates['testimonyPoses'] = {};
        if (socketStates.options['mute-character']) socketStates['mutedCharUsers'] = [];
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
    });


    const origOnevent = socket.onevent;
    socket.onevent = function(e) {
        if (DEBUGLOGS) console.log('event', e);
        const [ action, data ] = e.data;

        if (action === 'receive_message') {

            if (socketStates.options['tts'] && socketStates['tts-enabled']) data.frame.frameActions.push({ "actionId": 5 });
            if (socketStates.options['mute-character'] && socketStates['mutedCharUsers'].includes(data.userId)) {
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
        if (socketStates.options['list-moderation']) {
            if (action === 'get_owner_options') {
                window.postMessage(['is_owner']);
            } else if (action === 'owner_data') {
                window.postMessage(['is_owner']);
                socketStates['mods'] = data.mods;
                socketStates['bans'] = data.bans.map(user => user.id);
            } else if (action === 'set_mods') {
                socketStates['mods'] = data;
                if (socketStates.options['list-moderation']) {
                    if (data.includes(userInstance.currentUser.id)) window.postMessage(['is_mod']);
                    else window.postMessage(['is_mid']);
                }
            } else if (action === 'set_bans') {
                socketStates['bans'] = data.map(user => user.id);
            } else if (action === 'room_data') {
                socketStates['mods'] = data.users.filter(user => user.isMod).map(user => user.id);
            }
        }
        if (socketStates.options['mute-character']) {
            if (action === 'change_username' && socketStates['mutedCharUsers'].includes(data.userId)) {
                const presentUsers = muteInputInstance.items.filter(item => socketStates['mutedCharUsers'].includes(item.id));
                presentUsers.find(user => user.id === data.userId).username = data.username;
                window.postMessage([
                    'set_muted_char_usernames',
                    presentUsers.map(user => user.username),
                ]);
            }
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
