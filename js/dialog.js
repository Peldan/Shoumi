'use strict';

const swal = require('sweetalert2');
let renderer = require('./renderer');
let network = require('./network');
const {dialog} = require('electron').remote;

exports.connectToFriend = function (onlinefriends) {
    console.log(renderer.getCurrentUser());
    if(renderer.getCurrentUser() !== undefined && renderer.getCurrentUser() !== null) {
        swal({
            title: "Start an image-sharing session with a friend",
            text: "Online friends",
            type: 'question',
            input: 'select',
            inputOptions: onlinefriends,
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: true,
            preConfirm: () => {
                renderer.setDidRequest(true);
            }
        }).then((result) => {
            if (result.value) {
                exports.socket.emit('connecttofriend', {
                    user: renderer.getCurrentUser().username,
                    friend: onlinefriends[swal.getInput().selectedIndex]
                }, (error, data) => {
                    if (error) swal(error);
                });
            }
        });
    } else {
        swal({text: "You are not logged in!", type:"warning"});
    }
}

exports.openFileDialog = function() {
    dialog.showOpenDialog({
        properties: ["openFile", "multiSelections"],
        filters: [
            {name: "Images", extensions: ["jpg", "png", "gif"]}
        ]
    }, fileNames => {
        if (fileNames === undefined) {
            return;
        }
        renderer.displayImage(fileNames, false);
    })
}

exports.showRegisterSignInDialog = function(result, username, password) {
    let newUser = false;
    if(result.dismiss === swal.DismissReason.cancel){
        newUser = true;
    }
    if(result.dismiss === swal.DismissReason.close){
        return;
    }
    swal({
        title: (newUser) ?  "Register" : "Sign in" ,
        type: 'question',
        html:
            '<input id="swal-input1" class="swal2-input" type="text" placeholder="Username" required/>' +
            '<input id="swal-input2" class="swal2-input" type="password" placeholder="Password" required/>',
        showCloseButton: true,
        showCancelButton: true,
        focusConfirm: true,
        confirmButtonText:
            '<strong>OK</strong>',
        confirmButtonAriaLabel: 'OK',
        cancelButtonText:
            '<strong>Cancel</strong>',
        cancelButtonAriaLabel: 'Cancel',
        preConfirm: function () {
            username = document.getElementById('swal-input1').value;
            password = document.getElementById('swal-input2').value;
        }
    }).then((result) => {
        if (result.value) {
            network.requestSalt(username, password, newUser, result)
        }
    })
}

exports.showUserInfo = function() {
    let currentUser = renderer.getCurrentUser();
    let infotext = "";
    if(currentUser.isConnected){
        infotext = "You are currently connected to " + currentUser.connectedTo;
    } else {
        infotext = "";
    }
    swal({
        title: "Logged in as " + currentUser.username,
        type: 'info',
        showCloseButton: true,
        showCancelButton: true,
        focusConfirm: true,
        text: infotext,
    })
}

exports.loginDialog = function () {
    if(renderer.getCurrentUser() !== null && renderer.getCurrentUser() !== undefined){
        exports.showUserInfo();
    } else {
        let username = "";
        let password = "";
        swal({
            title: "Account",
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: true,
            imageUrl: './build/account.png',
            confirmButtonText:
                '<strong>Sign in</strong>',
            confirmButtonAriaLabel: 'Sign in',
            cancelButtonText:
                '<strong>Register</strong>',
            cancelButtonAriaLabel: 'Register',
        }).then((result) => {
            exports.showRegisterSignInDialog(result, username, password);
        });
    }

}

exports.displaySwal = function(text){
    swal(text);
}


exports.addFriend = function () {
    if(renderer.getCurrentUser() !== undefined && renderer.getCurrentUser() !== null){
        let username;
        swal({
            title: "Add friend",
            type: 'question',
            html: '<input id="swal-input1" class="swal2-input" type="text" placeholder="Username" required/>',
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: true,
            confirmButtonText:
                '<strong>Add</strong>',
            confirmButtonAriaLabel: 'OK',
            cancelButtonText:
                '<strong>Cancel</strong>',
            cancelButtonAriaLabel: 'Cancel',
            inputValidator: (value) => {
                return !value && 'No username specified'
            },
            preConfirm: () => {
                username = document.getElementById("swal-input1").value;
            }
        }).then((result) => {
            if (result.value) {
                network.addFriend(username);
            }
        });
    } else {
        swal({text: "You are not logged in!", type:"warning"});
    }

}