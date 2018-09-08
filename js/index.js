const { app, BrowserWindow, Menu, Tray } = require('electron');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');
let window;
let template = 'index.html';
let fileName;
let tray = null;
let isQuitting = false;

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

function createWindow(){
    window = new BrowserWindow({width: 880, height: 390});
    window.loadFile(template);
    if(typeof fileName !== "undefined"){
        window.webContents.on('did-finish-load', () => {
            window.webContents.send('image-msg', fileName);
        })
    }
    window.on('minimize', (event) =>{
        event.preventDefault();
        window.hide();
    });

    window.on('close', (event) => {
        if(!isQuitting) {
            event.preventDefault();
            window.hide();
        }
    });
}

app.on('ready', () => {
    createWindow();
    tray = new Tray('./build/trayicon.png');
    const contextMenu = Menu.buildFromTemplate([
        {label: 'Show', click: () => {
            window.show();
        }},
        {label: 'Exit', click: () => {
            isQuitting = true;
            app.quit();
        }},
    ])
    tray.setToolTip("Shoumi - Image viewer");
    tray.setContextMenu(contextMenu);
    autoUpdater.checkForUpdates();

});

autoUpdater.on('checking-for-update', () => {
    console.log("Checking for updates...");
});

autoUpdater.on('update-available', (info) => {
    alert("Update available");
    console.log("Update available");
    console.log("Version: " + info.version);
});

autoUpdater.on('update-not-available', () => {
    alert("No updates available");
    console.log("Update not available");
});

autoUpdater.on('download-progress', (progress) => {
    console.log("Download progress: ${Math.floor(progress.percent)}");
});

autoUpdater.on('update-downloaded', (info) => {
    console.log("Download complete");
    autoUpdater.quitAndInstall();
});

autoUpdater.on('error', (error) => {
    alert(error);
    console.error(error);
});



