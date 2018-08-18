const {app, BrowserWindow} = require('electron');
const {ipcMain} = require ('electron');

let window;

function createWindow(){
    window = new BrowserWindow({width: 1200, height: 900});
    window.loadFile('index.html');
    window.webContents.openDevTools();
    window.on('closed', () => {
        window = null;
    });
}



app.on('ready', () => {
    createWindow();
});

ipcMain.on('asynchronous-message', (event, arg) => {
    if(arg === 'window-requested') {
        var win = new BrowserWindow({width: 1200, height: 900});
        win.loadFile('index.html');
        win.on('closed', () => win = null);
        event.sender.send('asynchronous-reply', 'window-ready', win);
    } else {
        event.sender.send('asynchronous-reply', 'unrecognized-args');
    }
})
