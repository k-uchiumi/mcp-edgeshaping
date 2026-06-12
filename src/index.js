/**
 * EdgeShaping MCP Server
 * Transport: Streamable HTTP (MCP 2025-03-26)
 * Auth:      Bearer token (MCP_API_KEY env)
 */
import express        from 'express';
import rateLimit      from 'express-rate-limit';
import { McpServer }  from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { TOOLS, callTool } from './tools.js';

const PORT        = process.env.PORT || 3000;
const MCP_API_KEY = process.env.MCP_API_KEY;

if ( ! MCP_API_KEY ) {
  console.error( 'ERROR: MCP_API_KEY env is required' );
  process.exit( 1 );
}

const app = express();

// Railway はリバースプロキシ経由なので trust proxy が必要
app.set( 'trust proxy', 1 );
app.use( express.json() );

// レートリミット
app.use( '/mcp', rateLimit( {
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
} ) );

// Bearer Token 認証
function authenticate( req, res, next ) {
  const auth = req.headers['authorization'] ?? '';
  if ( auth !== `Bearer ${MCP_API_KEY}` ) {
    return res.status( 401 ).json( { error: 'Unauthorized' } );
  }
  next();
}

// MCPサーバーファクトリ（stateless: リクエストごとに新規）
function createMcpServer() {
  const server = new McpServer( {
    name:    'edgeshaping-mcp',
    version: '1.0.0',
  } );

  for ( const tool of TOOLS ) {
    server.tool(
      tool.name,
      tool.description,
      tool.schema,
      async ( args ) => callTool( tool.name, args )
    );
  }

  return server;
}

// POST /mcp
app.post( '/mcp', authenticate, async ( req, res ) => {
  const server    = createMcpServer();
  const transport = new StreamableHTTPServerTransport( {
    sessionIdGenerator: undefined, // stateless
  } );

  res.on( 'close', () => {
    transport.close();
    server.close();
  } );

  try {
    await server.connect( transport );
    await transport.handleRequest( req, res, req.body );
  } catch ( err ) {
    console.error( 'MCP error:', err );
    if ( ! res.headersSent ) {
      res.status( 500 ).json( { error: 'Internal server error' } );
    }
  }
} );

// ヘルスチェック（認証不要）
app.get( '/health', ( _req, res ) => {
  res.json( { status: 'ok', service: 'edgeshaping-mcp', version: '1.0.0' } );
} );

app.listen( PORT, () => {
  console.log( `EdgeShaping MCP Server running on port ${PORT}` );
} );
