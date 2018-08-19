const {dialog} = require('electron').remote;
var electron = require('electron');
var {ipcRenderer} = require('electron');
var header;
var zoominfo;
var cardarea;
var currentZoom = 1;
var isFullscreen = false;
var currentBg = 0;
var menu;
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
        alert("spejs");
    } else if (event.key === "Escape" && isFullscreen) {
        enableOverview();
    }

}

function displayTip(tip){
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
    cardtext.innerText = tip;
    cardoption.id = "btn";
    cardoption.innerHTML = "<i class=\"tiny material-icons\">check</i> Ok, got it!";
    tiparea.appendChild(card);
    card.appendChild(cardtextarea);
    card.appendChild(cardaction);
    cardtextarea.appendChild(cardtitle);
    cardtextarea.appendChild(cardtext);
    cardaction.appendChild(cardoption);
}

function displayImage(fileName) {
    const checkbox = document.getElementById("continuous");
    const img = new Image();
    img.src = fileName;
    if(checkbox != null && checkbox.checked){
        ipcRenderer.send('asynchronous-message', 'window-requested', fileName);
    } else {
        var newrow = document.createElement('div');
        newrow.className = 'row';
        imgdiv.append(newrow);
        newrow.appendChild(img);
    }
    header = document.getElementById("#header");
    zoominfo = document.getElementById("zoom")
    var target = document.getElementById("bild");
    var observer = new MutationObserver(callback);
    cardarea = document.getElementById("tipcol");
    observer.observe(target, config);
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
            displayImage(fileNames)
        })
}

function enableFullscreen(){
    document.documentElement.style.overflow = "hidden";
    var window = electron.remote.getCurrentWindow();
    var main = document.getElementsByTagName("main")[0];
    window.setFullScreen(true);
    var imglist = imgdiv.find('img');
    var url = imglist[currentBg].src.replace("file:///", "");
    imglist[currentBg].style.visibility = "hidden";
    main.style.backgroundImage = "url('" + url + "')";
    main.style.backgroundRepeat = "no-repeat";
    main.style.backgroundPosition = 'center top';
    main.style.backgroundSize = ('auto ' + ($('main').height() - $('header:first').height()) + 'px');
    isFullscreen = true;
    displayTip("You're now in full screen mode! Use [SPACE] to flip between your imported images\n" +
        "Press [ESCAPE] or the Overview button to leave full screen");
    console.log(isFullscreen);
}

function enableOverview(){
    isFullscreen = false;
    var window = electron.remote.getCurrentWindow();
    window.setFullScreen(false);
    console.log(isFullscreen);
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

$('#tipcol').on("click", function(e) {
    e.preventDefault();
    if(e.target.id === 'btn') {
        $('.card*').remove();
    }
})



