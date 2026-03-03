const mongoose = require('mongoose');

const VideoCallSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number, default: 0 },
    status: { type: String, enum: ['scheduled', 'active', 'completed', 'missed'], default: 'scheduled' },
    chatMessages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: String,
        timestamp: { type: Date, default: Date.now }
    }],
    notes: String,
    recording: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('VideoCall', VideoCallSchema);