import React, { useState, useEffect } from 'react';
import { Home, Briefcase, Phone, CheckCircle2, ShieldCheck, KeyRound, ArrowLeft, RefreshCw, X, AlertCircle, Gift } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSettings } from '../context/SettingsContext';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../config/firebase';

const CompleteProfileModal = ({ isOpen, user, onComplete, onClose, error: externalError }) => {
    const { settings } = useSettings();
    const [dismissed, setDismissed] = useState(false);
    const [formData, setFormData] = useState(() => {
        const searchRef = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : '';
        const storageRef = typeof window !== 'undefined' ? localStorage.getItem('pending_referral_code') : '';
        const initialRef = (searchRef || storageRef || '').toUpperCase().trim();
        return {
            role: (user?.role === 'Broker' || user?.role === 'Admin') ? user.role : 'User',
            phone: user?.phone || '',
            referralCode: initialRef,
            otp: ''
        };
    });
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState(null);

    // Sync referral code and user info whenever modal opens or mounts
    useEffect(() => {
        if (isOpen) {
            const searchRef = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : '';
            const storageRef = typeof window !== 'undefined' ? localStorage.getItem('pending_referral_code') : '';
            const activeRef = (searchRef || storageRef || '').toUpperCase().trim();
            if (activeRef) {
                localStorage.setItem('pending_referral_code', activeRef);
            }
            setFormData(prev => ({
                ...prev,
                role: (user?.role === 'Broker' || user?.role === 'Admin') ? user.role : 'User',
                phone: user?.phone || prev.phone || '',
                referralCode: activeRef || prev.referralCode || ''
            }));
        }
    }, [isOpen, user]);

    /* OTP Code commented out for now as requested
    const [step, setStep] = useState(1);
    const [sendingOTP, setSendingOTP] = useState(false);
    const [verifyingOTP, setVerifyingOTP] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [confirmationResult, setConfirmationResult] = useState(null);

    useEffect(() => {
        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                    window.recaptchaVerifier = null;
                } catch (e) {
                    // ignore
                }
            }
        };
    }, []);
    */

    if (!isOpen || dismissed) return null;

    const handleClose = () => {
        setDismissed(true);
        if (onClose) onClose();
    };

    const roles = [
        {
            id: 'User',
            label: 'Individual Property Owner / Buyer',
            desc: 'Buy land & plots, or post your own properties freely',
            icon: Home,
            colorClass: 'bg-blue-50 text-blue-600 border-blue-100'
        },
        {
            id: 'Broker',
            label: 'Real Estate Broker / Agent',
            desc: 'Manage client listings with Verified Agent Stamp',
            icon: Briefcase,
            colorClass: 'bg-indigo-50 text-indigo-600 border-indigo-100'
        },
    ];

    // Direct registration / profile completion without OTP verification
    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        setLocalError(null);

        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
            setLocalError('Please enter a valid 10-digit mobile number.');
            return;
        }

        setSubmitting(true);
        try {
            await onComplete({
                role: formData.role,
                phone: cleanPhone,
                referralCode: formData.referralCode ? formData.referralCode.trim().toUpperCase() : undefined
            });
            localStorage.removeItem('pending_referral_code');
            toast.success('Profile completed & registered successfully!');
        } catch (err) {
            setLocalError(err.response?.data?.error || err.response?.data?.message || 'Failed to complete profile.');
        } finally {
            setSubmitting(false);
        }
    };

    /* Commented out OTP functions for future reference:
    const initRecaptcha = () => { ... };
    const handleSendOTP = async (e) => { ... };
    const handleVerifyOTP = async (e) => { ... };
    const handleResendOTP = async () => { ... };
    */

    const displayError = localError || externalError;

    return (
        <div
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
            className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 font-['Inter',sans-serif] animate-fade-in"
        >
            <div onClick={(e) => e.stopPropagation()} className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
                {/* Invisible reCAPTCHA container for Firebase */}
                <div id="recaptcha-container"></div>

                {/* Top Accent Gradient Bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 absolute top-0 left-0" />

                {/* Prominent Close Button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-xs group"
                    aria-label="Close modal"
                    title="Close Modal"
                >
                    <X size={18} className="group-hover:scale-110 transition-transform" />
                </button>

                {/* Header */}
                <div className="text-center mb-6 pt-2">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs border border-blue-100">
                        <ShieldCheck size={28} />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Complete Your Profile
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Select account type & enter your 10-digit mobile number to complete registration.
                    </p>
                </div>

                {/* Error Banner */}
                {displayError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold mb-4 flex items-center gap-2.5 shadow-2xs">
                        <AlertCircle size={18} className="text-rose-600 shrink-0" />
                        <span>{displayError}</span>
                    </div>
                )}

                {/* Account Type Selection & Mobile Phone Form */}
                <form onSubmit={handleSubmitProfile} className="space-y-5">
                    {/* Role selector */}
                    <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                            Select Account Type
                        </label>
                        <div className="space-y-2.5">
                            {roles.map((r) => {
                                const Icon = r.icon;
                                const isSelected = formData.role === r.id;
                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: r.id })}
                                        className={`w-full flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${isSelected
                                            ? "border-blue-600 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20"
                                            : "border-slate-200 bg-slate-50 hover:bg-slate-100/80"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${r.colorClass}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-extrabold ${isSelected ? "text-blue-900" : "text-slate-900"}`}>
                                                    {r.label}
                                                </span>
                                                {isSelected && (
                                                    <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                                                )}
                                            </div>
                                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5 line-clamp-2">
                                                {r.desc}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile Phone Input */}
                    <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                            Mobile Phone Number
                        </label>
                        <div className="relative flex items-center">
                            <div className="absolute left-3.5 text-xs font-bold text-slate-500 flex items-center gap-1 pointer-events-none">
                                <Phone size={14} className="text-slate-400" />
                                <span>+91</span>
                            </div>
                            <span className="absolute left-3.5 text-xs font-black text-slate-400 pointer-events-none">
                                +91
                            </span>
                            <input
                                type="tel"
                                required
                                maxLength={10}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                placeholder="10-digit mobile number"
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all font-bold text-slate-900 text-sm placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Referral Code (Optional) */}
                    {settings.enableRewardsSystem !== false && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                    Referral Code (Optional)
                                </label>
                                {formData.referralCode && (
                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                                        <Check size={11} /> +100 Bonus Coins (₹5.00)
                                    </span>
                                )}
                            </div>
                            <div className="relative flex items-center">
                                <div className="absolute left-3.5 text-xs font-bold text-amber-500 flex items-center pointer-events-none">
                                    <Gift size={16} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="e.g. KP9823AB (Bonus ₹5 Coins)"
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider placeholder:text-slate-400 placeholder:normal-case placeholder:font-normal ${formData.referralCode
                                            ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950 focus:border-emerald-500'
                                            : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                        }`}
                                    value={formData.referralCode}
                                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting || !formData.phone || formData.phone.length !== 10}
                            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    Saving Details...
                                </>
                            ) : (
                                "Save & Continue"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompleteProfileModal;
