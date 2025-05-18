import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// APIの定義
const api = {
  // 設定関連
  getStoreValue: (key: string): Promise<any> =>
    ipcRenderer.invoke("get-store-value", key),
  setStoreValue: (key: string, value: any): Promise<boolean> =>
    ipcRenderer.invoke("set-store-value", key, value),

  // クリップボード関連
  toggleClipboardMonitoring: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke("toggle-clipboard-monitoring", enabled),
  getClipboardText: (): Promise<string> =>
    ipcRenderer.invoke("get-clipboard-text"),
  setClipboardText: (text: string): Promise<boolean> =>
    ipcRenderer.invoke("set-clipboard-text", text),

  // イベントリスナー
  onClipboardThread: (callback: (text: string) => void): (() => void) => {
    const listener = (_: any, text: string): void => callback(text);
    ipcRenderer.on("clipboard-thread", listener);

    // クリーンアップ関数を返す
    return (): void => {
      ipcRenderer.removeListener("clipboard-thread", listener);
    };
  },
};

// APIをレンダラープロセスに公開
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore
  window.electron = electronAPI;
  // @ts-ignore
  window.api = api;
}
