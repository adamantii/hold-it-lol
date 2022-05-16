"use strict";
const socketStates = {
    options: {},
};

function main(socketComponent) {
    const TN_MIN_DIST = 0.63;
    const DEBUGLOGS = true;
    const socket = socketComponent.$socket;

    window.postMessage(['wrapper_loaded'])

    const origOnevent = socket.onevent;
    socket.onevent = function(e) {
        if (DEBUGLOGS) console.log('event', e);
        origOnevent(e);
    }

    const origEmit = socket.emit;
    socket.emit = function(type, data) {
        if (DEBUGLOGS) console.log('emit', type, data);
        let delay = 0;

        if (type === 'message') {
            if (socketStates['no-talk'] || data.text.includes('[##nt]')) data.doNotTalk = true;
            if (socketStates['options']['smart-pre'] && data.poseId === socketStates['prev-pose']) data.poseAnimation = false;
            if (socketStates['options']['smart-tn']) {
                (function() {
                    let useTN = socketStates['tn-enabled'];
                    useTN = useTN === undefined ? true : useTN;
                    useTN = data.text.includes('[##tn]') ? !useTN : useTN;

                    if (useTN && socketStates['prev-char'] === data.characterId && data.poseId !== socketStates['prev-pose']) {
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
                        origEmit.call(socket, type, tnFrame);
                        delay = 1000;
                    }
                })();
            }
            socketStates['prev-pose'] = data.poseId;
            socketStates['prev-char'] = data.characterId;
        }

        if (delay === 0) origEmit.call(socket, type, data);
        else setTimeout(() => origEmit.call(socket, type, data), delay);
    }
}

window.addEventListener('message', function(event) {
    const [type, data] = event.data;
    if (type == 'set_options') socketStates.options = data;
    if (type == 'set_socket_state') {
        for (const key in data) {
            socketStates[key] = data[key];
        }
    }
})

//window.socketComponent defined in content.js intercepting OL's script
main(window.socketComponent);

console.log('socket_loaded pong');
