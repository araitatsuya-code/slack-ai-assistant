"use strict";
const electron = require("electron");
const path = require("node:path");
const utils = require("@electron-toolkit/utils");
const Store = require("electron-store");
const store = new Store({
  name: "slack-ai-assistant-config",
  defaults: {
    clipboardMonitoring: false,
    hotkey: "CommandOrControl+Shift+A",
    theme: "light"
  }
});
let clipboardMonitoringInterval = null;
let lastClipboardContent = "";
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? {
      icon: path.join(__dirname, "../../build/icon.png")
    } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true
    }
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  if (utils.is.dev) {
    mainWindow.webContents.openDevTools();
  }
  return mainWindow;
}
function startClipboardMonitoring(mainWindow) {
  if (clipboardMonitoringInterval)
    return;
  lastClipboardContent = electron.clipboard.readText();
  clipboardMonitoringInterval = setInterval(() => {
    const currentContent = electron.clipboard.readText();
    if (currentContent !== lastClipboardContent) {
      lastClipboardContent = currentContent;
      if (isLikelySlackThread(currentContent)) {
        mainWindow.webContents.send("clipboard-thread", currentContent);
      }
    }
  }, 1e3);
}
function stopClipboardMonitoring() {
  if (clipboardMonitoringInterval) {
    clearInterval(clipboardMonitoringInterval);
    clipboardMonitoringInterval = null;
  }
}
function isLikelySlackThread(text) {
  return text.includes("\n") && (text.match(/\[\d{1,2}:\d{1,2}(?::\d{1,2})?\]/) !== null || text.match(/[A-Z][a-z]+ \d{1,2}, \d{4}/) !== null);
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.yourcompany.slackaiassistant");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  const mainWindow = createWindow();
  setupIPC(mainWindow);
  const hotkey = store.get("hotkey");
  if (hotkey) {
    electron.globalShortcut.register(hotkey, () => {
      if (mainWindow.isMinimized())
        mainWindow.restore();
      mainWindow.show();
    });
  }
  if (store.get("clipboardMonitoring")) {
    startClipboardMonitoring(mainWindow);
  }
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });
});
function setupIPC(mainWindow) {
  electron.ipcMain.handle("get-store-value", (_, key) => {
    return store.get(key);
  });
  electron.ipcMain.handle("set-store-value", (_, key, value) => {
    store.set(key, value);
    return true;
  });
  electron.ipcMain.handle("toggle-clipboard-monitoring", (_, enabled) => {
    store.set("clipboardMonitoring", enabled);
    if (enabled) {
      startClipboardMonitoring(mainWindow);
    } else {
      stopClipboardMonitoring();
    }
    return true;
  });
  electron.ipcMain.handle("get-clipboard-text", () => {
    return electron.clipboard.readText();
  });
  electron.ipcMain.handle("set-clipboard-text", (_, text) => {
    electron.clipboard.writeText(text);
    return true;
  });
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("will-quit", () => {
  electron.globalShortcut.unregisterAll();
  stopClipboardMonitoring();
});
