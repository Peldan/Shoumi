const {app, BrowserWindow} = require('electron');
const {ipcMain} = require ('electron');

let window;
let template = 'index.html';
let fileName;

function createWindow(){
    window = new BrowserWindow({width: 1200, height: 900});
    window.loadFile(template);
    window.webContents.openDevTools();
    window.on('closed', () => {
        window = null;
    });
    if(fileName !== undefined){
        window.webContents.send('image-msg', fileName);
    }
}


app.on('ready', () => {
    createWindow();
    ipcMain.on('asynchronous-message', (event, arg, fileName) => {
        if (arg === 'window-requested') {
            this.fileName = fileName;
            template = 'imagevwr.html';
            createWindow();
        } else {
            event.sender.send('asynchronous-reply', 'unrecognized-args');
        }
    })
});
