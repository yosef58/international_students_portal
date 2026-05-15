import Notification from '../models/Notification.js';
import User from '../models/User.js';
import sendNotificationEmail from './emailService.js';

const createNotification = async ({ userId, message }) => {
  try {
    await Notification.create({ user: userId, message });
    console.log(`✅ Notification created for user: ${userId}`);

    const user = await User.findById(userId).select('email notificationEmail name');

    if (!user) {
      console.log(`❌ User not found: ${userId}`);
      return;
    }

    console.log(`✅ User found: ${user.email}`);

    // ✅ Hardcoded for testing with Resend free tier
    const sendTo = 'yosefazam43@gmail.com';
    console.log(`📧 Sending email to: ${sendTo}`);

    await sendNotificationEmail({
      to:      sendTo,
      subject: 'New Notification',
      message
    });

    console.log(`✅ Email sent to: ${sendTo}`);

  } catch (err) {
    console.error("❌ Notification error:", err.message);
  }
};

const createBulkNotifications = async ({ userIds, message }) => {
  try {
    const notifications = userIds.map(id => ({ user: id, message }));
    await Notification.insertMany(notifications);
    console.log(`✅ Bulk notifications created for ${userIds.length} users`);

    const users = await User.find(
      { _id: { $in: userIds } }
    ).select('email notificationEmail name');

    console.log(`✅ Found ${users.length} users to email`);

    await Promise.all(
      users.map(user => {
        // ✅ Hardcoded for testing with Resend free tier
        const sendTo = 'yosefazam43@gmail.com';
        console.log(`📧 Sending bulk email to: ${sendTo}`);
        return sendNotificationEmail({
          to:      sendTo,
          subject: 'New Notification',
          message
        });
      })
    );

    console.log(`✅ All bulk emails sent`);

  } catch (err) {
    console.error("❌ Bulk notification error:", err.message);
  }
};

export { createNotification, createBulkNotifications };