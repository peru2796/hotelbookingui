const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');

const isDev = !app.isPackaged;

// ✅ Declare mainWindow globally
let mainWindow = null;

// ✅ Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('Another instance is already running. Quitting...');
  app.quit();

} else {

  // ✅ Focus existing window if second instance launched
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 1024,
      minHeight: 600,
      icon: path.join(__dirname, 'assets/icon.ico'),
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false
      }
    });

    // ✅ Remove menu bar
    Menu.setApplicationMenu(null);

    // ✅ Load app
    if (isDev) {
      mainWindow.loadURL('http://localhost:4300');
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'dist/hotel-dashboard/index.html'),
        protocol: 'file:',
        slashes: true
      }));
    }

    // ✅ Show when ready
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      mainWindow.focus();
    });

    // ✅ Clear reference on close
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}
