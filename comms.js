var ws = new WebSocket("ws://localhost:8084");

ws.onerror = function(err) {
    console.log("Error: ", err);
};

ws.onmessage = function(x) {
    console.log("Info: ", x);

    var cmd = parseMessage(x);
    b.apply_move(cmd[0], cmd[1], cmd[2], cmd[3]);
};

function parseMessage(x) {
    return JSON.parse(x.data);
}

