import nodemailer, { Transporter } from 'nodemailer';

let cachedTransport: Transporter | null = null;
let cachedTransportKey = '';

function transportKey() {
  return [
    process.env.SMTP_HOST || '',
    process.env.SMTP_PORT || '',
    process.env.SMTP_USER || '',
    process.env.SMTP_FROM || '',
  ].join('|');
}

function getTransport(): Transporter | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const key = transportKey();
  if (cachedTransport && cachedTransportKey === key) return cachedTransport;

  cachedTransport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  cachedTransportKey = key;
  return cachedTransport;
}

export interface SendOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(opts: SendOptions): Promise<{ delivered: boolean; reason?: string }> {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || 'noreply@enterpriseos.bond';

  if (!transport) {
    console.log('[email] SMTP not configured, would have sent:');
    console.log(`  To: ${opts.to}`);
    console.log(`  Subject: ${opts.subject}`);
    console.log(`  Body:\n${opts.text}`);
    return { delivered: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  try {
    await transport.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { delivered: true };
  } catch (err) {
    console.error('[email] send failed', err);
    return { delivered: false, reason: (err as Error).message };
  }
}

export function inviteEmailBody(opts: {
  inviteUrl: string;
  fullName?: string;
  companyName?: string;
  expiresAt: string;
}) {
  const greet = opts.fullName ? `Chào ${opts.fullName},` : 'Chào bạn,';
  const company = opts.companyName ? ` cho ${opts.companyName}` : '';
  return `${greet}

Bạn vừa được mời tham gia Dẹo Enterprise OS${company}.

Vui lòng nhấn vào link sau để tạo tài khoản (link hết hạn lúc ${opts.expiresAt}):

${opts.inviteUrl}

Nếu bạn không yêu cầu lời mời này, có thể bỏ qua email này.

— Dẹo Enterprise OS
`;
}
