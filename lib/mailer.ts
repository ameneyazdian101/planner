import "server-only";
import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD تنظیم نشده است.");

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"پلنر" <${process.env.GMAIL_USER}>`,
    to,
    subject: "بازیابی رمز عبور پلنر",
    html: `
      <div dir="rtl" style="font-family: Tahoma, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>بازیابی رمز عبور</h2>
        <p>برای این ایمیل درخواست بازیابی رمز عبور در پلنر ثبت شده. اگر این درخواست از طرف شما نبوده، این پیام را نادیده بگیرید.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">
            ساخت رمز عبور جدید
          </a>
        </p>
        <p style="color:#666;font-size:12px;">این لینک تا ۳۰ دقیقه دیگر معتبر است.</p>
      </div>
    `,
  });
}
