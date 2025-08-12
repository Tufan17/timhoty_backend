import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  auth: {
    user: "uygunusecsigorta@gmail.com",
    pass: "yujflpiuapxkeehm",
  },
  logger: true,
  debug: true,
  tls: {
    rejectUnauthorized: false,
  },
});




export async function sendMail(to: string, subject: string, body: string) {
  try{
    console.log("Mail gönderildi");
  await transporter.sendMail({
    from: '"uygunusecsigorta@gmail.com',
    to: to,
    subject: subject,
    text: body,
  });
  console.log("Mail gönderildi 2");
  }catch(error){
    console.log(error);
  }

}
