import { useState, useEffect } from "react";
import { useAppStore } from "../store/appStore";

export function Settings() {
  // ローカル状態
  const [apiKey, setApiKey] = useState("");
  const [hotkeyValue, setHotkeyValue] = useState("");

  // グローバル状態
  const clipboardMonitoring = useAppStore((state) => state.clipboardMonitoring);
  const toggleClipboardMonitoring = useAppStore(
    (state) => state.toggleClipboardMonitoring
  );
  const aiModel = useAppStore((state) => state.aiModel);
  const setAiModel = useAppStore((state) => state.setAiModel);

  // 設定を読み込み
  useEffect(() => {
    if (window.api) {
      // API Keyの読み込み
      window.api.getStoreValue("apiKey").then((value) => {
        if (value) setApiKey(value);
      });

      // ホットキーの読み込み
      window.api.getStoreValue("hotkey").then((value) => {
        if (value) setHotkeyValue(value);
      });
    }
  }, []);

  // API Keyの保存
  const handleSaveApiKey = async () => {
    if (window.api) {
      await window.api.setStoreValue("apiKey", apiKey);
      alert("API Keyを保存しました");
    }
  };

  // ホットキーの保存
  const handleSaveHotkey = async () => {
    if (window.api) {
      await window.api.setStoreValue("hotkey", hotkeyValue);
      alert("ホットキーを保存しました。次回起動時に有効になります。");
    }
  };

  return (
    <div className="settings">
      <h2>設定</h2>

      <div className="settings-section">
        <h3>AI設定</h3>

        <div className="form-group">
          <label htmlFor="ai-model">AIモデル:</label>
          <select
            id="ai-model"
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
          >
            <option value="gpt">OpenAI GPT</option>
            <option value="claude">Anthropic Claude</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="api-key">API Key:</label>
          <input
            type="password"
            id="api-key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API Key"
          />
          <button onClick={handleSaveApiKey}>保存</button>
        </div>
      </div>

      <div className="settings-section">
        <h3>アプリ設定</h3>

        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="clipboard-monitoring"
            checked={clipboardMonitoring}
            onChange={() => toggleClipboardMonitoring(!clipboardMonitoring)}
          />
          <label htmlFor="clipboard-monitoring">
            クリップボード監視を有効にする
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="hotkey">ショートカットキー:</label>
          <input
            type="text"
            id="hotkey"
            value={hotkeyValue}
            onChange={(e) => setHotkeyValue(e.target.value)}
            placeholder="例: CommandOrControl+Shift+A"
          />
          <button onClick={handleSaveHotkey}>保存</button>
        </div>
      </div>
    </div>
  );
}
