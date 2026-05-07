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

  // ✅ Count pending requests for each staff
  const staffRequestCounts = await Promise.all(
    staffList.map(async (staff) => {
      const count = await ServiceRequest.countDocuments({
        assignedTo: staff._id,
        status: "Pending"
      });
      return { staffId: staff._id, count };
    })
  );

  // ✅ Sort by count ascending and pick the least busy
  staffRequestCounts.sort((a, b) => a.count - b.count);

  return staffRequestCounts[0].staffId;

};

export default getLeastBusyStaff;