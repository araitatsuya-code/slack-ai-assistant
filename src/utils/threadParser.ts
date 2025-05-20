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

  // Slackコピペ形式対応
  let i = 0;
  while (i < lines.length) {
    let sender = lines[i].trim();
    if (!sender) {
      i++;
      continue;
    }
    // 次の行が時刻かどうか
    let timestamp = "";
    let content = "";
    let nextLine = lines[i + 1] ? lines[i + 1].trim() : "";
    // 時刻行の判定（例: "2分前", "12:34", "昨日 12:34" など）
    if (
      /^\d+分前$|^\d{1,2}:\d{2}(?::\d{2})?$|^昨日 \d{1,2}:\d{2}/.test(nextLine)
    ) {
      timestamp = nextLine;
      i += 2;
    } else {
      // 形式が違う場合はスキップ
      i++;
      continue;
    }
    // 本文の抽出
    while (i < lines.length) {
      let line = lines[i].trim();
      // ノイズ行や次のメッセージ開始を検出
      if (
        !line ||
        /^リアクションする$/.test(line) ||
        /^\d+ 件の返信$/.test(line) ||
        /^スレッドを表示$/.test(line) ||
        /^返信$/.test(line) ||
        /^\d+ 件のリアクション$/.test(line) ||
        // 次のユーザー名らしき行
        (lines[i + 1] &&
          /^\d+分前$|^\d{1,2}:\d{2}(?::\d{2})?$|^昨日 \d{1,2}:\d{2}/.test(
            lines[i + 1].trim()
          ))
      ) {
        break;
      }
      content += line + "\n";
      i++;
    }
    if (sender && timestamp && content.trim()) {
      messages.push({
        sender,
        timestamp,
        content: content.trim(),
      });
    }
    // 空行やノイズ行をスキップ
    while (i < lines.length && !lines[i].trim()) {
      i++;
    }
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
