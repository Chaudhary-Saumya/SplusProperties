import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../utils/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Set baseURL
    axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const clearAuth = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    };

    // IMMEDIATELY set header if token exists to avoid race conditions on reload
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Response Interceptor to handle auth/session invalidation
    useEffect(() => {
        const interceptorId = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                const status = error?.response?.status;
                const backendError = error?.response?.data?.error || '';
                const isAccountBlockedError =
                    status === 403 &&
                    typeof backendError === 'string' &&
                    backendError.toLowerCase().includes('account is');

                if (status === 401 || isAccountBlockedError) {
                    clearAuth();
                }

                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptorId);
        };
    }, []);

    useEffect(() => {
        if (user) {
            const userId = user.id || user._id;
            if (!socket.connected) {
                socket.connect();
            }
            // Join user-specific room
            socket.emit('join', userId);

            // Re-join on reconnect
            const handleReconnect = () => {
                socket.emit('join', userId);
            };
            socket.on('connect', handleReconnect);

            return () => {
                socket.off('connect', handleReconnect);
            };
        } else {
            if (socket.connected) {
                socket.disconnect();
            }
        }
    }, [user]);

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
            clearAuth();
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

    const googleLogin = async (credential, referralCodeParam = null) => {
        const referralCode = referralCodeParam || localStorage.getItem('pending_referral_code') || '';
        const res = await axios.post('/api/auth/google', { idToken: credential, referralCode });

        if (res.data.success) {
            const { token: newToken, user: newUser } = res.data;
            // Clear pending referral code once consumed
            localStorage.removeItem('pending_referral_code');
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

    const updateProfileDetails = async (details) => {
        const res = await axios.put('/api/auth/updatedetails', details);
        if (res.data?.data) {
            setUser(res.data.data);
        }
        return res.data;
    };

    const register = async (userData) => {
        const res = await axios.post('/api/auth/register', userData);
        if (res.data?.token) {
            const { token: newToken, user: newUser } = res.data;
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            setToken(newToken);
            setUser(newUser);
        }
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

    const forgotPassword = async (email) => {
        const res = await axios.post('/api/auth/forgot-password', { email });
        return res.data;
    };

    const resetPassword = async (email, otp, newPassword) => {
        const res = await axios.post('/api/auth/reset-password', { email, otp, newPassword });
        const { token: newToken, user: newUser } = res.data;
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setUser(newUser);
        return res.data;
    };

    const deleteAccount = async (password) => {
        const res = await axios.delete('/api/auth/delete-account', { data: { password } });
        if (res.data.success) {
            clearAuth();
        }
        return res.data;
    };

    const updateFavorites = (newFavorites) => {
        if (user) {
            setUser(prevUser => (prevUser ? { ...prevUser, favorites: newFavorites } : null));
        }
    };

    const logout = () => {
        clearAuth();
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            googleLogin,
            completeProfile,
            register,
            verifyOTP,
            resendOTP,
            forgotPassword,
            resetPassword,
            deleteAccount,
            updateFavorites,
            updateProfileDetails,
            setUser,
            loadUser,
            updateUserCoins: (coins) => setUser(prev => prev ? { ...prev, coinsBalance: coins } : prev),
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};
