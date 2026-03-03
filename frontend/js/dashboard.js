document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    const user = getUser();
    
    // Update UI
    document.getElementById('dashboardName').textContent = user.firstName || 'User';
    document.getElementById('userName').textContent = user.firstName || 'User';
    document.getElementById('userAvatar').textContent = (user.firstName || 'U').charAt(0).toUpperCase();

    // Load stats
    try {
        const statsResult = await apiRequest('/appointments/stats/overview');
        if (statsResult.success) {
            const s = statsResult.stats;
            document.getElementById('totalAppointments').textContent = s.total;
            document.getElementById('pendingAppointments').textContent = s.pending;
            document.getElementById('completedAppointments').textContent = s.completed;
            document.getElementById('todayAppointments').textContent = s.todayAppointments;
        }
    } catch (e) {
        console.log('Stats error:', e);
    }

    // Load recent appointments
    try {
        const result = await apiRequest('/appointments?limit=5');
        const container = document.getElementById('recentAppointments');

        if (result.success && result.appointments.length > 0) {
            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Doctor/Patient</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.appointments.map(apt => {
                            const doctorName = apt.doctor?.user ? `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}` : 'N/A';
                            const patientName = apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'N/A';
                            const displayName = user.role === 'patient' ? doctorName : patientName;
                            return `
                                <tr>
                                    <td><strong>${displayName}</strong></td>
                                    <td>${formatDate(apt.appointmentDate)}</td>
                                    <td>${apt.timeSlot}</td>
                                    <td>${apt.type === 'video-call' ? '📹 Video' : apt.type === 'phone' ? '📞 Phone' : '🏥 In-Person'}</td>
                                    <td>${getStatusBadge(apt.status)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📅</div>
                    <h3>No appointments yet</h3>
                    <p>Book your first appointment to get started</p>
                    <a href="appointments.html" class="btn btn-primary" style="margin-top: 16px;">Book Appointment</a>
                </div>
            `;
        }
    } catch (e) {
        document.getElementById('recentAppointments').innerHTML = '<p style="padding: 20px; color: var(--gray);">Failed to load appointments</p>';
    }
});