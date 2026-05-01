import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, KeyRound, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { forgotPassword, resetPassword } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await forgotPassword(email);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP. Please check your email.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }
        setStep(3);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await resetPassword(email, otp, newPassword);
            setStep(4);
            // Auto redirect after 2 seconds
            setTimeout(() => {
                navigate('/search');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. OTP might be expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

                .forgot-page {
                    min-height: calc(100vh - 68px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Nunito Sans', sans-serif;
                    background: #f8f5ee;
                    padding: 24px;
                }

                .forgot-card {
                    width: 100%;
                    max-width: 440px;
                    background: #fff;
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(26,35,64,0.08);
                    padding: 40px;
                    position: relative;
                    overflow: hidden;
                }

                .forgot-card::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0; height: 4px;
                    background: linear-gradient(90deg, #c9a84c, #f0d080, #c9a84c);
                }

                .forgot-header { text-align: center; margin-bottom: 32px; }
                
                .forgot-icon-wrap {
                    width: 60px; height: 60px; background: #fdfaf5;
                    border: 1.5px solid #e2d9c5; border-radius: 15px;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 20px; color: #c9a84c;
                }

                .forgot-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 26px; color: #1a2340; margin-bottom: 8px;
                }
                .forgot-subtitle {
                    font-size: 14px; color: #6b7280; line-height: 1.5;
                }

                .forgot-error {
                    background: #fff0f0; border: 1px solid #fcc; color: #c0392b;
                    padding: 12px; border-radius: 8px; font-size: 13px;
                    font-weight: 600; margin-bottom: 20px; text-align: center;
                }

                .forgot-field { margin-bottom: 20px; }
                .forgot-label {
                    display: block; font-size: 11px; font-weight: 800;
                    color: #1a2340; text-transform: uppercase; letter-spacing: 1px;
                    margin-bottom: 8px;
                }
                .forgot-input-wrap { position: relative; }
                .forgot-input {
                    width: 100%; box-sizing: border-box;
                    padding: 13px 16px; border-radius: 8px;
                    border: 1.5px solid #e2d9c5; background: #fdfaf5;
                    font-size: 15px; font-weight: 600; color: #1a2340;
                    outline: none; transition: all 0.2s;
                }
                .forgot-input:focus {
                    border-color: #c9a84c; background: #fff;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
                }

                .forgot-btn {
                    width: 100%; padding: 14px;
                    background: #1a2340; color: #fff;
                    border: none; border-radius: 8px; cursor: pointer;
                    font-size: 14px; font-weight: 800; text-transform: uppercase;
                    letter-spacing: 1px; transition: all 0.2s;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                }
                .forgot-btn:hover:not(:disabled) { background: #c9a84c; color: #1a1200; transform: translateY(-1px); }
                .forgot-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                .forgot-back {
                    display: flex; align-items: center; justify-content: center; gap: 6px;
                    margin-top: 24px; font-size: 13px; font-weight: 700; color: #6b7280;
                    text-decoration: none; cursor: pointer; transition: color 0.2s;
                }
                .forgot-back:hover { color: #1a2340; }

                .otp-grid {
                    display: flex; justify-content: center; gap: 10px;
                }
                
                .success-check {
                    width: 80px; height: 80px; background: #f0fdf4;
                    color: #16a34a; border-radius: 50%; display: flex;
                    align-items: center; justify-content: center; margin: 0 auto 24px;
                }
            `}</style>

            <div className="forgot-card">
                {step === 1 && (
                    <div className="forgot-step">
                        <div className="forgot-header">
                            <div className="forgot-icon-wrap"><Mail size={28} /></div>
                            <h1 className="forgot-title">Forgot Password?</h1>
                            <p className="forgot-subtitle">No worries, enter your email and we'll send you an OTP to reset it.</p>
                        </div>

                        {error && <div className="forgot-error">⚠ {error}</div>}

                        <form onSubmit={handleSendOTP}>
                            <div className="forgot-field">
                                <label className="forgot-label">Email Address</label>
                                <input
                                    type="email"
                                    className="forgot-input"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="forgot-btn" disabled={loading}>
                                {loading ? 'Sending...' : 'Send OTP'} <ArrowRight size={18} />
                            </button>
                        </form>

                        <Link to="/login" className="forgot-back">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                )}

                {step === 2 && (
                    <div className="forgot-step">
                        <div className="forgot-header">
                            <div className="forgot-icon-wrap"><KeyRound size={28} /></div>
                            <h1 className="forgot-title">Enter OTP</h1>
                            <p className="forgot-subtitle">We've sent a 6-digit code to <strong>{email}</strong></p>
                        </div>

                        {error && <div className="forgot-error">⚠ {error}</div>}

                        <form onSubmit={handleVerifyOTP}>
                            <div className="forgot-field">
                                <label className="forgot-label">6-Digit Code</label>
                                <input
                                    type="text"
                                    className="forgot-input"
                                    placeholder="000000"
                                    maxLength="6"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                    required
                                    style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px' }}
                                />
                            </div>
                            <button type="submit" className="forgot-btn">
                                Verify & Continue <ArrowRight size={18} />
                            </button>
                        </form>

                        <div className="forgot-back" onClick={() => setStep(1)}>
                            <ArrowLeft size={16} /> Use a different email
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="forgot-step">
                        <div className="forgot-header">
                            <div className="forgot-icon-wrap"><Lock size={28} /></div>
                            <h1 className="forgot-title">Reset Password</h1>
                            <p className="forgot-subtitle">Create a strong password to secure your account.</p>
                        </div>

                        {error && <div className="forgot-error">⚠ {error}</div>}

                        <form onSubmit={handleResetPassword}>
                            <div className="forgot-field">
                                <label className="forgot-label">New Password</label>
                                <div className="forgot-input-wrap">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="forgot-input"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength="6"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="forgot-field">
                                <label className="forgot-label">Confirm Password</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="forgot-input"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="forgot-btn" disabled={loading}>
                                {loading ? 'Resetting...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 4 && (
                    <div className="forgot-step" style={{ textAlign: 'center' }}>
                        <div className="success-check">
                            <CheckCircle2 size={48} />
                        </div>
                        <h1 className="forgot-title">Password Reset!</h1>
                        <p className="forgot-subtitle" style={{ marginBottom: '32px' }}>
                            Your password has been successfully updated. <br />
                            <strong>Logging you in automatically...</strong>
                        </p>
                        <button onClick={() => navigate('/search')} className="forgot-btn">
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
