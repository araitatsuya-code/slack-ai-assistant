import {
  AIService,
  RefineOptions,
  ResponseOptions,
  ThreadContext,
} from "./types";

export class OpenAIService implements AIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // テキスト推敲
  async refineText(text: string, options?: RefineOptions): Promise<string[]> {
    try {
      const style = options?.style || "formal";
      const strength = options?.strength || "medium";
      const focus = options?.focus || [
        "grammar",
        "spelling",
        "tone",
        "clarity",
      ];

      const prompt = this.createRefinePrompt(text, style, strength, focus);
      const responses = await this.callOpenAI(prompt);

      return responses;
    } catch (error) {
      console.error("OpenAI API呼び出しエラー:", error);
      throw new Error("テキスト推敲に失敗しました");
    }
  }

  // 返答案の生成
  async generateResponses(
    threadContext: ThreadContext,
    responseHint?: string,
    options?: ResponseOptions
  ): Promise<string[]> {
    try {
      const style = options?.style || "formal";
      const numResponses = options?.numResponses || 3;

      const prompt = this.createResponsePrompt(
        threadContext,
        responseHint,
        style,
        numResponses
      );
      const responses = await this.callOpenAI(prompt, numResponses);

      return responses;
    } catch (error) {
      console.error("OpenAI API呼び出しエラー:", error);
      throw new Error("返答生成に失敗しました");
    }
  }

  private async callOpenAI(
    prompt: string,
    numResponses: number = 1
  ): Promise<string[]> {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content:
                  "あなたは文章の推敲と適切な返答を生成する優秀なアシスタントです。",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
            n: numResponses,
            max_tokens: 1000,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // エラーコードに基づいたわかりやすいメッセージ
        if (response.status === 429) {
          throw new Error(
            "APIレート制限に達しました。しばらく待ってから再試行してください。"
          );
        } else if (response.status === 401) {
          throw new Error("APIキーが無効です。設定を確認してください。");
        } else if (response.status === 400) {
          throw new Error(
            `APIリクエストエラー: ${errorData.error?.message || "不明なエラー"}`
          );
        } else {
          throw new Error(
            `APIエラー (${response.status}): ${errorData.error?.message || "不明なエラー"}`
          );
        }
      }

      const data = await response.json();

      // レスポンスから複数の回答を抽出
      const choices = data.choices || [];
      return choices.map((choice: any) => choice.message.content.trim());
    } catch (error) {
      console.error("OpenAI API呼び出しエラー:", error);

      // エラーを再スローするが、よりユーザーにわかりやすいメッセージに変換
      if (error instanceof Error) {
        throw error; // 既にカスタムエラーメッセージが設定されている場合
      } else {
        throw new Error(
          "API接続中にエラーが発生しました。ネットワーク接続を確認してください。"
        );
      }
    }
  }

  // 推敲用のプロンプトを作成
  private createRefinePrompt(
    text: string,
    style: string,
    strength: string,
    focus: string[]
  ): string {
    return `
以下のテキストを推敲してください。
元のテキスト: "${text}"

スタイル: ${style}
推敲の強度: ${strength}
重点的にチェックする項目: ${focus.join(", ")}

以下の点に注意して推敲してください:
1. 誤字脱字や文法的な誤りを修正
2. より明確でわかりやすい表現への改善
3. 適切な敬語や表現レベルの調整
4. 文脈に合わせた適切な表現の選択

複数の異なる推敲案を提案してください。それぞれの提案は明確に分けて表示し、どのような改善を行ったかの簡単な説明を添えてください。
`;
  }

  // 返答生成用のプロンプトを作成
  private createResponsePrompt(
    threadContext: ThreadContext,
    responseHint?: string,
    style?: string,
    numResponses?: number
  ): string {
    // スレッドの内容をテキストに変換
    const threadText = threadContext.messages
      .map((msg) => `${msg.sender} [${msg.timestamp}]: ${msg.content}`)
      .join("\n\n");

    return `
以下のSlackスレッドに対する返答を${numResponses}種類生成してください。

チャンネル: ${threadContext.channelName || "不明"}

スレッド内容:
${threadText}

${responseHint ? `返答のヒント: ${responseHint}` : ""}
スタイル: ${style}

以下の点に注意して返答を生成してください:
1. スレッドの文脈を理解し、関連性の高い返答を作成
2. 指定されたスタイル（${style}）に合わせた表現を使用
3. 相手に不快感を与えない、丁寧な表現を心がける
4. 具体的で建設的な内容を含める

それぞれの返答案は明確に分けて表示し、どのような意図でこの返答を作成したかの簡単な説明を添えてください。
`;
  }
}
