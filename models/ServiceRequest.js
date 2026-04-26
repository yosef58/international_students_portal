import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  documents: [
  {
    filename: String,
    path: String
  }
],
  reviewNotes: String,
}, { timestamps: true });
serviceRequestSchema.index(
  { student: 1, service: 1 },
  { unique: true }
);

export default mongoose.model('ServiceRequest', serviceRequestSchema);
