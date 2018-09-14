'use strict';

let renderer = require('./renderer');

exports.sendImage = function(data, destid){
    renderer.socket.emit('imgByClient', { isImage: true, buffer: data, destid: destid});
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
        let currentUser = renderer.getCurrentUser();
        if(renderer.didRequest()) {
            renderer.displaySwal("You are now connected with user " + data.dest);
            currentUser.connectedTo = data.dest;
            currentUser.connectedToId = data.destid;
        } else {
            renderer.displaySwal("User " + data.requester + " has initiated a connection with you");
            currentUser.connectedTo = data.requester;
            currentUser.connectedToId = data.requesterid;
        }
        currentUser.isConnected = true;
        renderer.setDidRequest(false);
    });

    renderer.socket.on('imgByClient', function(data) {
        console.log(data);
        let fileNames = [data];
        renderer.displayImage(fileNames, true);
    });
}