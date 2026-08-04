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

// Los clientes de correo ignoran gran parte del CSS moderno: por eso el
// maquetado va con tablas y todos los estilos en línea.
function buildEmailHtml({ name, email, message }) {
  const body = esc(message).replace(/\r?\n/g, '<br />');
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Nuevo mensaje</title></head>
<body style="margin:0;padding:0;background:#f4f2ef;">
  <!-- Resumen que muestran Gmail/Outlook junto al asunto -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(name)} te escribió desde potihoo.vercel.app</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ef;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06);">

        <tr><td style="background:#0a0a0a;padding:22px 28px;">
          <span style="font:600 19px/1 Helvetica,Arial,sans-serif;color:#f5f1ea;letter-spacing:-.3px;">potihoo</span><span style="color:#e30052;font:600 19px/1 Helvetica,Arial,sans-serif;">.</span>
          <div style="margin-top:6px;font:400 12px/1.4 Helvetica,Arial,sans-serif;color:rgba(245,241,234,.62);letter-spacing:.08em;text-transform:uppercase;">Nuevo mensaje del formulario</div>
        </td></tr>

        <tr><td style="padding:26px 28px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font:600 11px/1.4 Helvetica,Arial,sans-serif;color:#8a8a92;letter-spacing:.1em;text-transform:uppercase;padding-bottom:4px;">De</td>
            </tr>
            <tr>
              <td style="font:600 17px/1.4 Helvetica,Arial,sans-serif;color:#16161a;padding-bottom:2px;">${esc(name)}</td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;"><a href="mailto:${esc(email)}" style="font:400 14px/1.4 Helvetica,Arial,sans-serif;color:#e30052;text-decoration:none;">${esc(email)}</a></td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f6;border-left:3px solid #e30052;border-radius:8px;">
            <tr><td style="padding:18px 20px;font:400 15px/1.7 Helvetica,Arial,sans-serif;color:#2a2a30;">${body}</td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 28px 28px;">
          <a href="mailto:${esc(email)}" style="display:inline-block;background:#e30052;color:#ffffff;font:600 14px/1 Helvetica,Arial,sans-serif;text-decoration:none;padding:13px 24px;border-radius:999px;">Responder a ${esc(name)}</a>
        </td></tr>

        <tr><td style="border-top:1px solid #eceae6;padding:16px 28px;font:400 12px/1.6 Helvetica,Arial,sans-serif;color:#9a9aa2;">
          Enviado desde el formulario de <a href="https://potihoo.vercel.app/contact" style="color:#9a9aa2;">potihoo.vercel.app</a>. Si respondes a este correo le llega directamente a ${esc(name)}.
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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
        subject: `Nuevo mensaje de ${name} · potihoo`,
        text: `Nuevo mensaje desde potihoo.vercel.app\n\nNombre: ${name}\nEmail: ${email}\n\n${message}\n\n— Responde a este correo para contestarle directamente.`,
        html: buildEmailHtml({ name, email, message }),
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
