# EdgeShaping MCP Server

EdgeShapingのAIボット観測データをMCP経由で提供するサーバーです。

## Transport
Streamable HTTP（MCP 2025-03-26仕様）

## エンドポイント
- `POST /mcp` — MCPリクエスト
- `GET  /mcp` — MCPセッション
- `GET  /health` — ヘルスチェック（認証不要）

## 認証
`Authorization: Bearer {MCP_API_KEY}` ヘッダーが必要

## 利用可能なツール

### get_bot_logs
EdgeShapingが観測したAIボットのアクセスログを取得します。

パラメータ:
- `from` : 開始日（YYYY-MM-DD）
- `to`   : 終了日（YYYY-MM-DD）
- `category` : 用途分類フィルタ（例: "検索/RAG"）
- `limit`    : 取得件数（1〜1000、デフォルト100）
- `offset`   : スキップ件数（ページネーション用）

## Railway デプロイ手順

1. GitHubリポジトリにpush
2. Railwayで「New Project → Deploy from GitHub repo」
3. Variables に以下を設定:
   - `WP_URL`
   - `WP_USER`
   - `WP_APP_PASSWORD`
   - `MCP_API_KEY`
4. デプロイ完了後、`https://{your-railway-domain}/health` で確認

## Claude Desktop 設定例

```json
{
  "mcpServers": {
    "edgeshaping": {
      "url": "https://{your-railway-domain}/mcp",
      "headers": {
        "Authorization": "Bearer {MCP_API_KEY}"
      }
    }
  }
}
```
