const {dialog} = require('electron').remote;
var electron = require('electron');
var {ipcRenderer} = require('electron');
var header;
var zoominfo;
var cardarea;
var currentZoom = 1;
var isFullscreen = false;
var currentSelection;
var lastModifiedCanvas;
var currentBg = 0;
var imglist;
var layerlist;
var main;
var cards = [];
var $ = require("jquery");
var imgdiv = $('#bild');



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
    ctx = lastModifiedCanvas.getContext('2d');
    ctx.beginPath();
    ctx.clearRect(0, 0, lastModifiedCanvas.width, lastModifiedCanvas.height);
}

function duplicateSelection() {
    ctx = lastModifiedCanvas.getContext('2d');
    ctx.putImageData(currentSelection, 0, 0);
}


function flipbg(forward){
    if(currentBg === (imglist.length)){
        createCardObj('You have reached the end of your imported images!', ['Ok, got it!']);
        displayTip();
        return;
    }
    var url = imglist[currentBg].toDataURL();
    main.style.backgroundImage = "url('" + url + "')";
    main.style.backgroundRepeat = "no-repeat";
    main.style.backgroundPosition = 'center top';
    main.style.backgroundSize = ('auto ' + ($('main').height() - $('header:first').height()) + 'px');
    currentBg++;
}

function displayTip(){
    var cardobj = cards[cards.length - 1];
    if(!cardobj.isRead) {
        var tiparea = document.getElementById("tipcol");
        var card = document.createElement("div");
        var cardtextarea = document.createElement("div");
        var cardaction = document.createElement("div");
        var cardtitle = document.createElement("span");
        var cardtext = document.createElement("p");
        var cardoption = document.createElement("p");
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
            var firstCanvas = document.createElement('canvas'); // I am using canvas as 'layers', i.e one canvas is for
            var secondCanvas = document.createElement('canvas'); // displaying the image, the other canvas handles "drawing" etc.
            var ctx = firstCanvas.getContext('2d');
            firstCanvas.className = 'imgcanvas';
            secondCanvas.className = 'layercanvas'
            var newrow = document.createElement('div');
            newrow.className = 'row center-align cr';
            imgdiv.append(newrow);
            firstCanvas.width = 1000;
            firstCanvas.height = 800;
            secondCanvas.width = firstCanvas.width;
            secondCanvas.height = firstCanvas.height;
            newrow.style.marginBottom = firstCanvas.height + "px";
            img.onload = function(){
                var wratio = firstCanvas.width / img.width;
                var hratio = firstCanvas.height / img.height;
                var ratio  = Math.min ( wratio, hratio );
                var centerx = ( firstCanvas.width - img.width*ratio ) / 2;
                var centery = ( firstCanvas.height - img.height*ratio ) / 2;
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
        var card = {text: text, options: options, isRead: false};
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
    for(var i = 0; i < imglist.length; i++){
        imglist[i].style.visibility = visibility;
    }
}

function enableFullscreen(){
    document.documentElement.style.overflow = "hidden";
    var window = electron.remote.getCurrentWindow();
    window.setFullScreen(true);
    var url = imglist[currentBg].toDataURL();
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
    var window = electron.remote.getCurrentWindow();
    window.setFullScreen(false);
    console.log(isFullscreen);
    currentBg = 0;
}


function selectMode(){
    function changeCursor(cursor){
        for(var i = 0; i < layerlist.length; i++){
            var layer = layerlist[i];
            layer.style.cursor = cursor;
        }
    }
    if(imglist != undefined && imglist.length > 0){
        var layercanvas = $('.layercanvas');
        var startx;
        var starty;
        var currx;
        var curry;
        var c;
        var ctx;
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
        layercanvas.mouseup(function(e){
            ctx = $(this)[0].getContext('2d');
            c = $(this)[0];
            $(this).data('mouseheld', false);
            if(currx != undefined && curry != undefined && !(currx == startx && curry == starty)){
                var imgcanvas = $(this).siblings()[0];
                var imgcanvasctx = imgcanvas.getContext('2d');
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
        layercanvas.mouseleave(function(e){
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
    var target = e.target; //TODO add dragging functionality
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
    console.log(e.target.id);
    if(e.target.id === 'selectbtn'){
        selectMode();
    }
})

$('#tipcol').on("click", function(e) {
    e.preventDefault();
    if(e.target.id === 'btn') {
        $('.card*').remove();
    }
})

$( document ).ready(function (){
    main = document.getElementsByTagName("main")[0];
    header = document.getElementById("#header");
    zoominfo = document.getElementById("zoom")
    cardarea = document.getElementById("tipcol");
    createCardObj("Press [O] to open an image", ['Ok, got it!']);
    displayTip();
    createCardObj("You're now in full screen mode! Use [SPACE] to flip between your imported images.\nPress [ESCAPE] or the Overview button to leave full screen.", ['Ok, got it!']);
})