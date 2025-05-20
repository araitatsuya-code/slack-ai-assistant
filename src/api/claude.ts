import {
  AIService,
  RefineOptions,
  ResponseOptions,
  ThreadContext,
} from "./types";

export class ClaudeService implements AIService {
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
      const numResponses = options?.numResponses || 1;

      const prompt = this.createRefinePrompt(
        text,
        style,
        strength,
        focus,
        numResponses
      );
      const responses = await this.callClaude(prompt, numResponses);

      return responses;
    } catch (error) {
      console.error("Claude API呼び出しエラー:", error);
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
      const responses = await this.callClaude(prompt, numResponses);

      return responses;
    } catch (error) {
      console.error("Claude API呼び出しエラー:", error);
      throw new Error("返答生成に失敗しました");
    }
  }

  // Claude APIを呼び出す
  private async callClaude(
    prompt: string,
    numResponses: number = 1
  ): Promise<string[]> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API呼び出しエラー: ${response.status}`);
    }

    const data = await response.json();

    // Claudeの場合は複数の応答を分割して取得する必要がある
    const content = data.content[0].text;

    // 応答を複数のセクションに分割
    const responses: string[] = [];
    if (numResponses > 1) {
      // 「応答案1:」「応答案2:」といった形式で分割
      const regex = /応答案\s*\d+\s*[:：]/g;
      let match;
      const indices: number[] = [];

      while ((match = regex.exec(content)) !== null) {
        indices.push(match.index);
      }

      if (indices.length >= 2) {
        for (let i = 0; i < indices.length; i++) {
          const start = indices[i];
          const end = i < indices.length - 1 ? indices[i + 1] : content.length;
          responses.push(content.substring(start, end).trim());
        }
      } else {
        // 分割できない場合は全体を1つの応答として扱う
        responses.push(content);
      }
    } else {
      responses.push(content);
    }

    return responses.length > 0 ? responses : [content];
  }

  // 推敲用のプロンプトを作成
  private createRefinePrompt(
    text: string,
    style: string,
    strength: string,
    focus: string[],
    numResponses: number = 2 // numResponsesパラメータを追加
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
  
  ${numResponses}種類の異なる推敲案を提案してください。それぞれの提案は以下の形式で表示してください:
  
  応答案1: [推敲されたテキスト]
  (改善ポイント: 簡単な説明)
  
  応答案2: [推敲されたテキスト]
  (改善ポイント: 簡単な説明)
  
  ... 以下同様
  `;
  }

  // 返答生成用のプロンプトを作成
  private createResponsePrompt(
    threadContext: ThreadContext,
    responseHint?: string,
    style: string = "formal",
    numResponses: number = 2
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
  
  それぞれの返答案は以下の形式で表示してください:
  
  応答案1: [返答内容]
  (意図: 簡単な説明)
  
  応答案2: [返答内容]
  (意図: 簡単な説明)
  
  ... 以下同様
  `;
  }
}
