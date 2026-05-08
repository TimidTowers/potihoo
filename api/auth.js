// =====================================================================
// Decap CMS — paso 1 del OAuth
// Decap llama a /api/auth y nosotros redirigimos a GitHub para login.
// GitHub vuelve a /api/callback con un "code" que intercambiamos por token.
// =====================================================================

import crypto from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 500;
    res.end('Missing GITHUB_OAUTH_CLIENT_ID env var');
    return;
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/callback`;
  const state = crypto.randomBytes(16).toString('hex');

  // Cookie con el state para verificar al volver del callback (CSRF)
  res.setHeader(
    'Set-Cookie',
    `decap_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo,user',
    state,
    allow_signup: 'false',
  });

  res.statusCode = 302;
  res.setHeader('Location', `https://github.com/login/oauth/authorize?${params}`);
  res.end();
}
