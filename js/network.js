'use strict';

let renderer = require('./renderer');

exports.sendImage = function(image){
    renderer.socket.emit('imgByClient', { image });
}

exports.startSocketListeners = function() {
    renderer.socket.on('newuser', function(data) {
        console.log("hallå");
        renderer.setUsers(data.userlist);
    });

    renderer.socket.on('userleft',function(data) {
        renderer.setUsers(data.userlist);
    });

    renderer.socket.on('broadcast',function(data) {
        console.log(data.description);
    });

    renderer.socket.on('connectionsuccess', function(data){
        if(renderer.didRequest()) {
            renderer.displaySwal("You are now connected with user " + data.dest);
            renderer.getCurrentUser().connectedTo = data.dest;
        } else {
            renderer.displaySwal("User " + data.requester + " has initiated a connection with you");
            renderer.getCurrentUser().connectedTo = data.requester;
        }
        renderer.getCurrentUser().isConnected = true;
        renderer.setDidRequest(false);
    });

    renderer.socket.on('imgByClient', function(data) {
        console.log("VAFAN");
        let fileNames = [data];
        renderer.displayImage(fileNames, true);
    });

    renderer.socket.on('requestConnectedTo', function(callback) {
        callback(null, renderer.getCurrentUser().connectedTo);
    });
}