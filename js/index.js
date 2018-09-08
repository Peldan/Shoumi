const { app, BrowserWindow, Menu, Tray } = require('electron');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');
const log = require('electron-log');
log.transports.file.level = "info";
log.info('Hej!');
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
    if(isDev){
        window.webContents.openDevTools();
    }
    if(typeof fileName !== "undefined"){
        window.webContents.on('did-finish-load', () => {
            window.webContents.send('image-msg', fileName);
        })
    }
    window.on('minimize', (event) =>{
        event.preventDefault();
        window.hide();
    });

    window.on('close', () => {
        window = null;
        app.quit();
    });
}

app.on('ready', () => {
    createWindow();
    if(isDev){
        tray = new Tray('./build/icon.ico');
    } else {
        log.info("Dirname: " + __dirname + " resources: " + process.resourcesPath);
        console.log(__dirname);
        tray = new Tray(process.resourcesPath + '\\icon.ico');
    }

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
    if(!isDev) {
        autoUpdater.checkForUpdates();
    }
});

autoUpdater.on('checking-for-update', () => {
    console.log("Checking for updates...");
});

autoUpdater.on('update-available', (info) => {
    console.log("Update available");
    console.log("Version: " + info.version);
});

autoUpdater.on('update-not-available', () => {
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
    log.info("Update error:" + error);
});



