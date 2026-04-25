import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
            // Only load user if we haven't just set it in login/register
            if (!user) {
                loadUser();
            }
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
            setLoading(false);
        }
    }, [token]);

    const loadUser = async () => {
        try {
            const res = await axios.get('/api/auth/me');
            setUser(res.data.data);
        } catch (err) {
            console.error(err);
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (identifier, password) => {
        const res = await axios.post('/api/auth/login', { email: identifier, password });
        const { token: newToken, user: newUser } = res.data;
        
        // Update headers immediately
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setUser(newUser);
        return res.data;
    };

    const googleLogin = async (credential) => {
        console.log('Sending ID Token to Backend:', credential ? (credential.substring(0, 20) + '...') : 'NULL');
        const res = await axios.post('/api/auth/google', { idToken: credential });
        
        if (res.data.success) {
            const { token: newToken, user: newUser } = res.data;
            // Set token and headers immediately to authorize subsequent calls
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            setToken(newToken);
            setUser(newUser);
        }
        
        return res.data;
    };

    const completeProfile = async (profileData) => {
        const res = await axios.put('/api/auth/complete-profile', profileData);
        setUser(res.data.data);
        return res.data;
    };

    const register = async (userData) => {
        const res = await axios.post('/api/auth/register', userData);
        return res.data;
    };

    const verifyOTP = async (email, otp) => {
        const res = await axios.post('/api/auth/verify-otp', { email, otp });
        const { token: newToken, user: newUser } = res.data;
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setUser(newUser);
        return res.data;
    };

    const resendOTP = async (email) => {
        const res = await axios.post('/api/auth/resend-otp', { email });
        return res.data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            googleLogin,
            completeProfile,
            register,
            verifyOTP,
            resendOTP,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};
