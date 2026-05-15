import nodemailer from 'nodemailer';

const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS
    }
  });
};

const sendNotificationEmail = async ({ to, subject, message }) => {
  try {
    // ✅ Create transporter only when sending — env vars are loaded by then
    const transporter = getTransporter();

    // ✅ Verify connection before sending
    await transporter.verify();
    console.log(`✅ Transporter verified`);

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
    console.error("❌ GMAIL_USER:", process.env.GMAIL_USER);       // ✅ debug
    console.error("❌ GMAIL_APP_PASS exists:", !!process.env.GMAIL_APP_PASS); // ✅ debug
  }
};

export default sendNotificationEmail;