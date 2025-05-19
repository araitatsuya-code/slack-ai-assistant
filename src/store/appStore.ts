// src/store/appStore.ts
import { create } from "zustand";

// スレッドメッセージの型定義
interface ThreadMessage {
  sender: string;
  content: string;
  timestamp: string;
}

// スレッドコンテキストの型定義
interface ThreadContext {
  messages: ThreadMessage[];
  channelName?: string;
}

// アプリケーション状態の型定義
interface AppState {
  // 状態
  threadText: string;
  threadContext: ThreadContext | null;
  clipboardMonitoring: boolean;

  // アクション
  setThreadText: (text: string) => void;
  setThreadContext: (context: ThreadContext | null) => void;
  toggleClipboardMonitoring: (enabled: boolean) => Promise<void>;

  // 設定
  aiModel: string;
  setAiModel: (model: string) => void;
}

// Zustandストアの作成
export const useAppStore = create<AppState>((set, get) => ({
  // 初期状態
  threadText: "",
  threadContext: null,
  clipboardMonitoring: false,
  aiModel: "gpt",

  // アクション
  setThreadText: (text: string) => set({ threadText: text }),
  setThreadContext: (context: ThreadContext | null) =>
    set({ threadContext: context }),

  toggleClipboardMonitoring: async (enabled: boolean) => {
    if (window.api) {
      try {
        await window.api.setStoreValue("clipboardMonitoring", enabled);
        if (enabled) {
          await window.api.toggleClipboardMonitoring(true);
        } else {
          await window.api.toggleClipboardMonitoring(false);
        }
        set({ clipboardMonitoring: enabled });
      } catch (error) {
        console.error("クリップボード監視の切り替えに失敗しました:", error);
      }
    }
  },

  setAiModel: (model: string) => set({ aiModel: model }),
}));
