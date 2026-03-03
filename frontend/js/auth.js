// ===== REGISTRATION =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showToast('Passwords do not match!', 'error');
            return;
        }

        const btn = document.getElementById('registerBtn');
        btn.disabled = true;
        btn.textContent = 'Creating Account...';

        try {
            const data = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: password,
                gender: document.getElementById('gender').value,
                bloodGroup: document.getElementById('bloodGroup').value,
                dateOfBirth: document.getElementById('dateOfBirth').value
            };

            const result = await apiRequest('/auth/register', 'POST', data);

            if (result.success) {
                setAuth(result.token, result.user);
                showToast('Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        } catch (error) {
            showToast(error.message || 'Registration failed', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Create Account';
        }
    });
}

// ===== LOGIN =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('loginBtn');
        btn.disabled = true;
        btn.textContent = 'Logging in...';

        try {
            const data = {
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value
            };

            const result = await apiRequest('/auth/login', 'POST', data);

            if (result.success) {
                setAuth(result.token, result.user);
                showToast('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        } catch (error) {
            showToast(error.message || 'Login failed', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Login';
        }
    });
}

// Redirect if already logged in
if (isLoggedIn() && (window.location.pathname.includes('login') || window.location.pathname.includes('register'))) {
    window.location.href = 'dashboard.html';
}