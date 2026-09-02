import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, ArrowLeft, Mail, AlertCircle, LandPlot, Ruler } from 'lucide-react';
import CompleteProfileModal from '../components/CompleteProfileModal';
import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const { language, t } = useLanguage();
    const [credentials, setCredentials] = useState({ identifier: '', password: '' });
    const { login, googleLogin, completeProfile, user } = useContext(AuthContext);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const redirectPath = queryParams.get('redirect') || '/';

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
            else navigate(redirectPath);
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.response?.data?.error || 'Login failed. Please try again.';
            setError(serverMsg);
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
                else navigate(redirectPath);
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
            else navigate(redirectPath);
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
                    onClose={() => setShowCompleteModal(false)}
                    error={error}
                />
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

                .login-page {
                    min-height: calc(100vh - 68px);
                    display: flex;
                    flex-direction: column;
                    font-family: 'Nunito Sans', sans-serif;
                    background: #f8f5ee;
                }
                @media (min-width: 900px) {
                    .login-page {
                        flex-direction: row;
                    }
                }

                /* ── Mobile Hero Header (< 900px) ── */
                .login-mobile-hero {
                    position: relative;
                    background: #1a2340;
                    padding: 32px 20px 48px;
                    overflow: hidden;
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                @media (min-width: 900px) {
                    .login-mobile-hero { display: none; }
                }

                .login-mobile-hero-img {
                    position: absolute; inset: 0;
                    width: 100%; height: 100%;
                    object-fit: cover;
                    opacity: 0.38;
                }

                .login-mobile-hero-overlay {
                    position: absolute; inset: 0;
                    background: linear-gradient(180deg, rgba(26,35,64,0.75) 0%, rgba(26,35,64,0.95) 100%);
                }

                .login-mobile-hero-content {
                    position: relative;
                    z-index: 2;
                    max-width: 400px;
                }

                /* ── Left Panel (Desktop >= 900px) ── */
                .login-left {
                    display: none;
                    flex: 1.1;
                    position: relative;
                    overflow: hidden;
                    background: #1a2340;
                }
                @media (min-width: 900px) {
                    .login-left {
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-end;
                    }
                }

                .login-left-img {
                    position: absolute; inset: 0;
                    width: 100%; height: 100%;
                    object-fit: cover;
                    opacity: 0.38;
                }
                .login-left-overlay {
                    position: relative; z-index: 2;
                    padding: 56px 48px;
                }
                .login-left-tag {
                    display: inline-block;
                    background: rgba(201,168,76,0.22);
                    border: 1px solid rgba(201,168,76,0.55);
                    color: #f0d080;
                    font-size: 11px; font-weight: 800;
                    letter-spacing: 2px; text-transform: uppercase;
                    padding: 5px 16px; border-radius: 100px;
                    margin-bottom: 16px;
                }
                .login-left-heading {
                    font-size: clamp(2rem, 3vw, 2.8rem);
                    color: #fff; font-weight: 800; line-height: 1.2;
                    margin: 0 0 16px;
                    letter-spacing: -0.5px;
                }
                .login-left-sub {
                    color: rgba(255,255,255,0.75);
                    font-size: 14px; font-weight: 500; line-height: 1.7;
                    max-width: 380px; margin-bottom: 36px;
                }
                .login-trust-row {
                    display: flex; gap: 24px; flex-wrap: wrap;
                }
                .login-trust-item {
                    background: rgba(255,255,255,0.08);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.12);
                    padding: 10px 18px;
                    border-radius: 14px;
                    text-align: center;
                }
                .login-trust-num {
                    font-size: 18px; color: #f0d080; font-weight: 800;
                }
                .login-trust-label {
                    font-size: 10px; color: rgba(255,255,255,0.7);
                    font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
                    margin-top: 2px;
                }

                /* Gold top accent */
                .login-left::before, .login-mobile-hero::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #c9a84c, #f0d080, #c9a84c);
                    z-index: 3;
                }

                /* ── Right Form Panel ── */
                .login-right {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 32px 20px 48px;
                    background: #fff;
                    box-sizing: border-box;
                }
                @media (max-width: 899px) {
                    .login-right {
                        margin-top: -24px;
                        border-radius: 28px 28px 0 0;
                        position: relative;
                        z-index: 10;
                        box-shadow: 0 -12px 32px rgba(15,23,42,0.15);
                        padding: 32px 24px 48px;
                        max-width: 520px;
                        margin-left: auto;
                        margin-right: auto;
                    }
                }
                @media (min-width: 900px) {
                    .login-right {
                        max-width: 480px;
                        padding: 48px 40px;
                        box-shadow: -8px 0 40px rgba(26,35,64,0.08);
                    }
                }

                .login-title {
                    font-size: 26px; font-weight: 800;
                    color: #1a2340; margin: 0 0 6px;
                    letter-spacing: -0.3px;
                }
                .login-subtitle {
                    font-size: 14px; color: #6b7280; font-weight: 500;
                    margin-bottom: 28px; line-height: 1.5;
                }

                /* Error */
                .login-error {
                    background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
                    padding: 12px 16px; border-radius: 12px;
                    font-size: 13px; font-weight: 600;
                    margin-bottom: 20px;
                    display: flex; align-items: center; gap: 8px;
                }

                /* Form */
                .login-field { margin-bottom: 20px; }
                .login-label {
                    display: block; font-size: 11px; font-weight: 800;
                    color: #1a2340; text-transform: uppercase; letter-spacing: 0.8px;
                    margin-bottom: 8px;
                }
                .login-input {
                    width: 100%; box-sizing: border-box;
                    padding: 13px 16px; border-radius: 12px;
                    border: 1.5px solid #e2d9c5; background: #fdfaf5;
                    font-size: 14px; font-weight: 600; color: #1a2340;
                    font-family: 'Nunito Sans', sans-serif;
                    outline: none; transition: all 0.2s;
                }
                .login-input::placeholder { color: #b0a898; font-weight: 500; }
                .login-input:focus {
                    border-color: #c9a84c;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
                    background: #fff;
                }

                .login-forgot {
                    display: block; text-align: right;
                    font-size: 12px; font-weight: 700; color: #c9a84c;
                    text-decoration: none; margin-top: -10px; margin-bottom: 24px;
                }
                .login-forgot:hover { text-decoration: underline; }

                .login-btn {
                    width: 100%; padding: 14px;
                    background: #1a2340; color: #fff;
                    border: none; border-radius: 12px; cursor: pointer;
                    font-size: 14px; font-weight: 800; letter-spacing: 1px;
                    text-transform: uppercase; font-family: 'Nunito Sans', sans-serif;
                    transition: all 0.2s;
                    position: relative; overflow: hidden;
                    box-shadow: 0 4px 14px rgba(26,35,64,0.18);
                }
                .login-btn:hover:not(:disabled) { background: #c9a84c; color: #1a1200; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,168,76,0.3); }
                .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .login-native-google-btn {
                    background: #fff !important;
                    color: #1a2340 !important;
                    border: 1.5px solid #e2d9c5 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 10px !important;
                    text-transform: none !important;
                }

                /* Divider */
                .login-divider {
                    display: flex; align-items: center; gap: 12px;
                    margin: 24px 0;
                }
                .login-divider-line { flex: 1; height: 1px; background: #e2d9c5; }
                .login-divider-text {
                    font-size: 11px; font-weight: 800; color: #9ca3af;
                    text-transform: uppercase; letter-spacing: 1px;
                }

                .login-google-wrap {
                    display: flex; justify-content: center;
                    margin-bottom: 4px;
                }

                .login-footer {
                    text-align: center; margin-top: 24px;
                    font-size: 13px; color: #6b7280; font-weight: 600;
                }
                .login-footer a {
                    color: #c9a84c; font-weight: 800; text-decoration: none; margin-left: 5px;
                }
                .login-footer a:hover { text-decoration: underline; }

                .login-google-container {
                    background: linear-gradient(135deg, #fdfaf5 0%, #fffbf0 100%);
                    border: 1.5px dashed #e2d9c5;
                    border-radius: 16px;
                    padding: 24px 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .login-btn-outline {
                    width: 100%;
                    padding: 14px;
                    background: #fff;
                    color: #1a2340;
                    border: 1.5px solid #e2d9c5;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    font-family: 'Nunito Sans', sans-serif;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    box-sizing: border-box;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .login-btn-outline:hover {
                    background: #fdfaf5;
                    border-color: #1a2340;
                    transform: translateY(-1px);
                }
                .login-back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: none;
                    border: none;
                    color: #c9a84c;
                    font-size: 13px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    padding: 0;
                    margin-bottom: 24px;
                    transition: color 0.2s;
                }
                .login-back-link:hover {
                    color: #1a2340;
                }
            `}</style>

            <div className="login-page">

                {/* ── Mobile Hero Header (< 900px) ── */}
                <div className="login-mobile-hero">
                    <img
                        className="login-mobile-hero-img"
                        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80"
                        alt="Land & Plots"
                    />
                    <div className="login-mobile-hero-overlay" />
                    <div className="login-mobile-hero-content">
                        <div className="login-left-tag">
                            {language === 'en' ? 'Verified Land & Plots Platform' : 'વેરિફાઇડ લેન્ડ એન્ડ પ્લોટ પ્લેટફોર્મ'}
                        </div>
                        <h2 className="text-xl font-extrabold text-white mb-2 leading-snug">
                            {language === 'en' ? 'Your Dream Land Awaits You' : 'તમારી સપનાની જમીન અહીં છે'}
                        </h2>
                        <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                            <span className="inline-flex items-center gap-1.5"><LandPlot size={13} className="text-amber-400" /> {language === 'en' ? 'Verified Plots' : 'વેરિફાઇડ પ્લોટ્સ'}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1.5"><Ruler size={13} className="text-amber-400" /> {language === 'en' ? 'Boundary Maps' : 'સીમા નકશા'}</span>
                        </div>
                    </div>
                </div>

                {/* ── Left Panel (Desktop >= 900px) ── */}
                <div className="login-left">
                    <img
                        className="login-left-img"
                        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80"
                        alt="Land Plots"
                    />
                    <div className="login-left-overlay">
                        <div className="login-left-tag">
                            {language === 'en' ? 'Trusted Land & Plot Platform' : 'ભરોસાપાત્ર લેન્ડ એન્ડ પ્લોટ પ્લેટફોર્મ'}
                        </div>
                        <h2 className="login-left-heading">
                            {language === 'en' ? (
                                <>Your Dream Land<br />Awaits You</>
                            ) : (
                                <>તમારી સપનાની જમીન<br />અહીં છે</>
                            )}
                        </h2>
                        <p className="login-left-sub">
                            {language === 'en'
                                ? "Access thousands of verified plots, agricultural land and commercial sites — all with smart boundary mapping tools."
                                : "હજારો વેરિફાઇડ પ્લોટ્સ, ખેતીની જમીન અને કોમર્શિયલ સાઇટ્સ સ્માર્ટ સીમા નકશા સાધનો સાથે મેળવો."}
                        </p>
                        <div className="login-trust-row">
                            <div className="login-trust-item">
                                <div className="login-trust-num">100%</div>
                                <div className="login-trust-label">{language === 'en' ? 'Verified Land' : 'ચકાસાયેલ જમીન'}</div>
                            </div>
                            <div className="login-trust-item">
                                <div className="login-trust-num">0%</div>
                                <div className="login-trust-label">{language === 'en' ? 'Direct Contact' : 'સીધો સંપર્ક'}</div>
                            </div>
                            <div className="login-trust-item">
                                <div className="login-trust-num">GPS</div>
                                <div className="login-trust-label">{language === 'en' ? 'Boundary Tools' : 'સીમા સાધનો'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Panel Form Card ── */}
                <div className="login-right">
                    <AnimatePresence mode="wait">
                        {!showManualForm ? (
                            <motion.div
                                key="choice"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}
                            >
                                <h1 className="login-title">{t('auth.login_title')}</h1>
                                <p className="login-subtitle">{t('auth.login_subtitle')}</p>

                                {error && <div className="login-error">⚠ {error}</div>}

                                {/* Google Sign-In at the Top */}
                                <div className="login-google-container" style={{ marginBottom: '24px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#1a2340', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                                        {language === 'en' ? 'Quick Sign-In' : 'ઝડપી સાઇન-ઇન'}
                                    </span>
                                    <div className="login-google-wrap" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                        {Capacitor.isNativePlatform() ? (
                                            <button
                                                type="button"
                                                className="login-btn login-native-google-btn"
                                                onClick={async () => {
                                                    try {
                                                        await GoogleSignIn.initialize({
                                                            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID
                                                        });
                                                        const result = await GoogleSignIn.signIn();
                                                        if (result.idToken) {
                                                            handleGoogleSuccess(result.idToken);
                                                        }
                                                    } catch (err) {
                                                        console.error('Native Google Error:', err);
                                                        setError('Google Login Canceled or Failed');
                                                    }
                                                }}
                                            >
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="20" height="20" />
                                                {language === 'en' ? 'Sign in with Google' : 'Google સાથે સાઇન ઇન કરો'}
                                            </button>
                                        ) : (
                                            <GoogleLogin
                                                onSuccess={res => handleGoogleSuccess(res.credential)}
                                                onError={() => setError('Google Login Failed')}
                                                width="380"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="login-divider" style={{ margin: '12px 0 24px' }}>
                                    <div className="login-divider-line" />
                                    <span className="login-divider-text">{language === 'en' ? 'Or Login Manually' : 'અથવા જાતે લોગીન કરો'}</span>
                                    <div className="login-divider-line" />
                                </div>

                                {/* Manual login toggle */}
                                <button
                                    type="button"
                                    onClick={() => setShowManualForm(true)}
                                    className="login-btn-outline"
                                    style={{ marginBottom: '16px' }}
                                >
                                    <Mail size={16} color="#c9a84c" />
                                    <span>{language === 'en' ? 'Login with Email / Phone' : 'ઇમેઇલ / ફોન દ્વારા લોગીન કરો'}</span>
                                </button>

                                <p className="login-footer" style={{ marginTop: '16px' }}>
                                    {language === 'en' ? "Don't have an account?" : "એકાઉન્ટ નથી?"}
                                    <Link to="/register">{language === 'en' ? 'Create one free' : 'નવું બનાવો'}</Link>
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="manual"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowManualForm(false)}
                                    className="login-back-link"
                                >
                                    <ArrowLeft size={14} /> {language === 'en' ? 'Use Google Sign-In' : 'Google સાઇન-ઇન વાપરો'}
                                </button>

                                <h1 className="login-title">{language === 'en' ? 'Login Manually' : 'જાતે લોગીન કરો'}</h1>
                                <p className="login-subtitle">{language === 'en' ? 'Enter your registered email and password' : 'તમારો રજીસ્ટર્ડ ઇમેઇલ અને પાસવર્ડ દાખલ કરો'}</p>

                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold mb-4 flex items-center gap-2.5 shadow-2xs">
                                        <AlertCircle size={18} className="text-rose-600 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="login-field">
                                        <label htmlFor="identifier" className="login-label">{language === 'en' ? 'Email or Phone Number' : 'ઇમેઇલ અથવા ફોન નંબર'}</label>
                                        <input
                                            id="identifier"
                                            type="text"
                                            name="identifier"
                                            className="login-input"
                                            value={credentials.identifier}
                                            onChange={handleChange}
                                            placeholder={language === 'en' ? 'Enter your email or phone' : 'ઇમેઇલ અથવા ફોન દાખલ કરો'}
                                            required
                                        />
                                    </div>

                                    <div className="login-field">
                                        <label htmlFor="password" className="login-label">{t('auth.password')}</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                id="password"
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

                                    <Link to="/forgot-password" className="login-forgot">{t('auth.forgot_password')}</Link>

                                    <button type="submit" className="login-btn" disabled={loading}>
                                        {loading ? (language === 'en' ? 'Signing In...' : 'સાઇન ઇન થઈ રહ્યું છે...') : t('auth.btn_login')}
                                    </button>
                                </form>

                                <p className="login-footer" style={{ marginTop: '24px' }}>
                                    {language === 'en' ? "Don't have an account?" : "એકાઉન્ટ નથી?"}
                                    <Link to="/register">{language === 'en' ? 'Create one free' : 'નવું બનાવો'}</Link>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};

export default Login;