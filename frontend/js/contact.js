document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();

    document.getElementById('contactForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            phone: document.getElementById('contactPhone').value,
            subject: document.getElementById('contactSubject').value,
            message: document.getElementById('contactMessage').value
        };

        try {
            const result = await apiRequest('/contact', 'POST', data);
            if (result.success) {
                showToast('Message sent successfully! We will get back to you soon.', 'success');
                document.getElementById('contactForm').reset();
            }
        } catch (error) {
            showToast(error.message || 'Failed to send message', 'error');
        }
    });
});