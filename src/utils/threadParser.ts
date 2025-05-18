// スレッド内のメッセージの型定義
export interface ThreadMessage {
  sender: string;
  content: string;
  timestamp: string;
}

// パース済みスレッドの型定義
export interface ParsedThread {
  messages: ThreadMessage[];
  channelName?: string;
}

/**
 * スレッドテキストを解析する関数
 */
export function parseThreadContent(text: string): ParsedThread | null {
  if (!text || typeof text !== "string") {
    return null;
  }

  const messages: ThreadMessage[] = [];
  const lines = text.split("\n");
  let channelName: string | undefined;

  // チャンネル名を抽出する試み
  const channelMatch = text.match(/#([a-zA-Z0-9_-]+)/);
  if (channelMatch && channelMatch[1]) {
    channelName = channelMatch[1];
  }

  // 各行を処理
  let currentSender: string | null = null;
  let currentContent = "";
  let currentTimestamp = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 新しい発言者の行かどうかをチェック
    const senderMatch = line.match(
      /^([^[]+)\s+\[(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]$/
    );

    if (senderMatch) {
      // 前のメッセージがあれば保存
      if (currentSender && currentContent) {
        messages.push({
          sender: currentSender,
          content: currentContent.trim(),
          timestamp: currentTimestamp,
        });
      }

      // 新しいメッセージの開始
      currentSender = senderMatch[1].trim();
      currentTimestamp = senderMatch[2];
      currentContent = "";
    } else if (currentSender) {
      // 現在のメッセージの続き
      currentContent += line + "\n";
    }
  }

  // 最後のメッセージを追加
  if (currentSender && currentContent) {
    messages.push({
      sender: currentSender,
      content: currentContent.trim(),
      timestamp: currentTimestamp,
    });
  }

  return {
    messages,
    channelName,
  };
}

/**
 * テキストがSlackスレッドらしいかを判定する関数
 */
export function isLikelySlackThread(text: string): boolean {
  return (
    text.includes("\n") &&
    (text.match(/\[\d{1,2}:\d{1,2}(?::\d{1,2})?\]/) !== null ||
      text.match(/[A-Z][a-z]+ \d{1,2}, \d{4}/) !== null)
  );
}
