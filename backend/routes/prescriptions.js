const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const { protect, authorize } = require('../middleware/auth');

// GET /api/prescriptions
router.get('/', protect, async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'patient') {
            query.patient = req.user._id;
        } else if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({ user: req.user._id });
            if (doctor) query.doctor = doctor._id;
        }

        const prescriptions = await Prescription.find(query)
            .populate('patient', 'firstName lastName email')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'firstName lastName' }
            })
            .populate('appointment')
            .sort({ createdAt: -1 });

        res.json({ success: true, prescriptions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
});

// POST /api/prescriptions
router.post('/', protect, authorize('doctor'), async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ user: req.user._id });
        if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

        const prescription = await Prescription.create({
            ...req.body,
            doctor: doctor._id
        });

        const populated = await Prescription.findById(prescription._id)
            .populate('patient', 'firstName lastName email')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'firstName lastName' }
            });

        res.status(201).json({ success: true, prescription: populated });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create prescription' });
    }
});

// GET /api/prescriptions/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('patient', 'firstName lastName email phone dateOfBirth gender bloodGroup')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'firstName lastName email phone' }
            })
            .populate('appointment');

        if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
        res.json({ success: true, prescription });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch prescription' });
    }
});

module.exports = router;