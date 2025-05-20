export interface AIService {
  // テキスト推敲
  refineText(text: string, options?: RefineOptions): Promise<string[]>;

  // 返答案の生成
  generateResponses(
    threadContext: ThreadContext,
    responseHint?: string,
    options?: ResponseOptions
  ): Promise<string[]>;
}

// 推敲オプション
export interface RefineOptions {
  style?: "formal" | "casual" | "business";
  strength?: "light" | "medium" | "strong";
  focus?: ("grammar" | "spelling" | "tone" | "clarity")[];
  numResponses?: number;
}

// 返答生成オプション
export interface ResponseOptions {
  style?: "formal" | "casual" | "supportive" | "concise";
  numResponses?: number;
  maxLength?: number;
}

// スレッドコンテキスト
export interface ThreadContext {
  messages: ThreadMessage[];
  channelName?: string;
}

// スレッドメッセージ
export interface ThreadMessage {
  sender: string;
  content: string;
  timestamp: string;
}
