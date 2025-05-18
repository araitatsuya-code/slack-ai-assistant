import {
  app,
  BrowserWindow,
  clipboard,
  ipcMain,
  globalShortcut,
} from "electron";
import path from "node:path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import Store from "electron-store";

// 設定ストアの初期化
const store = new Store({
  name: "slack-ai-assistant-config",
  defaults: {
    clipboardMonitoring: false,
    hotkey: "CommandOrControl+Shift+A",
    theme: "light",
  },
});

// クリップボード監視の状態
let clipboardMonitoringInterval: NodeJS.Timeout | null = null;
let lastClipboardContent = "";

function createWindow(): BrowserWindow {
  // ブラウザウィンドウを作成
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux"
      ? {
          icon: path.join(__dirname, "../../build/icon.png"),
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
    },
  });

  // HMRのセットアップ
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  // 準備ができたらウィンドウを表示
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  // 開発モードではDevToolsを開く
  if (is.dev) {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
}

// クリップボード監視の開始
function startClipboardMonitoring(mainWindow: BrowserWindow) {
  if (clipboardMonitoringInterval) return;

  lastClipboardContent = clipboard.readText();

  clipboardMonitoringInterval = setInterval(() => {
    const currentContent = clipboard.readText();

    if (currentContent !== lastClipboardContent) {
      lastClipboardContent = currentContent;

      // テキストがSlackスレッドらしいかを簡易チェック
      if (isLikelySlackThread(currentContent)) {
        mainWindow.webContents.send("clipboard-thread", currentContent);
      }
    }
  }, 1000);
}

// クリップボード監視の停止
function stopClipboardMonitoring() {
  if (clipboardMonitoringInterval) {
    clearInterval(clipboardMonitoringInterval);
    clipboardMonitoringInterval = null;
  }
}

// テキストがSlackスレッドらしいか判定する簡易関数
function isLikelySlackThread(text: string): boolean {
  // 複数行でタイムスタンプっぽいパターンがあるか
  return (
    text.includes("\n") &&
    (text.match(/\[\d{1,2}:\d{1,2}(?::\d{1,2})?\]/) !== null ||
      text.match(/[A-Z][a-z]+ \d{1,2}, \d{4}/) !== null)
  );
}

// アプリの初期化
app.whenReady().then(() => {
  // アプリのセットアップ
  electronApp.setAppUserModelId("com.yourcompany.slackaiassistant");

  // ウィンドウのショートカットを設定
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // メインウィンドウの作成
  const mainWindow = createWindow();

  // IPC通信のセットアップ
  setupIPC(mainWindow);

  // グローバルショートカットの登録
  const hotkey = store.get("hotkey") as string;
  if (hotkey) {
    globalShortcut.register(hotkey, () => {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
    });
  }

  // クリップボード監視が有効なら開始
  if (store.get("clipboardMonitoring") as boolean) {
    startClipboardMonitoring(mainWindow);
  }

  // macOSでのアクティベーション処理
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// IPC通信のセットアップ
function setupIPC(mainWindow: BrowserWindow) {
  // 設定の取得
  ipcMain.handle("get-store-value", (_, key: string) => {
    return store.get(key);
  });

  // 設定の保存
  ipcMain.handle("set-store-value", (_, key: string, value: any) => {
    store.set(key, value);
    return true;
  });

  // クリップボード監視の切り替え
  ipcMain.handle("toggle-clipboard-monitoring", (_, enabled: boolean) => {
    store.set("clipboardMonitoring", enabled);

    if (enabled) {
      startClipboardMonitoring(mainWindow);
    } else {
      stopClipboardMonitoring();
    }

    return true;
  });

  // クリップボードからのテキスト取得
  ipcMain.handle("get-clipboard-text", () => {
    return clipboard.readText();
  });

  // クリップボードへのテキスト設定
  ipcMain.handle("set-clipboard-text", (_, text: string) => {
    clipboard.writeText(text);
    return true;
  });
}

// 全ウィンドウが閉じられたときの処理
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// アプリ終了時のクリーンアップ
app.on("will-quit", () => {
  // グローバルショートカットの解除
  globalShortcut.unregisterAll();

  // クリップボード監視の停止
  stopClipboardMonitoring();
});
