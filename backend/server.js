const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Import Routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const patientRoutes = require('./routes/patients');
const prescriptionRoutes = require('./routes/prescriptions');
const videoCallRoutes = require('./routes/videocall');
const contactRoutes = require('./routes/contact');

const app = express();
const server = http.createServer(app);

// Socket.io setup for video calls
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
    }
});

// Connect to Database
connectDB();

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/videocall', videoCallRoutes);
app.use('/api/contact', contactRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Hospital Management API is running', timestamp: new Date() });
});

// Socket.io for Video Calls & Real-time
const activeRooms = new Map();
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // User comes online
    socket.on('user-online', (userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit('online-users', Array.from(onlineUsers.keys()));
    });

    // Join video call room
    socket.on('join-room', ({ roomId, userId, userName }) => {
        socket.join(roomId);

        if (!activeRooms.has(roomId)) {
            activeRooms.set(roomId, []);
        }
        activeRooms.get(roomId).push({ id: userId, name: userName, socketId: socket.id });

        // Notify others in the room
        socket.to(roomId).emit('user-joined', { userId, userName, socketId: socket.id });

        console.log(`📹 ${userName} joined room: ${roomId}`);
    });

    // WebRTC Signaling
    socket.on('offer', ({ offer, to, from }) => {
        io.to(to).emit('offer', { offer, from });
    });

    socket.on('answer', ({ answer, to, from }) => {
        io.to(to).emit('answer', { answer, from });
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
        io.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    // Chat message in video call
    socket.on('chat-message', ({ roomId, message, userName }) => {
        io.to(roomId).emit('chat-message', { message, userName, timestamp: new Date() });
    });

    // Leave room
    socket.on('leave-room', ({ roomId, userId }) => {
        socket.leave(roomId);
        if (activeRooms.has(roomId)) {
            const users = activeRooms.get(roomId).filter(u => u.id !== userId);
            if (users.length === 0) {
                activeRooms.delete(roomId);
            } else {
                activeRooms.set(roomId, users);
            }
        }
        socket.to(roomId).emit('user-left', { userId, socketId: socket.id });
    });

    // Notification
    socket.on('send-notification', ({ to, notification }) => {
        const targetSocket = onlineUsers.get(to);
        if (targetSocket) {
            io.to(targetSocket).emit('notification', notification);
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        // Remove from online users
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
        // Remove from active rooms
        for (const [roomId, users] of activeRooms.entries()) {
            const filtered = users.filter(u => u.socketId !== socket.id);
            if (filtered.length === 0) {
                activeRooms.delete(roomId);
            } else {
                activeRooms.set(roomId, filtered);
                socket.to(roomId).emit('user-left', { socketId: socket.id });
            }
        }
        io.emit('online-users', Array.from(onlineUsers.keys()));
        console.log(`❌ User disconnected: ${socket.id}`);
    });
});

// Catch-all: serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🏥 Hospital Management Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
});