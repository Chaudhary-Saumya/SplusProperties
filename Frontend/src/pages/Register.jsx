import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, ArrowLeft, Mail, User, Phone, LandPlot, Ruler, BadgeCheck, UserCheck, Briefcase, Gift, Check, AlertCircle } from 'lucide-react';
import CompleteProfileModal from '../components/CompleteProfileModal';
import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

const Register = () => {
    const { language, t } = useLanguage();
    const { settings } = useSettings();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState(() => {
        const urlRef = searchParams.get('ref');
        const savedRef = localStorage.getItem('pending_referral_code');
        const initialRef = (urlRef || savedRef || '').toUpperCase().trim();
        return {
            name: '',
            email: '',
            password: '',
            role: 'Buyer',
            phone: '',
            referralCode: initialRef
        };
    });

    useEffect(() => {
        const urlRef = searchParams.get('ref');
        const savedRef = localStorage.getItem('pending_referral_code');
        const cleanRef = (urlRef || savedRef || '').toUpperCase().trim();
        if (cleanRef) {
            localStorage.setItem('pending_referral_code', cleanRef);
            setFormData(prev => ({ ...prev, referralCode: cleanRef }));
        }
    }, [searchParams]);
    const { register, googleLogin, completeProfile, user } = useContext(AuthContext);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [showManualForm, setShowManualForm] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Restriction for phone: only numbers and max 10 digits
        if (name === 'phone') {
            const onlyNums = value.replace(/[^0-9]/g, '');
            if (onlyNums.length <= 10) {
                setFormData({ ...formData, [name]: onlyNums });
            }
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await register(formData);
            if (data?.user?.role === 'Admin' || formData.role === 'Admin') navigate('/admin');
            else navigate('/');
        } catch (err) {
            // Check for specific backend message first, then error field, then fallback
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.';
            setError(errorMessage);
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
                    else navigate('/');
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
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Profile completion failed.');
        }
    };

    const roles = [
        { 
            value: 'User',  
            label: language === 'en' ? 'Individual User / Owner' : 'વ્યક્તિગત વપરાશકર્તા / માલિક', 
            desc: language === 'en' ? 'Explore, buy, or post your own land/plots' : 'જમીન ખરીદો, જુઓ અથવા લિસ્ટ કરો',  
            icon: <UserCheck size={22} className="mx-auto mb-1 text-amber-500" />
        },
        { 
            value: 'Broker', 
            label: language === 'en' ? 'Real Estate Agent / Broker' : 'રિયલ એસ્ટેટ એજન્ટ / બ્રોકર',     
            desc: language === 'en' ? 'Manage client listings with Verified Broker Stamp' : 'વરિફાઇડ બ્રોકર સ્ટેમ્પ સાથે મિલકત મેનેજ કરો',     
            icon: <BadgeCheck size={22} className="mx-auto mb-1 text-blue-600" />
        },
    ];

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

                .reg-page {
                    min-height: calc(100vh - 68px);
                    display: flex;
                    flex-direction: column;
                    font-family: 'Nunito Sans', sans-serif;
                    background: #f8f5ee;
                }
                @media (min-width: 900px) {
                    .reg-page {
                        flex-direction: row;
                    }
                }

                /* ── Mobile Hero Header (< 900px) ── */
                .reg-mobile-hero {
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
                    .reg-mobile-hero { display: none; }
                }

                .reg-mobile-hero-img {
                    position: absolute; inset: 0;
                    width: 100%; height: 100%;
                    object-fit: cover;
                    opacity: 0.38;
                }

                .reg-mobile-hero-overlay {
                    position: absolute; inset: 0;
                    background: linear-gradient(180deg, rgba(26,35,64,0.75) 0%, rgba(26,35,64,0.95) 100%);
                }

                .reg-mobile-hero-content {
                    position: relative;
                    z-index: 2;
                    max-width: 400px;
                }

                /* ── Left Panel (Desktop >= 900px) ── */
                .reg-left {
                    display: none;
                    flex: 1.1;
                    position: relative;
                    overflow: hidden;
                    background: #1a2340;
                    flex-direction: column;
                    justify-content: flex-end;
                }
                @media (min-width: 900px) { .reg-left { display: flex; } }

                .reg-left::before, .reg-mobile-hero::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #c9a84c, #f0d080, #c9a84c);
                    z-index: 3;
                }
                .reg-left-img {
                    position: absolute; inset: 0;
                    width: 100%; height: 100%;
                    object-fit: cover; opacity: 0.38;
                }
                .reg-left-overlay {
                    position: relative; z-index: 2;
                    padding: 48px;
                }
                .reg-left-tag {
                    display: inline-block;
                    background: rgba(201,168,76,0.22);
                    border: 1px solid rgba(201,168,76,0.55);
                    color: #f0d080;
                    font-size: 11px; font-weight: 800;
                    letter-spacing: 2px; text-transform: uppercase;
                    padding: 5px 16px; border-radius: 100px;
                    margin-bottom: 16px;
                }
                .reg-left-heading {
                    font-size: clamp(1.8rem, 2.8vw, 2.6rem);
                    color: #fff; font-weight: 800; line-height: 1.25;
                    margin: 0 0 16px;
                    letter-spacing: -0.5px;
                }
                .reg-left-sub {
                    color: rgba(255,255,255,0.75);
                    font-size: 14px; font-weight: 500; line-height: 1.7;
                    max-width: 360px; margin-bottom: 32px;
                }
                .reg-steps { display: flex; flex-direction: column; gap: 16px; }
                .reg-step {
                    display: flex; align-items: flex-start; gap: 14px;
                }
                .reg-step-num {
                    width: 30px; height: 30px; border-radius: 50%;
                    background: rgba(201,168,76,0.25);
                    border: 1.5px solid rgba(201,168,76,0.6);
                    color: #f0d080; font-size: 12px; font-weight: 800;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; margin-top: 1px;
                }
                .reg-step-text { font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 600; line-height: 1.5; }
                .reg-step-text strong { color: #fff; display: block; margin-bottom: 2px; }

                /* ── Right Form Panel ── */
                .reg-right {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 32px 20px 48px;
                    background: #fff;
                    box-sizing: border-box;
                    overflow-y: auto;
                }
                @media (max-width: 899px) {
                    .reg-right {
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
                    .reg-right {
                        max-width: 500px;
                        padding: 48px 40px;
                        box-shadow: -8px 0 40px rgba(26,35,64,0.08);
                    }
                }

                .reg-title {
                    font-size: 26px; font-weight: 800;
                    color: #1a2340; margin: 0 0 6px;
                    letter-spacing: -0.3px;
                }
                .reg-subtitle {
                    font-size: 14px; color: #6b7280; font-weight: 500;
                    margin-bottom: 28px; line-height: 1.5;
                }

                /* Error */
                .reg-error {
                    background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
                    padding: 12px 16px; border-radius: 12px;
                    font-size: 13px; font-weight: 600;
                    margin-bottom: 20px;
                }

                /* Fields */
                .reg-row { display: flex; gap: 14px; flex-wrap: wrap; }
                .reg-row .reg-field { flex: 1; min-width: 140px; }

                .reg-field { margin-bottom: 18px; }
                .reg-label {
                    display: block; font-size: 11px; font-weight: 800;
                    color: #1a2340; text-transform: uppercase; letter-spacing: 0.8px;
                    margin-bottom: 7px;
                }
                .reg-input {
                    width: 100%; box-sizing: border-box;
                    padding: 12px 15px; border-radius: 12px;
                    border: 1.5px solid #e2d9c5; background: #fdfaf5;
                    font-size: 14px; font-weight: 600; color: #1a2340;
                    font-family: 'Nunito Sans', sans-serif;
                    outline: none; transition: all 0.2s;
                    appearance: none;
                }
                .reg-input::placeholder { color: #b0a898; font-weight: 500; }
                .reg-input:focus {
                    border-color: #c9a84c;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
                    background: #fff;
                }

                /* Role Selector */
                .reg-role-grid {
                    display: flex; gap: 10px; margin-bottom: 18px;
                    flex-wrap: wrap;
                }
                .reg-role-card {
                    flex: 1; min-width: 130px;
                    border: 1.5px solid #e2d9c5;
                    border-radius: 14px; padding: 14px 12px;
                    cursor: pointer; text-align: center;
                    background: #fdfaf5;
                    transition: all 0.2s;
                    user-select: none;
                }
                .reg-role-card.selected {
                    border-color: #c9a84c;
                    background: #fffbf0;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
                }
                .reg-role-card:hover:not(.selected) {
                    border-color: #1a2340; background: #f8f5ee;
                }
                .reg-role-icon { font-size: 22px; margin-bottom: 6px; }
                .reg-role-name {
                    font-size: 12px; font-weight: 800; color: #1a2340;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .reg-role-desc {
                    font-size: 10px; color: #9ca3af; font-weight: 500;
                    margin-top: 4px; line-height: 1.4;
                }
                .reg-role-card.selected .reg-role-name { color: #b8933a; }

                /* Submit */
                .reg-btn {
                    width: 100%; padding: 14px;
                    background: #1a2340; color: #fff;
                    border: none; border-radius: 12px; cursor: pointer;
                    font-size: 14px; font-weight: 800; letter-spacing: 1px;
                    text-transform: uppercase; font-family: 'Nunito Sans', sans-serif;
                    transition: all 0.2s;
                    margin-top: 4px;
                    box-shadow: 0 4px 14px rgba(26,35,64,0.18);
                }
                .reg-btn:hover:not(:disabled) { background: #c9a84c; color: #1a1200; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,168,76,0.3); }
                .reg-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .reg-native-google-btn {
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
                .reg-divider {
                    display: flex; align-items: center; gap: 12px;
                    margin: 22px 0;
                }
                .reg-divider-line { flex: 1; height: 1px; background: #e2d9c5; }
                .reg-divider-text {
                    font-size: 11px; font-weight: 800; color: #9ca3af;
                    text-transform: uppercase; letter-spacing: 1px;
                }

                .reg-google-wrap { display: flex; justify-content: center; }

                .reg-footer {
                    text-align: center; margin-top: 24px;
                    font-size: 13px; color: #6b7280; font-weight: 600;
                }
                .reg-footer a {
                    color: #c9a84c; font-weight: 800; text-decoration: none; margin-left: 5px;
                }
                .reg-footer a:hover { text-decoration: underline; }

                .reg-btn-outline {
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
                .reg-btn-outline:hover {
                    background: #fdfaf5;
                    border-color: #1a2340;
                    transform: translateY(-1px);
                }
                .reg-back-link {
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
                .reg-back-link:hover {
                    color: #1a2340;
                }
                .reg-google-container {
                    background: linear-gradient(135deg, #fdfaf5 0%, #fffbf0 100%);
                    border: 1.5px dashed #e2d9c5;
                    border-radius: 16px;
                    padding: 24px 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>

            <div className="reg-page">

                {/* ── Mobile Hero Header (< 900px) ── */}
                <div className="reg-mobile-hero">
                    <img
                        className="reg-mobile-hero-img"
                        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80"
                        alt="Land & Plots"
                    />
                    <div className="reg-mobile-hero-overlay" />
                    <div className="reg-mobile-hero-content">
                        <div className="reg-left-tag">
                            {language === 'en' ? 'Verified Land & Plots Platform' : 'વેરિફાઇડ લેન્ડ એન્ડ પ્લોટ પ્લેટફોર્મ'}
                        </div>
                        <h2 className="text-xl font-extrabold text-white mb-2 leading-snug">
                            {language === 'en' ? 'Start Your Land Journey Today' : 'આજે જ તમારી જમીનની સફર શરૂ કરો'}
                        </h2>
                        <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                            <span className="inline-flex items-center gap-1.5"><UserCheck size={13} className="text-amber-400" /> {language === 'en' ? 'Free Registration' : 'મફત રજીસ્ટ્રેશન'}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1.5"><Ruler size={13} className="text-amber-400" /> {language === 'en' ? 'Smart Map Tools' : 'સ્માર્ટ નકશા સાધનો'}</span>
                        </div>
                    </div>
                </div>

                {/* ── Left Panel (Desktop >= 900px) ── */}
                <div className="reg-left">
                    <img
                        className="reg-left-img"
                        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80"
                        alt="Land Plots"
                    />
                    <div className="reg-left-overlay">
                        <div className="reg-left-tag">
                            {language === 'en' ? 'Trusted Land & Plot Platform' : 'ભરોસાપાત્ર લેન્ડ એન્ડ પ્લોટ પ્લેટફોર્મ'}
                        </div>
                        <h2 className="reg-left-heading">
                            {language === 'en' ? (
                                <>Start Your Property<br />Journey Today</>
                            ) : (
                                <>આજે જ તમારી પ્રોપર્ટી<br />સફર શરૂ કરો</>
                            )}
                        </h2>
                        <p className="reg-left-sub">
                            {language === 'en'
                                ? "Create a free account and get access to thousands of verified land plots, smart boundary tools and direct seller contacts."
                                : "મફત એકાઉન્ટ બનાવો અને હજારો વેરિફાઇડ પ્લોટ્સ, સ્માર્ટ સીમા નકશા સાધનો અને સીધા વેચનારના સંપર્ક મેળવો."}
                        </p>
                        <div className="reg-steps">
                            {[
                                { 
                                    title: language === 'en' ? 'Create Your Account' : 'તમારું એકાઉન્ટ બનાવો', 
                                    desc: language === 'en' ? 'Sign up free in under 2 minutes' : '૨ મિનિટથી ઓછા સમયમાં મફત સાઇન અપ કરો' 
                                },
                                { 
                                    title: language === 'en' ? 'Browse Verified Land Plots' : 'વેરિફાઇડ જમીન પ્લોટ્સ જુઓ', 
                                    desc: language === 'en' ? 'Explore farmland, plots & commercial sites' : 'ખેતીની જમીન, પ્લોટ્સ અને કોમર્શિયલ સાઇટ્સ શોધો' 
                                },
                                { 
                                    title: language === 'en' ? 'Connect Directly' : 'સીધો સંપર્ક કરો', 
                                    desc: language === 'en' ? 'Contact land owners with zero brokerage' : 'કોઈપણ દલાલી વિના જમીન માલિકોનો સંપર્ક કરો' 
                                },
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

                {/* ── Right Panel Form Card ── */}
                <div className="reg-right">
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
                                <h1 className="reg-title">{t('auth.register_title')}</h1>
                                <p className="reg-subtitle">{t('auth.register_subtitle')}</p>

                                {error && <div className="reg-error"><AlertCircle size={14} /> <span>{error}</span></div>}

                                {/* Active Referral Code Banner */}
                                {settings.enableRewardsSystem !== false && formData.referralCode && (
                                    <div style={{
                                        marginBottom: '16px',
                                        padding: '12px 14px',
                                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.06))',
                                        border: '1px solid rgba(245, 158, 11, 0.4)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '10px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Gift size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>
                                                    Referral Code: <span style={{ color: '#d97706', fontFamily: 'monospace', fontSize: '13px' }}>{formData.referralCode}</span>
                                                </div>
                                                <div style={{ fontSize: '10px', fontWeight: '600', color: '#64748b' }}>
                                                    +100 Bonus Coins (₹5.00) will be added!
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', background: '#10b981', color: '#fff', padding: '4px 8px', borderRadius: '8px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Check size={12} /> Applied
                                        </span>
                                    </div>
                                )}

                                {/* Google Sign-Up at the Top */}
                                <div className="reg-google-container" style={{ marginBottom: '24px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#1a2340', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                                        {language === 'en' ? 'Quick Sign-Up' : 'ઝડપી સાઇન-અપ'}
                                    </span>
                                    <div className="reg-google-wrap" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                        {Capacitor.isNativePlatform() ? (
                                            <button
                                                type="button"
                                                className="reg-btn reg-native-google-btn"
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
                                                        setError('Google Registration Canceled or Failed');
                                                    }
                                                }}
                                            >
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="20" height="20" />
                                                {language === 'en' ? 'Sign up with Google' : 'Google સાથે સાઇન અપ કરો'}
                                            </button>
                                        ) : (
                                            <GoogleLogin
                                                onSuccess={res => handleGoogleSuccess(res.credential)}
                                                onError={() => setError('Google Registration Failed')}
                                                width="380"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="reg-divider" style={{ margin: '12px 0 24px' }}>
                                    <div className="reg-divider-line" />
                                    <span className="reg-divider-text">{language === 'en' ? 'Or Register Manually' : 'અથવા જાતે રજીસ્ટર કરો'}</span>
                                    <div className="reg-divider-line" />
                                </div>

                                {/* Manual signup toggle */}
                                <button
                                    type="button"
                                    onClick={() => setShowManualForm(true)}
                                    className="reg-btn-outline"
                                    style={{ marginBottom: '16px' }}
                                >
                                    <Mail size={16} color="#c9a84c" />
                                    <span>{language === 'en' ? 'Sign Up with Email / Phone' : 'ઇમેઇલ / ફોન દ્વારા સાઇન અપ કરો'}</span>
                                </button>

                                <p className="reg-footer" style={{ marginTop: '16px' }}>
                                    {language === 'en' ? 'Already have an account?' : 'પહેલેથી જ એકાઉન્ટ છે?'}
                                    <Link to="/login">{t('auth.btn_login')}</Link>
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
                                    className="reg-back-link"
                                >
                                    <ArrowLeft size={14} /> {language === 'en' ? 'Use Google Sign-Up' : 'Google સાઇન-અપ વાપરો'}
                                </button>

                                <h1 className="reg-title">{language === 'en' ? 'Register Manually' : 'જાતે રજીસ્ટર કરો'}</h1>
                                <p className="reg-subtitle">{language === 'en' ? 'Enter your profile and contact information' : 'તમારી પ્રોફાઇલ અને સંપર્ક માહિતી દાખલ કરો'}</p>

                                {error && <div className="reg-error"><AlertCircle size={14} /> <span>{error}</span></div>}

                                <form onSubmit={handleSubmit}>
                                    {/* Name + Phone */}
                                    <div className="reg-row">
                                        <div className="reg-field">
                                            <label htmlFor="name" className="reg-label">{t('auth.name')}</label>
                                            <input
                                                id="name"
                                                type="text" name="name" className="reg-input"
                                                value={formData.name} onChange={handleChange}
                                                placeholder={language === 'en' ? 'Your full name' : 'તમારું આખું નામ'} required
                                            />
                                        </div>
                                        <div className="reg-field">
                                            <label htmlFor="phone" className="reg-label">{t('auth.phone')}</label>
                                            <input
                                                id="phone"
                                                type="tel" name="phone" className="reg-input"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="9876543210" required
                                                maxLength="10"
                                                pattern="[0-9]{10}"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="reg-field">
                                        <label htmlFor="email" className="reg-label">{t('auth.email')}</label>
                                        <input
                                            id="email"
                                            type="email" name="email" className="reg-input"
                                            value={formData.email} onChange={handleChange}
                                            placeholder="you@email.com" required
                                        />
                                    </div>

                                    {/* Role Selector */}
                                    <div className="reg-field">
                                        <label className="reg-label">{t('auth.role')}</label>
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
                                        <label htmlFor="password" className="reg-label">{t('auth.password')}</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                className="reg-input"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder={language === 'en' ? 'Min. 6 characters' : 'ઓછામાં ઓછા ૬ અક્ષર'}
                                                required
                                                minLength="6"
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

                                    {/* Referral Code (Optional) */}
                                    {settings.enableRewardsSystem !== false && (
                                        <div className="reg-field">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <label htmlFor="referralCode" className="reg-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                                    <Gift size={14} className="text-amber-500" />
                                                    <span>{language === 'en' ? 'Referral Code (Optional)' : 'રેફરલ કોડ (વૈકલ્પિક)'}</span>
                                                </label>
                                                {formData.referralCode && (
                                                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', background: '#d1fae5', padding: '2px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Check size={11} /> Bonus Applied
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                id="referralCode"
                                                type="text"
                                                name="referralCode"
                                                className="reg-input"
                                                value={formData.referralCode}
                                                onChange={handleChange}
                                                placeholder={language === 'en' ? 'e.g. KP9823AB (Bonus ₹5 Coins)' : 'દા.ત. KP9823AB'}
                                                style={{
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    fontWeight: 'bold',
                                                    borderColor: formData.referralCode ? '#f59e0b' : undefined,
                                                    background: formData.referralCode ? '#fffbeb' : undefined
                                                }}
                                            />
                                        </div>
                                    )}

                                    <button type="submit" className="reg-btn" disabled={loading}>
                                        {loading ? (language === 'en' ? 'Creating Account...' : 'એકાઉન્ટ બની રહ્યું છે...') : (language === 'en' ? 'Create My Account →' : 'નવું એકાઉન્ટ બનાવો →')}
                                    </button>
                                </form>

                                <p className="reg-footer" style={{ marginTop: '24px' }}>
                                    {language === 'en' ? 'Already have an account?' : 'પહેલેથી જ એકાઉન્ટ છે?'}
                                    <Link to="/login">{t('auth.btn_login')}</Link>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};

export default Register;