let localStream = null;
let remoteStream = null;
let peerConnection = null;
let socket = null;
let currentRoomId = null;
let isMicOn = true;
let isCameraOn = true;
let callTimer = null;
let callSeconds = 0;

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    updateNavbar();

    // Check URL params for room
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    if (roomId) {
        document.getElementById('roomIdInput').value = roomId;
    }

    // Load upcoming video appointments
    await loadUpcomingVideoCalls();

    // Initialize socket
    try {
        socket = io(SOCKET_URL);
        const user = getUser();
        socket.emit('user-online', user.id);

        socket.on('user-joined', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('user-left', handleUserLeft);
        socket.on('chat-message', handleChatMessage);
    } catch (e) {
        console.log('Socket init error:', e);
    }
});

async function loadUpcomingVideoCalls() {
    try {
        const result = await apiRequest('/appointments?limit=5');
        const container = document.getElementById('upcomingVideoCalls');

        if (result.success) {
            const videoCalls = result.appointments.filter(a =>
                a.type === 'video-call' && ['pending', 'confirmed'].includes(a.status) && a.videoCallRoomId
            );

            if (videoCalls.length > 0) {
                container.innerHTML = `
                    <h3 style="margin-bottom: 16px;">📹 Upcoming Video Consultations</h3>
                    ${videoCalls.map(apt => `
                        <div class="data-card" style="margin-bottom: 12px; text-align: left;">
                            <div style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${apt.doctor?.user ? `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}` : 'Doctor'}</strong>
                                    <p style="color: var(--gray); font-size: 13px;">${formatDate(apt.appointmentDate)} • ${apt.timeSlot}</p>
                                </div>
                                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('roomIdInput').value='${apt.videoCallRoomId}'; joinVideoCall();">
                                    📹 Join
                                </button>
                            </div>
                        </div>
                    `).join('')}
                `;
            }
        }
    } catch (e) {
        console.log('Failed to load video calls');
    }
}

async function joinVideoCall() {
    const roomId = document.getElementById('roomIdInput').value.trim();
    if (!roomId) {
        showToast('Please enter a Room ID', 'error');
        return;
    }

    currentRoomId = roomId;

    try {
        // Get local media stream
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        // Show video call screen
        document.getElementById('preCallScreen').style.display = 'none';
        document.getElementById('videoCallScreen').style.display = 'block';
        document.getElementById('displayRoomId').textContent = roomId;

        // Set local video
        document.getElementById('localVideo').srcObject = localStream;

        // Join room via socket
        const user = getUser();
        socket.emit('join-room', {
            roomId,
            userId: user.id,
            userName: user.firstName
        });

        // Update status
        document.getElementById('callStatus').textContent = '● Connected';
        startCallTimer();

        showToast('Joined video call room', 'success');
    } catch (error) {
        console.error('Media error:', error);
        showToast('Failed to access camera/microphone. Please allow permissions.', 'error');
    }
}

async function createNewRoom() {
    if (!requireAuth()) return;

    try {
        const roomId = 'room-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        document.getElementById('roomIdInput').value = roomId;
        showToast('Room created! Share this ID with your doctor/patient: ' + roomId, 'success');
    } catch (error) {
        showToast('Failed to create room', 'error');
    }
}

async function handleUserJoined({ userId, userName, socketId }) {
    showToast(`${userName} joined the call`, 'success');

    // Create peer connection
    peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
        document.getElementById('remoteVideo').srcObject = event.streams[0];
        document.getElementById('noRemoteUser').style.display = 'none';
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                candidate: event.candidate,
                to: socketId
            });
        }
    };

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit('offer', {
        offer: peerConnection.localDescription,
        to: socketId,
        from: socket.id
    });
}

async function handleOffer({ offer, from }) {
    peerConnection = new RTCPeerConnection(ICE_SERVERS);

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        document.getElementById('remoteVideo').srcObject = event.streams[0];
        document.getElementById('noRemoteUser').style.display = 'none';
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                candidate: event.candidate,
                to: from
            });
        }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('answer', {
        answer: peerConnection.localDescription,
        to: from,
        from: socket.id
    });
}

async function handleAnswer({ answer }) {
    if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
}

async function handleIceCandidate({ candidate }) {
    if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
}

function handleUserLeft({ socketId }) {
    showToast('Other participant left the call', 'warning');
    document.getElementById('noRemoteUser').style.display = 'flex';
    document.getElementById('remoteVideo').srcObject = null;
}

function toggleMic() {
    if (localStream) {
        isMicOn = !isMicOn;
        localStream.getAudioTracks().forEach(track => track.enabled = isMicOn);
        const btn = document.getElementById('micBtn');
        btn.textContent = isMicOn ? '🎤' : '🔇';
        btn.classList.toggle('active', !isMicOn);
    }
}

function toggleCamera() {
    if (localStream) {
        isCameraOn = !isCameraOn;
        localStream.getVideoTracks().forEach(track => track.enabled = isCameraOn);
        const btn = document.getElementById('cameraBtn');
        btn.textContent = isCameraOn ? '📷' : '📷';
        btn.classList.toggle('active', !isCameraOn);
    }
}

async function shareScreen() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (peerConnection) {
            const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
            if (sender) sender.replaceTrack(screenTrack);
        }

        document.getElementById('localVideo').srcObject = screenStream;

        screenTrack.onended = () => {
            const videoTrack = localStream.getVideoTracks()[0];
            if (peerConnection) {
                const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
                if (sender) sender.replaceTrack(videoTrack);
            }
            document.getElementById('localVideo').srcObject = localStream;
        };
    } catch (error) {
        showToast('Screen sharing cancelled or not supported', 'warning');
    }
}

function toggleChat() {
    const panel = document.getElementById('chatPanel');
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message || !currentRoomId) return;

    const user = getUser();
    socket.emit('chat-message', {
        roomId: currentRoomId,
        message,
        userName: user.firstName
    });

    addChatMessage(message, user.firstName, true);
    input.value = '';
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') sendChatMessage();
}

function handleChatMessage({ message, userName }) {
    addChatMessage(message, userName, false);
}

function addChatMessage(message, userName, isOwn) {
    const container = document.getElementById('chatMessages');
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    container.innerHTML += `
        <div class="chat-message ${isOwn ? 'own' : ''}">
            <div class="sender">${isOwn ? 'You' : userName}</div>
            <div class="text">${message}</div>
        </div>
    `;
    container.scrollTop = container.scrollHeight;
}

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (socket && currentRoomId) {
        const user = getUser();
        socket.emit('leave-room', { roomId: currentRoomId, userId: user.id });
    }
    stopCallTimer();

    document.getElementById('preCallScreen').style.display = 'block';
    document.getElementById('videoCallScreen').style.display = 'none';
    document.getElementById('callStatus').textContent = '● Ready';

    showToast('Call ended', 'info');
}

function startCallTimer() {
    callSeconds = 0;
    callTimer = setInterval(() => {
        callSeconds++;
        const mins = Math.floor(callSeconds / 60).toString().padStart(2, '0');
        const secs = (callSeconds % 60).toString().padStart(2, '0');
        document.getElementById('callTimer').textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopCallTimer() {
    if (callTimer) clearInterval(callTimer);
    callSeconds = 0;
    document.getElementById('callTimer').textContent = '00:00';
}