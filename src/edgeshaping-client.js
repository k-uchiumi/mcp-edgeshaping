/**
 * EdgeShaping REST API クライアント
 * WP側のAPIを叩いてデータを取得する
 */

const WP_URL      = process.env.WP_URL;
const WP_USER     = process.env.WP_USER;
const WP_PASSWORD = process.env.WP_APP_PASSWORD;

if ( ! WP_URL || ! WP_USER || ! WP_PASSWORD ) {
  throw new Error( 'Missing required env: WP_URL, WP_USER, WP_APP_PASSWORD' );
}

const BASE = `${WP_URL.replace( /\/$/, '' )}/wp-json/edgeshaping/v1`;
const AUTH  = 'Basic ' + Buffer.from( `${WP_USER}:${WP_PASSWORD}` ).toString( 'base64' );

async function fetchLogs( { from, to, category, limit = 100, offset = 0 } = {} ) {
  const params = new URLSearchParams();
  if ( from )     params.set( 'from',         from );
  if ( to )       params.set( 'to',           to );
  if ( category ) params.set( 'category',     category );
  params.set( 'limit',  String( limit ) );
  params.set( 'offset', String( offset ) );

  const url = `${BASE}/logs?${params}`;
  const res = await fetch( url, {
    headers: { Authorization: AUTH },
    signal: AbortSignal.timeout( 10000 ),
  } );

  if ( ! res.ok ) {
    const body = await res.text();
    throw new Error( `EdgeShaping API error: ${res.status} ${body}` );
  }

  return res.json();
}

export { fetchLogs };
