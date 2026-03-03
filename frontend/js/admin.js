document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    const user = getUser();
    if (user.role !== 'admin') {
        showToast('Access denied. Admin only.', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
        return;
    }

    await loadAdminStats();
    await loadUsers();
    await loadMessages();

    document.getElementById('addDoctorForm').addEventListener('submit', addDoctor);
});

async function loadAdminStats() {
    try {
        const usersResult = await apiRequest('/auth/users?limit=1');
        document.getElementById('totalUsers').textContent = usersResult.total || 0;

        const doctorsResult = await apiRequest('/doctors?limit=1');
        document.getElementById('totalDoctors').textContent = doctorsResult.total || 0;

        const apptsResult = await apiRequest('/appointments?limit=1');
        document.getElementById('totalApptsAdmin').textContent = apptsResult.total || 0;

        const msgsResult = await apiRequest('/contact');
        document.getElementById('totalMessages').textContent = msgsResult.messages?.length || 0;
    } catch (e) {
        console.log('Admin stats error:', e);
    }
}

async function loadUsers() {
    const role = document.getElementById('userRoleFilter')?.value || '';
    let endpoint = '/auth/users?limit=50';
    if (role) endpoint += `&role=${role}`;

    try {
        const result = await apiRequest(endpoint);
        const container = document.getElementById('usersList');

        if (result.success && result.users.length > 0) {
            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.users.map(u => `
                            <tr>
                                <td><strong>${u.firstName} ${u.lastName}</strong></td>
                                <td>${u.email}</td>
                                <td>${u.phone}</td>
                                <td>${getStatusBadge(u.role)}</td>
                                <td>${formatDate(u.createdAt)}</td>
                                <td>${u.isActive ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-cancelled">Inactive</span>'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = '<div class="empty-state"><h3>No users found</h3></div>';
        }
    } catch (e) {
        document.getElementById('usersList').innerHTML = '<p style="padding: 20px; color: var(--danger);">Failed to load users</p>';
    }
}

async function loadMessages() {
    try {
        const result = await apiRequest('/contact');
        const container = document.getElementById('messagesList');

        if (result.success && result.messages.length > 0) {
            container.innerHTML = result.messages.map(msg => `
                <div style="padding: 16px 20px; border-bottom: 1px solid #f1f5f9;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <strong>${msg.name}</strong> <span style="color: var(--gray); font-size: 13px;">(${msg.email})</span>
                            <p style="font-weight: 600; margin: 4px 0;">${msg.subject}</p>
                            <p style="color: var(--gray);">${msg.message}</p>
                        </div>
                        <div style="text-align: right;">
                            ${getStatusBadge(msg.status)}
                            <p style="font-size: 12px; color: var(--gray); margin-top: 4px;">${formatDate(msg.createdAt)}</p>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state"><h3>No messages</h3></div>';
        }
    } catch (e) {
        console.log('Messages error');
    }
}

async function addDoctor(e) {
    e.preventDefault();

    try {
        // First, register the doctor as a user
        const userData = {
            firstName: document.getElementById('docFirstName').value,
            lastName: document.getElementById('docLastName').value,
            email: document.getElementById('docEmail').value,
            phone: document.getElementById('docPhone').value,
            password: '123456', // Default password
            role: 'doctor'
        };

        const userResult = await apiRequest('/auth/register', 'POST', userData);

        if (userResult.success) {
            // Create doctor profile
            const doctorData = {
                userId: userResult.user.id,
                specialization: document.getElementById('docSpecialization').value,
                department: document.getElementById('docDepartment').value,
                qualification: document.getElementById('docQualification').value,
                licenseNumber: document.getElementById('docLicense').value,
                experience: parseInt(document.getElementById('docExperience').value),
                consultationFee: parseInt(document.getElementById('docFee').value),
                bio: document.getElementById('docBio').value,
                languages: ['English', 'Hindi']
            };

            const docResult = await apiRequest('/doctors', 'POST', doctorData);

            if (docResult.success) {
                showToast('Doctor added successfully! Default password: 123456', 'success');
                document.getElementById('addDoctorForm').reset();
                await loadUsers();
                await loadAdminStats();
            }
        }
    } catch (error) {
        showToast(error.message || 'Failed to add doctor', 'error');
    }
}