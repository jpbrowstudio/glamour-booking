// Envío de correos vía la cuenta de Gmail conectada (jpbrowsstudio26@gmail.com)
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_mail/gmail/v1';

function encodeHeader(value: string) {
  // RFC 2047 para acentos en asunto / nombre
  return /[^\x20-\x7E]/.test(value)
    ? `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
    : value;
}

function toBase64Url(input: string) {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendGmail(opts: { to: string; subject: string; html: string }) {
  const lovableKey = process.env['LOVABLE_API_KEY'];
  const connKey = process.env['GOOGLE_MAIL_API_KEY'];
  if (!lovableKey || !connKey) throw new Error('Gmail no está configurado en el servidor');

  const raw = [
    `To: ${opts.to}`,
    `Subject: ${encodeHeader(opts.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    opts.html,
  ].join('\r\n');

  const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': connKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: toBase64Url(raw) }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[gmail] envío falló [${res.status}]: ${body}`);
    throw new Error(`Gmail error [${res.status}]: ${body}`);
  }
  return { sent: true as const };
}

const STUDIO = 'JP Brows Studio';

function layout(title: string, body: string) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#3b2f2a">
  <div style="max-width:560px;margin:0 auto;padding:28px 24px">
    <h1 style="font-size:20px;margin:0 0 6px">${STUDIO}</h1>
    <h2 style="font-size:16px;font-weight:normal;color:#8a6f5c;margin:0 0 18px">${title}</h2>
    ${body}
    <p style="margin-top:28px;font-size:12px;color:#9b8b80">Este correo fue enviado automáticamente por ${STUDIO}.</p>
  </div></body></html>`;
}

export interface BookingEmailData {
  name: string;
  email: string;
  phone: string;
  areaCode: string;
  serviceName: string;
  date: string;
  time: string;
  notes?: string | null;
}

function detalles(b: BookingEmailData) {
  return `<table style="font-size:14px;line-height:1.7">
    <tr><td>Servicio:</td><td><b>${b.serviceName}</b></td></tr>
    <tr><td>Fecha:</td><td><b>${b.date}</b></td></tr>
    <tr><td>Hora:</td><td><b>${b.time}</b></td></tr>
    <tr><td>Teléfono:</td><td>${b.areaCode} ${b.phone}</td></tr>
    ${b.notes ? `<tr><td>Notas:</td><td>${b.notes}</td></tr>` : ''}
  </table>`;
}

export type BookingEmailKind = 'solicitud' | 'confirmada' | 'cancelada' | 'reprogramada' | 'recordatorio';

export function clientEmail(kind: BookingEmailKind, b: BookingEmailData) {
  const map: Record<BookingEmailKind, { subject: string; intro: string }> = {
    solicitud: {
      subject: `Recibimos tu solicitud de cita · ${STUDIO}`,
      intro: `¡Hola ${b.name}! Recibimos tu solicitud de cita. En breve la revisamos y te confirmamos.`,
    },
    confirmada: {
      subject: `Tu cita está confirmada · ${STUDIO}`,
      intro: `¡Hola ${b.name}! Tu cita quedó <b>confirmada</b>. ¡Te esperamos!`,
    },
    cancelada: {
      subject: `Tu cita fue cancelada · ${STUDIO}`,
      intro: `Hola ${b.name}, tu cita fue cancelada. Escríbenos para reagendar cuando quieras.`,
    },
    reprogramada: {
      subject: `Tu cita fue reprogramada · ${STUDIO}`,
      intro: `Hola ${b.name}, tu cita se reprogramó con los siguientes datos.`,
    },
    recordatorio: {
      subject: `Recordatorio de tu cita · ${STUDIO}`,
      intro: `Hola ${b.name}, te recordamos tu próxima cita.`,
    },
  };
  const { subject, intro } = map[kind];
  return {
    subject,
    html: layout(subject, `<p style="font-size:14px">${intro}</p>${detalles(b)}`),
  };
}

export function ownerEmail(b: BookingEmailData) {
  const subject = `Nueva reserva solicitada · ${b.date} ${b.time}`;
  return {
    subject,
    html: layout(
      subject,
      `<p style="font-size:14px"><b>${b.name}</b> solicitó una cita.</p>${detalles(b)}
       <p style="font-size:14px">Correo del cliente: ${b.email}</p>
       <p style="font-size:14px">Gestiónala desde el panel de administración.</p>`,
    ),
  };
}
