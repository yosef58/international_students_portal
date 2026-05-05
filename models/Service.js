import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },
  image: { 
    type: String   // هتخزن path أو URL
  },
  category: {
    type: String,
    enum: ["education", "visa", "housing", "financial"],
    required: true
  },

  price: { 
    type: Number,
    default: 0,
    min: 0
  },

  requiredDocuments: [String]

}, { timestamps: true });

export default mongoose.model('Service', serviceSchema);