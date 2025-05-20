// App.tsx
import { useState, useEffect } from "react";
import { ThreadAnalyzer } from "./components/ThreadAnalyzer";
import { ResponseGenerator } from "./components/ResponseGenerator";
import { TextRefiner } from "./components/TextRefiner";
import { Settings } from "./components/Settings";
import { useAppStore } from "./store/appStore";
import "./App.css";

type TabType = "thread" | "response" | "refine" | "settings";

function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>("thread");
  const setThreadText = useAppStore((state) => state.setThreadText);

  // クリップボードからのスレッド監視
  useEffect(() => {
    if (window.api && window.api.onClipboardThread) {
      const cleanup = window.api.onClipboardThread((text) => {
        if (text) {
          setThreadText(text);
        }
      });

      return () => {
        if (cleanup && typeof cleanup === "function") {
          cleanup();
        }
      };
    }
    return undefined;
  }, [setThreadText]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 min-h-screen flex flex-col">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Slack AI アシスタント</h1>
        <p className="text-sm text-gray-500">
          テキスト推敲と返答作成をサポート
        </p>

        <div className="mt-4 border-b">
          <nav className="flex -mb-px space-x-4">
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "thread"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("thread")}
            >
              スレッド取得
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "response"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("response")}
            >
              返答作成
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "refine"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("refine")}
            >
              テキスト推敲
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "settings"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              設定
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {activeTab === "thread" && <ThreadAnalyzer />}
        {activeTab === "response" && <ResponseGenerator />}
        {activeTab === "refine" && <TextRefiner />}
        {activeTab === "settings" && <Settings />}
      </main>

      <footer className="mt-6 py-4 border-t text-sm text-gray-500 flex justify-between">
        <p>Slack AI アシスタント v0.1.0</p>
        <p>© 2025</p>
      </footer>
    </div>
  );
}

export default App;
