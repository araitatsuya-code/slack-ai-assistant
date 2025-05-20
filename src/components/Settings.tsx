// src/components/Settings.tsx
import { useState, useEffect } from "react";
import { useAppStore } from "../store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react"; // アイコン（オプション）

export function Settings() {
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
    if (window.api && window.api.getStoreValue) {
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
    if (window.api && window.api.setStoreValue) {
      try {
        await window.api.setStoreValue("apiKey", apiKey);
        toast.success("API Keyを保存しました", {
          description: "保存完了",
        });
      } catch (error) {
        toast.error("API Keyの保存に失敗しました", {
          description: "エラー",
        });
      }
    }
  };

  // ホットキーの保存
  const handleSaveHotkey = async () => {
    if (window.api && window.api.setStoreValue) {
      try {
        await window.api.setStoreValue("hotkey", hotkeyValue);
        toast.success("ショートカットキーを保存しました", {
          description: "次回起動時に有効になります。",
        });
      } catch (error) {
        toast.error("ショートカットキーの保存に失敗しました", {
          description: "エラー",
        });
      }
    }
  };

  // APIキーを検証するボタンと関数を追加
  const validateApiKey = async () => {
    if (!apiKey) {
      // APIキーが入力されていない場合
      toast({
        title: "エラー",
        description: "APIキーを入力してください",
        variant: "destructive",
      });
      return;
    }

    try {
      // 簡単なテストリクエストを送信
      const aiService = createAIService(aiModel, apiKey);
      await aiService.refineText("これはテストです。", {
        style: "formal",
        strength: "light",
      });

      toast({
        title: "成功",
        description: "APIキーは有効です",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description:
          error instanceof Error
            ? error.message
            : "APIキーの検証に失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI設定</CardTitle>
          <CardDescription>AIサービスの設定を管理します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-model">AIモデル</Label>
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger id="ai-model">
                <SelectValue placeholder="AIモデルを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt">OpenAI GPT</SelectItem>
                <SelectItem value="claude">Anthropic Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex space-x-2">
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Keyを入力"
              />
              <Button onClick={validateApiKey} variant="secondary">
                検証
              </Button>
              <Button onClick={handleSaveApiKey} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>アプリ設定</CardTitle>
          <CardDescription>アプリケーションの動作設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="clipboard-monitoring"
              checked={clipboardMonitoring}
              onCheckedChange={toggleClipboardMonitoring}
            />
            <Label htmlFor="clipboard-monitoring">
              クリップボード監視を有効にする
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hotkey">ショートカットキー</Label>
            <div className="flex space-x-2">
              <Input
                id="hotkey"
                value={hotkeyValue}
                onChange={(e) => setHotkeyValue(e.target.value)}
                placeholder="例: CommandOrControl+Shift+A"
              />
              <Button onClick={handleSaveHotkey} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              次回起動時に有効になります
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
