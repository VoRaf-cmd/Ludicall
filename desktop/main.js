// Cliente desktop do Ludicall: janela Electron para o app publicado da Base44.
const { app, BrowserWindow, Menu, Tray, desktopCapturer, session, shell } = require("electron");
const path = require("node:path");

const APP_URL = "https://ludicall.base44.app";
const APP_ORIGIN = new URL(APP_URL).origin;
const TRAY_ICON = path.join(__dirname, "assets", "ludicall.ico");

let mainWindow = null;
let tray = null;
let isQuitting = false;
let closeHintShown = false;

function isAppUrl(url) {
  try {
    return new URL(url).origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

function showMainWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
}

function createTray() {
  if (tray) return;
  tray = new Tray(TRAY_ICON);
  tray.setToolTip("Ludicall");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Abrir Ludicall", click: showMainWindow },
    { type: "separator" },
    { label: "Sair", click: () => { isQuitting = true; app.quit(); } },
  ]));
  tray.on("click", showMainWindow);
  tray.on("double-click", showMainWindow);
}

function setupPermissions() {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    const fromApp = isAppUrl(details && details.requestingUrl);
    const allowed = ["media", "display-capture", "fullscreen", "clipboard-sanitized-write", "notifications"];
    callback(fromApp && allowed.includes(permission));
  });

  ses.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => {
    return permission === "media" && isAppUrl(requestingOrigin);
  });

  ses.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      try {
        const sources = await desktopCapturer.getSources({ types: ["screen", "window"] });
        const screen = sources.find((item) => String(item.id).startsWith("screen:")) || sources[0];
        if (!screen) return callback({});
        callback({ video: screen, audio: "loopback" });
      } catch {
        callback({});
      }
    },
    { useSystemPicker: true }
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: "#0E0E15",
    title: "Ludicall",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadURL(APP_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    shell.openExternal(url);
  });

  // Fechar a janela esconde o app; “Sair” no menu da bandeja encerra de verdade.
  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow.hide();
    if (!closeHintShown && tray) {
      tray.displayBalloon({
        title: "Ludicall continua aberto",
        content: "Clique no ícone do Ludicall na bandeja para voltar, ou escolha Sair no menu para encerrar.",
      });
      closeHintShown = true;
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", showMainWindow);

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    setupPermissions();
    createTray();
    createWindow();

    app.on("activate", showMainWindow);
  });

  app.on("before-quit", () => {
    isQuitting = true;
    if (tray) {
      tray.destroy();
      tray = null;
    }
  });
}
