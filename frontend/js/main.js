// ===== CONFIGURATION =====
const API_URL = window.location.origin + '/api';
const SOCKET_URL = window.location.origin;

// ===== AUTH HELPERS =====
function getToken() {
    return localStorage.getItem('medicare_token');
}

function getUser() {
    const user = localStorage.getItem('medicare_user');
    return user ? JSON.parse(user) : null;
}

function setAuth(token, user) {
    localStorage.setItem('medicare_token', token);
    localStorage.setItem('medicare_user', JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem('medicare_token');
    localStorage.removeItem('medicare_user');
}

function isLoggedIn() {
    return !!getToken();
}

function logout() {
    clearAuth();
    window.location.href = 'login.html';
}

// ===== API HELPER =====
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const token = getToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                clearAuth();
                window.location.href = 'login.html';
                return;
            }
            throw new Error(result.error || 'Something went wrong');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `
        <span style="font-size: 20px;">${icons[type] || '✅'}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===== MODAL HELPERS =====
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ===== MOBILE MENU =====
function toggleMobileMenu() {
    const nav = document.getElementById('navMenu');
    if (nav) nav.classList.toggle('show');
}

// ===== NAV AUTH STATE =====
function updateNavbar() {
    const user = getUser();
    const navActions = document.getElementById('navActions');
    
    if (!navActions) return;

    if (user) {
        const initial = (user.firstName || 'U').charAt(0).toUpperCase();
        navActions.innerHTML = `
            <div class="user-menu" onclick="window.location.href='dashboard.html'">
                <div class="user-avatar">${initial}</div>
                <span>${user.firstName || 'User'}</span>
            </div>
            <button class="btn btn-sm btn-danger" onclick="logout()">Logout</button>
        `;
    } else {
        navActions.innerHTML = `
            <a href="login.html" class="btn btn-outline btn-sm">Login</a>
            <a href="register.html" class="btn btn-primary btn-sm">Register</a>
        `;
    }
}

// ===== PROTECT PAGES =====
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ===== FORMATTING HELPERS =====
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function getStatusBadge(status) {
    const classes = {
        pending: 'badge-pending',
        confirmed: 'badge-confirmed',
        completed: 'badge-completed',
        cancelled: 'badge-cancelled',
        active: 'badge-active'
    };
    return `<span class="badge ${classes[status] || 'badge-pending'}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    
    // Show admin link if admin
    const user = getUser();
    if (user && user.role === 'admin') {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) adminLink.style.display = 'block';
    }
});