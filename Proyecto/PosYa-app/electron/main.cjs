const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 768,
    resizable: false,            
    maximizable: false,         
    fullscreenable: false,     
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadURL('http://localhost:5173'); 
}

app.whenReady().then(createWindow);
