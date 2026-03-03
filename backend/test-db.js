require('dotenv').config();
console.log('\n=== Testing MongoDB Connection ===\n');
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
console.log('URI found:', uri ? 'Yes' : 'No');
console.log('Connecting...\n');
mongoose.connect(uri)
    .then(() => {
        console.log('SUCCESS! Database connected!');
        console.log('Host:', mongoose.connection.host);
        console.log('Database:', mongoose.connection.name);
        console.log('\nNext step: Run "node seed.js"');
        process.exit(0);
    })
    .catch((err) => {
        console.log('FAILED!');
        console.log('Error:', err.message);
        process.exit(1);
    });