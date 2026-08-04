// =====================================================================
// Formulario de contacto → email a Ana.
// Usa Resend (https://resend.com). Variables de entorno en Vercel:
//   RESEND_API_KEY  (obligatoria para que envíe)
//   CONTACT_TO      (opcional, por defecto anapaulatvi@gmail.com)
//   CONTACT_FROM    (opcional, por defecto el remitente de pruebas de Resend)
// Sin RESEND_API_KEY responde 503 {error:'not_configured'} y el front
// abre el cliente de correo del visitante como alternativa.
// =====================================================================

const TO = process.env.CONTACT_TO || 'anapaulatvi@gmail.com';
const FROM = process.env.CONTACT_FROM || 'potihoo <onboarding@resend.dev>';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'method_not_allowed' }));
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'bad_json' }));
    }
  }
  body = body || {};

  const name = (body.name || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const message = (body.message || '').toString().trim();
  const website = (body.website || '').toString().trim(); // honeypot anti-spam

  // Un bot rellena el campo oculto: fingimos éxito y descartamos
  if (website) {
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true }));
  }

  if (!name || !email || !message) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'missing_fields' }));
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length > 5000) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'invalid_input' }));
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: 'not_configured' }));
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `potihoo · mensaje de ${name}`,
        html: `
          <div style="font-family:system-ui,sans-serif;line-height:1.6">
            <h2 style="margin:0 0 12px">Nuevo mensaje desde potihoo.vercel.app</h2>
            <p><strong>Nombre:</strong> ${esc(name)}</p>
            <p><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
            <p><strong>Mensaje:</strong></p>
            <p style="white-space:pre-wrap;border-left:3px solid #e30052;padding-left:12px">${esc(message)}</p>
          </div>`,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('[contact] Resend respondió', r.status, detail);
      res.statusCode = 502;
      return res.end(JSON.stringify({ error: 'send_failed' }));
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('[contact] error:', err && err.message);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'server_error' }));
  }
}
