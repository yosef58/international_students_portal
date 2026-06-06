import User from '../models/User.js';
import ServiceRequest from '../models/ServiceRequest.js';

const getLeastBusyStaff = async () => {

  const FRESH_THRESHOLD_HOURS = 2; // consider staff stale if lastSeen > 2h ago
  const freshCutoff = new Date(Date.now() - FRESH_THRESHOLD_HOURS * 60 * 60 * 1000);

  // ✅ First try: online staff who were actually seen recently
  let staffList = await User.find({
    role: "staff",
    isActive: true,
    lastSeen: { $gte: freshCutoff }  // ← freshness guard
  }, "_id");

  // ✅ Fallback 1: any online staff (isActive=true, regardless of lastSeen)
  if (staffList.length === 0) {
    staffList = await User.find({ role: "staff", isActive: true }, "_id");
  }

  // ✅ Fallback 2: any staff at all
  if (staffList.length === 0) {
    staffList = await User.find({ role: "staff" }, "_id");
  }

  if (staffList.length === 0) return null;

  const staffRequestCounts = await Promise.all(
    staffList.map(async (staff) => {
      const count = await ServiceRequest.countDocuments({
        assignedTo: staff._id,
        status: "Pending"
      });
      return { staffId: staff._id, count };
    })
  );

  staffRequestCounts.sort((a, b) => a.count - b.count);
  return staffRequestCounts[0].staffId;
};

export default getLeastBusyStaff;