const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"MediCare Hospital" <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
};

const appointmentConfirmationEmail = (patientName, doctorName, date, time, type) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🏥 MediCare Hospital</h1>
            <p style="color: #e0e0e0;">Appointment Confirmation</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Hello ${patientName},</h2>
            <p>Your appointment has been confirmed!</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
                <p><strong>Type:</strong> ${type}</p>
            </div>
            <p style="margin-top: 20px; color: #666;">Please arrive 15 minutes before your scheduled time.</p>
            <p style="color: #666;">Thank you for choosing MediCare Hospital!</p>
        </div>
    </div>`;
};

module.exports = { sendEmail, appointmentConfirmationEmail };