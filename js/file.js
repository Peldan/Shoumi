'use strict';
let renderer = require('./renderer');
let dialog = require('./dialog');
let { saveAs } = require('file-saver/FileSaver');
let JSZip = require('jszip');
const fs = require('fs');
let settings = [[ 'autoShare', false]]
let settingsMap = new Map(settings);

exports.zipFilesAndDownload = function(selectedImages) {
    if(renderer.getImageArray().length === 0){
        dialog.displaySwal({text: "There are no images to save!", type:"warning"});
        return;
    }
    if(selectedImages.length > 0 ) {
        let imgzip = new JSZip();
        let imgfolder = imgzip.folder('images');
        let count = 0;
        selectedImages.forEach((e) => {
            if ($(e).attr('class') === 'imgcanvas') {
                count++;
                let curr = $(e)[0];
                let data = curr.toDataURL('image/jpeg').split(",")[1];
                imgfolder.file("sharedimg_" + count + ".jpg", data, {base64: true});
            }
        });

        imgzip.generateAsync({type: "blob"}).then(function (content) {
            saveAs(content, "sharedimages.zip");
        });
    } else {
        dialog.displaySwal({text: "You haven't selected any images!", type:"warning"});
    }
}

exports.saveSettingsToFile = function(curr, isLast){
    if(isLast){
        fs.writeFile("settings.cfg", curr.id + ": " + curr.checked + ",\n", 'utf8', function(error) {
            if(error) throw error;
        });
    } else {
        fs.writeFile("settings.cfg", curr.id + ": " + curr.checked, 'utf8', function(error) {
            if(error) throw error;
        });
    }


}

exports.changeSettings = function(event) {
    let key = settingsMap.get(event.target.id);
    settingsMap.set(key, event.target.checked);
}

exports.loadSettings = function(filename){
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