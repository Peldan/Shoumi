const {dialog} = require('electron').remote;
const prompt = require('electron-prompt');
const fs = require('fs');
const notifier = require('node-notifier');
let socket = io.connect('https://shoumiserver.herokuapp.com');
let electron = require('electron');
let {ipcRenderer} = require('electron');
let header, cardarea, currentSelection, lastModifiedCanvas, imgCanvasList, layerCanvasList, main, globalcanvas;
let currentBg = 0;
let isFullscreen = false;
let didRequest = false;
let isConnected = false;
let connectedTo = null;
let chosenName = null;
let toDelete = [];
let fileNames = [];
let infoCards = [];
let users = [];
let images = [];
let $ = require("jquery");
let imgdiv = $('#bild');

document.onkeydown = function(event) {
    event = event || window.event;
    if (event.key === "o") {
        openDialog();
    }
    else if (event.code === "ArrowUp" && isFullscreen){
        //TODO bläddra bakåt i fullscreen
    }
    else if (event.code === "Space" && isFullscreen) {
        flipbg();
    }
    else if (event.key === "Escape" && isFullscreen) {
        enableOverview();
    }
    else if (event.key === "Enter" && (currentSelection !== null && currentSelection !== 'undefined')){
        clearSelection();
        duplicateSelection();
    }
}

function clearSelection(){
    let ctx = lastModifiedCanvas.getContext('2d');
    ctx.beginPath();
    ctx.clearRect(0, 0, lastModifiedCanvas.width, lastModifiedCanvas.height);
}

function duplicateSelection() {
    let ctx = globalcanvas.getContext('2d');
    createImageBitmap(currentSelection).then(function(bitmap) {
        ctx.drawImage(bitmap, 0, 0);
    })
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

function b64(e){let t="";let n=new Uint8Array(e);let r=n.byteLength;for(let i=0;i<r;i++){t+=String.fromCharCode(n[i])}return window.btoa(t)}

function createImageObject(src, isShared){
    let imageObj = new Object();
    imageObj.file = src;
    imageObj.isShared = isShared;
    imageObj.isSelected = false;
    images.push(imageObj);
}

function displayImage(fileNames, isShared) {
    fileNames.forEach(function(file){
        let src = (isShared) ? ("data:image/png;base64," + b64(file.buffer)) : file;
        createImageObject(src, isShared);
        const img = new Image();
        img.src = src;
        let firstCanvas = document.createElement('canvas'); // I am using canvas as 'layers', i.e one canvas is for
        let secondCanvas = document.createElement('canvas'); // displaying the image, the other canvas handles "drawing" etc.
        let ctx = firstCanvas.getContext('2d');
        firstCanvas.className = 'imgcanvas';
        secondCanvas.className = 'layercanvas';
        firstCanvas.width = 1000;
        firstCanvas.height = 800;
        secondCanvas.width = firstCanvas.width;
        secondCanvas.height = firstCanvas.height;
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
        newrow.appendChild(secondCanvas);
    });
    imgCanvasList = document.getElementsByClassName('imgcanvas');
    layerCanvasList = document.getElementsByClassName('layercanvas');
    $('.layercanvas').click(function(){
        let target = $(this);
        if(target.css('border') !== "2px solid rgb(255, 0, 0)"){
            $(this).css('border', "solid 2px red");
            toDelete.push(target);
            toDelete.push(target.siblings(".imgcanvas"));
        } else {
            $(this).css('border', "solid 0px red");
            toDelete.splice(toDelete.indexOf(target), 1);
            toDelete.splice(toDelete.indexOf(target.siblings(".imgcanvas")), 1);
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
    console.log(fileNames.length);
    dialog.showOpenDialog({
        properties: ["openFile", "multiSelections"],
        filters: [
            {name: "Images", extensions: ["jpg", "png", "gif"]},
            {name: 'All Files', extensions: ['*']}
            ]
    }, fileNames => {
        if (fileNames === undefined) {
            return;
        }
        displayImage(fileNames, false);
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

function requestConnection(){
    users = [];
    socket.emit('requestclients', (error, data) => {
        users = data;
        let customIds = [];
        users.forEach((user) => {
            customIds.push(user.customId);
        });
        console.log("Custom ids: " + customIds);
        if(!isConnected) {
            prompt({
                title: 'Choose a peer',
                label: 'Target ID: ',
                value: 'http://example.org',
                type: 'select',
                selectOptions: customIds
            })
                .then((r) => {
                    if (r === null) {
                        console.log('user cancelled');
                    } else {
                        didRequest = true;
                        console.log('Chosen peer: ', users[r].customId + " with ID: " + users[r].clientId);
                        socket.emit('connectionrequest', {
                            destpeer: users[r]
                        });
                    }
                })
                .catch(console.error);
        } else {
            confirm("You are currently connected to " + connectedTo);
        }
    });
}

function sharePhotos(){
    for(let i = 0; i < images.length; i++) {
        fs.readFile(images[i].file, function(err, data){
            if(!images[i].isShared){
                images[i].isShared = true;
                socket.emit('imgByClient', { image: true, buffer: data});
            }
        });
    }
}

function deleteSelected(){
    toDelete.forEach(function(element){
        let obj = $(element);
        let objParent = $(element).parent();
        obj.remove();
        objParent.remove();
    });
    toDelete = [];
}

function enterName(){
    prompt({
        title: 'Enter your name',
        label: 'Name: ',
    })
        .then((input) => {
            if (input === null) {
                console.log('user cancelled');
            } else {
                chosenName = input;
                socket.emit('customClientInfo', {
                    customId: input,
                });
            }
        })
        .catch(console.error);
}


function selectMode(){
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
    if(e.target.id === 'selectbtn'){
        selectMode();
    }
    if(e.target.id == 'p2pbtn'){
        requestConnection();
    }
    if(e.target.id == 'sharebtn') {
        sharePhotos();
    }
    if(e.target.id == 'deletebtn') {
        deleteSelected();
    }
})

socket.on('connect', () => {
    socket.emit('customClientInfo', {
        customId: "Unnamed Shoumi-client: " + socket.id
    })
})

$('#tipcol').on("click", function(e) {
    e.preventDefault();
    if(e.target.id === 'btn') {
        $('.card*').remove();
    }
});

$( document ).ready(function (){
    enterName();
    globalcanvas = document.createElement("canvas");
    globalcanvas.id = "globalcanvas";
    main = document.getElementsByTagName("main")[0];
    header = document.getElementById("#header");
    cardarea = document.getElementById("tipcol");
    main.appendChild(globalcanvas);
    createCardObj("Press [O] to open an image", ['Ok, got it!']);
    displayTip();
    createCardObj("You're now in full screen mode! Use [SPACE] to flip between your imported images.\nPress [ESCAPE] or the Overview button to leave full screen.", ['Ok, got it!']);
});

socket.on('newuser', function(data) {
    users = data.userlist;
});

socket.on('userleft',function(data) {
    users = data.userlist;
});

socket.on('broadcast',function(data) {
    console.log(data.description);
});

socket.on('connectionsuccess', function(data){
    console.log("Did request: " + didRequest);
    if(didRequest) {
        alert("You are now connected with user " + data.dest.customId);
    } else {
        alert("User " + data.requestee.customId + " has initiated a connection with you");
    }
    didRequest = false;
    isConnected = true;
    connectedTo = data.dest.clientId;
});


socket.on('imgByClient', function(data) {
    let fileNames = [data];
    displayImage(fileNames, true);
    notifier.notify('Image received from ' + connectedTo.customId);
});

socket.on('requestConnectedTo', function(callback) {
    callback(null, connectedTo);
});