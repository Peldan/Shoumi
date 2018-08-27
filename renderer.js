const {dialog} = require('electron').remote;
const prompt = require('electron-prompt');
let socket = io.connect('https://shoumiserver.herokuapp.com');
let electron = require('electron');
let {ipcRenderer} = require('electron');
let header;
let zoominfo;
let cardarea;
let isFullscreen = false;
let currentSelection;
let lastModifiedCanvas;
let currentBg = 0;
let imglist;
let layerlist;
let main;
let cards = [];
let $ = require("jquery");
let imgdiv = $('#bild');
let globalcanvas;
let users = [];

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


function flipbg(forward){
    if(currentBg === (imglist.length)){
        createCardObj('You have reached the end of your imported images!', ['Ok, got it!']);
        displayTip();
        return;
    }
    let url = imglist[currentBg].toDataURL();
    main.style.backgroundImage = "url('" + url + "')";
    main.style.backgroundRepeat = "no-repeat";
    main.style.backgroundPosition = 'center top';
    main.style.backgroundSize = ('auto ' + ($('main').height() - $('header:first').height()) + 'px');
    currentBg++;
}

function displayTip(){
    let cardobj = cards[cards.length - 1];
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

function displayImage(fileNames) {
    const checkbox = document.getElementById("continuous");
    fileNames.forEach(function(file){
        const img = new Image();
        img.src = file;
        if (checkbox != null && checkbox.checked) {
            ipcRenderer.send('asynchronous-message', 'window-requested', file);
        } else {
            let firstCanvas = document.createElement('canvas'); // I am using canvas as 'layers', i.e one canvas is for
            let secondCanvas = document.createElement('canvas'); // displaying the image, the other canvas handles "drawing" etc.
            let ctx = firstCanvas.getContext('2d');
            firstCanvas.className = 'imgcanvas';
            secondCanvas.className = 'layercanvas'
            let newrow = document.createElement('div');
            newrow.className = 'row center-align cr';
            imgdiv.append(newrow);
            firstCanvas.width = 1000;
            firstCanvas.height = 800;
            secondCanvas.width = firstCanvas.width;
            secondCanvas.height = firstCanvas.height;
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
        }
    });
    imglist = document.getElementsByClassName('imgcanvas');
    layerlist = document.getElementsByClassName('layercanvas');
    console.log(imglist[0].id);
    console.log(imglist.length);
    console.log(fileNames.length);
}

function createCardObj(text, options){
    if(typeof text === 'string' && Array.isArray(options)) {
        let card = {text: text, options: options, isRead: false};
        cards.push(card);
    }
}

function openDialog() {
    dialog.showOpenDialog({
        properties: ["openFile", "multiSelections"],
        filters: [
            {name: "Images", extensions: ["jpg", "png", "gif"]},
            {name: 'All Files', extensions: ['*']}]
    }, fileNames => {
        if (fileNames === undefined) {
            return;
        }
        console.log(fileNames);
        displayImage(fileNames);
    })
}

function visibleImages(visibility){
    for(let i = 0; i < imglist.length; i++){
        imglist[i].style.visibility = visibility;
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
    console.log(isFullscreen);
    currentBg = 0;
}

function requestConnection(){
    prompt({
        title: 'Choose a peer',
        label: 'Target ID: ',
        value: 'http://example.org',
        type: 'select',
        selectOptions: users // also adds the clients own ID to list, needs fix
    })
        .then((r) => {
            if(r === null) {
                console.log('user cancelled');
            } else {
                console.log('Chosen peer: ', users[r]);
                socket.emit('connectionrequest', {
                    destpeer: users[r]
                });
            }
        })
        .catch(console.error);
}


function selectMode(){
    function changeCursor(cursor){
        for(let i = 0; i < layerlist.length; i++){
            let layer = layerlist[i];
            layer.style.cursor = cursor;
        }
    }
    if(imglist != undefined && imglist.length > 0){
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

$('.container').on("mousedown","img", function (e) {
    e.preventDefault();
    let target = e.target; //TODO add dragging functionality
});

$('nav').on("click", "a", function(e) {
    e.preventDefault();
    console.log(e.target.id)
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
})

$('#tipcol').on("click", function(e) {
    e.preventDefault();
    if(e.target.id === 'btn') {
        $('.card*').remove();
    }
})

$( document ).ready(function (){
    globalcanvas = document.createElement("canvas");
    globalcanvas.id = "globalcanvas";
    main = document.getElementsByTagName("main")[0];
    header = document.getElementById("#header");
    zoominfo = document.getElementById("zoom");
    cardarea = document.getElementById("tipcol");
    main.appendChild(globalcanvas);
    createCardObj("Press [O] to open an image", ['Ok, got it!']);
    displayTip();
    createCardObj("You're now in full screen mode! Use [SPACE] to flip between your imported images.\nPress [ESCAPE] or the Overview button to leave full screen.", ['Ok, got it!']);
});

socket.on('newuser', function(data) {
    console.log("User has connected!");
    let userString = "";
    users = data.userlist;
    for(let i = 0; i < users.length; i++){
        userString += (i+1 + "User: " + users[i] + "\n");
    }
    console.log(userString);
});

socket.on('userleft',function(data) {
    console.log("User has disconnected!");
    let userString = "";
    users = data.userlist;
    for(let i = 0; i < users.length; i++){
        userString += (i+1 + ": User: " + users[i] + "\n");
    }
    console.log(userString);
});

socket.on('broadcast',function(data) {
    console.log(data.description);
});

socket.on('connectionsuccess', function(data){
    alert("You are now connected with user + " + data.user + ", now kiss!!!!!");
})

socket.on('connectiondenied', function(){
    alert("Your connection request has been denied by the recipient");
});

socket.on('confirmrequest', function(data) {
    let request = confirm("User: " + data.user + " has requested to join a session with you.");
    socket.emit('connectionreply', {
        approved: request
    });
});

