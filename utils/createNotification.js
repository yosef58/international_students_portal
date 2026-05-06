import Notification from '../models/Notification.js';
import User from '../models/User.js';
import sendNotificationEmail from './emailService.js';

// ✅ Single notification
const createNotification = async ({ userId, message }) => {
  try {
    await Notification.create({ user: userId, message });

    // get user email
    const user = await User.findById(userId).select('email name');
    if (user) {
      await sendNotificationEmail({
        to: user.email,
        subject: 'New Notification',
        message
      });
    }
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};

// ✅ Bulk notifications (for notifying all staff)
const createBulkNotifications = async ({ userIds, message }) => {
  try {
    const notifications = userIds.map(id => ({ user: id, message }));
    await Notification.insertMany(notifications);

    // send email to each
    const users = await User.find({ _id: { $in: userIds } }).select('email name');
    await Promise.all(
      users.map(user =>
        sendNotificationEmail({
          to: user.email,
          subject: 'New Notification',
          message
        })
      )
    );
  } catch (err) {
    console.error("Bulk notification error:", err.message);
  }
};

export { createNotification, createBulkNotifications };