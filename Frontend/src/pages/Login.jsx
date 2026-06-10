import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
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
                
                    font-size: 20px; font-weight: 700;
                    color: #1a2340; text-decoration: none;
                    display: inline-block; margin-bottom: 36px;
                }
                .login-logo span { color: #c9a84c; }

                .login-title {
                  
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
                .login-google-container {
                    background: #fdfaf5;
                    border: 1.5px dashed #e2d9c5;
                    border-radius: 12px;
                    padding: 24px;
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
                    border-radius: 8px;
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
                }
                .login-btn-outline:hover {
                    background: #fdfaf5;
                    border-color: #1a2340;
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

                {/* ── Left: Hero Panel ── */}
                <div className="login-left">
                    <img
                        className="login-left-img"
                        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80"
                        alt="Property"
                    />
                    <div className="login-left-overlay">
                        <div className="login-left-tag">{language === 'en' ? 'Trusted Property Platform' : 'ભરોસાપાત્ર પ્રોપર્ટી પ્લેટફોર્મ'}</div>
                        <h2 className="login-left-heading">
                            {language === 'en' ? (
                                <>Your Dream Property<br />Awaits You</>
                            ) : (
                                <>તમારી સપનાની પ્રોપર્ટી<br />અહીં છે</>
                            )}
                        </h2>
                        <p className="login-left-sub">
                            {language === 'en'
                                ? "Access thousands of verified plots, commercial sites and residential land — all in one place with smart geospatial tools."
                                : "હજારો વેરિફાઇડ પ્લોટ્સ, કોમર્શિયલ સાઇટ્સ અને રહેણાંક જમીન એક જ જગ્યાએ સ્માર્ટ મેપિંગ સાથે મેળવો."}
                        </p>
                    </div>
                </div>

                {/* ── Right: Form Panel ── */}
                <div className="login-right">
                    <AnimatePresence mode="wait">
                        {!showManualForm ? (
                            <motion.div
                                key="choice"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
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
                                                className="login-btn"
                                                style={{ background: '#fff', color: '#1a2340', border: '1.5px solid #e2d9c5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textTransform: 'none' }}
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
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowManualForm(false)}
                                    className="login-back-link"
                                >
                                    <ArrowLeft size={14} /> {language === 'en' ? 'Use Google Sign-In' : 'Google સાઇન-અપ વાપરો'}
                                </button>

                                <h1 className="login-title">{language === 'en' ? 'Login Manually' : 'જાતે લોગીન કરો'}</h1>
                                <p className="login-subtitle">{language === 'en' ? 'Enter your registered email and password' : 'તમારો રજીસ્ટર્ડ ઇમેઇલ અને પાસવર્ડ દાખલ કરો'}</p>

                                {error && <div className="login-error">⚠ {error}</div>}

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