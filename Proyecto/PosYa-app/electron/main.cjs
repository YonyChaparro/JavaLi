const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 768,
    resizable: false,            // ❌ No se puede redimensionar
    maximizable: false,          // ❌ No se puede maximizar
    fullscreenable: false,       // ❌ No se puede poner en pantalla completa
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadURL('http://localhost:5173'); // O la ruta a tu index.html
}

app.whenReady().then(createWindow);
