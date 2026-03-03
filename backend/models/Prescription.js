const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    diagnosis: { type: String, required: true },
    medications: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: String,
        beforeAfterMeal: { type: String, enum: ['before', 'after', 'with', 'any'], default: 'after' }
    }],
    tests: [{
        name: String,
        instructions: String,
        urgent: { type: Boolean, default: false }
    }],
    advice: String,
    followUpDate: Date,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', PrescriptionSchema);