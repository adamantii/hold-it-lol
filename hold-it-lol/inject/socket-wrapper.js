const socketStates = {
    options: {},
};

function main(socket) {
    const debuglogs = false;

    const origOnevent = socket.onevent;
    socket.onevent = function(e) {
        if (debuglogs) console.log('event', e);
        origOnevent(e);
    }

    const origEmit = socket.emit;
    socket.emit = function(type, data) {
        if (debuglogs) console.log('emit', type, data);

        if (type === 'message') {
            data.doNotTalk = true;
        }

        origEmit.call(socket, type, data);
    }
}

window.addEventListener('message', function(event) {
    const [type, data] = event.data;
    if (type == 'set_options') socketStates.options = data;
})

//window.socket defined in content.js intercepting OL's script
main(window.socket);
