let selectedTimeSlot = '';

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    updateNavbar();

    // Set min date to today
    const dateInput = document.getElementById('bookDate');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
    }

    await loadAppointments();
    await loadDoctorsForBooking();

    // Check if doctor pre-selected from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('doctor')) {
        showBookingModal();
        document.getElementById('bookDoctor').value = params.get('doctor');
    }
});

async function loadAppointments() {
    const status = document.getElementById('statusFilter')?.value || '';
    const date = document.getElementById('dateFilter')?.value || '';

    let endpoint = '/appointments?limit=50';
    if (status) endpoint += `&status=${status}`;
    if (date) endpoint += `&date=${date}`;

    try {
        const result = await apiRequest(endpoint);
        const container = document.getElementById('appointmentsList');
        const user = getUser();

        if (result.success && result.appointments.length > 0) {
            container.innerHTML = result.appointments.map(apt => {
                const doctorName = apt.doctor?.user ? `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}` : 'N/A';
                const patientName = apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'N/A';
                const typeIcon = apt.type === 'video-call' ? '📹' : apt.type === 'phone' ? '📞' : '🏥';

                return `
                    <div class="data-card fade-in" style="margin-bottom: 16px;">
                        <div style="padding: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
                                <div>
                                    <h3>${user.role === 'patient' ? doctorName : patientName}</h3>
                                    <p style="color: var(--gray); margin: 4px 0;">
                                        📅 ${formatDate(apt.appointmentDate)} • ⏰ ${apt.timeSlot} • ${typeIcon} ${apt.type}
                                    </p>
                                    <p style="margin: 4px 0;"><strong>Reason:</strong> ${apt.reason}</p>
                                    ${apt.symptoms?.length ? `<p style="color: var(--gray); font-size: 13px;">Symptoms: ${apt.symptoms.join(', ')}</p>` : ''}
                                </div>
                                <div style="text-align: right;">
                                    ${getStatusBadge(apt.status)}
                                    <p style="font-size: 13px; color: var(--gray); margin-top: 8px;">💰 ₹${apt.fee || 0}</p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                                ${apt.type === 'video-call' && apt.videoCallRoomId && ['pending', 'confirmed'].includes(apt.status) ?
                                    `<a href="videocall.html?room=${apt.videoCallRoomId}" class="btn btn-sm btn-secondary">📹 Join Video Call</a>` : ''}
                                ${['pending', 'confirmed'].includes(apt.status) ?
                                    `<button class="btn btn-sm btn-danger" onclick="cancelAppointment('${apt._id}')">❌ Cancel</button>` : ''}
                                ${apt.status === 'pending' && (user.role === 'doctor' || user.role === 'admin') ?
                                    `<button class="btn btn-sm btn-success" onclick="updateAppointmentStatus('${apt._id}', 'confirmed')">✅ Confirm</button>` : ''}
                                ${apt.status === 'confirmed' && (user.role === 'doctor' || user.role === 'admin') ?
                                    `<button class="btn btn-sm btn-success" onclick="updateAppointmentStatus('${apt._id}', 'completed')">✅ Complete</button>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📅</div>
                    <h3>No appointments found</h3>
                    <p>Book a new appointment to get started</p>
                    <button class="btn btn-primary" style="margin-top: 16px;" onclick="showBookingModal()">Book Appointment</button>
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('appointmentsList').innerHTML = '<p style="padding: 20px; color: var(--danger);">Failed to load appointments</p>';
    }
}

async function loadDoctorsForBooking() {
    try {
        const result = await apiRequest('/doctors?limit=100');
        if (result.success) {
            const select = document.getElementById('bookDoctor');
            result.doctors.forEach(doc => {
                select.innerHTML += `<option value="${doc._id}">Dr. ${doc.user.firstName} ${doc.user.lastName} - ${doc.specialization} (₹${doc.consultationFee})</option>`;
            });
        }
    } catch (e) {
        console.log('Failed to load doctors for booking');
    }
}

function showBookingModal() {
    if (!requireAuth()) return;
    openModal('bookingModal');
}

function selectTimeSlot(element, time) {
    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedTimeSlot = time;
    document.getElementById('bookTimeSlot').value = time;
}

async function bookAppointment() {
    const doctorId = document.getElementById('bookDoctor').value;
    const date = document.getElementById('bookDate').value;
    const type = document.getElementById('bookType').value;
    const reason = document.getElementById('bookReason').value;
    const symptoms = document.getElementById('bookSymptoms').value;

    if (!doctorId || !date || !selectedTimeSlot || !reason) {
        showToast('Please fill all required fields and select a time slot', 'error');
        return;
    }

    try {
        const data = {
            doctorId,
            appointmentDate: date,
            timeSlot: selectedTimeSlot,
            type,
            reason,
            symptoms: symptoms ? symptoms.split(',').map(s => s.trim()) : []
        };

        const result = await apiRequest('/appointments', 'POST', data);

        if (result.success) {
            showToast('Appointment booked successfully! 🎉', 'success');
            closeModal('bookingModal');
            document.getElementById('bookingForm').reset();
            selectedTimeSlot = '';
            document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
            await loadAppointments();
        }
    } catch (error) {
        showToast(error.message || 'Failed to book appointment', 'error');
    }
}

async function cancelAppointment(id) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
        const result = await apiRequest(`/appointments/${id}/cancel`, 'PUT', { reason: 'Cancelled by user' });
        if (result.success) {
            showToast('Appointment cancelled', 'success');
            await loadAppointments();
        }
    } catch (error) {
        showToast('Failed to cancel appointment', 'error');
    }
}

async function updateAppointmentStatus(id, status) {
    try {
        const result = await apiRequest(`/appointments/${id}`, 'PUT', { status });
        if (result.success) {
            showToast(`Appointment ${status}!`, 'success');
            await loadAppointments();
        }
    } catch (error) {
        showToast('Failed to update appointment', 'error');
    }
}