// src/store/appStore.ts を拡張
import { create } from "zustand";
import { createAIService, RefineOptions, ResponseOptions } from "../api";
import type { ThreadContext, ThreadMessage } from "../api";

interface AppState {
  // 既存の状態
  threadText: string;
  threadContext: ThreadContext | null;
  clipboardMonitoring: boolean;
  aiModel: string;

  // AI関連の新しい状態
  isProcessingAI: boolean;
  refinedTexts: string[];
  responseOptions: string[];

  // 既存のアクション
  setThreadText: (text: string) => void;
  setThreadContext: (context: ThreadContext | null) => void;
  toggleClipboardMonitoring: (enabled: boolean) => Promise<void>;
  setAiModel: (model: string) => void;

  // 新しいAI関連アクション
  refineText: (text: string, options?: RefineOptions) => Promise<void>;
  generateResponses: (
    hint?: string,
    options?: ResponseOptions
  ) => Promise<void>;

  // ユーティリティアクション
  getApiKey: () => Promise<string>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 状態の初期値
  threadText: "",
  threadContext: null,
  clipboardMonitoring: false,
  aiModel: "gpt",
  isProcessingAI: false,
  refinedTexts: [],
  responseOptions: [],

  // 基本アクション
  setThreadText: (text: string) => set({ threadText: text }),
  setThreadContext: (context: ThreadContext | null) =>
    set({ threadContext: context }),
  setAiModel: (model: string) => set({ aiModel: model }),

  // クリップボード監視の切り替え
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

  // APIキーの取得
  getApiKey: async () => {
    if (window.api) {
      try {
        const apiKey = await window.api.getStoreValue("apiKey");
        if (!apiKey) {
          throw new Error("APIキーが設定されていません");
        }
        return apiKey;
      } catch (error) {
        console.error("APIキーの取得に失敗しました:", error);
        throw error;
      }
    }
    throw new Error("API機能が利用できません");
  },

  // テキスト推敲
  refineText: async (text: string, options?: RefineOptions) => {
    set({ isProcessingAI: true, refinedTexts: [] });

    try {
      const apiKey = await get().getApiKey();
      const aiModel = get().aiModel;

      const aiService = createAIService(aiModel, apiKey);
      const results = await aiService.refineText(text, options);

      set({ refinedTexts: results });
    } catch (error) {
      console.error("テキスト推敲に失敗しました:", error);
    } finally {
      set({ isProcessingAI: false });
    }
  },

  // 返答生成
  generateResponses: async (hint?: string, options?: ResponseOptions) => {
    const threadContext = get().threadContext;

    if (!threadContext) {
      console.error("スレッドコンテキストがありません");
      return;
    }

    set({ isProcessingAI: true, responseOptions: [] });

    try {
      const apiKey = await get().getApiKey();
      const aiModel = get().aiModel;

      const aiService = createAIService(aiModel, apiKey);
      const results = await aiService.generateResponses(
        threadContext,
        hint,
        options
      );

      set({ responseOptions: results });
    } catch (error) {
      console.error("返答生成に失敗しました:", error);
    } finally {
      set({ isProcessingAI: false });
    }
  },
}));
