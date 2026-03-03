require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Doctor.deleteMany({});
        await Patient.deleteMany({});

        // Create Admin
        const adminPassword = await bcrypt.hash('123456', 12);
        const admin = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@demo.com',
            password: adminPassword,
            phone: '+91 9999999999',
            role: 'admin',
            gender: 'male',
            isActive: true
        });
        console.log('✅ Admin created');

        // Create Patient
        const patientPassword = await bcrypt.hash('123456', 12);
        const patientUser = await User.create({
            firstName: 'Rahul',
            lastName: 'Sharma',
            email: 'patient@demo.com',
            password: patientPassword,
            phone: '+91 9876543210',
            role: 'patient',
            gender: 'male',
            bloodGroup: 'B+',
            dateOfBirth: new Date('1995-05-15'),
            isActive: true
        });
        await Patient.create({ user: patientUser._id });
        console.log('✅ Patient created');

        // Create Doctors
        const doctorsData = [
            { firstName: 'Arun', lastName: 'Patel', email: 'doctor@demo.com', specialization: 'Cardiology', department: 'Heart', qualification: 'MBBS, MD Cardiology', experience: 15, fee: 500, license: 'LIC-001' },
            { firstName: 'Priya', lastName: 'Singh', email: 'priya@medicare.com', specialization: 'Dermatology', department: 'Skin', qualification: 'MBBS, MD Dermatology', experience: 10, fee: 400, license: 'LIC-002' },
            { firstName: 'Vikram', lastName: 'Mehta', email: 'vikram@medicare.com', specialization: 'Neurology', department: 'Brain', qualification: 'MBBS, DM Neurology', experience: 20, fee: 800, license: 'LIC-003' },
            { firstName: 'Sneha', lastName: 'Reddy', email: 'sneha@medicare.com', specialization: 'Pediatrics', department: 'Children', qualification: 'MBBS, MD Pediatrics', experience: 8, fee: 350, license: 'LIC-004' },
            { firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh@medicare.com', specialization: 'Orthopedics', department: 'Bones', qualification: 'MBBS, MS Ortho', experience: 12, fee: 600, license: 'LIC-005' },
            { firstName: 'Anita', lastName: 'Desai', email: 'anita@medicare.com', specialization: 'Gynecology', department: 'Women Health', qualification: 'MBBS, MS OBG', experience: 18, fee: 500, license: 'LIC-006' },
        ];

        for (const doc of doctorsData) {
            const docPassword = await bcrypt.hash('123456', 12);
            const docUser = await User.create({
                firstName: doc.firstName,
                lastName: doc.lastName,
                email: doc.email,
                password: docPassword,
                phone: `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`,
                role: 'doctor',
                gender: ['Priya', 'Sneha', 'Anita'].includes(doc.firstName) ? 'female' : 'male',
                isActive: true
            });

            await Doctor.create({
                user: docUser._id,
                specialization: doc.specialization,
                department: doc.department,
                qualification: doc.qualification,
                experience: doc.experience,
                consultationFee: doc.fee,
                licenseNumber: doc.license,
                bio: `Experienced ${doc.specialization} specialist with ${doc.experience} years of practice.`,
                rating: (3.5 + Math.random() * 1.5).toFixed(1),
                totalRatings: Math.floor(10 + Math.random() * 90),
                totalPatients: Math.floor(100 + Math.random() * 500),
                languages: ['English', 'Hindi'],
                isAvailableForVideoCall: true,
                availableSlots: [
                    { day: 'Monday', startTime: '09:00', endTime: '17:00', maxPatients: 15 },
                    { day: 'Wednesday', startTime: '09:00', endTime: '17:00', maxPatients: 15 },
                    { day: 'Friday', startTime: '09:00', endTime: '14:00', maxPatients: 10 }
                ]
            });
        }
        console.log('✅ Doctors created');

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Demo Credentials:');
        console.log('  Admin:   admin@demo.com / 123456');
        console.log('  Patient: patient@demo.com / 123456');
        console.log('  Doctor:  doctor@demo.com / 123456');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seedDB();