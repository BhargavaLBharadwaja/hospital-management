document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    updateNavbar();
    await loadPrescriptions();
});

async function loadPrescriptions() {
    try {
        const result = await apiRequest('/prescriptions');
        const container = document.getElementById('prescriptionsList');

        if (result.success && result.prescriptions.length > 0) {
            container.innerHTML = result.prescriptions.map(rx => {
                const doctorName = rx.doctor?.user ? `Dr. ${rx.doctor.user.firstName} ${rx.doctor.user.lastName}` : 'Doctor';
                const patientName = rx.patient ? `${rx.patient.firstName} ${rx.patient.lastName}` : 'Patient';

                return `
                    <div class="prescription-card fade-in">
                        <div class="prescription-header">
                            <div>
                                <h3>🏥 MediCare Hospital</h3>
                                <p style="color: var(--gray);">Prescription #${rx._id.slice(-8).toUpperCase()}</p>
                            </div>
                            <div style="text-align: right;">
                                <p><strong>${doctorName}</strong></p>
                                <p style="color: var(--gray); font-size: 13px;">📅 ${formatDate(rx.createdAt)}</p>
                            </div>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p><strong>Patient:</strong> ${patientName}</p>
                            <p><strong>Diagnosis:</strong> ${rx.diagnosis}</p>
                        </div>

                        <h4 style="margin-bottom: 12px;">💊 Medications</h4>
                        <ul class="medication-list">
                            ${rx.medications.map((med, i) => `
                                <li class="medication-item">
                                    <div class="med-number">${i + 1}</div>
                                    <div style="flex: 1;">
                                        <strong>${med.name}</strong>
                                        <p style="color: var(--gray); font-size: 13px;">
                                            ${med.dosage} • ${med.frequency} • ${med.duration}
                                            ${med.instructions ? ` • ${med.instructions}` : ''}
                                            ${med.beforeAfterMeal ? ` • ${med.beforeAfterMeal} meal` : ''}
                                        </p>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>

                        ${rx.tests?.length ? `
                            <h4 style="margin: 16px 0 8px;">🔬 Tests Recommended</h4>
                            <ul style="list-style: none;">
                                ${rx.tests.map(test => `
                                    <li style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                                        ${test.urgent ? '🔴' : '🔵'} ${test.name} ${test.instructions ? `- ${test.instructions}` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        ` : ''}

                        ${rx.advice ? `<p style="margin-top: 16px; padding: 12px; background: var(--gray-light); border-radius: 8px;"><strong>💡 Advice:</strong> ${rx.advice}</p>` : ''}
                        ${rx.followUpDate ? `<p style="margin-top: 12px; color: var(--primary);"><strong>📅 Follow Up:</strong> ${formatDate(rx.followUpDate)}</p>` : ''}
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">💊</div>
                    <h3>No prescriptions yet</h3>
                    <p>Your prescriptions will appear here after your doctor visit</p>
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('prescriptionsList').innerHTML = '<p style="color: var(--danger); padding: 20px;">Failed to load prescriptions</p>';
    }
}