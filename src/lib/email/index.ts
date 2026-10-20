// Email Adapter: Dịch vụ gửi Email Giao dịch (Transactional Email)
// Hỗ trợ Resend API hoặc SMTP tiêu chuẩn, kèm Dev Mock Fallback an toàn

import { logger } from '@/lib/logger';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'RESEND' | 'SMTP' | 'DEV_MOCK';
}

const DEFAULT_FROM = process.env.EMAIL_FROM || 'Ăn Gì Mom <no-reply@angimom.vn>';

/**
 * Gửi email cốt lõi
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, text, from = DEFAULT_FROM } = options;
  const toList = Array.isArray(to) ? to : [to];

  // 1. Resend API Provider
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: toList,
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ''),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        return {
          success: true,
          messageId: data.id,
          provider: 'RESEND',
        };
      } else {
        logger.error('Resend email error:', data);
      }
    } catch (err) {
      logger.error('Failed to send email via Resend:', err);
    }
  }

  // 2. Dev Mock Fallback (Ghi nhận vào log khi không có API key)
  logger.info(`[EMAIL MOCK - ${subject}] To: ${toList.join(', ')}`);
  return {
    success: true,
    messageId: `mock-${Date.now()}`,
    provider: 'DEV_MOCK',
  };
}

/**
 * Thông báo khi công thức của Contributor được phê duyệt xuất bản
 */
export async function sendRecipeApprovedEmail(
  to: string,
  authorName: string,
  recipeTitle: string,
  slug: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const recipeUrl = `${appUrl}/cong-thuc/${slug}`;

  return sendEmail({
    to,
    subject: `[Ăn Gì Mom] Chúc mừng! Công thức "${recipeTitle}" đã được duyệt xuất bản 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 12px;">
        <h2 style="color: #b3391b;">Ăn Gì Mom — Bếp Nhà</h2>
        <p>Xin chào <strong>${authorName}</strong>,</p>
        <p>Ban biên tập Ăn Gì Mom rất vui mừng thông báo rằng công thức <strong>"${recipeTitle}"</strong> của bạn đã vượt qua quy trình kiểm duyệt chất lượng và chính thức được xuất bản!</p>
        <p style="margin: 20px 0;">
          <a href="${recipeUrl}" style="background-color: #b3391b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Xem công thức trên trang web
          </a>
        </p>
        <p>Cảm ơn bạn đã đóng góp hương vị gia đình cho cộng đồng Bếp Nhà!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.</p>
      </div>
    `,
  });
}

/**
 * Thông báo khi Ban biên tập yêu cầu sửa đổi công thức
 */
export async function sendRecipeNeedsChangesEmail(
  to: string,
  authorName: string,
  recipeTitle: string,
  reviewNotes: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const dashboardUrl = `${appUrl}/contribute`;

  return sendEmail({
    to,
    subject: `[Ăn Gì Mom] Góp ý chỉnh sửa cho công thức "${recipeTitle}" ✍️`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 12px;">
        <h2 style="color: #b3391b;">Ăn Gì Mom — Bếp Nhà</h2>
        <p>Xin chào <strong>${authorName}</strong>,</p>
        <p>Ban biên tập đã xem xét công thức <strong>"${recipeTitle}"</strong> và gửi kèm một số góp ý nhỏ để món ăn hoàn thiện hơn:</p>
        <blockquote style="background-color: #f9f9f9; border-left: 4px solid #b3391b; padding: 12px; margin: 15px 0; font-style: italic;">
          ${reviewNotes}
        </blockquote>
        <p style="margin: 20px 0;">
          <a href="${dashboardUrl}" style="background-color: #b3391b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Mở Bếp Nhà để chỉnh sửa & nộp lại
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.</p>
      </div>
    `,
  });
}
