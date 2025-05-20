// src/components/ThreadAnalyzer.tsx
import { useState, useEffect } from "react";
import { useAppStore } from "../store/appStore";
import { parseThreadContent } from "../utils/threadParser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Clipboard, Search, MessageSquare } from "lucide-react"; // アイコン（オプション）
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const threadContext = useAppStore((state) => state.threadContext);

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
      } catch (error) {
        console.error("クリップボードからのテキスト取得に失敗しました:", error);
      }
    }
  };

  // 入力テキストの変更を処理
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  // スレッドを解析
  const handleAnalyzeThread = (text: string) => {
    if (!text.trim()) {
      return;
    }

    setIsProcessing(true);

    try {
      // スレッド解析関数を呼び出す
      const parsedThread = parseThreadContent(text);
      setThreadContext(parsedThread);
    } catch (error) {
      console.error("スレッドの解析に失敗しました:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>スレッド取得</CardTitle>
          <CardDescription>Slackのスレッドを解析します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePasteFromClipboard}
              className="flex gap-2 items-center"
            >
              <Clipboard className="h-4 w-4" />
              クリップボードから貼り付け
            </Button>

            <div className="flex items-center space-x-2">
              <Switch
                id="clipboard-monitoring-toggle"
                checked={clipboardMonitoring}
                onCheckedChange={toggleClipboardMonitoring}
              />
              <Label htmlFor="clipboard-monitoring-toggle">
                クリップボード監視 {clipboardMonitoring ? "オン" : "オフ"}
              </Label>
            </div>
          </div>

          <Textarea
            value={inputText}
            onChange={handleInputChange}
            placeholder="Slackからコピーしたスレッドをここに貼り付けてください..."
            className="min-h-[200px]"
          />

          <div className="flex justify-center">
            <Button
              onClick={() => handleAnalyzeThread(inputText)}
              disabled={!inputText || isProcessing}
              className="flex gap-2 items-center"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  解析中...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  スレッドを解析
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {threadContext &&
        threadContext.messages &&
        threadContext.messages.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>解析結果</CardTitle>
                {threadContext.channelName && (
                  <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                    #{threadContext.channelName}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threadContext.messages.map((message, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-3 rounded-lg bg-muted/40"
                  >
                    <Avatar>
                      <AvatarFallback>
                        {message.sender.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{message.sender}</span>
                        <span className="text-xs text-muted-foreground">
                          [{message.timestamp}]
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="flex gap-1 items-center"
                onClick={() => (window.location.hash = "#response")} // ハッシュベースのナビゲーションを使用
              >
                <MessageSquare className="h-4 w-4" />
                返答を作成
              </Button>
            </CardFooter>
          </Card>
        )}
    </div>
  );
}
