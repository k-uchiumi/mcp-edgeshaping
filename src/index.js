/**
 * EdgeShaping MCP Server
 * Transport: Streamable HTTP (MCP 2025-03-26)
 * Auth:      Bearer token (MCP_API_KEY env)
 */
import express           from 'express';
import rateLimit         from 'express-rate-limit';
import { randomUUID }    from 'crypto';
import { McpServer }     from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { TOOLS, callTool } from './tools.js';

const PORT        = process.env.PORT || 3000;
const MCP_API_KEY = process.env.MCP_API_KEY;

if ( ! MCP_API_KEY ) {
  console.error( 'ERROR: MCP_API_KEY env is required' );
  process.exit( 1 );
}

const app = express();
app.use( express.json() );

// -----------------------------------------------------------------------
// レートリミット: 1分間に60リクエストまで
// -----------------------------------------------------------------------
app.use( '/mcp', rateLimit( {
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
} ) );

// -----------------------------------------------------------------------
// Bearer Token 認証ミドルウェア
// -----------------------------------------------------------------------
function authenticate( req, res, next ) {
  const auth = req.headers['authorization'] ?? '';
  if ( auth !== `Bearer ${MCP_API_KEY}` ) {
    return res.status( 401 ).json( { error: 'Unauthorized' } );
  }
  next();
}

// -----------------------------------------------------------------------
// MCPサーバーファクトリ（リクエストごとに新規インスタンス）
// -----------------------------------------------------------------------
function createMcpServer() {
  const server = new McpServer( {
    name:    'edgeshaping-mcp',
    version: '1.0.0',
  } );

  // ツール一覧を登録
  for ( const tool of TOOLS ) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema.properties,
      async ( args ) => callTool( tool.name, args )
    );
  }

  return server;
}

// -----------------------------------------------------------------------
// POST /mcp  — MCP Streamable HTTP エンドポイント
// -----------------------------------------------------------------------
app.post( '/mcp', authenticate, async ( req, res ) => {
  const server    = createMcpServer();
  const transport = new StreamableHTTPServerTransport( {
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
  } );

  res.on( 'close', () => {
    transport.close();
    server.close();
  } );

  try {
    await server.connect( transport );
    await transport.handleRequest( req, res, req.body );
  } catch ( err ) {
    console.error( 'MCP handler error:', err );
    if ( ! res.headersSent ) {
      res.status( 500 ).json( { error: 'Internal server error' } );
    }
  }
} );

// GET /mcp  — SSEセッション（Streamable HTTPのセッション管理用）
app.get( '/mcp', authenticate, async ( req, res ) => {
  const server    = createMcpServer();
  const transport = new StreamableHTTPServerTransport( {
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
  } );

  res.on( 'close', () => {
    transport.close();
    server.close();
  } );

  try {
    await server.connect( transport );
    await transport.handleRequest( req, res );
  } catch ( err ) {
    console.error( 'MCP GET error:', err );
    if ( ! res.headersSent ) {
      res.status( 500 ).json( { error: 'Internal server error' } );
    }
  }
} );

// -----------------------------------------------------------------------
// ヘルスチェック（Railway のデプロイ確認用・認証不要）
// -----------------------------------------------------------------------
app.get( '/health', ( _req, res ) => {
  res.json( { status: 'ok', service: 'edgeshaping-mcp', version: '1.0.0' } );
} );

app.listen( PORT, () => {
  console.log( `EdgeShaping MCP Server running on port ${PORT}` );
} );
