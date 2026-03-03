const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { protect, authorize } = require('../middleware/auth');

// POST /api/contact
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        const contactMessage = await ContactMessage.create({ name, email, phone, subject, message });
        res.status(201).json({ success: true, message: 'Message sent successfully!', data: contactMessage });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// GET /api/contact (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// PUT /api/contact/:id/reply (Admin)
router.put('/:id/reply', protect, authorize('admin'), async (req, res) => {
    try {
        const message = await ContactMessage.findByIdAndUpdate(req.params.id, {
            reply: req.body.reply,
            status: 'replied',
            repliedAt: new Date(),
            repliedBy: req.user._id
        }, { new: true });
        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reply' });
    }
});

module.exports = router;