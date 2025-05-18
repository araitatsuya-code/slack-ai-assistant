import { useState, useEffect } from "react";
import { ThreadAnalyzer } from "./components/ThreadAnalyzer";
import { Settings } from "./components/Settings";
import { useAppStore } from "./store/appStore";
import "./App.css";

type TabType = "thread" | "settings";

function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>("thread");
  const setThreadText = useAppStore((state) => state.setThreadText);

  // クリップボードからのスレッド監視
  useEffect(() => {
    // window.api が存在するか確認
    if (window.api && window.api.onClipboardThread) {
      const cleanup = window.api.onClipboardThread((text) => {
        if (text) {
          setThreadText(text);
        }
      });

      // クリーンアップ関数を返す
      return () => {
        if (cleanup && typeof cleanup === "function") {
          cleanup();
        }
      };
    }
    return undefined;
  }, [setThreadText]);

  return (
    <div className="container">
      <header>
        <h1>Slack AI アシスタント</h1>
        <nav>
          <button
            className={activeTab === "thread" ? "active" : ""}
            onClick={() => setActiveTab("thread")}
          >
            スレッド解析
          </button>
          <button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            設定
          </button>
        </nav>
      </header>

      <main>
        {activeTab === "thread" && <ThreadAnalyzer />}
        {activeTab === "settings" && <Settings />}
      </main>

      <footer>
        <p>Slack AI アシスタント v0.1.0</p>
      </footer>
    </div>
  );
}

export default App;
