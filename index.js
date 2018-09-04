const {app, BrowserWindow, Menu, Tray} = require('electron');
const {ipcMain} = require ('electron');
let window;
let template = 'index.html';
let fileName;
let tray = null;

function createWindow(){
    window = new BrowserWindow({width: 1200, height: 900});
    window.loadFile(template);
    if(typeof fileName !== "undefined"){
        window.webContents.on('did-finish-load', () => {
            window.webContents.send('image-msg', fileName);
        })
    }
    window.on('closed', (event) => {
        event.preventDefault();
        window = null;
    });

}

function setupNewWindow(name){
    fileName = name;
    template = 'imagevwr.html';
    createWindow();
}

app.on('ready', () => {
    createWindow();
    tray = new Tray('./resources/trayicon.png');
    const contextMenu = Menu.buildFromTemplate([
        {label: 'Item1', type: 'radio'},
        {label: 'Item2', type: 'radio'},
        {label: 'Item3', type: 'radio', checked: true},
        {label: 'Item4', type: 'radio'}
    ])
    tray.setToolTip("Shoumi - Image viewer");
    tray.setContextMenu(contextMenu);
    ipcMain.on('asynchronous-message', (event, arg, fileName) => {
        if (arg === 'window-requested') {
            setupNewWindow(fileName);
        } else {
            event.sender.send('asynchronous-reply', 'unrecognized-args');
        }
    })
});




