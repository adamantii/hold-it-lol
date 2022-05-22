"use strict";
const socketStates = {
    options: {},
};

function main(socketComponent) {
    const TN_MIN_DIST = 0.63;
    const DEBUGLOGS = true;
    const socket = socketComponent.$socket;

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

    window.postMessage(['wrapper_loaded']);

    const origOnevent = socket.onevent;
    socket.onevent = function(e) {
        if (DEBUGLOGS) console.log('event', e);
        const [ action, data ] = e.data;

        if (action === 'receive_message') {
            if (socketStates['options']['now-playing']) {
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
            if (socketStates['options']['smart-pre'] && data.poseId === socketStates['prev-pose']) data.poseAnimation = false;
            if (socketStates['options']['smart-tn'] && data.poseAnimation && socketStates['prev-char'] === data.characterId && data.poseId !== socketStates['prev-pose']) {
                (function() {
                    let useTN = socketStates['options']['tn-toggle-value'];
                    useTN = useTN === undefined ? true : useTN;
                    useTN = data.text.includes('[##tn]') ? !useTN : useTN;
                    if (!useTN) return;

                    if (socketStates['options']['tn-toggle-on-screen']) {
                        const prevFrame = socketStates['prev-message'].frame;
                        if (prevFrame.text.match(/\[#evd[0-9]*?\]/g) || prevFrame.characterId !== data.characterId || !(prevFrame.pairId === data.pairId && data.pairId !== null)) return;
                    }

                    const patterns = socketStates.options['smart-tn-patterns'] || ['TN'];
                    const charPoses = socketComponent.$children.find(component => component.currentCharacter).currentCharacter.poses;
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
                    const [ tnPoseName, distance ] = closestMatch(prevPoseName, tnPoses.map(pose => pose.name));
                    // log.push([prevPoseName, tnPoseName, distance, ratio]);
                    if (!tnPoseName) return;
                    const ratio = (prevPoseName.length + tnPoseName.length - distance) / (prevPoseName.length + tnPoseName.length);
                    console.log([prevPoseName, tnPoseName, distance, ratio]);
                    if (ratio < TN_MIN_DIST) return;
                    const tnPoseId = charPoses.find(pose => pose.name === tnPoseName).id;
                    const tnFrame = JSON.parse(JSON.stringify(data));
                    tnFrame.poseId = tnPoseId;
                    tnFrame.text = '';
                    origEmit.call(socket, action, tnFrame);
                    delay = 1000;
                })();
            }
            socketStates['prev-pose'] = data.poseId;
            socketStates['prev-char'] = data.characterId;
        }

        if (delay === 0) origEmit.call(socket, action, data);
        else setTimeout(() => origEmit.call(socket, action, data), delay);
    }
}

window.addEventListener('message', function(event) {
    const [action, data] = event.data;
    if (action == 'set_options') socketStates.options = data;
    if (action == 'set_socket_state') {
        for (const key in data) {
            socketStates[key] = data[key];
        }
    }
})

//window.socketComponent defined in content.js intercepting OL's script
main(window.socketComponent);

console.log('socket_loaded pong');
