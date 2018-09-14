'use strict';
var exports = module.exports = {};
const fs = require('fs');
let dialogmodule = require('./dialog');
let network = require('./network');
let electron = require('electron');
let imgCanvasList, main, header, cardarea;
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
let currentUser = null;
let window = electron.remote.getCurrentWindow();


function createImageObject(src, isShared, imgcanvas){
    let imageObj = new Object();
    imageObj.file = src;
    imageObj.isShared = isShared;
    imageObj.isSelected = false;
    imageObj.imgcanvas = imgcanvas;
    images.push(imageObj);
}


function addCanvasListener(){
    $('.imgcanvas').off().on('click', function(evt){
        evt.preventDefault();
        evt.stopPropagation();
        let target = $(this);
        if(target.css('border') !== "2px solid rgb(255, 0, 0)" || target.css('border') == null){
            $(this).css('border', "solid 2px red");
            selectedImages.push(target);
        } else {
            $(this).css('border', "solid 0px red");
            selectedImages.splice(selectedImages.indexOf(target), 1);
        }
    })
}

function visibleImages(visibility){
    for(let i = 0; i < imgCanvasList.length; i++){
        imgCanvasList[i].style.visibility = visibility;
    }
}

exports.createUserObj = function(username){
    currentUser = {
        username: username,
        friendslist: [],
        connected: false,
        connectedTo: null,
        connectedToId: null,
    }
}


exports.addFriend = function() {
    if(currentUser !== null && currentUser !== undefined) {
        dialogmodule.addFriend();
    } else {
        dialogmodule.displaySwal({text:"You are not logged in!", type:'warning'});
    }
}

exports.sharePhotos = function () {
    if(images.length == 0){
        dialogmodule.displaySwal({text: "There are no images to share", type: "warning"});
        return;
    }
    if(currentUser !== null && currentUser !== undefined && currentUser.isConnected) {
        for(let i = 0; i < images.length; i++) {
            fs.readFile(images[i].file, function(err, data){
                if(!images[i].isShared){
                    images[i].isShared = true;
                    network.sendImage({ image: true, buffer: data, destid: currentUser.connectedToId });
                }
            });
        }
    } else {
        dialogmodule.displaySwal({text: "You must be connected to a friend or logged in to use this function", type: "warning"})
    }
}

exports.deleteSelected = function() {
    if(images.length === 0){
        dialogmodule.displaySwal({text: "You haven't imported any images!", type:"warning"});
        return;
    }
    if(selectedImages.length === 0){
        dialogmodule.displaySwal({text: "You haven't selected any images!", type:"warning"});
        return;
    }
    selectedImages.forEach(function(element){
        let obj = $(element);
        let objParent = $(element).parent();
        obj.remove();
        objParent.remove();
    });
    selectedImages = [];
}

exports.enableOverview = function() {
    document.documentElement.style.overflow = "scroll";
    visibleImages("visible");
    main.style.background = "";
    isFullscreen = false;
    window.setFullScreen(false);
    currentBg = 0;
}

exports.enableFullscreen = function() {
    document.documentElement.style.overflow = "hidden";
    window.setFullScreen(true);
    visibleImages("hidden");
    flipbg();
    isFullscreen = true;
    exports.displayTip();

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
    //window.scrollTo(0, $(imgCanvasList[imgCanvasList.length - 1]).offset().top); //scrolls the latest appended image into view
    //window.scrollTo(0,document.body.scrollHeight);
    addCanvasListener();
    if(autoShare){
        sharePhotos();
    }
}

exports.displayTip = function() {
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

exports.createCardObj = function(text, options){
    if(typeof text === 'string' && Array.isArray(options)) {
        let card = {text: text, options: options, isRead: false};
        infoCards.push(card);
    }
}

exports.flipbg = function() {
    if(currentBg === (imgCanvasList.length)){
        exports.createCardObj('You have reached the end of your imported images!', ['Ok, got it!']);
        exports.displayTip();
        return;
    }
    let url = imgCanvasList[currentBg].toDataURL();
    main.style.backgroundImage = "url('" + url + "')";
    main.style.backgroundRepeat = "no-repeat";
    main.style.backgroundPosition = 'center top';
    main.style.backgroundSize = ('auto ' + ($('main').height() - $('header:first').height()) + 'px');
    currentBg++;
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

exports.isFullscreen = isFullscreen;


exports.window = window;

$( document ).ready(function(){
    let eventhandler = require('./event');
    eventhandler.initDocument();
})

exports.document = document;

exports.io = io;

exports.DOMObjs = function(){
    return {main: main, header: header, cardarea: cardarea};
}

exports.getImageArray = function(){
    return images;
}