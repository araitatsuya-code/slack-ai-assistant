import { useState } from "react";
import { useAppStore } from "../store/appStore";
import { RefineOptions } from "../api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wand2 } from "lucide-react";

export function TextRefiner() {
  const [inputText, setInputText] = useState("");
  const [selectedOption, setSelectedOption] = useState(0);
  const [options, setOptions] = useState<RefineOptions>({
    style: "formal",
    strength: "medium",
    focus: ["grammar", "spelling", "tone", "clarity"],
  });

  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // グローバル状態
  const isProcessingAI = useAppStore((state) => state.isProcessingAI);
  const refinedTexts = useAppStore((state) => state.refinedTexts);
  const refineText = useAppStore((state) => state.refineText);

  // 入力テキストの変更を処理
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  // オプションの変更を処理
  const handleOptionChange = (key: keyof RefineOptions, value: any) => {
    setOptions({
      ...options,
      [key]: value,
    });
  };

  // テキスト推敲の実行
  const handleRefine = async () => {
    if (!inputText.trim()) return;

    setIsError(false);
    setErrorMessage("");

    try {
      await refineText(inputText, options);
      setSelectedOption(0);
    } catch (error) {
      setIsError(true);
      setErrorMessage(
        error instanceof Error ? error.message : "不明なエラーが発生しました"
      );
    }
  };

  // 推敲結果をクリップボードにコピー
  const handleCopyToClipboard = async (text: string) => {
    if (window.api) {
      await window.api.setClipboardText(text);
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>テキスト推敲</CardTitle>
          <CardDescription>
            テキストをAIで推敲し、改善案を提案します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isError && (
            <div className="mt-4 p-3 border border-red-300 bg-red-50 text-red-800 rounded-md">
              <p className="font-medium">エラーが発生しました</p>
              <p className="text-sm">{errorMessage}</p>
              <p className="text-sm mt-1">
                OpenAI
                APIのレート制限に達した可能性があります。しばらく待ってから再試行してください。
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="refine-text">推敲するテキスト</Label>
            <Textarea
              id="refine-text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="推敲したいテキストを入力してください..."
              className="min-h-[150px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="style">文体スタイル</Label>
              <Select
                value={options.style}
                onValueChange={(value) => handleOptionChange("style", value)}
              >
                <SelectTrigger id="style">
                  <SelectValue placeholder="スタイルを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">フォーマル（丁寧）</SelectItem>
                  <SelectItem value="casual">
                    カジュアル（親しみやすい）
                  </SelectItem>
                  <SelectItem value="business">
                    ビジネス（簡潔・明瞭）
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strength">推敲の強度</Label>
              <Select
                value={options.strength}
                onValueChange={(value) => handleOptionChange("strength", value)}
              >
                <SelectTrigger id="strength">
                  <SelectValue placeholder="強度を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">弱（最小限の修正）</SelectItem>
                  <SelectItem value="medium">
                    中（バランスの取れた修正）
                  </SelectItem>
                  <SelectItem value="strong">強（積極的な改善）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <Button
              onClick={handleRefine}
              disabled={!inputText.trim() || isProcessingAI}
              className="flex items-center gap-2"
            >
              {isProcessingAI ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  推敲中...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  テキストを推敲
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {refinedTexts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>推敲結果</CardTitle>
            <CardDescription>AIによる改善案</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={selectedOption.toString()}
              onValueChange={(value) => setSelectedOption(parseInt(value))}
            >
              <TabsList className="grid grid-cols-3 mb-4">
                {refinedTexts.map((_, index) => (
                  <TabsTrigger key={index} value={index.toString()}>
                    案 {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>

              {refinedTexts.map((text, index) => (
                <TabsContent
                  key={index}
                  value={index.toString()}
                  className="space-y-4"
                >
                  <div className="p-4 bg-muted/40 rounded-md whitespace-pre-wrap">
                    {text}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleCopyToClipboard(text)}
                    >
                      クリップボードにコピー
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
