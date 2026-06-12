/**
 * MCPツール定義（Zod スキーマ版 / SDK v1.29.0+）
 */
import { z } from 'zod';
import { fetchLogs } from './edgeshaping-client.js';

export const TOOLS = [
  {
    name: 'get_bot_logs',
    description: [
      'Retrieve AI bot access logs observed on the EdgeShaping-monitored WordPress site (mareinterno.com).',
      'Each record contains: visited_at, bot_name, bot_category, request_url, user_agent.',
      'bot_category values: 学習専用 / 汎用クロール / 検索/RAG / ユーザートリガー / AIエージェント / リアルタイム検索 / 学術研究 / 知識グラフ・AI / データ販売 / 学習/汎用クロール / 汎用/AI / 学習/検索',
      'Use this tool to analyze which AI services are crawling which pages, frequency, and timing.',
    ].join( ' ' ),
    schema: {
      from:     z.string().optional().describe( 'Start date YYYY-MM-DD. Defaults to 30 days ago.' ),
      to:       z.string().optional().describe( 'End date YYYY-MM-DD. Defaults to today.' ),
      category: z.string().optional().describe( 'Filter by bot_category (Japanese). e.g. "検索/RAG"' ),
      limit:    z.number().min(1).max(1000).optional().describe( 'Max records (1–1000). Default 100.' ),
      offset:   z.number().min(0).optional().describe( 'Skip N records for pagination. Default 0.' ),
    },
  },
];

export async function callTool( name, args ) {
  switch ( name ) {
    case 'get_bot_logs': {
      const data = await fetchLogs( args );
      return {
        content: [ { type: 'text', text: JSON.stringify( data, null, 2 ) } ],
      };
    }
    default:
      throw new Error( `Unknown tool: ${name}` );
  }
}
