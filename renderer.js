const {dialog} = require('electron').remote;
var {ipcRenderer} = require('electron');

var $ = require("jquery");
var imgdiv = document.getElementById("bild");
var config = {attributes: true, childList: true, subtree: true};
var callback = function(mutationsList){
    for(var m of mutationsList){
        if(m.type == 'childList'){
            console.log("") //TODO: react to new image
        }
    }
};

var observer = new MutationObserver(callback);
observer.observe(imgdiv, config);

document.onkeydown = function(event) {
    event = event || window.event;
    if(event.key === "o"){
        openDialog();
    }
    else if ((event.key === "ArrowDown") && event.ctrlKey){
        alert("zoom out");
    }
    else if ((event.key === "ArrowUp") && event.ctrlKey){
        alert("zoom in");
    }
    else if (event.key === "ArrowDown"){
        alert("scroll down");
    }
    else if (event.key === "ArrowUp"){
        alert("scroll up");
    }


function displayImage(fileName) {
    const checkbox = document.getElementById("continuous");
    const img = new Image();
    img.src = fileName;
    if(checkbox != null && checkbox.checked){
        ipcRenderer.send('asynchronous-message', 'window-requested', fileName);
    } else {
        imgdiv.appendChild(img);
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
            displayImage(fileNames)
        })
    };
}

ipcRenderer.on('image-msg', (event, fileName) => {
    const img = new Image();
    img.src = fileName;
    imgdiv.appendChild(img);
});
