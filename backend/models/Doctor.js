const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: [true, 'Specialization is required'] },
    qualification: { type: String, required: [true, 'Qualification is required'] },
    experience: { type: Number, required: true, min: 0 },
    licenseNumber: { type: String, required: true, unique: true },
    consultationFee: { type: Number, required: true, min: 0 },
    bio: { type: String, maxlength: 1000 },
    department: { type: String, required: true },
    availableSlots: [{
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        startTime: String,
        endTime: String,
        maxPatients: { type: Number, default: 10 }
    }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalPatients: { type: Number, default: 0 },
    languages: [String],
    isAvailableForVideoCall: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

DoctorSchema.index({ specialization: 'text', department: 'text' });

module.exports = mongoose.model('Doctor', DoctorSchema);