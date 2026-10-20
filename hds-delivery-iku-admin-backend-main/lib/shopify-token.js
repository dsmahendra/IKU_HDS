/**
 * Shopify Admin API access token
 *
 * - SHOPIFY_ADMIN_TOKEN set: use it as-is (legacy custom app, shpat_...)
 * - Otherwise SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (Dev Dashboard app):
 *   request a token with the client credentials grant and cache it until
 *   shortly before it expires (Shopify issues them for ~24h)
 */

const axios = require('axios');

let cached = null; // { token, expiresAt }

function getShopifyStore() {
  return (process.env.SHOPIFY_STORE || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
}

async function getShopifyToken() {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;

  const store = getShopifyStore();
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!store || !clientId || !clientSecret) return null;

  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const response = await axios.post(
    `https://${store}/admin/oauth/access_token`,
    { client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' },
    { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
  );

  const { access_token, expires_in } = response.data;
  // Refresh 5 minutes early; fall back to 1 hour if no expiry is returned
  const ttlSeconds = expires_in ? Math.max(expires_in - 300, 60) : 3600;
  cached = { token: access_token, expiresAt: Date.now() + ttlSeconds * 1000 };
  console.log(`🔑 Shopify access token obtained (valid ~${Math.round(ttlSeconds / 3600)}h)`);
  return access_token;
}

// Drop the cached token (e.g. after a 401) so the next call fetches a new one
function clearShopifyToken() {
  cached = null;
}

module.exports = { getShopifyToken, clearShopifyToken, getShopifyStore };
