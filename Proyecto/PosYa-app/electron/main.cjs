const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 768,
    minWidth: 1024,
    minHeight: 614,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.setAspectRatio(5 / 3);

  win.loadURL('http://localhost:5173'); // O la ruta a tu index.html
}

app.whenReady().then(createWindow);
