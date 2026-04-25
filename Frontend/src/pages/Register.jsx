import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import CompleteProfileModal from '../components/CompleteProfileModal';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Buyer',
        phone: ''
    });
    const { register, googleLogin, completeProfile, user } = useContext(AuthContext);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await register(formData);
            navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
            else navigate('/search');
        } catch (err) {
            setError(err.response?.data?.error || 'Profile completion failed.');
        }
    };

    const roles = [
        { value: 'Buyer',  label: 'Buyer',             desc: 'I want to buy / explore properties',  icon: '🏠' },
        { value: 'Seller', label: 'Seller / Land Owner', desc: 'I want to list my property',          icon: '📋' },
        { value: 'Broker', label: 'Broker / Agent',     desc: 'I manage properties for clients',     icon: '🤝' },
    ];

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

                .reg-page {
                    min-height: calc(100vh - 68px);
                    display: flex;
                    font-family: 'Nunito Sans', sans-serif;
                    background: #f8f5ee;
                }

                /* ── Left Panel ── */
                .reg-left {
                    display: none;
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                    background: #1a2340;
                    flex-direction: column;
                    justify-content: flex-end;
                }
                @media (min-width: 900px) { .reg-left { display: flex; } }

                .reg-left::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #c9a84c, #f0d080, #c9a84c);
                    z-index: 3;
                }
                .reg-left-img {
                    position: absolute; inset: 0;
                    width: 100%; height: 100%;
                    object-fit: cover; opacity: 0.3;
                }
                .reg-left-overlay {
                    position: relative; z-index: 2;
                    padding: 48px;
                }
                .reg-left-tag {
                    display: inline-block;
                    background: rgba(201,168,76,0.2);
                    border: 1px solid rgba(201,168,76,0.5);
                    color: #f0d080;
                    font-size: 11px; font-weight: 800;
                    letter-spacing: 2px; text-transform: uppercase;
                    padding: 5px 16px; border-radius: 100px;
                    margin-bottom: 16px;
                }
                .reg-left-heading {
                    font-family: 'Playfair Display', serif;
                    font-size: clamp(1.8rem, 2.8vw, 2.6rem);
                    color: #fff; font-weight: 700; line-height: 1.25;
                    margin: 0 0 16px;
                }
                .reg-left-sub {
                    color: rgba(255,255,255,0.62);
                    font-size: 14px; font-weight: 500; line-height: 1.7;
                    max-width: 340px; margin-bottom: 36px;
                }
                .reg-steps { display: flex; flex-direction: column; gap: 16px; }
                .reg-step {
                    display: flex; align-items: flex-start; gap: 14px;
                }
                .reg-step-num {
                    width: 30px; height: 30px; border-radius: 50%;
                    background: rgba(201,168,76,0.25);
                    border: 1.5px solid rgba(201,168,76,0.5);
                    color: #f0d080; font-size: 12px; font-weight: 800;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; margin-top: 1px;
                }
                .reg-step-text { font-size: 13px; color: rgba(255,255,255,0.75); font-weight: 600; line-height: 1.5; }
                .reg-step-text strong { color: #fff; display: block; margin-bottom: 2px; }

                /* ── Right Panel ── */
                .reg-right {
                    width: 100%;
                    max-width: 500px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 48px 40px;
                    background: #fff;
                    box-shadow: -8px 0 40px rgba(26,35,64,0.08);
                    overflow-y: auto;
                }
                @media (max-width: 600px) { .reg-right { padding: 36px 24px; max-width: 100%; } }

                .reg-logo {
                    font-family: 'Playfair Display', serif;
                    font-size: 20px; font-weight: 700;
                    color: #1a2340; text-decoration: none;
                    display: inline-block; margin-bottom: 32px;
                }
                .reg-logo span { color: #c9a84c; }

                .reg-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 26px; font-weight: 700;
                    color: #1a2340; margin: 0 0 6px;
                }
                .reg-subtitle {
                    font-size: 14px; color: #6b7280; font-weight: 500;
                    margin-bottom: 28px;
                }

                /* Error */
                .reg-error {
                    background: #fff0f0; border: 1px solid #fcc; color: #c0392b;
                    padding: 12px 16px; border-radius: 8px;
                    font-size: 13px; font-weight: 600;
                    margin-bottom: 20px;
                }

                /* Fields */
                .reg-row { display: flex; gap: 14px; }
                .reg-row .reg-field { flex: 1; }

                .reg-field { margin-bottom: 18px; }
                .reg-label {
                    display: block; font-size: 11px; font-weight: 800;
                    color: #1a2340; text-transform: uppercase; letter-spacing: 0.8px;
                    margin-bottom: 7px;
                }
                .reg-input {
                    width: 100%; box-sizing: border-box;
                    padding: 12px 15px; border-radius: 8px;
                    border: 1.5px solid #e2d9c5; background: #fdfaf5;
                    font-size: 14px; font-weight: 600; color: #1a2340;
                    font-family: 'Nunito Sans', sans-serif;
                    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
                    appearance: none;
                }
                .reg-input::placeholder { color: #b0a898; font-weight: 500; }
                .reg-input:focus {
                    border-color: #c9a84c;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
                    background: #fff;
                }

                /* Role Selector */
                .reg-role-grid {
                    display: flex; gap: 10px; margin-bottom: 18px;
                    flex-wrap: wrap;
                }
                .reg-role-card {
                    flex: 1; min-width: 120px;
                    border: 1.5px solid #e2d9c5;
                    border-radius: 10px; padding: 12px 10px;
                    cursor: pointer; text-align: center;
                    background: #fdfaf5;
                    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
                    user-select: none;
                }
                .reg-role-card.selected {
                    border-color: #c9a84c;
                    background: #fffbf0;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
                }
                .reg-role-card:hover:not(.selected) {
                    border-color: #1a2340; background: #f8f5ee;
                }
                .reg-role-icon { font-size: 20px; margin-bottom: 5px; }
                .reg-role-name {
                    font-size: 12px; font-weight: 800; color: #1a2340;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .reg-role-desc {
                    font-size: 10px; color: #9ca3af; font-weight: 500;
                    margin-top: 3px; line-height: 1.4;
                }
                .reg-role-card.selected .reg-role-name { color: #b8933a; }

                /* Submit */
                .reg-btn {
                    width: 100%; padding: 14px;
                    background: #1a2340; color: #fff;
                    border: none; border-radius: 8px; cursor: pointer;
                    font-size: 14px; font-weight: 800; letter-spacing: 1px;
                    text-transform: uppercase; font-family: 'Nunito Sans', sans-serif;
                    transition: background 0.2s, transform 0.15s;
                    margin-top: 4px;
                }
                .reg-btn:hover:not(:disabled) { background: #c9a84c; color: #1a1200; transform: translateY(-1px); }
                .reg-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                /* Divider */
                .reg-divider {
                    display: flex; align-items: center; gap: 12px;
                    margin: 22px 0;
                }
                .reg-divider-line { flex: 1; height: 1px; background: #e2d9c5; }
                .reg-divider-text {
                    font-size: 11px; font-weight: 800; color: #b0a898;
                    text-transform: uppercase; letter-spacing: 1px;
                }

                .reg-google-wrap { display: flex; justify-content: center; }

                .reg-footer {
                    text-align: center; margin-top: 24px;
                    font-size: 13px; color: #6b7280; font-weight: 500;
                }
                .reg-footer a {
                    color: #c9a84c; font-weight: 800; text-decoration: none; margin-left: 4px;
                }
                .reg-footer a:hover { text-decoration: underline; }

                .reg-brand-strip {
                    margin-top: 28px; padding-top: 18px;
                    border-top: 1px solid #f0ebe0;
                    display: flex; gap: 12px; flex-wrap: wrap;
                }
                .reg-brand-badge {
                    font-size: 11px; font-weight: 700; color: #1a2340;
                    background: #f8f5ee; border: 1px solid #e2d9c5;
                    padding: 4px 12px; border-radius: 100px;
                    display: flex; align-items: center; gap: 4px;
                }
            `}</style>

            <div className="reg-page">

                {/* ── Left Panel ── */}
                <div className="reg-left">
                    <img
                        className="reg-left-img"
                        src="https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=1200&q=80"
                        alt="Property"
                    />
                    <div className="reg-left-overlay">
                        <div className="reg-left-tag">Join 12,000+ Happy Buyers</div>
                        <h2 className="reg-left-heading">
                            Start Your Property<br />Journey Today
                        </h2>
                        <p className="reg-left-sub">
                            Create a free account and get access to thousands of verified plots, smart boundary tools and direct seller contacts.
                        </p>
                        <div className="reg-steps">
                            {[
                                { title: 'Create Your Account', desc: 'Sign up free in under 2 minutes' },
                                { title: 'Browse Verified Listings', desc: 'Explore plots, land & commercial sites' },
                                { title: 'Connect Directly', desc: 'Contact sellers with zero brokerage' },
                            ].map(({ title, desc }, i) => (
                                <div className="reg-step" key={i}>
                                    <div className="reg-step-num">{i + 1}</div>
                                    <div className="reg-step-text">
                                        <strong>{title}</strong>
                                        {desc}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right Panel ── */}
                <div className="reg-right">


                    <h1 className="reg-title">Create Account</h1>
                    <p className="reg-subtitle">Join Splus Properties — it's free & takes 2 minutes</p>

                    {error && <div className="reg-error">⚠ {error}</div>}

                    <form onSubmit={handleSubmit}>

                        {/* Name + Phone */}
                        <div className="reg-row">
                            <div className="reg-field">
                                <label className="reg-label">Full Name</label>
                                <input
                                    type="text" name="name" className="reg-input"
                                    value={formData.name} onChange={handleChange}
                                    placeholder="Your full name" required
                                />
                            </div>
                            <div className="reg-field">
                                <label className="reg-label">Phone Number</label>
                                <input
                                    type="text" name="phone" className="reg-input"
                                    value={formData.phone} onChange={handleChange}
                                    placeholder="+91 98765 43210" required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="reg-field">
                            <label className="reg-label">Email Address</label>
                            <input
                                type="email" name="email" className="reg-input"
                                value={formData.email} onChange={handleChange}
                                placeholder="you@email.com" required
                            />
                        </div>

                        {/* Role Selector */}
                        <div className="reg-field">
                            <label className="reg-label">I am a...</label>
                            <div className="reg-role-grid">
                                {roles.map(r => (
                                    <div
                                        key={r.value}
                                        className={`reg-role-card ${formData.role === r.value ? 'selected' : ''}`}
                                        onClick={() => setFormData(p => ({ ...p, role: r.value }))}
                                    >
                                        <div className="reg-role-icon">{r.icon}</div>
                                        <div className="reg-role-name">{r.label}</div>
                                        <div className="reg-role-desc">{r.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Password */}
                        <div className="reg-field">
                            <label className="reg-label">Password</label>
                            <input
                                type="password" name="password" className="reg-input"
                                value={formData.password} onChange={handleChange}
                                placeholder="Min. 6 characters" required minLength="6"
                            />
                        </div>

                        <button type="submit" className="reg-btn" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create My Account →'}
                        </button>
                    </form>

                    <div className="reg-divider">
                        <div className="reg-divider-line" />
                        <span className="reg-divider-text">or sign up with</span>
                        <div className="reg-divider-line" />
                    </div>

                    <div className="reg-google-wrap">
                        <GoogleLogin
                            onSuccess={res => handleGoogleSuccess(res.credential)}
                            onError={() => setError('Google Registration Failed')}
                            width="380"
                        />
                    </div>

                    <p className="reg-footer">
                        Already have an account?
                        <Link to="/login">Sign In</Link>
                    </p>

                    
                </div>
            </div>
        </>
    );
};

export default Register;