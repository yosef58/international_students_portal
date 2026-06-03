import cron from 'node-cron';
import ServiceRequest from '../models/ServiceRequest.js';
import Event from '../models/Event.js';
import { createNotification, createBulkNotifications } from './createNotification.js';

// ─────────────────────────────────────────────────────────────────────────────
// JOB 1 — Auto-expire pending service requests
// Runs every day at midnight
// Finds all Pending requests whose expiresAt has passed and marks them Expired
// ─────────────────────────────────────────────────────────────────────────────
const autoExpireRequests = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Running auto-expire requests job...');
    try {
      const now = new Date();

      const expiredRequests = await ServiceRequest.find({
        status:    'Pending',
        expiresAt: { $lte: now }
      }).populate('service', 'name');

      if (expiredRequests.length === 0) {
        console.log('[Scheduler] No requests to expire.');
        return;
      }

      // Bulk update status to Expired
      const ids = expiredRequests.map(r => r._id);
      await ServiceRequest.updateMany(
        { _id: { $in: ids } },
        { status: 'Expired' }
      );

      // Notify each student
      await Promise.all(
        expiredRequests.map(r =>
          createNotification({
            userId:  r.student,
            message: `Your service request for "${r.service?.name || 'a service'}" has expired because it was not reviewed within the allowed period.`
          })
        )
      );

      console.log(`[Scheduler] Expired ${expiredRequests.length} request(s) and notified students.`);

    } catch (err) {
      console.error('[Scheduler] Auto-expire requests error:', err.message);
    }
  });
};


// ─────────────────────────────────────────────────────────────────────────────
// JOB 2 — Send deadline reminder for events happening within 24 hours
// Runs every day at 8:00 AM
// Finds events starting within the next 24 hours that haven't sent a reminder yet
// Notifies all students who reserved a seat
// ─────────────────────────────────────────────────────────────────────────────
const sendEventDeadlineReminders = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Running event deadline reminder job...');
    try {
      const now     = new Date();
      const in24hrs = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Events starting within the next 24 hours that haven't been reminded yet
      const upcomingEvents = await Event.find({
        date:                 { $gte: now, $lte: in24hrs },
        deadlineReminderSent: false,
        reservedCount:        { $gt: 0 }
      });

      if (upcomingEvents.length === 0) {
        console.log('[Scheduler] No upcoming events needing reminders.');
        return;
      }

      for (const event of upcomingEvents) {
        const studentIds = event.reservations.map(r => r.student);

        if (studentIds.length > 0) {
          await createBulkNotifications({
            userIds: studentIds,
            message: `Reminder: The event "${event.title}" is happening tomorrow${event.location ? ` at ${event.location}` : ''}. Don't miss it!`
          });
        }

        // Mark reminder as sent so it doesn't fire again
        event.deadlineReminderSent = true;
        await event.save();

        console.log(`[Scheduler] Reminder sent for event "${event.title}" to ${studentIds.length} student(s).`);
      }

    } catch (err) {
      console.error('[Scheduler] Event deadline reminder error:', err.message);
    }
  });
};


// ─────────────────────────────────────────────────────────────────────────────
// JOB 3 — Auto-expire past events
// Runs every day at 1:00 AM
// Events whose date has passed are no longer reservable — just logs / marks them
// ─────────────────────────────────────────────────────────────────────────────
const autoExpireEvents = () => {
  cron.schedule('0 1 * * *', async () => {
    console.log('[Scheduler] Running auto-expire events job...');
    try {
      const now = new Date();

      // Count events that have passed (for logging)
      const count = await Event.countDocuments({ date: { $lt: now } });

      // No status field needed on events — the eventController already
      // derives isFull / availability from date vs now at query time.
      // This job is a hook for any future cleanup or archiving logic.
      console.log(`[Scheduler] ${count} past event(s) detected. Reservation endpoints will block new bookings automatically.`);

    } catch (err) {
      console.error('[Scheduler] Auto-expire events error:', err.message);
    }
  });
};


// ─────────────────────────────────────────────────────────────────────────────
// Start all jobs
// ─────────────────────────────────────────────────────────────────────────────
const startScheduler = () => {
  autoExpireRequests();
  sendEventDeadlineReminders();
  autoExpireEvents();
  console.log('[Scheduler] All cron jobs started.');
};

export default startScheduler;