const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    patientId: { type: String, unique: true },
    medicalHistory: [{
        condition: String,
        diagnosedDate: Date,
        status: { type: String, enum: ['active', 'resolved', 'chronic'] },
        notes: String
    }],
    allergies: [String],
    currentMedications: [{
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date
    }],
    insuranceInfo: {
        provider: String,
        policyNumber: String,
        expiryDate: Date
    },
    height: Number,
    weight: Number,
    vitals: [{
        date: { type: Date, default: Date.now },
        bloodPressure: String,
        heartRate: Number,
        temperature: Number,
        oxygenLevel: Number
    }]
}, { timestamps: true });

// Auto-generate patient ID
PatientSchema.pre('save', async function (next) {
    if (!this.patientId) {
        const count = await mongoose.model('Patient').countDocuments();
        this.patientId = `PAT-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Patient', PatientSchema);