import { AIService } from "./types";
import { OpenAIService } from "./openai";
import { ClaudeService } from "./claude";

// AIサービスファクトリー
export function createAIService(provider: string, apiKey: string): AIService {
  switch (provider) {
    case "gpt":
      return new OpenAIService(apiKey);
    case "claude":
      return new ClaudeService(apiKey);
    default:
      throw new Error(`不明なAIプロバイダー: ${provider}`);
  }
}

export * from "./types";
