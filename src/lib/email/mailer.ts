import nodemailer from "nodemailer";

const globalForMailer = globalThis as unknown as {
  transporter: nodemailer.Transporter | undefined;
};

export const transporter =
  globalForMailer.transporter ??
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForMailer.transporter = transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: `"ProjectFlow" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
}