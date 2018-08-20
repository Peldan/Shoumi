const {dialog} = require('electron').remote;
var electron = require('electron');
var {ipcRenderer} = require('electron');
var header;
var zoominfo;
var cardarea;
var currentZoom = 1;
var isFullscreen = false;
var currentBg = 0;
var imglist;
var main;
var cards = [];
var $ = require("jquery");
var imgdiv = $('#bild');
var config = {attributes: true, childList: true, subtree: true};
var callback = function(mutationsList) {
 //TODO reagera på nya noder? vettefan om jag orkar l0l
}


document.onkeydown = function(event) {
    event = event || window.event;
    if (event.key === "o") {
        openDialog();
    }
    else if ((event.key === "ArrowDown") && event.ctrlKey) {
        currentZoom -= 0.2;
        for (var i = 0; i < imgdiv.childNodes.length; i++) {
            imgdiv.childNodes[i].style.transform = "scale(" + currentZoom + ")"; //TODO work on the zoom
        }
        zoominfo.innerHTML = "Zoom: " + Math.floor(currentZoom * 100) + "%";
    }
    else if ((event.key === "ArrowUp") && event.ctrlKey) {
        currentZoom += 0.2;
        for (var i = 0; i < imgdiv.childNodes.length; i++) {
            imgdiv.childNodes[i].style.transform = "scale(" + currentZoom + ")";
        }
        zoominfo.innerHTML = "Zoom: " + Math.floor(currentZoom * 100) + "%";
    } else if (event.code === "Space" && isFullscreen) {
        flipbg();
    } else if (event.key === "Escape" && isFullscreen) {
        enableOverview();
    }

}

function flipbg(){
    if(currentBg === (imglist.length)){
        createCardObj('You have reached the end of your imported images!', ['Ok, got it!']);
        displayTip();
        return;
    }
    var url = imglist[currentBg].src.replace("file:///", "");
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
    for(var i = 0; i < fileNames.length; i++) {
        const img = new Image();
        img.src = fileNames[i];
        if (checkbox != null && checkbox.checked) {
            ipcRenderer.send('asynchronous-message', 'window-requested', fileNames[i]);
        } else {
            var newrow = document.createElement('div');
            newrow.className = 'row center-align';
            imgdiv.append(newrow);
            newrow.appendChild(img);
        }
    }
    main = document.getElementsByTagName("main")[0];
    header = document.getElementById("#header");
    zoominfo = document.getElementById("zoom")
    var target = document.getElementById("bild");
    var observer = new MutationObserver(callback);
    cardarea = document.getElementById("tipcol");
    observer.observe(target, config);
    imglist = imgdiv.find('img');
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
    var url = imglist[currentBg].src.replace("file:///", "");
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
        for(var i = 0; i < imglist.length; i++){
            var img = imglist[i];
            img.style.cursor = cursor;
        }
    }
    if(imglist != undefined && imglist.length > 0){
        var startx;
        var starty;
        var currx;
        var curry;
        changeCursor("crosshair");
        $('img').mousedown(function(e){
            startx = e.offsetX;
            starty = e.offsetY;
            $(this).data('mouseheld', true);
        })
        $('img').mouseup(function(e){
            changeCursor("default");
            $(this).data('mouseheld', false);
            if(currx != undefined && curry != undefined){
                var endx = currx;
                var endy = curry;
                console.log("Dragged from " + "X: " + startx + " Y: " + starty);
                console.log("To " + "X: " + endx + " Y: " + endy);
            }
        })
        $('img').mouseleave(function(e){
            $(this).data('mouseheld', false);
        })
        $('img').mousemove(function(e){
            if($(this).data('mouseheld')){
                currx = e.offsetX;
                curry = e.offsetY;
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
    createCardObj("Press [O] to open an image", ['Ok, got it!']);
    displayTip();
    createCardObj("You're now in full screen mode! Use [SPACE] to flip between your imported images.\nPress [ESCAPE] or the Overview button to leave full screen.", ['Ok, got it!']);
})


