import nodemailer from 'nodemailer';

const getTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',  // ✅ use host instead of service
    port: 587,               // ✅ port 587 instead of 465
    secure: false,           // ✅ false for port 587
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS
    }
  });
};

const sendNotificationEmail = async ({ to, subject, message }) => {
  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from:    `"Students Portal" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="color: #555; font-size: 16px;">${message}</p>
          <hr />
          <p style="color: #999; font-size: 12px;">
            This is an automated notification from the International Students Portal.
          </p>
        </div>
      `
    });

    console.log(`✅ Email sent to ${to} | id: ${info.messageId}`);

  } catch (err) {
    console.error("❌ Email send error:", err.message);
  }
};

export default sendNotificationEmail;