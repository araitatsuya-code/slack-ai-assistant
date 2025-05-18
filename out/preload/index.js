"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  // 設定関連
  getStoreValue: (key) => electron.ipcRenderer.invoke("get-store-value", key),
  setStoreValue: (key, value) => electron.ipcRenderer.invoke("set-store-value", key, value),
  // クリップボード関連
  toggleClipboardMonitoring: (enabled) => electron.ipcRenderer.invoke("toggle-clipboard-monitoring", enabled),
  getClipboardText: () => electron.ipcRenderer.invoke("get-clipboard-text"),
  setClipboardText: (text) => electron.ipcRenderer.invoke("set-clipboard-text", text),
  // イベントリスナー
  onClipboardThread: (callback) => {
    const listener = (_, text) => callback(text);
    electron.ipcRenderer.on("clipboard-thread", listener);
    return () => {
      electron.ipcRenderer.removeListener("clipboard-thread", listener);
    };
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
