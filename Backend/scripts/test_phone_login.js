const axios = require('axios');

const testPhoneLogin = async () => {
    try {
        console.log('Testing Login API with Phone Number: 9876543210 ...');
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: '9876543210',
            password: 'Admin123456'
        });

        console.log('🎉 PHONE LOGIN TEST SUCCESSFUL!');
        console.log('Response:', {
            success: res.data.success,
            token: res.data.token ? 'JWT_TOKEN_PRESENT' : 'MISSING',
            user: res.data.user
        });
        process.exit(0);
    } catch (err) {
        console.error('❌ Phone login failed:', err.response?.data || err.message);
        process.exit(1);
    }
};

testPhoneLogin();
