import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  studentId: {
    type: String,
    required: true,
    unique: true
  },

  passportNumber: {
    type: String,
    required: true,
    unique: true
  },

  nationality: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  gender: {
    type: String,
    enum: ["male","female"]
  }

});

export default mongoose.model("Student", studentSchema);