import { create } from "zustand";

interface ThreadMessage {
  sender: string;
  content: string;
  timestamp: string;
}

interface ThreadContext {
  messages: ThreadMessage[];
  channelName: string;
  threadTopic: string;
}

interface AppState {
  threadText: string;
  threadContext: ThreadContext | null;
  responseInput: string;
  responseOptions: string[];
  selectedResponse: number;
  refineInput: string;
  refineOutput: string;
  aiModel: string;
  clipboardMonitoring: boolean;

  // アクション
  setThreadText: (text: string) => void;
  setThreadContext: (context: ThreadContext | null) => void;
  setResponseInput: (text: string) => void;
  setResponseOptions: (options: string[]) => void;
  setSelectedResponse: (index: number) => void;
  setRefineInput: (text: string) => void;
  setRefineOutput: (text: string) => void;
  setAiModel: (model: string) => void;
  toggleClipboardMonitoring: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  threadText: "",
  threadContext: null,
  responseInput: "",
  responseOptions: [],
  selectedResponse: 0,
  refineInput: "",
  refineOutput: "",
  aiModel: "gpt",
  clipboardMonitoring: false,

  setThreadText: (text) => set({ threadText: text }),
  setThreadContext: (context) => set({ threadContext: context }),
  setResponseInput: (text) => set({ responseInput: text }),
  setResponseOptions: (options) =>
    set({ responseOptions: options, selectedResponse: 0 }),
  setSelectedResponse: (index) => set({ selectedResponse: index }),
  setRefineInput: (text) => set({ refineInput: text }),
  setRefineOutput: (text) => set({ refineOutput: text }),
  setAiModel: (model) => set({ aiModel: model }),
  toggleClipboardMonitoring: (enabled) => set({ clipboardMonitoring: enabled }),
}));
