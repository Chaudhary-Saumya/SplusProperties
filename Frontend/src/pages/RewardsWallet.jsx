import React, { useState, useEffect, useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Coins, Gift, Users, ArrowUpRight, CheckCircle2, Copy, Share2,
  Layers, Calculator, Search, Smartphone, Building2,
  Clock, AlertCircle, Sparkles, RefreshCw, Check, ShieldCheck,
  ExternalLink, Loader2, Wallet, ArrowRight, ArrowLeft, Lock, EyeOff, Info, X
} from 'lucide-react';
import SEO from '../components/SEO';
import { GoldCoin, CoinBadge } from '../components/GoldCoin';

const RewardsWallet = () => {
  const { user, token, updateUserCoins, loadUser } = useContext(AuthContext);
  const { language, t } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();

  // Instant render using AuthContext user state if available
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(!user);
  const [refreshing, setRefreshing] = useState(false);
  const [taskLoadingId, setTaskLoadingId] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputReferralCode, setInputReferralCode] = useState('');
  const [applyingReferral, setApplyingReferral] = useState(false);

  // Dynamic economy config with admin defaults
  const coinRate = wallet?.coinRate || settings?.coinToINRRate || 20;
  const minWithdrawalINR = wallet?.minWithdrawalINR || settings?.minWithdrawalINR || 50;
  const minCoins = wallet?.minWithdrawalCoins || (minWithdrawalINR * coinRate);
  const isSystemActive = settings?.enableRewardsSystem !== false && (wallet ? wallet.isEnabled !== false : true);

  // Withdrawal Form State
  const [payoutType, setPayoutType] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({
    holderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const fetchWallet = async (showToast = false) => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      if (showToast) setRefreshing(true);
      if (!axios.defaults.headers.common['Authorization']) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${activeToken}`;
      }
      const res = await axios.get('/api/rewards/wallet');
      if (res.data?.success) {
        setWallet(res.data.data);
        if (updateUserCoins && res.data.data.coinsBalance !== undefined) {
          updateUserCoins(res.data.data.coinsBalance);
        }
        if (showToast) {
          toast.success(language === 'gu' ? 'વૉલેટ ડેટા અપડેટ થયો!' : 'Wallet refreshed!');
        }
      }
    } catch (err) {
      console.error('Wallet fetch error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [token, user?.id]);

  const handleClaimTask = async (taskId, redirectUrl = null) => {
    if (!user) {
      toast.info(language === 'gu' ? 'કૃપા કરીને સિક્કા મેળવવા માટે લૉગિન કરો.' : 'Please login to claim coins.');
      navigate('/login');
      return;
    }

    try {
      setTaskLoadingId(taskId);
      const res = await axios.post('/api/rewards/claim-task', { taskId });
      if (res.data?.success) {
        toast.success(res.data.message || '+20 Coins (₹1.00) Added to Wallet!');
        if (updateUserCoins && res.data.newBalance !== undefined) {
          updateUserCoins(res.data.newBalance);
        }
        
        // Optimistic UI update so task immediately reflects as completed
        setWallet((prev) => {
          if (!prev) return prev;
          const updatedTasks = { ...prev.tasks };
          if (taskId === 'LAND_MAP_USED' && updatedTasks.landMap) updatedTasks.landMap.completed = true;
          if (taskId === 'AREA_CONVERTER_USED' && updatedTasks.areaConverter) updatedTasks.areaConverter.completed = true;
          if (taskId === 'VIEW_LISTINGS' && updatedTasks.viewListings) updatedTasks.viewListings.completed = true;
          if (taskId === 'DAILY_CHECKIN' && updatedTasks.dailyCheckin) updatedTasks.dailyCheckin.completed = true;
          if (taskId === 'FIRST_PROPERTY_LISTING' && updatedTasks.firstProperty) updatedTasks.firstProperty.completed = true;
          return { ...prev, coinsBalance: res.data.newBalance || prev.coinsBalance + 20, tasks: updatedTasks };
        });

        await fetchWallet();
        if (redirectUrl) {
          setTimeout(() => navigate(redirectUrl), 400);
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Unable to claim task reward';
      toast.info(errMsg);
      await fetchWallet();
      if (redirectUrl) {
        setTimeout(() => navigate(redirectUrl), 300);
      }
    } finally {
      setTaskLoadingId(null);
    }
  };

  const handleWithdrawClick = () => {
    const currentCoins = wallet?.coinsBalance !== undefined ? wallet.coinsBalance : (user?.coinsBalance || 0);
    const minCoins = wallet?.minWithdrawalCoins || 600;

    if (currentCoins < minCoins) {
      setShowLowBalanceModal(true);
      return;
    }
    setShowWithdrawModal(true);
  };

  const handleCopy = (text, type = 'code') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
    toast.success(language === 'gu' ? 'ક્લિપબોર્ડ પર કૉપિ કર્યું!' : 'Copied to clipboard!');
  };

  const handleWhatsAppShare = () => {
    const refCode = wallet?.referralCode || user?.referralCode || '';
    const shareUrl = `${window.location.origin}/register?ref=${refCode}`;
    const message = language === 'gu'
      ? `ખરસાણ પ્રોપર્ટીઝ એપ પર રજીસ્ટર કરો અને મેળવો ₹10 ના સિક્કા ફ્રી!\n\nરેફરલ કોડ: *${refCode}*\nલિંક: ${shareUrl}`
      : `Join Kharsan Properties and get ₹10 in free wallet reward coins!\n\nReferral Code: *${refCode}*\nSign up here: ${shareUrl}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleApplyReferralCode = async (e) => {
    e.preventDefault();
    if (!inputReferralCode.trim()) {
      toast.error('Please enter a referral code.');
      return;
    }
    try {
      setApplyingReferral(true);
      const res = await axios.post('/api/rewards/apply-referral', {
        referralCode: inputReferralCode.trim().toUpperCase()
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Referral code applied successfully!');
        setInputReferralCode('');
        await fetchWallet();
        if (loadUser) loadUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply referral code');
    } finally {
      setApplyingReferral(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const currentCoins = wallet?.coinsBalance !== undefined ? wallet.coinsBalance : (user?.coinsBalance || 0);
    const minCoins = wallet?.minWithdrawalCoins || 600;

    if (currentCoins < minCoins) {
      toast.error(`Minimum withdrawal balance is ${minCoins} Coins (₹30.00).`);
      return;
    }

    try {
      setWithdrawLoading(true);
      const payload = {
        paymentType: payoutType,
        upiId: payoutType === 'UPI' ? upiId : undefined,
        holderName: payoutType === 'BANK' ? bankDetails.holderName : undefined,
        bankName: payoutType === 'BANK' ? bankDetails.bankName : undefined,
        accountNumber: payoutType === 'BANK' ? bankDetails.accountNumber : undefined,
        ifscCode: payoutType === 'BANK' ? bankDetails.ifscCode : undefined
      };

      const res = await axios.post('/api/rewards/withdraw', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Withdrawal request submitted successfully!');
        setShowWithdrawModal(false);
        await fetchWallet();
        if (loadUser) loadUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit cashout request');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading && !user && !wallet) {
    return (
      <div className="min-h-[75vh] bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {language === 'gu' ? 'વૉલેટ ડાઉનલોડ થઈ રહ્યું છે...' : 'Loading Rewards Wallet...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 font-['Nunito_Sans',sans-serif] bg-white py-12">
        <SEO title="Coin Rewards & Referral Wallet - Kharsan Properties" description="Earn cash rewards and coins by using land tools and referring friends on Kharsan Properties." />
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 text-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-sm border border-amber-500/20">
            <GoldCoin size={48} glow animated />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === 'gu' ? 'સિક્કા અને રિવોર્ડ્સ વૉલેટ' : 'Coin Rewards & Wallet'}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-2 leading-relaxed">
            {language === 'gu'
              ? 'એકાઉન્ટ બનાવો અને તરત જ ₹10 સુધીના સિક્કા મેળવો! એપ વાપરો અને મિત્રોને રેફર કરીને દર વખતે ₹10 કમાઓ.'
              : 'Sign in to unlock your welcome coins, earn daily cash rewards, and withdraw directly to UPI or Bank!'}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/register"
              className="w-full py-3.5 bg-[#2563eb] hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-xs transition-all text-center"
            >
              {language === 'gu' ? 'નવું એકાઉન્ટ બનાવો (₹5 ફ્રી)' : 'Sign Up & Get 100 Coins (₹5)'}
            </Link>
            <Link
              to="/login"
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm uppercase tracking-wider rounded-xl transition-all text-center"
            >
              {language === 'gu' ? 'લૉગિન કરો' : 'Login to Existing Account'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isSystemActive && !loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 font-['Nunito_Sans',sans-serif] bg-white py-12">
        <SEO title="Coin Rewards - Kharsan Properties" description="Rewards Program" />
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto shadow-sm">
            <GoldCoin size={48} className="grayscale opacity-60" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === 'gu' ? 'રિવોર્ડ્સ પ્રોગ્રામ હાલમાં બંધ છે' : 'Rewards Program Inactive'}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed">
            {language === 'gu'
              ? 'સિક્કા અને કેશઆઉટ સિસ્ટમ હાલમાં મેન્ટેનન્સ માટે અસ્થાયી રૂપે બંધ કરવામાં આવી છે. કૃપા કરીને થોડા સમય પછી ફરી તપાસો.'
              : 'The Coin Rewards & Cashout program is currently paused by administration. Please check back later!'}
          </p>
        </div>
      </div>
    );
  }

  // Calculated Values
  const coinsBalance = wallet?.coinsBalance !== undefined ? wallet.coinsBalance : (user?.coinsBalance || 0);
  const amountINR = (coinsBalance / coinRate).toFixed(2);
  const totalEarnedCoins = wallet?.totalCoinsEarned !== undefined ? wallet.totalCoinsEarned : coinsBalance;
  const totalEarnedINR = (totalEarnedCoins / coinRate).toFixed(2);
  const directCoinsEarned = wallet?.directCoinsEarned !== undefined ? wallet.directCoinsEarned : coinsBalance;
  const directINR = (directCoinsEarned / coinRate).toFixed(2);
  const directCapCoins = wallet?.directCoinsCap || (30 * coinRate);
  const directCapINR = wallet?.directCapINR || (directCapCoins / coinRate).toFixed(2);

  const referralCount = wallet?.referralCount || 0;
  const referralCoinsEarned = wallet?.referralCoinsEarned || 0;
  const referralINR = (referralCoinsEarned / coinRate).toFixed(2);

  const myReferralCode = wallet?.referralCode || user?.referralCode || '';

  // Task Completion Flags (Checking wallet.tasks, claimed fields, and user.completedTasks from AuthContext)
  const todayStr = new Date().toISOString().split('T')[0];
  const userCompletedTasks = user?.completedTasks || [];

  const taskDailyCheckinDone = wallet?.tasks?.dailyCheckin?.completed || 
    wallet?.tasks?.dailyCheckin?.claimedToday ||
    wallet?.tasks?.dailyCheckin?.claimed ||
    userCompletedTasks.some(t => t.taskId === 'DAILY_CHECKIN' && (t.date === todayStr || !t.date));

  const taskLandMapDone = wallet?.tasks?.landMap?.completed || 
    wallet?.tasks?.landMapUsed?.completed ||
    wallet?.tasks?.landMapUsed?.claimed ||
    wallet?.tasks?.landMap?.claimed ||
    userCompletedTasks.some(t => t.taskId === 'LAND_MAP_USED' && (t.date === todayStr || !t.date));

  const taskAreaConverterDone = wallet?.tasks?.areaConverter?.completed || 
    wallet?.tasks?.areaConverterUsed?.completed ||
    wallet?.tasks?.areaConverterUsed?.claimed ||
    wallet?.tasks?.areaConverter?.claimed ||
    userCompletedTasks.some(t => t.taskId === 'AREA_CONVERTER_USED' && (t.date === todayStr || !t.date));

  const taskViewListingsDone = wallet?.tasks?.viewListings?.completed || 
    wallet?.tasks?.viewListings?.claimed ||
    userCompletedTasks.some(t => t.taskId === 'VIEW_LISTINGS' && (t.date === todayStr || !t.date));

  const taskFirstPropertyDone = wallet?.tasks?.firstProperty?.completed || 
    wallet?.tasks?.firstProperty?.claimed ||
    userCompletedTasks.some(t => t.taskId === 'FIRST_PROPERTY_LISTING');

  const firstPropertyCoins = wallet?.tasks?.firstProperty?.coins || 500;
  const firstPropertyINR = (firstPropertyCoins / coinRate).toFixed(2);

  return (
    <div className="min-h-screen bg-white font-['Nunito_Sans',sans-serif]">
      <SEO title="Coin Rewards & Cashout Wallet - Kharsan Properties" description="Track your reward coins, refer friends, and withdraw cash to UPI or Bank." />

      {/* Main Layout Container matching Search Page */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-7 space-y-5 sm:space-y-7 pb-24 sm:pb-16">

        {/* ── Page Top Header ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-1 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0078d4] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                  {coinRate * 5} Coins = ₹5.00 ({coinRate} Coins = ₹1.00)
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                {language === 'gu' ? 'સિક્કા અને રિવોર્ડ્સ વૉલેટ' : 'Rewards & Cashout Wallet'}
              </h1>
            </div>
          </div>
          <button
            onClick={() => fetchWallet(true)}
            disabled={refreshing}
            className="p-2 sm:px-4 sm:py-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs"
            title="Refresh Balance"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-600' : ''} />
            <span className="hidden sm:inline">{language === 'gu' ? 'રીફ્રેશ' : 'Refresh'}</span>
          </button>
        </div>

        {/* ── Executive Hero Balance Card (Matching Search Page Card Styling) ──── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">

            {/* Left: Main Balance Display */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Available Wallet Balance
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  • 100% Instant Payouts
                </span>
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                <GoldCoin size="hero" glow animated />
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">
                    {coinsBalance.toLocaleString()}
                  </span>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600">
                    (₹{amountINR})
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
                <span>Lifetime Earned: <strong className="text-slate-900 font-black">₹{totalEarnedINR}</strong></span>
                <span>•</span>
                <span>Referral Rewards: <strong className="text-blue-700 font-black">₹{referralINR}</strong></span>
              </div>
            </div>

            {/* Right: Action Button / Pending State */}
            <div className="md:col-span-5 flex flex-col items-stretch md:items-end justify-center">
              {wallet?.pendingWithdrawal ? (
                <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-amber-800 text-xs font-black uppercase tracking-wider">
                    <Clock size={16} />
                    <span>Cashout Request Pending</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    ₹{wallet.pendingWithdrawal.amountINR.toFixed(2)}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                    Your request via {wallet.pendingWithdrawal.paymentType} is under admin review. Your coins are safe in your wallet — they will only be deducted once admin confirms transfer.
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    Ref: {wallet.pendingWithdrawal.transactionRef} • Expected within 24 hours
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleWithdrawClick}
                  className="w-full sm:w-auto px-8 py-4 bg-[#2563eb] hover:bg-blue-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <ArrowUpRight size={20} className="stroke-[3]" />
                  <span>WITHDRAW CASH (₹)</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ── 2-Column Grid: Earn Tasks & Refer Section ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Col: Earn Coins Activity Hub (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0078d4]">
                  Earn Coins Daily
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {language === 'gu' ? 'રોજિંદા ટાસ્ક અને એક્ટિવિટી' : 'Daily Tasks & Activities'}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 whitespace-nowrap">
                  ₹{directINR} / ₹{directCapINR} <span className="hidden sm:inline">Earned ({directCoinsEarned}/{directCapCoins} Coins)</span>
                </span>
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {/* Task 1: Welcome Login */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Gift size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      Welcome Login Reward
                    </div>
                    <div className="text-[11px] font-bold text-amber-700">
                      +100 Coins (₹5.00) welcome bonus
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end sm:justify-start shrink-0">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                    <CheckCircle2 size={16} />
                    <span>Claimed</span>
                  </div>
                </div>
              </div>

              {/* Task 2: Post First Property Listing (Featured Mega Bonus) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-amber-50/50 rounded-2xl border border-amber-300/80 shadow-2xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                    <Building2 size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>Post Your 1st Property</span>
                      <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">Mega Bonus</span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700">
                      +{firstPropertyCoins} Coins (₹{firstPropertyINR}) on 1st listing
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end sm:justify-start shrink-0">
                  {taskFirstPropertyDone ? (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                      <CheckCircle2 size={16} />
                      <span>Claimed</span>
                    </div>
                  ) : (
                    <Link
                      to="/create-listing"
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <span>Post & Earn ₹{firstPropertyINR}</span>
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Task 3: Daily Check-in */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Clock size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      Daily Check-in Streak
                    </div>
                    <div className="text-[11px] font-bold text-slate-500">
                      +20 Coins (₹1.00) once per day
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end sm:justify-start shrink-0">
                  {taskDailyCheckinDone ? (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                      <CheckCircle2 size={16} />
                      <span>Claimed Today</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClaimTask('DAILY_CHECKIN')}
                      disabled={taskLoadingId === 'DAILY_CHECKIN' || wallet?.isDirectCapReached}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-[#2563eb] text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      {taskLoadingId === 'DAILY_CHECKIN' ? <Loader2 size={14} className="animate-spin" /> : null}
                      <span>Claim ₹1.00</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Task 4: Land Measure Map */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Layers size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      Use Land Measure (Map)
                    </div>
                    <div className="text-[11px] font-bold text-slate-500">
                      +20 Coins (₹1.00) on GPS tool usage
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end sm:justify-start shrink-0">
                  {taskLandMapDone ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                        <CheckCircle2 size={16} />
                        <span>Claimed</span>
                      </div>
                      <Link
                        to="/boundary-map"
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClaimTask('LAND_MAP_USED', '/boundary-map')}
                      disabled={taskLoadingId === 'LAND_MAP_USED' || wallet?.isDirectCapReached}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-[#2563eb] text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      {taskLoadingId === 'LAND_MAP_USED' ? <Loader2 size={14} className="animate-spin" /> : null}
                      <span>Open & Claim</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Task 5: Area Converter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Calculator size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      Use Area Converter
                    </div>
                    <div className="text-[11px] font-bold text-slate-500">
                      +20 Coins (₹1.00) on unit conversion
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end sm:justify-start shrink-0">
                  {taskAreaConverterDone ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                        <CheckCircle2 size={16} />
                        <span>Claimed</span>
                      </div>
                      <Link
                        to="/area-converter"
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClaimTask('AREA_CONVERTER_USED', '/area-converter')}
                      disabled={taskLoadingId === 'AREA_CONVERTER_USED' || wallet?.isDirectCapReached}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-[#2563eb] text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      {taskLoadingId === 'AREA_CONVERTER_USED' ? <Loader2 size={14} className="animate-spin" /> : null}
                      <span>Open & Claim</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Task 6: Explore Properties */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Search size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      Explore Land Listings
                    </div>
                    <div className="text-[11px] font-bold text-slate-500">
                      +20 Coins (₹1.00) on property browsing
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end sm:justify-start shrink-0">
                  {taskViewListingsDone ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                        <CheckCircle2 size={16} />
                        <span>Claimed</span>
                      </div>
                      <Link
                        to="/search"
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                      >
                        <span>Explore</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClaimTask('VIEW_LISTINGS', '/search')}
                      disabled={taskLoadingId === 'VIEW_LISTINGS' || wallet?.isDirectCapReached}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-[#2563eb] text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      {taskLoadingId === 'VIEW_LISTINGS' ? <Loader2 size={14} className="animate-spin" /> : null}
                      <span>Open & Claim</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {wallet?.isDirectCapReached && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle size={20} className="shrink-0 text-amber-600" />
                <span>
                  You have reached the maximum ₹30.00 direct tasks cap. Refer friends to earn ₹10 (200 Coins) unlimited!
                </span>
              </div>
            )}
          </div>

          {/* Right Col: Refer & Earn Section (5 Cols) (Search Page Consistent Aesthetic) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs text-slate-900 flex flex-col justify-between space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider mb-3">
                <Users size={13} />
                <span>Unlimited Referral Program</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                Refer Friends, Earn ₹10 (200 Coins) Every Time!
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">
                Invite friends or brokers to Kharsan Properties. When they sign up using your code, you instantly receive 200 Coins (₹10.00)!
              </p>
            </div>

            {/* Referral Code Box */}
            <div className="bg-amber-50/50 border border-amber-200/80 shadow-2xs rounded-2xl p-4 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Your Unique Referral Code
              </div>
              <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-200/80">
                <span className="font-mono text-xl font-black text-amber-950 tracking-widest">
                  {myReferralCode}
                </span>
                <button
                  onClick={() => handleCopy(myReferralCode, 'code')}
                  className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-900 transition-colors cursor-pointer"
                  title="Copy Code"
                >
                  {copiedCode ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                </button>
              </div>

              {/* Share Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleWhatsAppShare}
                  className="py-3 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Smartphone size={15} />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => handleCopy(`${window.location.origin}/register?ref=${myReferralCode}`, 'link')}
                  className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-slate-200"
                >
                  {copiedLink ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Referral Counter */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Invited Friends: <strong className="text-slate-900 font-black">{referralCount}</strong></span>
              <span>Referral Earned: <strong className="text-emerald-600 font-black">₹{referralINR}</strong></span>
            </div>

            {/* Apply Referral Code */}
            {!wallet?.hasAppliedReferral && !user?.referredBy && (
              <form onSubmit={handleApplyReferralCode} className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Gift size={13} />
                  <span>Have a Friend's Code? Apply for +100 Coins</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputReferralCode}
                    onChange={(e) => setInputReferralCode(e.target.value.toUpperCase())}
                    placeholder="Enter referral code"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 uppercase outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={applyingReferral}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {applyingReferral ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* ── Transaction History Ledger (Search Page Style) ───────────────── */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0078d4]">
                Ledger Statement
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {language === 'gu' ? 'સિક્કા અને ટ્રાન્ઝેક્શન હિસ્ટ્રી' : 'Coin & Cashout History'}
              </h3>
            </div>
          </div>

          {wallet?.recentTransactions && wallet.recentTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {wallet.recentTransactions.map((tx) => (
                <div key={tx._id} className="py-3 sm:py-3.5 flex items-center justify-between gap-2.5 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                      tx.coins >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {tx.coins >= 0 ? '+' : '-'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                        {tx.description}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-black">
                      <CoinBadge
                        coins={tx.coins}
                        prefix={tx.coins > 0 ? '+' : ''}
                        showSuffix
                        textClassName={tx.coins >= 0 ? 'text-emerald-700' : 'text-rose-700'}
                      />
                    </div>
                    <div className="text-[10px] font-bold text-slate-400">
                      {tx.amountINR >= 0 ? `₹${tx.amountINR.toFixed(2)}` : `-₹${Math.abs(tx.amountINR).toFixed(2)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs font-semibold">
              No transactions yet. Complete tasks above to start earning!
            </div>
          )}
        </div>

      </div>

      {/* ── Low Balance Clean Notification Modal ──── */}
      <AnimatePresence>
        {showLowBalanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <Lock size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Minimum Cashout Balance
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">
                The minimum withdrawal limit is <strong>₹30.00 (600 Coins)</strong>. Your current wallet balance is <strong>₹{amountINR} ({coinsBalance} Coins)</strong>.
              </p>
              <div className="text-[11px] font-bold text-amber-900 mt-3 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center gap-2 text-left">
                <Info size={16} className="shrink-0 text-amber-700" />
                <span>Tip: Refer just 2-3 friends (+₹10 each) or complete daily tasks to cash out directly!</span>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => setShowLowBalanceModal(false)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Got It, Continue Earning
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Withdrawal Modal (When Balance is Available) ────────────────── */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Withdraw Cash (₹)
                  </h3>
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                    <span>Payout balance:</span>
                    <CoinBadge coins={coinsBalance} size="sm" showSuffix textClassName="font-black text-slate-900" />
                    <span>(₹{amountINR})</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="mt-4 space-y-4">
                {/* Method selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutType('UPI')}
                    className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      payoutType === 'UPI'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    UPI Payout
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutType('BANK')}
                    className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      payoutType === 'BANK'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Bank Transfer
                  </button>
                </div>

                {payoutType === 'UPI' ? (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      UPI ID (Google Pay / PhonePe / Paytm / BHIM)
                    </label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. 9876543210@paytm or name@okhdfcbank"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        required
                        value={bankDetails.holderName}
                        onChange={(e) => setBankDetails({ ...bankDetails, holderName: e.target.value })}
                        placeholder="Full name as in bank passbook"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Bank Name</label>
                      <input
                        type="text"
                        required
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                        placeholder="e.g. State Bank of India, HDFC Bank"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Account Number</label>
                        <input
                          type="text"
                          required
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                          placeholder="Bank Account No."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">IFSC Code</label>
                        <input
                          type="text"
                          required
                          value={bankDetails.ifscCode}
                          onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                          placeholder="SBIN0001234"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>Amount to be transferred: <strong>₹{amountINR}</strong> (Zero fees deducted).</span>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    {withdrawLoading ? 'Submitting...' : 'Confirm Cashout'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default RewardsWallet;
