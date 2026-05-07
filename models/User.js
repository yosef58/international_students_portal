import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["student", "staff", "admin"],
    default: "student"
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: false
  },
  lastSeen: { 
    type: Date, 
    default: null 
  }
},
{ timestamps: true }
);

export default mongoose.model("User", userSchema);