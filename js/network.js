'use strict';
let event = require('./event')
let renderer = require('./renderer');
let network = require('./network');
let dialogmodule = require('./dialog');
let md5 = require('md5');

exports.sendImage = function(data){
    event.socket.emit('imgByClient', { image: true, buffer: data.buffer, destid: data.destid});
}

exports.addFriend = function(username){
    event.socket.emit('addfriend', {toAdd: username}, (error, data) => {
        if (error) {
            dialogmodule.displaySwal(error);
        } else {
            dialogmodule.displaySwal(data);
        }
    });
}

exports.requestSalt = function(username, password, newUser, result) {
    event.socket.emit('requestsalt', (error, data) => {
        let salt = data;
        let hashedpw = md5(username + salt + password);
        if (!newUser) {
            exports.login(username, hashedpw);
        } else if (result.DismissReason.cancel) {
            exports.register(username, hashedpw);
        }
    })
}

exports.register = function(username, hashedpw) {
    event.socket.emit('createuser', {username: username, hashedpw: hashedpw}, (error, data) => {
        if (error){
            dialogmodule.displaySwal(error);
        }
        else {
            event.socket.emit('customClientInfo', {
                customId: username,
            });
            renderer.createUserObj(username);
            dialogmodule.displaySwal(data);
        }
    });
}

exports.login = function(username, hashedpw) {
    event.socket.emit('hashedpw', {username: username, hashedpw: hashedpw}, (error, data) => {
        if (error){
            dialogmodule.displaySwal(error);
        }
        else {
             event.socket.emit('customClientInfo', {
                customId: username,
            });
            renderer.createUserObj(username);
            dialogmodule.displaySwal(data);
        }
    });
}

exports.requestClientInfo = function () {
    let currentUser = renderer.getCurrentUser();
    console.log(currentUser);
    event.socket.emit('requestclientinfo', {username: currentUser.username}, (error, data) => {
        if (error){
            dialogmodule.displaySwal(error);
        }
        else {
            for (let i = 0; i < data.length; i++) {
                let object = data[i];
                for (let property in object) {
                    let friend = {
                        username: object[property],
                        isOnline: false,
                    }
                    currentUser.friendslist.push(friend);
                }
            }
        }
    });
}

exports.getOnlineFriends = function() {
    if(renderer.getCurrentUser() !== undefined && renderer.getCurrentUser() !== null) {
        let onlinefriends = [];
        event.socket.emit('getonlinefriends', {username: renderer.getCurrentUser().username}, (error, data) => {
            for(let i = 0; i < renderer.getCurrentUser().friendslist.length; i++){
                for(let j = 0; j < data.rows.length; j++){
                    let friendobj = JSON.parse(JSON.stringify(data.rows[j]));
                    if(friendobj.username === renderer.getCurrentUser().friendslist[i].username){
                        onlinefriends.push(friendobj.username);
                    }
                }
            }
            dialogmodule.connectToFriend(onlinefriends);
        })
    } else {
        dialogmodule.displaySwal({text: "You are not logged in!", type: "warning"})
    }
}

exports.startSocketListeners = function() {
    event.socket.on('newuser', function(data) {
        renderer.setUsers(data.userlist);
    });

    event.socket.on('userleft',function(data) {
        renderer.setUsers(data.userlist);
    });

    event.socket.on('broadcast',function(data) {
        console.log(data.description);
    });

    event.socket.on('connectionsuccess', function(data){
        let currentUser = renderer.getCurrentUser();
        if(renderer.didRequest()) {
            dialogmodule.displaySwal("You are now connected with user " + data.dest);
            currentUser.connectedTo = data.dest;
            currentUser.connectedToId = data.destid;
        } else {
            dialogmodule.displaySwal("User " + data.requester + " has initiated a connection with you");
            currentUser.connectedTo = data.requester;
            currentUser.connectedToId = data.requesterid;
        }
        currentUser.isConnected = true;
        renderer.setDidRequest(false);
    });

    event.socket.on('imgByClient', function(data) {
        let fileNames = [data];
        renderer.displayImage(fileNames, true);
    });
}