/**
 * MCPツール定義
 * 将来エンドポイントが増えたらここにツールを追加する
 */
import { fetchLogs } from './edgeshaping-client.js';

export const TOOLS = [
  {
    name: 'get_bot_logs',
    description: [
      'Retrieve AI bot access logs observed on the EdgeShaping-monitored WordPress site (mareinterno.com).',
      'Each record contains: visited_at, bot_name, bot_category, request_url, user_agent.',
      'bot_category values (from JS dictionary): 学習専用 / 汎用クロール / 検索/RAG / ユーザートリガー / AIエージェント / リアルタイム検索 / 学術研究 / 知識グラフ・AI / データ販売 / 学習/汎用クロール / 汎用/AI / 学習/検索',
      'Use this tool to analyze which AI services are crawling which pages, frequency, and timing.',
    ].join( ' ' ),
    inputSchema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format. Defaults to 30 days ago.',
        },
        to: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format. Defaults to today.',
        },
        category: {
          type: 'string',
          description: 'Filter by bot category (Japanese label). e.g. "検索/RAG" or "学習専用".',
        },
        limit: {
          type: 'number',
          description: 'Max records to return (1–1000). Default 100.',
          minimum: 1,
          maximum: 1000,
        },
        offset: {
          type: 'number',
          description: 'Number of records to skip for pagination. Default 0.',
          minimum: 0,
        },
      },
    },
  },
];

export async function callTool( name, args ) {
  switch ( name ) {
    case 'get_bot_logs': {
      const data = await fetchLogs( args );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify( data, null, 2 ),
          },
        ],
      };
    }
    default:
      throw new Error( `Unknown tool: ${name}` );
  }
}
