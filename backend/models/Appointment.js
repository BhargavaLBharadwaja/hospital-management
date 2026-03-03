const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentDate: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    type: { type: String, enum: ['in-person', 'video-call', 'phone'], default: 'in-person' },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'], default: 'pending' },
    reason: { type: String, required: [true, 'Reason for visit is required'] },
    symptoms: [String],
    notes: String,
    patientNotes: String,
    doctorNotes: String,
    diagnosis: String,
    videoCallRoomId: String,
    cancelReason: String,
    cancelledBy: { type: String, enum: ['patient', 'doctor', 'admin'] },
    fee: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'insurance', ''], default: '' },
    followUp: { type: Boolean, default: false },
    followUpDate: Date
}, { timestamps: true });

AppointmentSchema.index({ patient: 1, appointmentDate: 1 });
AppointmentSchema.index({ doctor: 1, appointmentDate: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);