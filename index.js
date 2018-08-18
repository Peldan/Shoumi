const {app, BrowserWindow} = require('electron');
const {ipcMain} = require ('electron');

let window;
let template = 'index.html';
let fileName;

function createWindow(){
    window = new BrowserWindow({width: 1200, height: 900});
    window.loadFile(template);
    if(typeof fileName !== "undefined"){
        console.log("NU SKA D FUNKA")
        window.webContents.on('did-finish-load', () => {
            window.webContents.send('image-msg', fileName);
        })
    }
    window.webContents.openDevTools();
    window.on('closed', () => {
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
    ipcMain.on('asynchronous-message', (event, arg, fileName) => {
        if (arg === 'window-requested') {
            setupNewWindow(fileName);
        } else {
            event.sender.send('asynchronous-reply', 'unrecognized-args');
        }
    })
});


