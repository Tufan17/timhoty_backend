import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'timhoty.dev@gmail.com',
    pass: 'izyp qzuk moje nkxa',
  
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendMail(to: string, subject: string, text?: string, html?: string, attachments?: string): Promise<any> {
  console.log("Mail gönderiliyor:", to);
  
  try {
    let mail;
    
    if (attachments) {
      // send mail with defined transport object
      mail = await transporter.sendMail({
        from: "timhoty.dev@gmail.com",
        to: to,
        subject: subject,
        text: text !== "" ? text : undefined,
        html: html || undefined,
        attachments: attachments !== "" ? [{ path: attachments }] : undefined
      });
    } else {
      // send mail with defined transport object
      mail = await transporter.sendMail({
        from: "timhoty.dev@gmail.com",
        to: to,
        subject: subject,
        text: text !== "" ? text : undefined,
        html: html || undefined,
      });
    }

    console.log("Mail gönderildi:", mail);
    return mail;
  } catch (err) {
    console.error("Hata:", err);
    throw err;
  }
}

export default sendMail;
