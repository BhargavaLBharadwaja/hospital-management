document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    updateNavbar();
    await loadProfile();

    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    document.getElementById('passwordForm').addEventListener('submit', changePassword);
});

async function loadProfile() {
    try {
        const result = await apiRequest('/auth/me');
        if (result.success) {
            const u = result.user;
            document.getElementById('profileAvatar').textContent = (u.firstName || 'U').charAt(0).toUpperCase();
            document.getElementById('profileName').textContent = `${u.firstName} ${u.lastName}`;
            document.getElementById('profileEmail').textContent = u.email;
            document.getElementById('profileRole').textContent = u.role.charAt(0).toUpperCase() + u.role.slice(1);

            document.getElementById('profFirstName').value = u.firstName || '';
            document.getElementById('profLastName').value = u.lastName || '';
            document.getElementById('profPhone').value = u.phone || '';
            document.getElementById('profGender').value = u.gender || '';
            document.getElementById('profDOB').value = u.dateOfBirth ? u.dateOfBirth.split('T')[0] : '';
            document.getElementById('profBlood').value = u.bloodGroup || '';
        }
    } catch (error) {
        showToast('Failed to load profile', 'error');
    }
}

function enableEditing() {
    document.querySelectorAll('#profileForm input, #profileForm select').forEach(el => el.disabled = false);
    document.getElementById('saveProfileBtn').style.display = 'flex';
    document.getElementById('saveProfileBtn').style.gap = '12px';
}

function cancelEditing() {
    document.querySelectorAll('#profileForm input, #profileForm select').forEach(el => el.disabled = true);
    document.getElementById('saveProfileBtn').style.display = 'none';
    loadProfile();
}

async function saveProfile(e) {
    e.preventDefault();
    try {
        const data = {
            firstName: document.getElementById('profFirstName').value,
            lastName: document.getElementById('profLastName').value,
            phone: document.getElementById('profPhone').value,
            gender: document.getElementById('profGender').value,
            dateOfBirth: document.getElementById('profDOB').value,
            bloodGroup: document.getElementById('profBlood').value
        };

        const result = await apiRequest('/auth/update-profile', 'PUT', data);
        if (result.success) {
            showToast('Profile updated successfully!', 'success');
            const user = getUser();
            user.firstName = data.firstName;
            user.lastName = data.lastName;
            localStorage.setItem('medicare_user', JSON.stringify(user));
            cancelEditing();
            await loadProfile();
        }
    } catch (error) {
        showToast(error.message || 'Failed to update profile', 'error');
    }
}

async function changePassword(e) {
    e.preventDefault();
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmNewPassword').value;

    if (newPass !== confirmPass) {
        showToast('New passwords do not match!', 'error');
        return;
    }

    try {
        const result = await apiRequest('/auth/change-password', 'PUT', {
            currentPassword: document.getElementById('currentPassword').value,
            newPassword: newPass
        });
        if (result.success) {
            showToast('Password changed successfully!', 'success');
            document.getElementById('passwordForm').reset();
        }
    } catch (error) {
        showToast(error.message || 'Failed to change password', 'error');
    }
}