const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/doctors - Get all doctors (Public)
router.get('/', async (req, res) => {
    try {
        const { specialization, department, search, page = 1, limit = 12 } = req.query;
        const query = { isActive: true };

        if (specialization) query.specialization = { $regex: specialization, $options: 'i' };
        if (department) query.department = { $regex: department, $options: 'i' };

        let doctors = await Doctor.find(query)
            .populate('user', 'firstName lastName email phone avatar gender')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ rating: -1 });

        if (search) {
            doctors = doctors.filter(d =>
                d.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
                d.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
                d.specialization.toLowerCase().includes(search.toLowerCase())
            );
        }

        const total = await Doctor.countDocuments(query);

        res.json({ success: true, doctors, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
});

// GET /api/doctors/specializations
router.get('/specializations', async (req, res) => {
    try {
        const specializations = await Doctor.distinct('specialization');
        const departments = await Doctor.distinct('department');
        res.json({ success: true, specializations, departments });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch specializations' });
    }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id)
            .populate('user', 'firstName lastName email phone avatar gender');
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
        res.json({ success: true, doctor });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch doctor' });
    }
});

// POST /api/doctors - Create doctor profile (Admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { userId, specialization, qualification, experience, licenseNumber, consultationFee, bio, department, availableSlots, languages } = req.body;

        // Update user role to doctor
        await User.findByIdAndUpdate(userId, { role: 'doctor' });

        const doctor = await Doctor.create({
            user: userId, specialization, qualification, experience,
            licenseNumber, consultationFee, bio, department, availableSlots, languages
        });

        res.status(201).json({ success: true, doctor });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to create doctor profile' });
    }
});

// PUT /api/doctors/:id
router.put('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json({ success: true, doctor });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update doctor profile' });
    }
});

// POST /api/doctors/:id/rate
router.post('/:id/rate', protect, async (req, res) => {
    try {
        const { rating } = req.body;
        const doctor = await Doctor.findById(req.params.id);

        doctor.totalRatings += 1;
        doctor.rating = ((doctor.rating * (doctor.totalRatings - 1)) + rating) / doctor.totalRatings;
        await doctor.save();

        res.json({ success: true, rating: doctor.rating });
    } catch (error) {
        res.status(500).json({ error: 'Failed to rate doctor' });
    }
});

module.exports = router;