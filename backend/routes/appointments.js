const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { protect, authorize } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/appointments
router.get('/', protect, async (req, res) => {
    try {
        const { status, date, page = 1, limit = 20 } = req.query;
        let query = {};

        if (req.user.role === 'patient') {
            query.patient = req.user._id;
        } else if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({ user: req.user._id });
            if (doctor) query.doctor = doctor._id;
        }

        if (status) query.status = status;
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
        }

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName email phone avatar')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'firstName lastName email phone avatar' }
            })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ appointmentDate: -1 });

        const total = await Appointment.countDocuments(query);

        res.json({ success: true, appointments, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// POST /api/appointments
router.post('/', protect, async (req, res) => {
    try {
        const { doctorId, appointmentDate, timeSlot, type, reason, symptoms, notes } = req.body;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

        // Check for conflicting appointment
        const existingAppointment = await Appointment.findOne({
            doctor: doctorId,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingAppointment) {
            return res.status(400).json({ error: 'This time slot is already booked' });
        }

        const appointmentData = {
            patient: req.user._id,
            doctor: doctorId,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            type: type || 'in-person',
            reason,
            symptoms: symptoms || [],
            patientNotes: notes,
            fee: doctor.consultationFee
        };

        // Generate video call room ID if video call
        if (type === 'video-call') {
            appointmentData.videoCallRoomId = uuidv4();
        }

        const appointment = await Appointment.create(appointmentData);

        const populated = await Appointment.findById(appointment._id)
            .populate('patient', 'firstName lastName email phone')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'firstName lastName email phone' }
            });

        res.status(201).json({ success: true, appointment: populated });
    } catch (error) {
        console.error('Appointment creation error:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
});

// PUT /api/appointments/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('patient', 'firstName lastName email phone')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'firstName lastName email phone' }
            });

        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

        res.json({ success: true, appointment });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update appointment' });
    }
});

// PUT /api/appointments/:id/cancel
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

        appointment.status = 'cancelled';
        appointment.cancelReason = req.body.reason || 'No reason provided';
        appointment.cancelledBy = req.user.role;
        await appointment.save();

        res.json({ success: true, message: 'Appointment cancelled', appointment });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel appointment' });
    }
});

// GET /api/appointments/stats
router.get('/stats/overview', protect, async (req, res) => {
    try {
        let matchQuery = {};

        if (req.user.role === 'patient') {
            matchQuery.patient = req.user._id;
        } else if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({ user: req.user._id });
            if (doctor) matchQuery.doctor = doctor._id;
        }

        const total = await Appointment.countDocuments(matchQuery);
        const pending = await Appointment.countDocuments({ ...matchQuery, status: 'pending' });
        const confirmed = await Appointment.countDocuments({ ...matchQuery, status: 'confirmed' });
        const completed = await Appointment.countDocuments({ ...matchQuery, status: 'completed' });
        const cancelled = await Appointment.countDocuments({ ...matchQuery, status: 'cancelled' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = await Appointment.countDocuments({
            ...matchQuery,
            appointmentDate: { $gte: today, $lt: tomorrow },
            status: { $in: ['pending', 'confirmed'] }
        });

        res.json({
            success: true,
            stats: { total, pending, confirmed, completed, cancelled, todayAppointments }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;