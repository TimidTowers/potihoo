// =====================================================================
// Decap CMS — paso 2 del OAuth
// GitHub nos devuelve aquí con ?code=...; intercambiamos por access_token
// y lo enviamos al panel de Decap vía window.postMessage.
// =====================================================================

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Verificar state contra la cookie (mitiga CSRF)
  const cookies = Object.fromEntries(
    (req.headers.cookie || '').split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );
  if (!state || state !== cookies.decap_oauth_state) {
    res.statusCode = 400;
    res.end('Invalid OAuth state. Probá de nuevo desde /admin.');
    return;
  }

  if (!code) {
    res.statusCode = 400;
    res.end('Missing OAuth code from GitHub.');
    return;
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        code,
      }),
    });

    const data = await tokenRes.json();

    if (!data.access_token) {
      res.statusCode = 400;
      res.end(`No access_token in response: ${JSON.stringify(data)}`);
      return;
    }

    const payload = JSON.stringify({ token: data.access_token, provider: 'github' });

    // Limpiar cookie del state
    res.setHeader('Set-Cookie', 'decap_oauth_state=; Path=/; Max-Age=0');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 200;
    res.end(`<!doctype html>
<html>
  <body style="font-family: system-ui; background:#0a0a0a; color:#f5f1ea; padding:2rem; text-align:center;">
    <h2>✓ Autenticado con GitHub</h2>
    <p>Cerrando ventana…</p>
    <script>
      (function () {
        function receiveMessage(e) {
          window.opener.postMessage(
            'authorization:github:success:' + ${JSON.stringify(payload)},
            e.origin
          );
          window.removeEventListener('message', receiveMessage, false);
        }
        window.addEventListener('message', receiveMessage, false);
        window.opener && window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
  </body>
</html>`);
  } catch (err) {
    res.statusCode = 500;
    res.end('OAuth error: ' + (err && err.message));
  }
}
