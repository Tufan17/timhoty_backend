import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter: Transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: `"Timhoty" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });
    console.log("Mail gönderildi:", info.messageId);
  } catch (err) {
    console.error("Hata:", err);
  }
}

export default sendMail;
