import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  
  category: {
    type: String,
    enum: ["education", "visa", "housing", "financial"],
    required: true
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  requiredDocuments: [
    {
      name: { type: String, required: true },       // e.g. "Passport Copy"
      isUploaded: { type: Boolean, default: false }, // did student upload it?
      file: {
        filename: { type: String, default: null },
        path: { type: String, default: null }
      }
    }
  ],
  reviewNotes: String,
}, { timestamps: true });
serviceRequestSchema.index(
  { student: 1, service: 1 },
  { unique: true }
);

export default mongoose.model('ServiceRequest', serviceRequestSchema);
