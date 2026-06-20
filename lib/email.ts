import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendStatusNotification(
  to: string,
  ticketNo: string,
  ticketTitle: string,
  newStatus: string,
  statusLabel: string
) {
  if (!process.env.SMTP_USER) return;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: `تحديث حالة التذكرة ${ticketNo}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2>بوابة تذاكر IT</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>تم تحديث حالة تذكرتك</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>رقم التذكرة:</strong> ${ticketNo}</p>
              <p><strong>العنوان:</strong> ${ticketTitle}</p>
              <p><strong>الحالة الجديدة:</strong> <span style="color: #2563eb;">${statusLabel}</span></p>
            </div>
            <p>يمكنك متابعة تذكرتك من خلال بوابة IT</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Email error:", error);
  }
}
