import User from '../models/User.js';
import ServiceRequest from '../models/ServiceRequest.js';

const getLeastBusyStaff = async () => {

  // ✅ First try online staff only
  let staffList = await User.find({ role: "staff", isActive: true }, "_id");

  // ✅ Fallback to any staff if no one is online
  if (staffList.length === 0) {
    staffList = await User.find({ role: "staff" }, "_id");
  }

  if (staffList.length === 0) return null;

  const staffIds = staffList.map(s => s._id);

  // ✅ Single aggregate instead of N+1 countDocuments queries
  const pendingCounts = await ServiceRequest.aggregate([
    { $match: { assignedTo: { $in: staffIds }, status: "Pending" } },
    { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
  ]);

  // Build lookup map — staff with 0 pending won't appear in aggregate results
  const countMap = {};
  pendingCounts.forEach(r => { countMap[r._id.toString()] = r.count; });

  // ✅ Find least busy (default to 0 for staff not in the map)
  const leastBusy = staffIds.reduce((min, staffId) => {
    const count    = countMap[staffId.toString()]  || 0;
    const minCount = countMap[min.toString()]       || 0;
    return count < minCount ? staffId : min;
  });

  return leastBusy;

};

export default getLeastBusyStaff;