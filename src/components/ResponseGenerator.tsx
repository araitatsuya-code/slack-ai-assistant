import { useState } from "react";
import { useAppStore } from "../store/appStore";
import { ResponseOptions } from "../api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { MessageSquare, Copy } from "lucide-react";

export function ResponseGenerator() {
  const [responseHint, setResponseHint] = useState("");
  const [selectedOption, setSelectedOption] = useState(0);
  const [options, setOptions] = useState<ResponseOptions>({
    style: "formal",
    numResponses: 3,
  });

  // グローバル状態
  const threadContext = useAppStore((state) => state.threadContext);
  const isProcessingAI = useAppStore((state) => state.isProcessingAI);
  const responseOptions = useAppStore((state) => state.responseOptions);
  const generateResponses = useAppStore((state) => state.generateResponses);

  // 返答ヒントの変更を処理
  const handleHintChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponseHint(e.target.value);
  };

  // オプションの変更を処理
  const handleOptionChange = (key: keyof ResponseOptions, value: any) => {
    setOptions({
      ...options,
      [key]: value,
    });
  };

  // 返答生成の実行
  const handleGenerateResponses = async () => {
    await generateResponses(responseHint || undefined, options);
    setSelectedOption(0); // 最初のオプションを選択
  };

  // 返答をクリップボードにコピー
  const handleCopyToClipboard = async (text: string) => {
    if (window.api) {
      await window.api.setClipboardText(text);
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="space-y-6">
      {!threadContext?.messages?.length ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="mx-auto h-12 w-12 opacity-50 mb-2" />
              <h3 className="text-lg font-medium">スレッドが見つかりません</h3>
              <p className="mt-1">
                先に「スレッド取得」タブからスレッドを解析してください
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>返答作成</CardTitle>
              <CardDescription>
                スレッドに対する返答案を生成します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="response-hint">
                  返答の意図やキーワード（任意）
                </Label>
                <Textarea
                  id="response-hint"
                  value={responseHint}
                  onChange={handleHintChange}
                  placeholder="返答に含めたいポイントや意図を入力してください..."
                  className="h-20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="style">返答スタイル</Label>
                  <Select
                    value={options.style}
                    onValueChange={(value) =>
                      handleOptionChange("style", value)
                    }
                  >
                    <SelectTrigger id="style">
                      <SelectValue placeholder="スタイルを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">フォーマル（丁寧）</SelectItem>
                      <SelectItem value="casual">
                        カジュアル（親しみやすい）
                      </SelectItem>
                      <SelectItem value="supportive">
                        サポーティブ（共感的）
                      </SelectItem>
                      <SelectItem value="concise">簡潔（要点のみ）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numResponses">提案数</Label>
                  <Select
                    value={options.numResponses?.toString() || "3"}
                    onValueChange={(value) =>
                      handleOptionChange("numResponses", parseInt(value))
                    }
                  >
                    <SelectTrigger id="numResponses">
                      <SelectValue placeholder="提案数を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1つ</SelectItem>
                      <SelectItem value="2">2つ</SelectItem>
                      <SelectItem value="3">3つ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <Button
                  onClick={handleGenerateResponses}
                  disabled={!threadContext || isProcessingAI}
                  className="flex items-center gap-2"
                >
                  {isProcessingAI ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                      生成中...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      返答を生成
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {responseOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>返答案</CardTitle>
                <CardDescription>AIが生成した返答案</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={selectedOption.toString()}
                  onValueChange={(value) => setSelectedOption(parseInt(value))}
                >
                  <TabsList className="grid grid-cols-3 mb-4">
                    {responseOptions.map((_, index) => (
                      <TabsTrigger key={index} value={index.toString()}>
                        案 {index + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {responseOptions.map((text, index) => (
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
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          クリップボードにコピー
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
