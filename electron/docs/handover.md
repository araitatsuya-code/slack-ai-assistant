# Slack AI アシスタント - 実装状況と開発計画

## 1. プロジェクト概要

Slack連携AI文章推敲アシスタントは、Slack上のコミュニケーションをAIの力を活用して向上させるためのデスクトップアプリケーションです。このアプリケーションは、誤字脱字の防止、文脈を考慮した返答生成、相手に不快感を与えないコミュニケーションの実現などを目的としています。

## 2. 技術スタック

- **フレームワーク**: Electron + React + TypeScript
- **ビルドツール**: electron-vite
- **状態管理**: Zustand
- **パッケージング**: electron-builder
- **AIサービス**: OpenAI API, Claude API (実装予定)
- **データ保存**: electron-store

## 3. 現在の実装状況

### 3.1 実装済みの機能

- **基本アプリケーション構造**
  - Electronアプリケーションの基本設定
  - タブベースのナビゲーション (スレッド解析、設定)
  - 基本的なUIコンポーネント

- **クリップボード連携**
  - クリップボードからのテキスト取得
  - クリップボード監視機能 (有効/無効切り替え可能)

- **スレッド解析**
  - Slackスレッドのテキスト解析機能
  - 送信者、タイムスタンプ、メッセージ内容の抽出
  - チャンネル名の自動検出

- **設定管理**
  - 設定の保存・読み込み機能
  - AIモデルの選択オプション
  - APIキーの保存機能

### 3.2 現在のファイル構成

```
slack-ai-assistant/
├── electron/                 # Electronメインプロセス
│   ├── main/
│   │   └── index.ts          # メインプロセスのエントリーポイント
│   └── preload/
│       └── index.ts          # プリロードスクリプト
├── src/                      # レンダラープロセス（React）
│   ├── App.tsx               # メインコンポーネント
│   ├── App.css               # アプリケーションスタイル
│   ├── main.tsx              # Reactのエントリーポイント
│   ├── index.css             # グローバルスタイル
│   ├── index.d.ts            # グローバル型定義
│   ├── components/           # UIコンポーネント
│   │   ├── ThreadAnalyzer.tsx # スレッド解析コンポーネント
│   │   └── Settings.tsx      # 設定コンポーネント
│   ├── store/                # 状態管理
│   │   └── appStore.ts       # Zustandストア
│   └── utils/                # ユーティリティ関数
│       └── threadParser.ts   # スレッド解析ユーティリティ
├── resources/                # アイコンなどのリソース
├── electron.vite.config.ts   # electron-vite設定
└── package.json              # プロジェクト設定
```

## 4. 今後の実装計画

### 4.1 次のフェーズで実装予定の機能

1. **AI API連携**
   - OpenAI APIクライアントの実装
   - Claude APIクライアントの実装
   - API呼び出しと応答処理の共通インターフェース

2. **返答生成機能**
   - 新しいタブとコンポーネント: ResponseGenerator
   - スレッドの文脈を考慮したプロンプト設計
   - 複数の返答候補生成と表示
   - 返答のコピーと編集機能

3. **テキスト推敲機能**
   - 新しいタブとコンポーネント: TextRefiner
   - 文法チェックと修正提案
   - ハラスメント表現の検出と代替案提示
   - 推敲結果の比較表示

4. **UI/UX改善**
   - トースト通知システム
   - ローディングインジケーター
   - キーボードショートカット
   - ドラッグ＆ドロップ対応

### 4.2 将来的に実装予定の機能

1. **ナレッジベース連携**
   - Slack会話履歴の取り込み
   - Notionなどの外部ナレッジベース連携

2. **自動応答機能**
   - 特定条件での半自動応答
   - 応答テンプレートの管理

3. **高度な分析機能**
   - コミュニケーションパターンの分析
   - 改善提案の統計情報

## 5. 実装詳細・計画

### 5.1 AI API連携実装（次のタスク）

#### ファイル構造
```
src/
├── api/
│   ├── types.ts              # 共通インターフェースと型定義
│   ├── openai.ts             # OpenAI API連携
│   ├── claude.ts             # Claude API連携
│   └── index.ts              # エクスポート・ファクトリー関数
```

#### 共通インターフェース (src/api/types.ts)
```typescript
// AIサービスの共通インターフェース
export interface AIService {
  // テキストの推敲
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
  style?: 'formal' | 'casual' | 'business';
  strength?: 'light' | 'medium' | 'strong';
  focus?: ('grammar' | 'spelling' | 'tone' | 'clarity')[];
}

// 返答生成オプション
export interface ResponseOptions {
  style?: 'formal' | 'casual' | 'supportive' | 'concise';
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
```

#### OpenAI実装計画 (src/api/openai.ts)
```typescript
import { Configuration, OpenAIApi } from 'openai';
import { AIService, RefineOptions, ResponseOptions, ThreadContext } from './types';

export class OpenAIService implements AIService {
  private api: OpenAIApi;
  
  constructor(apiKey: string) {
    const configuration = new Configuration({
      apiKey: apiKey,
    });
    this.api = new OpenAIApi(configuration);
  }
  
  // テキスト推敲の実装
  async refineText(text: string, options?: RefineOptions): Promise<string[]> {
    // プロンプトの構築
    // APIリクエスト
    // 結果の解析と返却
  }
  
  // 返答生成の実装
  async generateResponses(
    threadContext: ThreadContext, 
    responseHint?: string, 
    options?: ResponseOptions
  ): Promise<string[]> {
    // プロンプトの構築
    // APIリクエスト
    // 複数応答の解析と返却
  }
}
```

### 5.2 返答生成コンポーネント実装計画

#### ファイル構造
```
src/components/
├── ResponseGenerator.tsx     # 返答生成コンポーネント
└── ResponseOption.tsx        # 返答オプション表示コンポーネント
```

#### 状態管理拡張 (src/store/appStore.ts)
```typescript
// 既存のストアに返答生成関連の状態を追加
interface AppState {
  // ... 既存の状態 ...
  
  // 返答生成関連
  responseInput: string;
  responseOptions: string[];
  selectedResponse: number;
  responseStyle: 'formal' | 'casual' | 'supportive' | 'concise';
  
  // アクション
  setResponseInput: (text: string) => void;
  setResponseOptions: (options: string[]) => void;
  setSelectedResponse: (index: number) => void;
  setResponseStyle: (style: string) => void;
  generateResponses: () => Promise<void>;
}
```

### 5.3 テキスト推敲コンポーネント実装計画

#### ファイル構造
```
src/components/
└── TextRefiner.tsx           # テキスト推敲コンポーネント
```

#### 状態管理拡張 (src/store/appStore.ts)
```typescript
// 既存のストアにテキスト推敲関連の状態を追加
interface AppState {
  // ... 既存の状態 ...
  
  // テキスト推敲関連
  refineInput: string;
  refineOutput: string;
  refineStyle: 'formal' | 'casual' | 'business';
  refineStrength: 'light' | 'medium' | 'strong';
  
  // アクション
  setRefineInput: (text: string) => void;
  setRefineOutput: (text: string) => void;
  setRefineStyle: (style: string) => void;
  setRefineStrength: (strength: string) => void;
  refineText: () => Promise<void>;
}
```

## 6. 実装スケジュール

1. **フェーズ1: AI連携基盤 (1-2日)**
   - AI API連携クラスの実装
   - プロンプト設計
   - エラーハンドリング

2. **フェーズ2: 返答生成機能 (2-3日)**
   - ResponseGeneratorコンポーネント実装
   - Zustandストア拡張
   - UIデザインと実装

3. **フェーズ3: テキスト推敲機能 (2-3日)**
   - TextRefinerコンポーネント実装
   - 推敲結果表示の実装
   - UIデザインと調整

4. **フェーズ4: UI/UX改善と最終調整 (2-3日)**
   - 通知システム
   - キーボードショートカット
   - パフォーマンス最適化
   - バグ修正

5. **フェーズ5: パッケージングとテスト (1-2日)**
   - macOS用パッケージング
   - テスト
   - ドキュメント作成

## 7. 開発ガイドライン

### 7.1 コーディング規約

- **TypeScript**: 厳格な型チェックを使用
- **コンポーネント**: 関数コンポーネントとReactフックを使用
- **状態管理**: グローバル状態はZustandを使用、ローカル状態はReact stateを使用
- **スタイリング**: CSSモジュールを使用（必要に応じてスタイリングライブラリを検討）
- **エラーハンドリング**: try-catch ブロックと適切なユーザーフィードバック

### 7.2 テスト戦略

- **単体テスト**: 重要なユーティリティ関数
- **統合テスト**: 主要な機能フロー
- **手動テスト**: ユーザー体験とエッジケース

### 7.3 Git管理戦略

- **ブランチング**: feature/*, bugfix/*, release/* の命名規則
- **コミットメッセージ**: 接頭辞（feat:, fix:, docs:, style:, refactor:, test:, chore:）を使用
- **プルリクエスト**: レビュー後にマージ

## 8. 現在の課題と対応策

1. **Electron連携の安定性**
   - 課題: プリロードスクリプトとレンダラープロセスの連携に問題が発生することがある
   - 対応策: エラーハンドリングの強化、型定義の改善

2. **API認証管理**
   - 課題: APIキーのセキュアな保存と管理
   - 対応策: electron-storeの暗号化機能を活用

3. **大規模スレッドのパフォーマンス**
   - 課題: 大きなスレッドの解析と処理に時間がかかる可能性
   - 対応策: 非同期処理の最適化、プログレス表示

---

このドキュメントは、現在のプロジェクト状況と今後の開発計画を整理したものです。実際の開発の進行に合わせて、適宜更新していくことをお勧めします。