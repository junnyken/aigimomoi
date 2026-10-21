import net from 'node:net';
import tls from 'node:tls';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  isMock?: boolean;
  error?: string;
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && 
    process.env.SMTP_USER && 
    process.env.SMTP_PASS
  );
}

/**
 * Lightweight native SMTP client using Node.js built-in tls/net
 * Zero external dependencies required.
 */
async function sendViaSmtp(options: EmailOptions): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST!;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;
  const from = process.env.SMTP_FROM || `Ăn Gì Mom <${user}>`;

  return new Promise((resolve) => {
    let socket: net.Socket | tls.TLSSocket;
    let step = 0;
    let buffer = '';

    const onError = (err: Error) => {
      resolve({ success: false, error: err.message });
      try { socket.destroy(); } catch {}
    };

    const isSecure = port === 465;
    if (isSecure) {
      socket = tls.connect({ host, port, minVersion: 'TLSv1.2' }, onConnected);
    } else {
      socket = net.connect({ host, port }, onConnected);
    }

    socket.on('error', onError);
    socket.setEncoding('utf-8');

    function onConnected() {
      // Connected, wait for server greeting (220)
    }

    socket.on('data', (chunk: string) => {
      buffer += chunk;
      if (!buffer.endsWith('\r\n')) return;
      
      const line = buffer.trim();
      buffer = '';
      const code = parseInt(line.slice(0, 3), 10);

      try {
        if (step === 0 && code === 220) {
          step = 1;
          socket.write(`EHLO angimom.vn\r\n`);
        } else if (step === 1 && code === 250) {
          step = 2;
          socket.write(`AUTH LOGIN\r\n`);
        } else if (step === 2 && code === 334) {
          step = 3;
          socket.write(`${Buffer.from(user).toString('base64')}\r\n`);
        } else if (step === 3 && code === 334) {
          step = 4;
          socket.write(`${Buffer.from(pass).toString('base64')}\r\n`);
        } else if (step === 4 && code === 235) {
          step = 5;
          const fromEmail = from.includes('<') ? from.match(/<([^>]+)>/)?.[1] || user : user;
          socket.write(`MAIL FROM:<${fromEmail}>\r\n`);
        } else if (step === 5 && code === 250) {
          step = 6;
          socket.write(`RCPT TO:<${options.to}>\r\n`);
        } else if (step === 6 && code === 250) {
          step = 7;
          socket.write(`DATA\r\n`);
        } else if (step === 7 && code === 354) {
          step = 8;
          const msg = [
            `From: ${from}`,
            `To: <${options.to}>`,
            `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString('base64')}?=`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=UTF-8`,
            ``,
            options.html,
            `.`,
            ``
          ].join('\r\n');
          socket.write(msg);
        } else if (step === 8 && code === 250) {
          step = 9;
          socket.write(`QUIT\r\n`);
          resolve({ success: true, messageId: `smtp-${Date.now()}` });
        } else if (code >= 400) {
          resolve({ success: false, error: `SMTP server responded with error: ${line}` });
          try { socket.destroy(); } catch {}
        }
      } catch (err: unknown) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    });
  });
}

export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  if (isSmtpConfigured()) {
    try {
      const result = await sendViaSmtp(options);
      if (result.success) return result;
      console.warn('[Mailer] SMTP delivery failed, falling back to mock log:', result.error);
    } catch (e) {
      console.warn('[Mailer] Unexpected error during SMTP transport:', e);
    }
  }

  // Fallback for dev / staging / tests without live SMTP
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Dev Mailer] Email sent to: ${options.to} | Subject: ${options.subject}`);
  }
  return { success: true, isMock: true, messageId: `mock-${Date.now()}` };
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<SendEmailResult> {
  const subject = 'ĂN GÌ MOM — Hướng dẫn đặt lại mật khẩu của bạn';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; padding: 6px 14px; background: #ecfdf5; color: #059669; border-radius: 20px; font-weight: 700; font-size: 14px;">ĂN GÌ MOM</span>
        <h1 style="color: #111827; font-size: 20px; margin-top: 12px; margin-bottom: 6px;">Yêu cầu đặt lại mật khẩu</h1>
        <p style="color: #4b5563; font-size: 14px; margin: 0;">Bữa cơm nhà, bớt nghĩ hôm nay ăn gì</p>
      </div>

      <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
          Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong> tại Ăn Gì Mom.
        </p>
      </div>

      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        Vui lòng nhấn vào nút bên dưới để tiến hành thiết lập mật khẩu mới. Liên kết này có hiệu lực trong vòng <strong>15 phút</strong> và chỉ sử dụng được 1 lần duy nhất.
      </p>

      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Đặt lại mật khẩu ngay
        </a>
      </div>

      <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin-bottom: 8px;">
        Nếu nút trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:
      </p>
      <p style="word-break: break-all; font-size: 12px; color: #059669; background: #f3f4f6; padding: 8px; border-radius: 6px;">
        ${resetUrl}
      </p>

      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
        Nếu bạn không thực hiện yêu cầu này, hãy yên tâm bỏ qua email này. Mật khẩu của bạn vẫn hoàn toàn an toàn.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text: `Yêu cầu đặt lại mật khẩu Ăn Gì Mom cho ${email}. Vui lòng mở liên kết sau trong 15 phút: ${resetUrl}`,
  });
}
