let renderer = require('./renderer');
let file = require('./file');
let dialog = require('./dialog');
let network = require('./network');
let socket;
let $ = require("jquery");
let electron = require('electron');

exports.initDocument = function() {
    exports.listenForEvents();
    let filename = window.location.pathname.split("/").slice(-1);
    file.loadSettings(filename);
    exports.window = electron.remote.getCurrentWindow();
    switch(filename[0]){
        case "index.html":
            socket = renderer.io.connect('https://shoumiserver.herokuapp.com');
            exports.socket = socket;
            network.startSocketListeners();
            renderer.DOMObjs.main = document.getElementsByTagName("main")[0];
            renderer.DOMObjs.header = document.getElementById("#header");
            renderer.DOMObjs.cardarea = document.getElementById("tipcol");
            renderer.createCardObj("Press [O] to open an image", ['Ok, got it!']);
            renderer.displayTip();
            renderer.createCardObj("You're now in full screen mode! Use [SPACE] to flip between your imported images.\nPress [ESCAPE] or the Overview button to leave full screen.", ['Ok, got it!']);
            renderer.document.addEventListener('drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
                let draggedFiles = new Set();
                for(let f of e.dataTransfer.files){
                    draggedFiles.add(f.path);
                }
                renderer.displayImage(draggedFiles);
            });
            renderer.document.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
            break;
        case "settings.html":
            $('.setting').change(function(event){
                file.changeSettings(event)
            });

            $('#save').click(function(){
                let settings = renderer.document.getElementsByClassName("setting");
                for(let i = 0; i < settings.length; i++){
                    let curr = settings[i];
                    if(settings[i + 1] !== null || settings[i + 1] !== undefined){
                        file.saveSettingsToFile(curr, false)
                    } else {
                        file.saveSettingsToFile(curr, true);
                    }
                }
            })
            break;
        default:
            break;
    }
}

exports.listenForEvents = function() {
    let document = renderer.document;
    $('nav').on("click", "a", function(e) {
        e.preventDefault();
        if(e.target.id === 'fullscreen'){
            renderer.enableFullscreen();
        }
        else if(e.target.id === 'overview'){
            renderer.enableOverview();
        }
    });

    $('#toolarea').on("click", '.toolbtn', function(e) {
        e.preventDefault();
        if(e.target.id == 'friendbtn'){
            dialog.addFriend();
        }
        if(e.target.id == 'sharebtn') {
            renderer.sharePhotos();
        }
        if(e.target.id == 'deletebtn') {
            renderer.deleteSelected();
        }
        if(e.target.id == 'zipbtn') {
            file.zipFilesAndDownload();
        }
        if(e.target.id == 'loginbtn') {
            dialog.loginDialog();
        }
        if(e.target.id == 'connectbtn') {
            network.getOnlineFriends();
        }
    });

    $('#tipcol').on("click", function(e) {
        e.preventDefault();
        if(e.target.id === 'btn') {
            $('.card*').remove();
        }
    });
    document.onkeydown = function(event) {
        event = event || window.event;
        if (event.key === "o") {
            dialog.openFileDialog();
        }
        else if (event.code === "Space" && renderer.isFullscreen) {
            renderer.flipbg();
        }
        else if (event.key === "Escape" && renderer.isFullscreen) {
            renderer.enableOverview();
        }
    }

}