const {dialog} = require('electron').remote;
var electron = require('electron');
var {ipcRenderer} = require('electron');
var header;
var zoominfo;
var currentZoom = 1;
var $ = require("jquery");
var imgdiv = document.getElementById("bild");
var config = {attributes: true, childList: true, subtree: true};
var callback = function(mutationsList){
    for(var m of mutationsList){
        if(m.type == 'childList'){
            console.log("") //TODO: react to new image
        }
    }
}

var observer = new MutationObserver(callback);
observer.observe(imgdiv, config);

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
    }
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
        imgdiv.appendChild(newrow);
        newrow.appendChild(img);
    }
    header = document.getElementById("#header");
    zoominfo = document.getElementById("zoom")
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
    var window = electron.remote.getCurrentWindow();
    var main = document.getElementsByTagName("main")[0];
    window.setFullScreen(true);
    var test = $('#bild')
    var imgsrc = test.children().first().children().first().attr('src');
    main.setAttribute('background-image', 'url("' + imgsrc + '")');
    main.setAttribute('background-size', 'cover');
    main.setAttribute('background-repeat', 'no-repeat');
    main.setAttribute('background-position', 'center center');
}

function enableOverview(){
    var window = electron.remote.getCurrentWindow();
    window.setFullScreen(false);
    for(var i = 0; i < imgdiv.childNodes.length; i++){
        imgdiv.childNodes[i].style.height = "auto";
        imgdiv.childNodes[i].style.width = "65%";
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

$('.card*').on("click", function(e) {
    e.preventDefault();
    if(e.target.id === 'btn') {
        $(this).remove();
    }
})



