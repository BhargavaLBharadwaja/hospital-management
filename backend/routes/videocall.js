const express = require('express');
const router = express.Router();
const VideoCall = require('../models/VideoCall');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// POST /api/videocall/create-room
router.post('/create-room', protect, async (req, res) => {
    try {
        const { appointmentId, patientId } = req.body;
        const roomId = uuidv4();

        const videoCall = await VideoCall.create({
            roomId,
            appointment: appointmentId,
            doctor: req.user._id,
            patient: patientId,
            status: 'scheduled'
        });

        // Update appointment with room ID
        if (appointmentId) {
            await Appointment.findByIdAndUpdate(appointmentId, { videoCallRoomId: roomId });
        }

        res.status(201).json({ success: true, roomId, videoCall });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create video call room' });
    }
});

// GET /api/videocall/room/:roomId
router.get('/room/:roomId', protect, async (req, res) => {
    try {
        const videoCall = await VideoCall.findOne({ roomId: req.params.roomId })
            .populate('doctor', 'firstName lastName')
            .populate('patient', 'firstName lastName');

        if (!videoCall) return res.status(404).json({ error: 'Video call room not found' });

        res.json({ success: true, videoCall });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video call room' });
    }
});

// PUT /api/videocall/room/:roomId/start
router.put('/room/:roomId/start', protect, async (req, res) => {
    try {
        const videoCall = await VideoCall.findOneAndUpdate(
            { roomId: req.params.roomId },
            { status: 'active', startTime: new Date() },
            { new: true }
        );
        res.json({ success: true, videoCall });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start video call' });
    }
});

// PUT /api/videocall/room/:roomId/end
router.put('/room/:roomId/end', protect, async (req, res) => {
    try {
        const videoCall = await VideoCall.findOne({ roomId: req.params.roomId });
        if (videoCall) {
            videoCall.status = 'completed';
            videoCall.endTime = new Date();
            videoCall.duration = Math.floor((videoCall.endTime - videoCall.startTime) / 1000 / 60);
            videoCall.notes = req.body.notes || '';
            await videoCall.save();
        }
        res.json({ success: true, videoCall });
    } catch (error) {
        res.status(500).json({ error: 'Failed to end video call' });
    }
});

// GET /api/videocall/my-calls
router.get('/my-calls', protect, async (req, res) => {
    try {
        const query = req.user.role === 'doctor'
            ? { doctor: req.user._id }
            : { patient: req.user._id };

        const calls = await VideoCall.find(query)
            .populate('doctor', 'firstName lastName')
            .populate('patient', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json({ success: true, calls });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video calls' });
    }
});

module.exports = router;