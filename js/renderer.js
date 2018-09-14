'use strict';

let { saveAs } = require('file-saver/FileSaver');
const {dialog} = require('electron').remote;
const fs = require('fs');
const swal = require('sweetalert2')
let JSZip = require('jszip');
let md5 = require('md5');
let socket;
let electron = require('electron');
let {ipcRenderer} = require('electron');
let header, cardarea, currentSelection, imgCanvasList, main, globalcanvas;
let currentBg = 0;
let isFullscreen = false;
let didRequest = false;
let selectedImages = [];
let infoCards = [];
let users = [];
let images = [];
let $ = require("jquery");
let imgdiv = $('#bild');
let autoShare = false;
let settings = [[ 'autoShare', false]]
let settingsMap = new Map(settings);
let currentUser = null;
var exports = module.exports = {};
let network = require('./network');

//TODO chat

document.onkeydown = function(event) {
    event = event || window.event;
    if (event.key === "o") {
        openDialog();
    }
    else if (event.code === "Space" && isFullscreen) {
        flipbg();
    }
    else if (event.key === "Escape" && isFullscreen) {
        enableOverview();
    }
}


function flipbg(){
    if(currentBg === (imgCanvasList.length)){
        createCardObj('You have reached the end of your imported images!', ['Ok, got it!']);
        displayTip();
        return;
    }
    let url = imgCanvasList[currentBg].toDataURL();
    main.style.backgroundImage = "url('" + url + "')";
    main.style.backgroundRepeat = "no-repeat";
    main.style.backgroundPosition = 'center top';
    main.style.backgroundSize = ('auto ' + ($('main').height() - $('header:first').height()) + 'px');
    currentBg++;
}

function displayTip(){
    let cardobj = infoCards[infoCards.length - 1];
    if(!cardobj.isRead) {
        let tiparea = document.getElementById("tipcol");
        let card = document.createElement("div");
        let cardtextarea = document.createElement("div");
        let cardaction = document.createElement("div");
        let cardtitle = document.createElement("span");
        let cardtext = document.createElement("p");
        let cardoption = document.createElement("p");
        card.className = "card blue-grey darken-1";
        cardtextarea.className = "card-content white-text";
        cardaction.className = "card-action";
        cardtitle.className = "card-title";
        cardtitle.innerText = "Tip";
        cardtext.innerText = cardobj.text;
        cardoption.id = "btn";
        cardoption.innerHTML = "<i class=\"tiny material-icons\">check</i>" + cardobj.options[0];
        tiparea.appendChild(card);
        card.appendChild(cardtextarea);
        card.appendChild(cardaction);
        cardtextarea.appendChild(cardtitle);
        cardtextarea.appendChild(cardtext);
        cardaction.appendChild(cardoption);
        cardobj.isRead = true;
    }
}


function createImageObject(src, isShared, imgcanvas){
    let imageObj = new Object();
    imageObj.file = src;
    imageObj.isShared = isShared;
    imageObj.isSelected = false;
    imageObj.imgcanvas = imgcanvas;
    images.push(imageObj);
}

exports.displayImage = function (fileNames, isShared) {
    fileNames.forEach(function(file){
        let src = (isShared) ? ("data:image/png;base64," + Buffer.from((file.buffer)).toString('base64')) : file;
        const img = new Image();
        img.src = src;
        let firstCanvas = document.createElement('canvas'); // I am using canvas as 'layers', i.e one canvas is for
        let ctx = firstCanvas.getContext('2d');
        firstCanvas.className = 'imgcanvas';
        firstCanvas.width = 1000;
        firstCanvas.height = 800;
        let newrow = document.createElement('div');
        newrow.className = 'row center-align cr';
        imgdiv.append(newrow);
        newrow.style.marginBottom = firstCanvas.height + "px";
        img.onload = function(){
            let wratio = firstCanvas.width / img.width;
            let hratio = firstCanvas.height / img.height;
            let ratio  = Math.min ( wratio, hratio );
            let centerx = ( firstCanvas.width - img.width*ratio ) / 2;
            let centery = ( firstCanvas.height - img.height*ratio ) / 2;
            ctx.drawImage(img, 0, 0,
                img.width, img.height,
                centerx, centery, img.width * ratio, img.height * ratio);
        };
        newrow.appendChild(firstCanvas);
        createImageObject(src, isShared, firstCanvas);
    });
    imgCanvasList = document.getElementsByClassName('imgcanvas');
    window.scrollTo(0, $(imgCanvasList[imgCanvasList.length - 1]).offset().top); //scrolls the latest appended image into view
    addCanvasListener();
    if(autoShare){
        sharePhotos();
    }
}

function addCanvasListener(){
    $('.imgcanvas').off().on('click', function(evt){
        evt.preventDefault();
        evt.stopPropagation();
        let target = $(this);
        console.log("Click!");
        if(target.css('border') !== "2px solid rgb(255, 0, 0)" || target.css('border') == null){
            $(this).css('border', "solid 2px red");
            selectedImages.push(target);
        } else {
            $(this).css('border', "solid 0px red");
            selectedImages.splice(selectedImages.indexOf(target), 1);
        }
    })
}

function createCardObj(text, options){
    if(typeof text === 'string' && Array.isArray(options)) {
        let card = {text: text, options: options, isRead: false};
        infoCards.push(card);
    }
}

function openDialog() {
    dialog.showOpenDialog({
        properties: ["openFile", "multiSelections"],
        filters: [
            {name: "Images", extensions: ["jpg", "png", "gif"]}
            ]
    }, fileNames => {
        if (fileNames === undefined) {
            return;
        }
        exports.displayImage(fileNames, false);
    })
}

function visibleImages(visibility){
    for(let i = 0; i < imgCanvasList.length; i++){
        imgCanvasList[i].style.visibility = visibility;
    }
}

function enableFullscreen(){
    document.documentElement.style.overflow = "hidden";
    let window = electron.remote.getCurrentWindow();
    window.setFullScreen(true);
    visibleImages("hidden");
    flipbg();
    isFullscreen = true;
    displayTip();
}

function enableOverview(){
    document.documentElement.style.overflow = "scroll";
    visibleImages("visible");
    main.style.background = "";
    isFullscreen = false;
    let window = electron.remote.getCurrentWindow();
    window.setFullScreen(false);
    currentBg = 0;
}

function loadSettings(filename){
    fs.readFile("settings.cfg", (err, data) => {
        if(err){
            console.log(err);
        } else {
            let settings = data.toString().split("\n");
            for(let i = 0; i < settings.length; i++){
                let settingName = settings[i].split(":")[0];
                let value = settings[i].split(":")[1].split(",")[0];
                if(filename[0] === "index.html"){
                    settingsMap.set(settingName, (value.trim() === 'true' ? true:false));
                }
                else if(filename[0] === "settings.html"){
                    let element = document.getElementById(settingName);
                    element.checked = (value.trim() === 'true' ? true:false);
                }
            }
        }
    })
}

function sharePhotos(){
    if(images.length == 0){
        swal({text: "There are no images to share", type: "warning"});
        return;
    }
    if(currentUser !== null && currentUser !== undefined && currentUser.isConnected) {
        for (let i = 0; i < images.length; i++) {
            fs.readFile(images[i].file, function (err, data) {
                if (!images[i].isShared) {
                    images[i].isShared = true;
                    network.sendImage(data, currentUser.connectedToId);
                }
            });
        }
    } else {
        swal({
            text: "You must be connected to a friend or logged in to use this function",
            type: "warning"
        })
    }
}

function deleteSelected(){
    selectedImages.forEach(function(element){
        let obj = $(element);
        let objParent = $(element).parent();
        obj.remove();
        objParent.remove();
    });
    selectedImages = [];
}

function connectToFriend(){
    if(currentUser !== null && currentUser !== undefined){
        let onlinefriends = [];
        exports.socket.emit('getonlinefriends', {username: currentUser.username}, (error, data) => {
            for(let i = 0; i < currentUser.friendslist.length; i++){
                for(let j = 0; j < data.rows.length; j++){
                    let friendobj = JSON.parse(JSON.stringify(data.rows[j]));
                    if(friendobj.username === currentUser.friendslist[i].username){
                        onlinefriends.push(friendobj.username);
                    }
                }
            }
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
                    didRequest = true;
                }
            }).then((result) => {
                if (result.value) {
                    exports.socket.emit('connecttofriend', {user: currentUser.username, friend: onlinefriends[swal.getInput().selectedIndex]}, (error, data) => {
                        if(error) swal(error);
                    });
                }
            });
        })
    } else {
        swal({text: "You are not logged in!", type: "warning"})
    }
}

function createUserObj(username){
    currentUser = {
        username: username,
        friendslist: [],
        connected: false,
        connectedTo: null,
        connectedToId: null,
    }
    exports.socket.emit('requestclientinfo', {username: currentUser.username}, (error, data) => {
        if (error) swal(error);
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

function showUserInfo(){
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


function login(username, hashedpw){
    exports.socket.emit('hashedpw', {username: username, hashedpw: hashedpw}, (error, data) => {
        if (error) swal(error);
        else {
            socket.emit('customClientInfo', {
                customId: username,
            });
            createUserObj(username);
            swal(data);
        }
    });
}

function register(username, hashedpw){
    exports.socket.emit('createuser', {username: username, hashedpw: hashedpw}, (error, data) => {
        if (error) swal(error);
        else {
            exports.socket.emit('customClientInfo', {
                customId: username,
            });
            createUserObj(username);
            swal(data);
        }
    });
}

function showRegisterSignInDialog(result, username, password){
    console.log(result.value);
    console.log(result.dismiss);
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
            exports.socket.emit('requestsalt', (error, data) => {
                let salt = data;
                let hashedpw = md5(username + salt + password);
                if (!newUser) {
                    login(username, hashedpw);
                } else if (result.DismissReason.cancel) {
                    register(username, hashedpw);
                }
            })
        }
    })

}

function loginDialog(){
    if(currentUser !== null && currentUser !== undefined){
        showUserInfo();
    } else {
        let username = "";
        let password = "";
        swal({
            title: "Account",
            type: 'info',
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: true,
            confirmButtonText:
                '<strong>Sign in</strong>',
            confirmButtonAriaLabel: 'Sign in',
            cancelButtonText:
                '<strong>Register</strong>',
            cancelButtonAriaLabel: 'Register',
        }).then((result) => {
            showRegisterSignInDialog(result, username, password);
        });
    }
}

function zipFilesAndDownload(){
    let imgzip = new JSZip();
    let imgfolder = imgzip.folder('images');
    let count = 0;
    selectedImages.forEach((e) => {
        if($(e).attr('class') === 'imgcanvas'){
            count++;
            let curr = $(e)[0];
            let data = curr.toDataURL('image/jpeg').split(",")[1];
            imgfolder.file("sharedimg_" + count + ".jpg", data, {base64: true});
        }
    });

    imgzip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, "sharedimages.zip");
    });
}


function addFriend() {
    if(currentUser !== null && currentUser !== undefined) {
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
                exports.socket.emit('addfriend', {toAdd: username}, (error, data) => {
                    if (error) {
                        swal(error);
                    } else {
                        swal(data);
                    }
                });
            }
        });
    } else {
        swal({text:"You are not logged in!", type:'warning'});
    }
}





ipcRenderer.on('image-msg', (event, fileName) => {
    const img = new Image();
    img.src = fileName;
    img.setAttribute("class", "image");
    imgdiv.appendChild(img);
});


$('nav').on("click", "a", function(e) {
    e.preventDefault();
    if(e.target.id === 'fullscreen'){
        enableFullscreen();
    }
    else if(e.target.id === 'overview'){
        enableOverview();
    }
});

$('#toolarea').on("click", '.toolbtn', function(e) {
    e.preventDefault();
    if(e.target.id == 'friendbtn'){
        addFriend();
    }
    if(e.target.id == 'sharebtn') {
        sharePhotos();
    }
    if(e.target.id == 'deletebtn') {
        deleteSelected();
    }
    if(e.target.id == 'zipbtn') {
        zipFilesAndDownload();
    }
    if(e.target.id == 'loginbtn') {
        loginDialog();
    }
    if(e.target.id == 'connectbtn') {
        connectToFriend();
    }
});

$('#tipcol').on("click", function(e) {
    e.preventDefault();
    if(e.target.id === 'btn') {
        $('.card*').remove();
    }
});

$( document ).ready(function (){
    let filename = window.location.pathname.split("/").slice(-1);
    loadSettings(filename);
    switch(filename[0]){
        case "index.html":
            socket = io.connect('https://shoumiserver.herokuapp.com');
            exports.socket = socket;
            network.startSocketListeners();
            globalcanvas = document.createElement("canvas");
            globalcanvas.id = "globalcanvas";
            main = document.getElementsByTagName("main")[0];
            header = document.getElementById("#header");
            cardarea = document.getElementById("tipcol");
            main.appendChild(globalcanvas);
            createCardObj("Press [O] to open an image", ['Ok, got it!']);
            displayTip();
            createCardObj("You're now in full screen mode! Use [SPACE] to flip between your imported images.\nPress [ESCAPE] or the Overview button to leave full screen.", ['Ok, got it!']);
            document.addEventListener('drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
                let draggedFiles = new Set();
                for(let f of e.dataTransfer.files){
                    draggedFiles.add(f.path);
                }
                exports.displayImage(draggedFiles);
            });
            document.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
            break;
        case "settings.html":
            $('.setting').change(function(e){
                let key = settingsMap.get(e.target.id);
                settingsMap.set(key, e.target.checked);
            });

            $('#save').click(function(){
                let settings = document.getElementsByClassName("setting");
                for(let i = 0; i < settings.length; i++){
                    let curr = settings[i];
                    if(settings[i + 1] !== null || settings[i + 1] !== undefined){
                        fs.writeFile("settings.cfg", curr.id + ": " + curr.checked + ",\n", 'utf8', function(error) {
                            if(error) throw error;
                        });
                    } else {
                        fs.writeFile("settings.cfg", curr.id + ": " + curr.checked, 'utf8', function(error) {
                            if(error) throw error;
                        });
                    }
                }
            })
            break;
        default:
            break;
    }
});

exports.displaySwal = function(text){
    swal(text);
}

exports.getUsers = function() {
    return users;
}

exports.getCurrentUser = function() {
    return currentUser;
}

exports.setUsers = function(newusers) {
    users = newusers;
}

exports.setDidRequest = function(bool) {
    didRequest = bool;
}

exports.didRequest = function() {
    return didRequest;
}

// Don't know if I want to keep this functionality..

/*function clearSelection(){
    let ctx = lastModifiedCanvas.getContext('2d');
    ctx.beginPath();
    ctx.clearRect(0, 0, lastModifiedCanvas.width, lastModifiedCanvas.height);
}

function duplicateSelection() {
    let ctx = globalcanvas.getContext('2d');
    createImageBitmap(currentSelection).then(function(bitmap) {
        ctx.drawImage(bitmap, 0, 0);
    })
}*/

/*function selectMode(){
    function changeCursor(cursor){
        for(let i = 0; i < layerCanvasList.length; i++){
            let layer = layerCanvasList[i];
            layer.style.cursor = cursor;
        }
    }
    if(imgCanvasList != undefined && imgCanvasList.length > 0){
        let layercanvas = $('.layercanvas');
        let startx;
        let starty;
        let currx;
        let curry;
        let c;
        let ctx;
        changeCursor("crosshair");
        layercanvas.mousedown(function(e){
            startx = e.offsetX;
            starty = e.offsetY;
            $(this).data('mouseheld', true);
            if(lastModifiedCanvas !== undefined && lastModifiedCanvas !== $(this)[0]) {
                ctx = lastModifiedCanvas.getContext('2d');
                ctx.beginPath();
                ctx.clearRect(0, 0, lastModifiedCanvas.width, lastModifiedCanvas.height);
            }
        })
        layercanvas.mouseup(function(){
            ctx = $(this)[0].getContext('2d');
            c = $(this)[0];
            $(this).data('mouseheld', false);
            if(currx != undefined && curry != undefined && !(currx == startx && curry == starty)){
                let imgcanvas = $(this).siblings()[0];
                let imgcanvasctx = imgcanvas.getContext('2d');
                currentSelection = imgcanvasctx.getImageData(startx, starty, (currx - startx), (curry - starty));
                lastModifiedCanvas = $(this)[0];
            } else {
                currentSelection = null;
            }
            startx = null;
            starty = null;
            currx = null;
            curry = null;
        })
        layercanvas.mouseleave(function(){
            if($(this).data('mouseheld')){
                ctx = $(this)[0].getContext('2d');
                ctx.beginPath();
                ctx.clearRect(0, 0, c.width, c.height);
            }
            $(this).data('mouseheld', false);
        })
        $('canvas').mousemove(function(e){
            if($(this).data('mouseheld')){
                c = $(this)[0];
                ctx = $(this)[0].getContext('2d');
                ctx.beginPath();
                ctx.clearRect(0, 0, c.width, c.height);
                ctx.strokeStyle="red";
                currx = e.offsetX;
                curry = e.offsetY;
                ctx.rect(startx, starty, currx - startx, curry - starty);
                ctx.stroke();
            }
        })
    } else {
        createCardObj("You need to import images before using this", ['Ok, got it!']);
        displayTip();
    }
}*/