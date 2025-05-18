import { useState, useEffect } from "react";
import { useAppStore } from "../store/appStore";
import { parseThreadContent, ParsedThread } from "../utils/threadParser";

export function ThreadAnalyzer() {
  // ローカル状態
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // グローバル状態
  const threadText = useAppStore((state) => state.threadText);
  const setThreadContext = useAppStore((state) => state.setThreadContext);
  const clipboardMonitoring = useAppStore((state) => state.clipboardMonitoring);
  const toggleClipboardMonitoring = useAppStore(
    (state) => state.toggleClipboardMonitoring
  );

  // スレッドテキストが変更されたら入力欄に反映
  useEffect(() => {
    if (threadText) {
      setInputText(threadText);
      handleAnalyzeThread(threadText);
    }
  }, [threadText]);

  // クリップボードから直接テキストを取得
  const handlePasteFromClipboard = async () => {
    if (window.api) {
      try {
        const clipboardText = await window.api.getClipboardText();
        setInputText(clipboardText);
        handleAnalyzeThread(clipboardText);
      } catch (error) {
        console.error("クリップボードからのテキスト取得に失敗しました:", error);
      }
    }
  };

  // スレッドを解析
  const handleAnalyzeThread = (text: string) => {
    setIsProcessing(true);

    try {
      const parsedThread = parseThreadContent(text);
      setThreadContext(parsedThread);
    } catch (error) {
      console.error("スレッドの解析に失敗しました:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 入力テキストの変更を処理
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  // 解析ボタンのクリックを処理
  const handleAnalyzeClick = () => {
    handleAnalyzeThread(inputText);
  };

  // クリップボード監視の切り替え
  const handleToggleMonitoring = () => {
    toggleClipboardMonitoring(!clipboardMonitoring);
  };

  return (
    <div className="thread-analyzer">
      <h2>スレッド取得</h2>

      <div className="controls">
        <button className="paste-button" onClick={handlePasteFromClipboard}>
          クリップボードから貼り付け
        </button>

        <div className="monitoring-toggle">
          <input
            type="checkbox"
            id="monitoring-toggle"
            checked={clipboardMonitoring}
            onChange={handleToggleMonitoring}
          />
          <label htmlFor="monitoring-toggle">
            クリップボード監視 {clipboardMonitoring ? "オン" : "オフ"}
          </label>
        </div>
      </div>

      <div className="thread-input-container">
        <textarea
          className="thread-input"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Slackからコピーしたスレッドをここに貼り付けてください..."
          rows={10}
        />
      </div>

      <div className="thread-actions">
        <button
          className="analyze-button"
          onClick={handleAnalyzeClick}
          disabled={!inputText || isProcessing}
        >
          {isProcessing ? "解析中..." : "スレッドを解析"}
        </button>
      </div>

      <ThreadPreview />
    </div>
  );
}

// スレッドプレビューサブコンポーネント
function ThreadPreview() {
  const threadContext = useAppStore((state) => state.threadContext);

  if (
    !threadContext ||
    !threadContext.messages ||
    threadContext.messages.length === 0
  ) {
    return null;
  }

  return (
    <div className="thread-preview">
      <h3>スレッド内容</h3>
      {threadContext.channelName && (
        <div className="channel-name">
          チャンネル: #{threadContext.channelName}
        </div>
      )}

      <div className="thread-messages">
        {threadContext.messages.map((message, index) => (
          <div key={index} className="thread-message">
            <div className="message-header">
              <span className="sender">{message.sender}</span>
              <span className="timestamp">[{message.timestamp}]</span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
