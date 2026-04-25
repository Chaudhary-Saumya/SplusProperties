import React, { useState, useContext, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, RefreshCw, ArrowLeft, Building2, ChevronRight, Mail } from 'lucide-react';

const VerifyOTP = () => {
    const [otp,       setOtp]       = useState(['', '', '', '', '', '']);
    const [error,     setError]     = useState(null);
    const [loading,   setLoading]   = useState(false);
    const [resending, setResending] = useState(false);
    const [timer,     setTimer]     = useState(60);
    const { verifyOTP, resendOTP }  = useContext(AuthContext);
    const location  = useLocation();
    const navigate  = useNavigate();
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    const queryParams = new URLSearchParams(location.search);
    const email       = queryParams.get('email');

    useEffect(() => {
        if (!email) navigate('/register');
    }, [email, navigate]);

    useEffect(() => {
        let interval;
        if (timer > 0) interval = setInterval(() => setTimer(p => p - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp     = [...otp];
        newOtp[index]    = value.substring(value.length - 1);
        setOtp(newOtp);
        if (value && index < 5) inputRefs[index + 1].current.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0)
            inputRefs[index - 1].current.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) { setError('Please enter all 6 digits'); return; }
        setLoading(true);
        setError(null);
        try {
            await verifyOTP(email, otpString);
            navigate('/search');
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setResending(true);
        setError(null);
        try {
            await resendOTP(email);
            setTimer(60);
            toast.success('OTP resent successfully!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    // Progress ring for countdown
    const radius    = 18;
    const circ      = 2 * Math.PI * radius;
    const progress  = (timer / 60) * circ;

    return (
        <div className="min-h-screen bg-[#f8f5ee] flex flex-col">

            {/* ── Top hero bar ── */}
            <div className="bg-[#1a2340] text-white px-6 py-8 md:px-16">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center gap-2 text-[#c9a84c] text-xs font-bold uppercase tracking-[0.2em]">
                        <Building2 size={13} />
                        <span>Splus Properties</span>
                        <ChevronRight size={11} />
                        <span>Verify Email</span>
                    </div>
                </div>
            </div>

            {/* ── Card ── */}
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">

                    {/* Shield icon */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="w-24 h-24 bg-[#1a2340] rounded-2xl flex items-center justify-center shadow-xl">
                                <ShieldCheck size={44} className="text-[#c9a84c]" />
                            </div>
                            {/* Decorative ring */}
                            <div className="absolute -inset-2 rounded-3xl border-2 border-[#c9a84c]/20 pointer-events-none" />
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black text-[#1a2340] tracking-tight mb-2">
                            Verify Your <span className="text-[#c9a84c]">Email</span>
                        </h2>
                        <p className="text-[#1a2340]/50 text-sm font-medium leading-relaxed">
                            We've sent a 6-digit code to
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 bg-white border border-[#1a2340]/10 rounded-xl px-4 py-2 shadow-sm">
                            <Mail size={14} className="text-[#c9a84c] shrink-0" />
                            <span className="text-[#1a2340] font-black text-sm">{email}</span>
                        </div>
                    </div>

                    {/* Main card */}
                    <div className="bg-white rounded-2xl border border-[#1a2340]/10 shadow-sm p-8 space-y-7">

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2">
                                <span className="shrink-0 text-base">⚠️</span> {error}
                            </div>
                        )}

                        {/* OTP inputs */}
                        <form onSubmit={handleSubmit} className="space-y-7">
                            <div>
                                <p className="text-[10px] font-black text-[#1a2340]/40 uppercase tracking-[0.15em] text-center mb-4">
                                    Enter 6-digit code
                                </p>
                                <div className="flex justify-center gap-2.5">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={inputRefs[index]}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className={`w-11 h-14 text-center text-2xl font-black rounded-xl border-2 outline-none transition-all bg-[#f8f5ee]/60 text-[#1a2340]
                                                ${digit
                                                    ? 'border-[#c9a84c] bg-[#c9a84c]/5 shadow-md shadow-[#c9a84c]/10'
                                                    : 'border-[#1a2340]/15 focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/10'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#1a2340] hover:bg-[#243060] text-[#c9a84c] py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {loading
                                    ? <><RefreshCw className="animate-spin" size={16} /> Verifying...</>
                                    : <><ShieldCheck size={16} /> Verify Account</>
                                }
                            </button>
                        </form>

                        {/* Resend section */}
                        <div className="pt-5 border-t border-[#f8f5ee]">
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-[#1a2340]/40 text-xs font-medium">
                                    Didn't receive the code?
                                </p>

                                {/* Countdown ring + resend button */}
                                <div className="flex items-center gap-3">
                                    {timer > 0 && (
                                        <div className="relative w-10 h-10 shrink-0">
                                            <svg width="40" height="40" className="-rotate-90">
                                                <circle cx="20" cy="20" r={radius} fill="none" stroke="#f0ebe0" strokeWidth="3" />
                                                <circle
                                                    cx="20" cy="20" r={radius}
                                                    fill="none"
                                                    stroke="#c9a84c"
                                                    strokeWidth="3"
                                                    strokeDasharray={circ}
                                                    strokeDashoffset={circ - progress}
                                                    strokeLinecap="round"
                                                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                                                />
                                            </svg>
                                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#1a2340]">
                                                {timer}s
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleResend}
                                        disabled={timer > 0 || resending}
                                        className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-all ${
                                            timer > 0 || resending
                                                ? 'text-[#1a2340]/20 cursor-not-allowed'
                                                : 'text-[#c9a84c] hover:text-[#b8943e]'
                                        }`}
                                    >
                                        {resending
                                            ? <RefreshCw className="animate-spin" size={13} />
                                            : <RefreshCw size={13} />
                                        }
                                        Resend
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Back link */}
                    <div className="text-center mt-6">
                        <button
                            onClick={() => navigate('/register')}
                            className="text-[#1a2340]/40 hover:text-[#1a2340] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-colors"
                        >
                            <ArrowLeft size={13} /> Back to Register
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;