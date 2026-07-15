const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');

let mainWindow = null;
let serverProcess = null;
let serverUrl = 'http://127.0.0.1:3000';
const appStartPath = '/dashboard';

const isDev = !app.isPackaged;

Menu.setApplicationMenu(null);

if (!isDev) {
  // Prevent EPIPE broken pipe errors on Windows
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
}

function sanitizeFileName(value) {
  return String(value || 'Oturma Duzeni')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function getUniquePdfPath(fileName) {
  const desktopPath = app.getPath('desktop');
  const safeName = sanitizeFileName(fileName);
  let filePath = path.join(desktopPath, `${safeName}.pdf`);
  let index = 2;

  while (fs.existsSync(filePath)) {
    filePath = path.join(desktopPath, `${safeName} (${index}).pdf`);
    index += 1;
  }

  return filePath;
}

ipcMain.handle('save-print-pdf', async (event, options = {}) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (!senderWindow) {
    return { success: false, error: 'PDF oluşturulacak pencere bulunamadı.' };
  }

  try {
    const filePath = getUniquePdfPath(options.fileName);
    const pdfBuffer = await senderWindow.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      landscape: false,
      preferCSSPageSize: false,
      margins: {
        marginType: 'default',
      },
    });

    fs.writeFileSync(filePath, pdfBuffer);
    return { success: true, filePath };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'PDF kaydedilemedi.',
    };
  }
});

function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const http = require('http');

    function check() {
      const req = http.get(url, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Server startup timeout'));
        } else {
          setTimeout(check, 500);
        }
      });
      req.end();
    }

    check();
  });
}

function findAvailablePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      const server = net.createServer();

      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE' && port < startPort + 50) {
          tryPort(port + 1);
          return;
        }
        reject(err);
      });

      server.once('listening', () => {
        server.close(() => resolve(port));
      });

      server.listen(port, '127.0.0.1');
    };

    tryPort(startPort);
  });
}

function copyDir(source, target) {
  if (!fs.existsSync(source)) {
    return;
  }

  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

function ensureStandaloneAssets() {
  if (isDev) {
    return;
  }

  const resourceStandalone = path.join(process.resourcesPath, '.next', 'standalone');
  const appStandalone = path.join(__dirname, '.next', 'standalone');

  copyDir(
    path.join(resourceStandalone, '.next', 'static'),
    path.join(appStandalone, '.next', 'static')
  );
  copyDir(
    path.join(resourceStandalone, 'public'),
    path.join(appStandalone, 'public')
  );
}

async function startNextServer() {
  ensureStandaloneAssets();

  const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');
  const userDataPath = app.getPath('userData');
  const port = await findAvailablePort(3000);
  serverUrl = `http://127.0.0.1:${port}`;

  return new Promise((resolve, reject) => {
    
    serverProcess = spawn(process.execPath, [serverPath], {
      cwd: path.dirname(serverPath),
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        HOSTNAME: '0.0.0.0',
        PORT: String(port),
        NODE_ENV: 'production',
        USER_DATA_PATH: userDataPath,
      },
      stdio: 'pipe',
    });

    serverProcess.stdout.on('data', (data) => {
      if (isDev) {
        console.log(`[Next.js] ${data.toString()}`);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      if (isDev) {
        console.error(`[Next.js] ${data.toString()}`);
      }
    });

    serverProcess.on('error', (err) => {
      if (isDev) console.error('Failed to start Next.js server:', err);
      reject(err);
    });

    serverProcess.on('close', (code) => {
      if (isDev) console.log(`Next.js server exited with code ${code}`);
      serverProcess = null;
    });

    // Wait for server to be ready
    waitForServer(serverUrl)
      .then(resolve)
      .catch(reject);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Etkinlik Oturma Düzeni',
    icon: path.join(__dirname, 'public', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`${serverUrl}${appStartPath}`);

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.focus();
  });

  mainWindow.on('focus', () => {
    mainWindow.webContents.focus();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.focus();
    mainWindow.webContents.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.on('ready', async () => {
  try {
    if (!isDev) {
      console.log('Starting Next.js standalone server...');
      await startNextServer();
      console.log('Next.js server is ready.');
    } else {
      console.log('Development mode: assuming Next.js dev server is already running.');
    }

    createWindow();
  } catch (err) {
    console.error('Failed to start application:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    console.log('Killing Next.js server process...');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
});
