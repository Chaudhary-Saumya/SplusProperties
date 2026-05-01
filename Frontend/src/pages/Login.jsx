import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';
import CompleteProfileModal from '../components/CompleteProfileModal';

const Login = () => {
    const [credentials, setCredentials] = useState({ identifier: '', password: '' });
    const { login, googleLogin, completeProfile, user } = useContext(AuthContext);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await login(credentials.identifier, credentials.password);
            if (data?.user?.role === 'Admin') navigate('/admin');
            else navigate('/search');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credential) => {
        setError(null);
        try {
            const data = await googleLogin(credential);
                if (data?.needsProfileCompletion) {
                    setShowCompleteModal(true);
                } else {
                    if (data?.user?.role === 'Admin') navigate('/admin');
                    else navigate('/search');
                }
        } catch (err) {
            setError(err.response?.data?.error || 'Google Login failed.');
        }
    };

    const handleProfileComplete = async (profileData) => {
        try {
            const data = await completeProfile(profileData);
            setShowCompleteModal(false);
            if (data?.role === 'Admin' || user?.role === 'Admin') navigate('/admin');
            else navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Profile completion failed.');
        }
    };

    return (
        <>
            {showCompleteModal && (
                <CompleteProfileModal
                    isOpen={showCompleteModal}
                    user={user}
                    onComplete={handleProfileComplete}
                    error={error}
                />
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

                .login-page {
                    min-height: calc(100vh - 68px);
                    display: flex;
                    font-family: 'Nunito Sans', sans-serif;
                    background: #f8f5ee;
                }

                /* ── Left Panel ── */
                .login-left {
                    display: none;
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                    background: #1a2340;
                }
                @media (min-width: 900px) { .login-left { display: flex; flex-direction: column; justify-content: flex-end; } }

                .login-left-img {
                    position: absolute; inset: 0;
                    width: 100%; height: 100%;
                    object-fit: cover;
                    opacity: 0.35;
                }
                .login-left-overlay {
                    position: relative; z-index: 2;
                    padding: 48px;
                }
                .login-left-tag {
                    display: inline-block;
                    background: rgba(201,168,76,0.2);
                    border: 1px solid rgba(201,168,76,0.5);
                    color: #f0d080;
                    font-size: 11px; font-weight: 800;
                    letter-spacing: 2px; text-transform: uppercase;
                    padding: 5px 16px; border-radius: 100px;
                    margin-bottom: 16px;
                }
                .login-left-heading {
                    font-family: 'Playfair Display', serif;
                    font-size: clamp(2rem, 3vw, 2.8rem);
                    color: #fff; font-weight: 700; line-height: 1.2;
                    margin: 0 0 16px;
                }
                .login-left-sub {
                    color: rgba(255,255,255,0.65);
                    font-size: 14px; font-weight: 500; line-height: 1.7;
                    max-width: 340px; margin-bottom: 36px;
                }
                .login-trust-row {
                    display: flex; gap: 28px; flex-wrap: wrap;
                }
                .login-trust-item {
                    text-align: center;
                }
                .login-trust-num {
                    font-family: 'Playfair Display', serif;
                    font-size: 22px; color: #c9a84c; font-weight: 700;
                }
                .login-trust-label {
                    font-size: 11px; color: rgba(255,255,255,0.55);
                    font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
                    margin-top: 2px;
                }

                /* Gold top accent */
                .login-left::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #c9a84c, #f0d080, #c9a84c);
                    z-index: 3;
                }

                /* ── Right Panel ── */
                .login-right {
                    width: 100%;
                    max-width: 480px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 48px 40px;
                    background: #fff;
                    box-shadow: -8px 0 40px rgba(26,35,64,0.08);
                }
                @media (max-width: 600px) { .login-right { padding: 36px 24px; } }

                .login-logo {
                    font-family: 'Playfair Display', serif;
                    font-size: 20px; font-weight: 700;
                    color: #1a2340; text-decoration: none;
                    display: inline-block; margin-bottom: 36px;
                }
                .login-logo span { color: #c9a84c; }

                .login-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 28px; font-weight: 700;
                    color: #1a2340; margin: 0 0 6px;
                }
                .login-subtitle {
                    font-size: 14px; color: #6b7280; font-weight: 500;
                    margin-bottom: 32px;
                }

                /* Error */
                .login-error {
                    background: #fff0f0; border: 1px solid #fcc; color: #c0392b;
                    padding: 12px 16px; border-radius: 8px;
                    font-size: 13px; font-weight: 600;
                    margin-bottom: 20px;
                    display: flex; align-items: center; gap: 8px;
                }

                /* Form */
                .login-field { margin-bottom: 20px; }
                .login-label {
                    display: block; font-size: 12px; font-weight: 800;
                    color: #1a2340; text-transform: uppercase; letter-spacing: 0.8px;
                    margin-bottom: 8px;
                }
                .login-input {
                    width: 100%; box-sizing: border-box;
                    padding: 13px 16px; border-radius: 8px;
                    border: 1.5px solid #e2d9c5; background: #fdfaf5;
                    font-size: 14px; font-weight: 600; color: #1a2340;
                    font-family: 'Nunito Sans', sans-serif;
                    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
                }
                .login-input::placeholder { color: #b0a898; font-weight: 500; }
                .login-input:focus {
                    border-color: #c9a84c;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
                    background: #fff;
                }

                .login-forgot {
                    display: block; text-align: right;
                    font-size: 12px; font-weight: 700; color: #c9a84c;
                    text-decoration: none; margin-top: -12px; margin-bottom: 24px;
                }
                .login-forgot:hover { text-decoration: underline; }

                .login-btn {
                    width: 100%; padding: 14px;
                    background: #1a2340; color: #fff;
                    border: none; border-radius: 8px; cursor: pointer;
                    font-size: 14px; font-weight: 800; letter-spacing: 1px;
                    text-transform: uppercase; font-family: 'Nunito Sans', sans-serif;
                    transition: background 0.2s, transform 0.15s;
                    position: relative; overflow: hidden;
                }
                .login-btn:hover:not(:disabled) { background: #c9a84c; color: #1a1200; transform: translateY(-1px); }
                .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                /* Divider */
                .login-divider {
                    display: flex; align-items: center; gap: 12px;
                    margin: 24px 0;
                }
                .login-divider-line { flex: 1; height: 1px; background: #e2d9c5; }
                .login-divider-text {
                    font-size: 11px; font-weight: 800; color: #b0a898;
                    text-transform: uppercase; letter-spacing: 1px;
                }

                .login-google-wrap {
                    display: flex; justify-content: center;
                    margin-bottom: 4px;
                }

                .login-footer {
                    text-align: center; margin-top: 28px;
                    font-size: 13px; color: #6b7280; font-weight: 500;
                }
                .login-footer a {
                    color: #c9a84c; font-weight: 800; text-decoration: none; margin-left: 4px;
                }
                .login-footer a:hover { text-decoration: underline; }

                /* Bottom brand strip */
                .login-brand-strip {
                    margin-top: 36px; padding-top: 20px;
                    border-top: 1px solid #f0ebe0;
                    display: flex; gap: 16px; align-items: center;
                    flex-wrap: wrap;
                }
                .login-brand-badge {
                    font-size: 11px; font-weight: 700; color: #1a2340;
                    background: #f8f5ee; border: 1px solid #e2d9c5;
                    padding: 4px 12px; border-radius: 100px;
                    display: flex; align-items: center; gap: 5px;
                }
            `}</style>

            <div className="login-page">

                {/* ── Left: Hero Panel ── */}
                <div className="login-left">
                    <img
                        className="login-left-img"
                        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80"
                        alt="Property"
                    />
                    <div className="login-left-overlay">
                        <div className="login-left-tag">Trusted Property Platform</div>
                        <h2 className="login-left-heading">
                            Your Dream Property<br />Awaits You
                        </h2>
                        <p className="login-left-sub">
                            Access thousands of verified plots, commercial sites and residential land — all in one place with smart geospatial tools.
                        </p>
                        <div className="login-trust-row">
                            {[
                                { num: '2,400+', label: 'Listings' },
                                { num: '180+', label: 'Cities' },
                                { num: '12K+', label: 'Happy Buyers' },
                            ].map(({ num, label }) => (
                                <div className="login-trust-item" key={label}>
                                    <div className="login-trust-num">{num}</div>
                                    <div className="login-trust-label">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right: Form Panel ── */}
                <div className="login-right">

                    <h1 className="login-title">Welcome Back</h1>
                    <p className="login-subtitle">Sign in to your account to continue</p>

                    {/* Error */}
                    {error && (
                        <div className="login-error">
                            ⚠ {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="login-field">
                            <label className="login-label">Email or Phone Number</label>
                            <input
                                type="text"
                                name="identifier"
                                className="login-input"
                                value={credentials.identifier}
                                onChange={handleChange}
                                placeholder="Enter your email or phone"
                                required
                            />
                        </div>

                        <div className="login-field">
                            <label className="login-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className="login-input"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    style={{ paddingRight: '45px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', color: '#9ca3af',
                                        display: 'flex', alignItems: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="login-divider">
                        <div className="login-divider-line" />
                        <span className="login-divider-text">or continue with</span>
                        <div className="login-divider-line" />
                    </div>

                    {/* Google */}
                    <div className="login-google-wrap">
                        <GoogleLogin
                            onSuccess={res => handleGoogleSuccess(res.credential)}
                            onError={() => setError('Google Login Failed')}
                            width="370"
                        />
                    </div>

                    {/* Footer */}
                    <p className="login-footer">
                        Don't have an account?
                        <Link to="/register">Create one free</Link>
                    </p>

                    
                </div>
            </div>
        </>
    );
};

export default Login;