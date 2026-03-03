let allDoctors = [];

document.addEventListener('DOMContentLoaded', async () => {
    updateNavbar();
    await loadDoctors();
    await loadFilters();

    // Search events
    document.getElementById('doctorSearch').addEventListener('input', filterDoctors);
    document.getElementById('specializationFilter').addEventListener('change', filterDoctors);
    document.getElementById('departmentFilter').addEventListener('change', filterDoctors);
});

async function loadDoctors() {
    try {
        const result = await apiRequest('/doctors?limit=50');
        if (result.success) {
            allDoctors = result.doctors;
            renderDoctors(allDoctors);
        }
    } catch (error) {
        document.getElementById('doctorsGrid').innerHTML = '<div class="empty-state"><h3>Failed to load doctors</h3></div>';
    }
}

async function loadFilters() {
    try {
        const result = await apiRequest('/doctors/specializations');
        if (result.success) {
            const specFilter = document.getElementById('specializationFilter');
            result.specializations.forEach(spec => {
                specFilter.innerHTML += `<option value="${spec}">${spec}</option>`;
            });

            const deptFilter = document.getElementById('departmentFilter');
            result.departments.forEach(dept => {
                deptFilter.innerHTML += `<option value="${dept}">${dept}</option>`;
            });
        }
    } catch (e) {
        console.log('Filter load error');
    }
}

function filterDoctors() {
    const search = document.getElementById('doctorSearch').value.toLowerCase();
    const spec = document.getElementById('specializationFilter').value.toLowerCase();
    const dept = document.getElementById('departmentFilter').value.toLowerCase();

    let filtered = allDoctors.filter(doc => {
        const name = `${doc.user.firstName} ${doc.user.lastName}`.toLowerCase();
        const matchSearch = !search || name.includes(search) || doc.specialization.toLowerCase().includes(search);
        const matchSpec = !spec || doc.specialization.toLowerCase() === spec;
        const matchDept = !dept || doc.department.toLowerCase() === dept;
        return matchSearch && matchSpec && matchDept;
    });

    renderDoctors(filtered);
}

function renderDoctors(doctors) {
    const grid = document.getElementById('doctorsGrid');

    if (doctors.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="icon">🩺</div><h3>No doctors found</h3><p>Try adjusting your search filters</p></div>';
        return;
    }

    grid.innerHTML = doctors.map(doc => {
        const name = `Dr. ${doc.user.firstName} ${doc.user.lastName}`;
        const initial = doc.user.firstName.charAt(0);
        const stars = '⭐'.repeat(Math.round(doc.rating));

        return `
            <div class="doctor-card fade-in">
                <div class="doctor-avatar">${initial}</div>
                <div class="doctor-info">
                    <h3>${name}</h3>
                    <p class="specialization">${doc.specialization}</p>
                    <p class="details">
                        🎓 ${doc.qualification} • 📋 ${doc.experience} yrs exp<br>
                        🏥 ${doc.department} • 💰 ₹${doc.consultationFee}
                    </p>
                    <div class="doctor-rating">${stars || 'No ratings yet'} (${doc.totalRatings})</div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-sm btn-outline" onclick="viewDoctor('${doc._id}')">View Profile</button>
                        <button class="btn btn-sm btn-primary" onclick="bookDoctor('${doc._id}')">Book Now</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function viewDoctor(id) {
    const doc = allDoctors.find(d => d._id === id);
    if (!doc) return;

    const name = `Dr. ${doc.user.firstName} ${doc.user.lastName}`;
    document.getElementById('modalDoctorName').textContent = name;

    document.getElementById('modalDoctorBody').innerHTML = `
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: 40px; color: white; flex-shrink: 0;">
                ${doc.user.firstName.charAt(0)}
            </div>
            <div>
                <h2>${name}</h2>
                <p style="color: var(--primary); font-weight: 600;">${doc.specialization}</p>
                <p style="color: var(--gray);">${doc.department}</p>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
            <div style="padding: 12px; background: var(--gray-light); border-radius: 8px;">
                <strong>🎓 Qualification</strong><br>${doc.qualification}
            </div>
            <div style="padding: 12px; background: var(--gray-light); border-radius: 8px;">
                <strong>📋 Experience</strong><br>${doc.experience} Years
            </div>
            <div style="padding: 12px; background: var(--gray-light); border-radius: 8px;">
                <strong>💰 Fee</strong><br>₹${doc.consultationFee}
            </div>
            <div style="padding: 12px; background: var(--gray-light); border-radius: 8px;">
                <strong>📹 Video Call</strong><br>${doc.isAvailableForVideoCall ? '✅ Available' : '❌ Not Available'}
            </div>
        </div>
        ${doc.bio ? `<p style="margin-bottom: 16px;"><strong>About:</strong> ${doc.bio}</p>` : ''}
        ${doc.languages?.length ? `<p><strong>Languages:</strong> ${doc.languages.join(', ')}</p>` : ''}
    `;

    document.getElementById('bookFromModal').onclick = () => {
        closeModal('doctorModal');
        bookDoctor(id);
    };

    openModal('doctorModal');
}

function bookDoctor(doctorId) {
    if (!isLoggedIn()) {
        showToast('Please login to book an appointment', 'warning');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    window.location.href = `appointments.html?doctor=${doctorId}`;
}