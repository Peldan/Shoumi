const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');
const log = require('electron-log');
require('electron-reload')(__dirname);
log.transports.file.level = "info";
let settingsWindow, window;
let template = 'index.html';
let settingsTemplate = 'settings.html';
let fileName;
let tray = null;
let isQuitting = false;
const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {label: 'Open'},
            {label: 'Settings', click: () => {
                openSettings();
            }},
            {role: 'quit'}
     ]
    },
    {
        label: 'Edit',
        submenu: [
            {role: 'undo'},
            {role: 'redo'}
        ]
    }]
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';


function createWindow(){
    window = new BrowserWindow({width: 880, height: 390});
    window.loadFile(template);
    if(isDev){
        window.webContents.openDevTools();
    }
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
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
    window.on('will-navigate', (e) => {
        e.preventDefault();
    });
}

function openSettings(){
    settingsWindow = new BrowserWindow({
        width: 400,
        height: 500,
        resizable: false
    });
    settingsWindow.loadFile(settingsTemplate);
    settingsWindow.on('close', () => {
        settingsWindow = null;
    })
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
        autoUpdater.checkForUpdatesAndNotify();
    }
});

ipcMain.on('requestsocket', (event, arg) => {
    event.returnValue = socket;
})





