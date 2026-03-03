const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/patients
router.get('/', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        let query = {};

        const patients = await Patient.find(query)
            .populate('user', 'firstName lastName email phone avatar gender dateOfBirth bloodGroup address')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        let filtered = patients;
        if (search) {
            filtered = patients.filter(p =>
                p.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
                p.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
                p.patientId.toLowerCase().includes(search.toLowerCase())
            );
        }

        const total = await Patient.countDocuments(query);
        res.json({ success: true, patients: filtered, total });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

// GET /api/patients/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate('user', 'firstName lastName email phone avatar gender dateOfBirth bloodGroup address emergencyContact');
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        res.json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch patient' });
    }
});

// PUT /api/patients/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('user', 'firstName lastName email phone');
        res.json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update patient' });
    }
});

// POST /api/patients/:id/vitals
router.post('/:id/vitals', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        patient.vitals.push(req.body);
        await patient.save();

        res.json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add vitals' });
    }
});

module.exports = router;