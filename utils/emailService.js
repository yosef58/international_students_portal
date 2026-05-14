import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,     // staff Gmail e.g. staff@gmail.com
    pass: process.env.GMAIL_APP_PASS  // the 16-char App Password
  }
});

const sendNotificationEmail = async ({ to, subject, message }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Students Portal" <${process.env.GMAIL_USER}>`,
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

    console.log(`Email sent to ${to} | id: ${info.messageId}`);
  } catch (err) {
    console.error("Email send error:", err.message);
  }
};

export default sendNotificationEmail;