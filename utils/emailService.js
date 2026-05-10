import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendNotificationEmail = async ({ to, subject, message }) => {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
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
  } catch (err) {
    console.error("Email send error:", err.message);
  }
};

export default sendNotificationEmail;