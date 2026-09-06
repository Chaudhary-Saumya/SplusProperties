import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
    Shield, Home, Users as UsersIcon, FileText, CheckCircle, MapPin,
    LayoutDashboard, PhoneCall, Settings, Zap, ZapOff, Search,
    Trash2, Coins, Check, X, Sliders,
    Layers, Calculator, RefreshCw, Save, DollarSign, ExternalLink,
    UserCog, Eye, Pencil, BadgeCheck, XCircle, Lock, ChevronDown,
    Bell, Send, Smartphone, Sparkles, Info, IndianRupee, CreditCard,
    Key, Copy, CheckCheck, EyeOff
} from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmModal from '../components/ConfirmModal';
import { getImageUrl } from '../utils/imageUrl';
import { GoldCoin, CoinBadge } from '../components/GoldCoin';

const Admin = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const { reloadSettings } = useSettings();
    const [data, setData] = useState(null);
    const [inquiries, setInquiries] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawalFilter, setWithdrawalFilter] = useState('ALL');
    const [actionWithdrawalLoadingId, setActionWithdrawalLoadingId] = useState(null);
    const [expandedWithdrawalId, setExpandedWithdrawalId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview'); // 'Overview', 'Users', 'Listings', 'Inquiries', 'Withdrawals', 'Push Notifications', 'Settings'
    const [settings, setSettings] = useState([]);
    const [updatingSetting, setUpdatingSetting] = useState(null);
    const [selectedUserRole, setSelectedUserRole] = useState('All');
    const [userActionLoadingId, setUserActionLoadingId] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    // Push Notification Broadcast State
    const [pushStats, setPushStats] = useState({ totalDevices: 0, androidDevices: 0, webDevices: 0 });
    const [pushForm, setPushForm] = useState({
        title: '🏡 3 New Verified Land Plots Just Listed!',
        body: 'Check out newly approved agricultural & NA plots with clear legal titles in Gujarat. 0 brokerage fee.',
        route: '/search',
        imageUrl: '',
        targetRole: 'ALL'
    });
    const [sendingPush, setSendingPush] = useState(false);

    // Economy Configuration Form State
    const [economyForm, setEconomyForm] = useState({
        minWithdrawalINR: 50,
        coinToINRRate: 20,
        welcomeLoginCoins: 100,
        referralBonusCoins: 200,
        firstPropertyCoins: 500,
        directDailyCapINR: 30,
        dailyCheckinCoins: 20,
        landMapCoins: 20,
        areaConverterCoins: 20,
        viewListingsCoins: 20
    });
    const [savingEconomy, setSavingEconomy] = useState(false);

    // Master Admin Security PIN States (Enterprise 2FA Protection)
    const [sessionAdminPin, setSessionAdminPin] = useState(() => sessionStorage.getItem('admin_master_pin') || '');
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [pinInput, setPinInput] = useState('');
    const [verifyingPin, setVerifyingPin] = useState(false);

    // Change Master PIN Modal States
    const [showChangePinModal, setShowChangePinModal] = useState(false);
    const [currentPinInput, setCurrentPinInput] = useState('');
    const [newPinInput, setNewPinInput] = useState('');
    const [confirmPinInput, setConfirmPinInput] = useState('');
    const [changingPin, setChangingPin] = useState(false);

    // Pagination states with customizable page sizes (10, 20, 30, 50, 100)
    const [usersPage, setUsersPage] = useState(1);
    const [usersPageSize, setUsersPageSize] = useState(10);

    const [listingsPage, setListingsPage] = useState(1);
    const [listingsPageSize, setListingsPageSize] = useState(10);

    const [inquiriesPage, setInquiriesPage] = useState(1);
    const [inquiriesPageSize, setInquiriesPageSize] = useState(10);

    const [withdrawalsPage, setWithdrawalsPage] = useState(1);
    const [withdrawalsPageSize, setWithdrawalsPageSize] = useState(10);

    const [listingStatusFilter, setListingStatusFilter] = useState('All');
    const [listingActionLoadingId, setListingActionLoadingId] = useState(null);
    const [inquiryActionLoadingId, setInquiryActionLoadingId] = useState(null);

    // User filters and modal states
    const [selectedUserAuth, setSelectedUserAuth] = useState('All'); // 'All', 'Google', 'Manual', 'Both'
    const [selectedUserStatus, setSelectedUserStatus] = useState('All'); // 'All', 'Active', 'Suspended', 'Disabled'
    const [viewUserModal, setViewUserModal] = useState(null);   // user object
    const [editUserModal, setEditUserModal] = useState(null);   // user object
    const [editUserForm, setEditUserForm] = useState({ 
        name: '', 
        email: '', 
        phone: '', 
        role: 'User', 
        accountStatus: 'Active', 
        coinsBalance: 0,
        password: '' 
    });
    const [showEditPassword, setShowEditPassword] = useState(false);
    const [savingUser, setSavingUser] = useState(false);

    // Password Reset Modal States
    const [resetPasswordModal, setResetPasswordModal] = useState(null);
    const [newPasswordInput, setNewPasswordInput] = useState('');
    const [showPasswordText, setShowPasswordText] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    // Listing modal states
    const [viewListingModal, setViewListingModal] = useState(null);
    const [editListingModal, setEditListingModal] = useState(null);
    const [editListingForm, setEditListingForm] = useState({
        title: '',
        price: '',
        location: '',
        area: '',
        status: 'Active',
        listingType: 'NonVerified',
        description: ''
    });
    const [savingListing, setSavingListing] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');

    // Dynamic Pagination Component with Page Size Selector
    const Pagination = ({ totalItems, currentPage, onPageChange, pageSize = 10, onPageSizeChange }) => {
        const totalPages = Math.ceil(totalItems / pageSize) || 1;
        const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(currentPage * pageSize, totalItems);

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-slate-100">
                {/* Left: Summary and Page Size Picker */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                    <span>
                        Showing <strong className="text-slate-900">{startItem}</strong> - <strong className="text-slate-900">{endItem}</strong> of <strong className="text-slate-900">{totalItems}</strong> entries
                    </span>

                    {onPageSizeChange && (
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rows:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    onPageSizeChange(Number(e.target.value));
                                    onPageChange(1);
                                }}
                                className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
                            >
                                {[10, 20, 30, 40, 50, 100].map(sz => (
                                    <option key={sz} value={sz}>{sz}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Right: Page Navigation Buttons */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${currentPage === 1 ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 shadow-2xs'
                                }`}
                        >
                            ← Prev
                        </button>

                        {(() => {
                            const pages = [];
                            if (totalPages <= 7) {
                                for (let i = 1; i <= totalPages; i++) pages.push(i);
                            } else {
                                pages.push(1);
                                if (currentPage > 3) pages.push('...');
                                const start = Math.max(2, currentPage - 1);
                                const end = Math.min(totalPages - 1, currentPage + 1);
                                for (let i = start; i <= end; i++) {
                                    if (!pages.includes(i)) pages.push(i);
                                }
                                if (currentPage < totalPages - 2) pages.push('...');
                                if (!pages.includes(totalPages)) pages.push(totalPages);
                            }

                            return pages.map((p, i) => (
                                p === '...' ? (
                                    <span key={`sep-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold">...</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => onPageChange(p)}
                                        className={`w-8 h-8 rounded-xl text-xs font-black border transition-all cursor-pointer ${currentPage === p ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                )
                            ));
                        })()}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${currentPage === totalPages ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 shadow-2xs'
                                }`}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const handleEconomyInputChange = (field, val) => {
        setEconomyForm(prev => ({
            ...prev,
            [field]: val === '' ? '' : val
        }));
    };

    useEffect(() => {
        if (!user) return;

        if (user.role !== 'Admin') {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const fetchAdminData = async () => {
            try {
                const [dashRes, inqRes, setRes, withRes, pushRes] = await Promise.all([
                    axios.get('/api/admin/dashboard').catch(() => ({ data: { data: null } })),
                    axios.get('/api/inquiries').catch(() => ({ data: { data: [] } })),
                    axios.get('/api/admin/settings').catch(() => ({ data: { data: [] } })),
                    axios.get('/api/admin/withdrawals').catch(() => ({ data: { data: [] } })),
                    axios.get('/api/admin/push-stats').catch(() => ({ data: { data: { totalDevices: 0, androidDevices: 0, webDevices: 0 } } }))
                ]);

                if (!isMounted) return;

                if (dashRes.data?.data) setData(dashRes.data.data);
                if (inqRes.data?.data) setInquiries(inqRes.data.data);
                if (pushRes.data?.data) setPushStats(pushRes.data.data);

                const rawSettings = setRes.data?.data || [];
                setSettings(rawSettings);

                // Populate economy form with database settings
                const map = {};
                rawSettings.forEach(s => { map[s.key] = s.value; });
                setEconomyForm(prev => ({
                    ...prev,
                    minWithdrawalINR: map['minWithdrawalINR'] !== undefined ? map['minWithdrawalINR'] : 50,
                    coinToINRRate: map['coinToINRRate'] !== undefined ? map['coinToINRRate'] : 20,
                    welcomeLoginCoins: map['welcomeLoginCoins'] !== undefined ? map['welcomeLoginCoins'] : 100,
                    referralBonusCoins: map['referralBonusCoins'] !== undefined ? map['referralBonusCoins'] : 200,
                    firstPropertyCoins: map['firstPropertyCoins'] !== undefined ? map['firstPropertyCoins'] : 500,
                    directDailyCapINR: map['directDailyCapINR'] !== undefined ? map['directDailyCapINR'] : 30,
                    dailyCheckinCoins: map['dailyCheckinCoins'] !== undefined ? map['dailyCheckinCoins'] : 20,
                    landMapCoins: map['landMapCoins'] !== undefined ? map['landMapCoins'] : 20,
                    areaConverterCoins: map['areaConverterCoins'] !== undefined ? map['areaConverterCoins'] : 20,
                    viewListingsCoins: map['viewListingsCoins'] !== undefined ? map['viewListingsCoins'] : 20
                }));

                if (withRes.data?.data) setWithdrawals(withRes.data.data);
            } catch (err) {
                console.error('Error fetching admin data', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAdminData();

        return () => { isMounted = false; };
    }, [user?._id, user?.role]);

    const handleSendPushBroadcast = async (e) => {
        e?.preventDefault();
        if (!pushForm.title.trim() || !pushForm.body.trim()) {
            return toast.error('Notification title and message body are required.');
        }

        setSendingPush(true);
        try {
            const res = await axios.post('/api/admin/broadcast-push', pushForm);
            if (res.data?.success) {
                toast.success(res.data.message || 'Push notification broadcast sent successfully!');
                const statsRes = await axios.get('/api/admin/push-stats');
                if (statsRes.data?.data) setPushStats(statsRes.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to dispatch push broadcast.');
        } finally {
            setSendingPush(false);
        }
    };

    const fetchWithdrawals = async () => {
        try {
            const res = await axios.get('/api/admin/withdrawals');
            if (res.data.success) {
                setWithdrawals(res.data.data || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleVerifyPinSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!pinInput.trim()) {
            toast.error('Please enter your 6-digit Master PIN');
            return;
        }

        setVerifyingPin(true);
        try {
            const res = await axios.post('/api/admin/verify-pin', { pin: pinInput.trim() });
            if (res.data?.success) {
                const verifiedPin = pinInput.trim();
                setSessionAdminPin(verifiedPin);
                sessionStorage.setItem('admin_master_pin', verifiedPin);
                setShowPinModal(false);
                setPinInput('');
                toast.success('Master Security PIN Verified! Authorization granted.');

                // Execute the queued action
                if (pendingAction) {
                    const action = pendingAction;
                    setPendingAction(null);
                    await executeActionWithPin(action, verifiedPin);
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'ACCESS DENIED: Invalid Master Admin Security PIN!');
        } finally {
            setVerifyingPin(false);
        }
    };

    const executeActionWithPin = async (action, pinToUse = sessionAdminPin) => {
        if (!pinToUse) {
            setPendingAction(action);
            setShowPinModal(true);
            return;
        }

        const config = { headers: { 'x-admin-pin': pinToUse } };

        try {
            if (action.type === 'SAVE_ECONOMY') {
                setSavingEconomy(true);
                const sanitizedEconomy = {
                    minWithdrawalINR: Number(economyForm.minWithdrawalINR) || 50,
                    coinToINRRate: Number(economyForm.coinToINRRate) || 20,
                    welcomeLoginCoins: Number(economyForm.welcomeLoginCoins) || 100,
                    referralBonusCoins: Number(economyForm.referralBonusCoins) || 200,
                    firstPropertyCoins: Number(economyForm.firstPropertyCoins) || 500,
                    directDailyCapINR: Number(economyForm.directDailyCapINR) || 30,
                    dailyCheckinCoins: Number(economyForm.dailyCheckinCoins) || 20,
                    landMapCoins: Number(economyForm.landMapCoins) || 20,
                    areaConverterCoins: Number(economyForm.areaConverterCoins) || 20,
                    viewListingsCoins: Number(economyForm.viewListingsCoins) || 20
                };
                const res = await axios.post('/api/admin/settings/batch', { settings: sanitizedEconomy }, config);
                if (res.data?.success) {
                    toast.success('Economy & Rewards parameters updated successfully!');
                    setSettings(res.data.data);
                    if (reloadSettings) reloadSettings();
                }
            } else if (action.type === 'TOGGLE_FEATURE') {
                setUpdatingSetting(action.key);
                const res = await axios.patch(`/api/admin/settings/${action.key}`, { value: action.value }, config);
                if (res.data?.success) {
                    setSettings(prev => prev.map(s => s.key === action.key ? res.data.data : s));
                    toast.success(`${action.key.replace('enable', '')} set to ${action.value ? 'ON' : 'OFF'}`);
                    if (reloadSettings) reloadSettings();
                }
            } else if (action.type === 'APPROVE_WITHDRAWAL') {
                setActionWithdrawalLoadingId(action.id);
                const res = await axios.put(`/api/admin/withdrawals/${action.id}/approve`, { transactionRef: action.transactionRef }, config);
                if (res.data?.success) {
                    toast.success('Withdrawal approved! Coins deducted from user wallet.');
                    fetchWithdrawals();
                }
            } else if (action.type === 'REJECT_WITHDRAWAL') {
                setActionWithdrawalLoadingId(action.id);
                const res = await axios.put(`/api/admin/withdrawals/${action.id}/reject`, { adminNote: action.adminNote }, config);
                if (res.data?.success) {
                    toast.success('Withdrawal rejected. User coins were NOT deducted.');
                    fetchWithdrawals();
                }
            } else if (action.type === 'RESET_USER_PASSWORD') {
                setResettingPassword(true);
                const res = await axios.put(`/api/users/${action.userId}/reset-password`, {
                    newPassword: action.newPassword
                }, config);
                if (res.data?.success) {
                    updateUserInState(res.data.data);
                    toast.success(res.data.message || 'Password successfully updated');
                    setResetPasswordModal(null);
                    setNewPasswordInput('');
                    setShowPasswordText(false);
                }
            }
        } catch (err) {
            if (err.response?.data?.requiresPin) {
                setSessionAdminPin('');
                sessionStorage.removeItem('admin_master_pin');
                setPendingAction(action);
                setShowPinModal(true);
                toast.warn('Master Security PIN required to authorize password reset.');
            } else {
                toast.error(err.response?.data?.error || 'Action failed');
            }
        } finally {
            setSavingEconomy(false);
            setUpdatingSetting(null);
            setActionWithdrawalLoadingId(null);
            setResettingPassword(false);
        }
    };

    const handleApproveWithdrawal = (withdrawalId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Approve & Mark Paid',
            message: 'Enter the UTR / Payment Reference ID after you manually send money via UPI or Bank Transfer:',
            type: 'prompt',
            inputLabel: 'Transaction Reference / UTR',
            inputPlaceholder: 'e.g. UTR-1234567890',
            defaultValue: `UTR-${Date.now()}`,
            confirmText: 'Authorize & Deduct Coins',
            onConfirm: (transactionRef) => {
                setConfirmModal(null);
                executeActionWithPin({
                    type: 'APPROVE_WITHDRAWAL',
                    id: withdrawalId,
                    transactionRef: (transactionRef || '').trim() || `UTR-${Date.now()}`
                });
            },
            onCancel: () => setConfirmModal(null)
        });
    };

    const handleRejectWithdrawal = (withdrawalId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Reject Withdrawal Request',
            message: 'Enter the reason for rejection (user coins remain in their wallet):',
            type: 'prompt',
            inputLabel: 'Rejection Reason',
            inputPlaceholder: 'e.g. Invalid UPI ID / Bank Account details',
            defaultValue: 'Invalid UPI ID or Bank Account details. Please update and re-submit.',
            confirmText: 'Reject Request',
            onConfirm: (adminNote) => {
                setConfirmModal(null);
                executeActionWithPin({
                    type: 'REJECT_WITHDRAWAL',
                    id: withdrawalId,
                    adminNote: (adminNote || '').trim() || 'Request rejected by admin'
                });
            },
            onCancel: () => setConfirmModal(null)
        });
    };

    const handleUpdateSetting = async (key, value) => {
        executeActionWithPin({
            type: 'TOGGLE_FEATURE',
            key,
            value
        });
    };

    const handleSaveEconomyBatch = async (e) => {
        if (e) e.preventDefault();
        executeActionWithPin({
            type: 'SAVE_ECONOMY'
        });
    };

    const handleChangePinSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!currentPinInput || !newPinInput) {
            toast.error('Please fill both current and new PIN');
            return;
        }
        if (newPinInput !== confirmPinInput) {
            toast.error('New PIN and Confirmation PIN do not match');
            return;
        }
        if (newPinInput.length < 4 || newPinInput.length > 8) {
            toast.error('PIN must be between 4 and 8 digits');
            return;
        }

        setChangingPin(true);
        try {
            const res = await axios.post('/api/admin/change-pin', {
                currentPin: currentPinInput.trim(),
                newPin: newPinInput.trim()
            });
            if (res.data?.success) {
                toast.success('Master Admin PIN updated and encrypted successfully!');
                setSessionAdminPin(newPinInput.trim());
                sessionStorage.setItem('admin_master_pin', newPinInput.trim());
                setShowChangePinModal(false);
                setCurrentPinInput('');
                setNewPinInput('');
                setConfirmPinInput('');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update PIN. Verify current PIN.');
        } finally {
            setChangingPin(false);
        }
    };

    const updateUserInState = (updatedUser) => {
        setData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                users: prev.users.map((u) => (u._id === updatedUser._id ? { ...u, ...updatedUser } : u))
            };
        });
    };

    const removeUserFromState = (userId) => {
        setData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                users: prev.users.filter((u) => u._id !== userId)
            };
        });
    };

    const handleUpdateUserStatus = (targetUser, nextStatus) => {
        if (!targetUser?._id) return;
        setConfirmModal({
            isOpen: true,
            title: `${nextStatus === 'Active' ? 'Activate' : 'Suspend'} Account`,
            message: `Are you sure you want to change account status of "${targetUser.name}" to ${nextStatus}?`,
            confirmText: `Set as ${nextStatus}`,
            type: nextStatus === 'Active' ? 'success' : 'warning',
            onConfirm: async () => {
                setConfirmModal(null);
                setUserActionLoadingId(targetUser._id);
                try {
                    const res = await axios.put(`/api/users/${targetUser._id}`, { accountStatus: nextStatus });
                    if (res.data?.success) {
                        updateUserInState(res.data.data);
                        toast.success(`User status updated to ${nextStatus}`);
                    }
                } catch (err) {
                    toast.error(err.response?.data?.error || 'Failed to update account status');
                } finally {
                    setUserActionLoadingId(null);
                }
            },
            onCancel: () => setConfirmModal(null)
        });
    };

    const handleDeleteUser = (targetUser) => {
        if (!targetUser?._id) return;
        setConfirmModal({
            isOpen: true,
            title: 'Delete User Account',
            message: `Permanently delete account for "${targetUser.name}"? This action cannot be undone.`,
            confirmText: 'Delete Permanently',
            type: 'danger',
            onConfirm: async () => {
                setConfirmModal(null);
                setUserActionLoadingId(targetUser._id);
                try {
                    const res = await axios.delete(`/api/users/${targetUser._id}`);
                    if (res.data?.success) {
                        removeUserFromState(targetUser._id);
                        toast.success('User account deleted');
                    }
                } catch (err) {
                    toast.error(err.response?.data?.error || 'Failed to delete account');
                } finally {
                    setUserActionLoadingId(null);
                }
            },
            onCancel: () => setConfirmModal(null)
        });
    };

    // Generate random strong password
    const generateStrongPassword = () => {
        const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lowercase = 'abcdefghijkmnpqrstuvwxyz';
        const numbers = '23456789';
        const symbols = '!@#$%&*';
        const all = uppercase + lowercase + numbers + symbols;
        let pass = '';
        pass += uppercase[Math.floor(Math.random() * uppercase.length)];
        pass += lowercase[Math.floor(Math.random() * lowercase.length)];
        pass += numbers[Math.floor(Math.random() * numbers.length)];
        pass += symbols[Math.floor(Math.random() * symbols.length)];
        for (let i = 4; i < 10; i++) {
            pass += all[Math.floor(Math.random() * all.length)];
        }
        return pass.split('').sort(() => 0.5 - Math.random()).join('');
    };

    const handleCopyPassword = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedPassword(true);
        toast.info('Password copied to clipboard');
        setTimeout(() => setCopiedPassword(false), 2500);
    };

    // Admin direct password reset (Guarded with Master Security PIN)
    const handleResetUserPassword = async (e) => {
        if (e) e.preventDefault();
        if (!resetPasswordModal?._id) return;
        if (!newPasswordInput || newPasswordInput.trim().length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        executeActionWithPin({
            type: 'RESET_USER_PASSWORD',
            userId: resetPasswordModal._id,
            newPassword: newPasswordInput.trim()
        });
    };

    // Save user edits (including coins balance, contact info & optional password)
    const handleSaveEditUser = async (e) => {
        if (e) e.preventDefault();
        if (!editUserModal?._id) return;

        setSavingUser(true);
        try {
            const payload = {
                name: editUserForm.name,
                email: editUserForm.email,
                phone: editUserForm.phone,
                role: editUserForm.role,
                accountStatus: editUserForm.accountStatus,
                coinsBalance: Number(editUserForm.coinsBalance || 0)
            };
            if (editUserForm.password && editUserForm.password.trim()) {
                payload.password = editUserForm.password.trim();
            }

            const res = await axios.put(`/api/users/${editUserModal._id}`, payload);
            if (res.data?.success) {
                updateUserInState(res.data.data);
                toast.success(res.data.message || 'User updated successfully');
                setEditUserModal(null);
                setShowEditPassword(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update user');
        } finally {
            setSavingUser(false);
        }
    };

    // Save listing edits
    const handleSaveEditListing = async (e) => {
        if (e) e.preventDefault();
        setSavingListing(true);
        try {
            const res = await axios.put(`/api/listings/${editListingModal._id}`, {
                title: editListingForm.title,
                price: Number(editListingForm.price),
                location: editListingForm.location,
                area: editListingForm.area,
                status: editListingForm.status,
                listingType: editListingForm.listingType,
                description: editListingForm.description
            });
            if (res.data?.success) {
                const updated = res.data.data;
                setData(prev => ({
                    ...prev,
                    allListings: prev.allListings.map(l => l._id === editListingModal._id ? { ...l, ...updated } : l)
                }));
                toast.success('Listing updated successfully');
                setEditListingModal(null);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update listing');
        } finally {
            setSavingListing(false);
        }
    };

    // Quick filter listings by user
    const handleFilterByUser = (userNameOrEmail) => {
        setViewUserModal(null);
        setActiveTab('Listings');
        setListingStatusFilter('All');
        setSearchQuery(userNameOrEmail || '');
        setListingsPage(1);
    };

    // Listing admin actions
    const handleListingAction = async (listingId, action) => {
        if (action === 'reject') {
            setConfirmModal({
                isOpen: true,
                title: 'Reject Property Verification',
                message: 'Enter reason why this listing verification is rejected:',
                type: 'prompt',
                inputLabel: 'Rejection Reason',
                defaultValue: 'Incomplete or inaccurate information',
                confirmText: 'Reject Verification',
                onConfirm: async (reason) => {
                    setConfirmModal(null);
                    setListingActionLoadingId(listingId + action);
                    try {
                        const res = await axios.patch(`/api/listings/${listingId}/reject-verification`, { reason: (reason || '').trim() || 'Incomplete details' });
                        if (res.data?.success) {
                            setData(prev => ({
                                ...prev,
                                allListings: prev.allListings.map(l => l._id === listingId ? { ...l, verificationStatus: 'Rejected', listingType: 'NonVerified' } : l)
                            }));
                            toast.success('Verification rejected.');
                        }
                    } catch (err) {
                        toast.error(err.response?.data?.error || 'Rejection failed');
                    } finally {
                        setListingActionLoadingId(null);
                    }
                },
                onCancel: () => setConfirmModal(null)
            });
            return;
        }

        if (action === 'delete') {
            setConfirmModal({
                isOpen: true,
                title: 'Delete Property Listing',
                message: 'Permanently remove this property listing from Kharsan Properties? This cannot be undone.',
                confirmText: 'Delete Permanently',
                type: 'danger',
                onConfirm: async () => {
                    setConfirmModal(null);
                    setListingActionLoadingId(listingId + action);
                    try {
                        const res = await axios.delete(`/api/listings/${listingId}`);
                        if (res.data?.success) {
                            setData(prev => ({
                                ...prev,
                                allListings: prev.allListings.filter(l => l._id !== listingId)
                            }));
                            toast.success('Listing deleted.');
                        }
                    } catch (err) {
                        toast.error(err.response?.data?.error || 'Failed to delete listing');
                    } finally {
                        setListingActionLoadingId(null);
                    }
                },
                onCancel: () => setConfirmModal(null)
            });
            return;
        }

        setListingActionLoadingId(listingId + action);
        try {
            let res;
            if (action === 'verify') {
                res = await axios.patch(`/api/listings/${listingId}/verify`);
                if (res.data?.success) {
                    setData(prev => ({
                        ...prev,
                        allListings: prev.allListings.map(l => l._id === listingId ? { ...l, listingType: 'Verified', verificationStatus: 'Approved' } : l)
                    }));
                    toast.success('Listing verified successfully!');
                }
            } else if (action === 'reserve') {
                res = await axios.patch(`/api/listings/${listingId}/reserve`);
                if (res.data?.success) {
                    setData(prev => ({
                        ...prev,
                        allListings: prev.allListings.map(l => l._id === listingId ? { ...l, status: 'Reserved' } : l)
                    }));
                    toast.success('Listing marked as Reserved.');
                }
            } else if (action === 'activate') {
                res = await axios.put(`/api/listings/${listingId}`, { status: 'Active' });
                if (res.data?.success) {
                    setData(prev => ({
                        ...prev,
                        allListings: prev.allListings.map(l => l._id === listingId ? { ...l, status: 'Active', soldAt: null } : l)
                    }));
                    toast.success('Listing activated successfully.');
                }
            } else if (action === 'deactivate') {
                res = await axios.put(`/api/listings/${listingId}`, { status: 'Inactive' });
                if (res.data?.success) {
                    setData(prev => ({
                        ...prev,
                        allListings: prev.allListings.map(l => l._id === listingId ? { ...l, status: 'Inactive' } : l)
                    }));
                    toast.success('Listing marked as Inactive.');
                }
            } else if (action === 'mark-sold') {
                res = await axios.put(`/api/listings/${listingId}`, { status: 'Sold' });
                if (res.data?.success) {
                    setData(prev => ({
                        ...prev,
                        allListings: prev.allListings.map(l => l._id === listingId ? { ...l, status: 'Sold', soldAt: new Date() } : l)
                    }));
                    toast.success('Listing marked as Sold.');
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.error || `Action '${action}' failed`);
        } finally {
            setListingActionLoadingId(null);
        }
    };

    // Inquiry status update
    const handleUpdateInquiryStatus = async (inquiryId, newStatus) => {
        setInquiryActionLoadingId(inquiryId);
        try {
            const res = await axios.patch(`/api/inquiries/${inquiryId}/status`, { status: newStatus });
            if (res.data?.success) {
                setInquiries(prev => prev.map(inq => inq._id === inquiryId ? { ...inq, status: newStatus } : inq));
                toast.success(`Inquiry marked as ${newStatus}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update inquiry');
        } finally {
            setInquiryActionLoadingId(null);
        }
    };

    // Change user role
    const handleUpdateUserRole = (targetUser, newRole) => {
        setConfirmModal({
            isOpen: true,
            title: 'Change User Role',
            message: `Change role of "${targetUser.name}" to ${newRole}? This has significant platform permissions impact.`,
            confirmText: 'Confirm Role Change',
            type: 'warning',
            onConfirm: async () => {
                setConfirmModal(null);
                setUserActionLoadingId(targetUser._id);
                try {
                    const res = await axios.put(`/api/users/${targetUser._id}`, { role: newRole });
                    if (res.data?.success) {
                        updateUserInState(res.data.data);
                        toast.success(`Role changed to ${newRole}`);
                    }
                } catch (err) {
                    toast.error(err.response?.data?.error || 'Failed to change role');
                } finally {
                    setUserActionLoadingId(null);
                }
            },
            onCancel: () => setConfirmModal(null)
        });
    };

    if (authLoading || loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    );

    if (user?.role !== 'Admin') return (
        <div className="min-h-[60vh] flex justify-center items-center">
            <div className="bg-red-50 text-red-600 px-8 py-6 rounded-2xl font-bold shadow-sm border border-red-100 flex items-center gap-3">
                <Shield size={24} /> Access Denied
            </div>
        </div>
    );

    const pendingWithdrawalCount = withdrawals.filter(w => w.status === 'PENDING').length;

    const tabs = [
        { id: 'Overview', icon: <LayoutDashboard size={18} /> },
        { id: 'Users', icon: <UsersIcon size={18} />, badge: data?.users?.length },
        { id: 'Listings', icon: <Home size={18} />, badge: data?.allListings?.length },
        { id: 'Inquiries', icon: <PhoneCall size={18} /> },
        { id: 'Withdrawals', icon: <Coins size={18} />, badge: pendingWithdrawalCount, badgeColor: 'bg-amber-500' },
        { id: 'Push Notifications', icon: <Bell size={18} />, badge: pushStats?.totalDevices, badgeColor: 'bg-blue-600' },
        { id: 'Settings', icon: <Settings size={18} /> }
    ];

    return (
        <div className="animate-fade-in flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50">
            {/* Sidebar */}
            <div className="hidden md:flex md:flex-col w-64 bg-white border-r border-slate-200 p-4 shadow-sm z-10">
                <div className="px-2 pt-4 mb-8">
                    <div className="flex items-center gap-2 mb-1">
                        <Shield className="text-blue-600" size={22} />
                        <h2 className="text-xl font-['Outfit'] font-bold text-slate-800">Admin Station</h2>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Super Power Control</p>
                </div>

                <div className="flex flex-col gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSearchQuery('');
                            }}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all text-left ${activeTab === tab.id
                                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <span className="flex items-center gap-3">{tab.icon} {tab.id}</span>
                            {tab.badge > 0 && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${tab.badgeColor || 'bg-slate-400'
                                    }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${sessionAdminPin ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                        <Lock size={12} />
                        {sessionAdminPin ? 'Session Unlocked' : 'PIN Required'}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">

                {!data && !loading && user?.role === 'Admin' && (
                    <div className="text-center p-12 bg-red-50 text-red-500 rounded-2xl mb-4 font-bold border border-red-100">
                        Error loading dashboard data. Please check backend models or API connection.
                    </div>
                )}

                {/* Mobile Tabs */}
                <div className="flex md:hidden bg-white rounded-2xl p-2 mb-6 shadow-sm border border-slate-200 gap-2 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'text-slate-500'}`}
                        >
                            {tab.icon} {tab.id}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'Overview' && data && (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <h1 className="text-3xl font-bold text-slate-900 mb-6">Platform Overview</h1>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                                <div className="flex justify-between items-center text-slate-500 mb-4">
                                    <span className="font-bold text-sm uppercase tracking-wider">Total Users</span>
                                    <UsersIcon size={20} className="text-blue-500" />
                                </div>
                                <span className="text-3xl font-extrabold text-slate-900">{data.metrics.totalUsers}</span>
                            </div>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                                <div className="flex justify-between items-center text-slate-500 mb-4">
                                    <span className="font-bold text-sm uppercase tracking-wider">Verified Plots</span>
                                    <CheckCircle size={20} className="text-emerald-500" />
                                </div>
                                <span className="text-3xl font-extrabold text-slate-900">{data.metrics.verifiedListings} <span className="text-lg text-slate-400">/ {data.metrics.totalListings}</span></span>
                            </div>

                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                                <div className="flex justify-between items-center text-slate-500 mb-4">
                                    <span className="font-bold text-sm uppercase tracking-wider">Token Revenue</span>
                                    <FileText size={20} className="text-purple-500" />
                                </div>
                                <span className="text-3xl font-extrabold text-slate-900 truncate">₹{data.metrics.totalRevenue?.toLocaleString('en-IN') || 0}</span>
                            </div>
                        </div>


                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'Users' && data && (
                    <div className="animate-fade-in max-w-7xl mx-auto space-y-6">
                        {/* Users Header & Filters */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Platform Users & Access</h1>
                                <p className="text-xs font-semibold text-slate-500 mt-1">Manage registered buyers, sellers, brokers, Google vs Manual auth, and direct password resets.</p>
                            </div>

                            {/* Role Filter Pills */}
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => { setSelectedUserRole('All'); setUsersPage(1); }}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${selectedUserRole === 'All'
                                            ? 'bg-slate-900 text-white shadow-md'
                                            : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    <span>All Roles</span>
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${selectedUserRole === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                        {data.users.length}
                                    </span>
                                </button>
                                {data.usersBreakdown.map(role => (
                                    <button
                                        key={role._id}
                                        onClick={() => { setSelectedUserRole(role._id); setUsersPage(1); }}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${selectedUserRole === role._id
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
                                            }`}
                                    >
                                        <span>{role._id}s</span>
                                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${selectedUserRole === role._id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'}`}>
                                            {role.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search & Multi-Filter Toolbar */}
                        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="relative flex-1">
                                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, phone, referral code, or role..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setUsersPage(1);
                                        }}
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => { setSearchQuery(''); setUsersPage(1); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Auth Filter Dropdown/Pills */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black uppercase text-slate-400 shrink-0">Auth:</span>
                                    <select
                                        value={selectedUserAuth}
                                        onChange={(e) => { setSelectedUserAuth(e.target.value); setUsersPage(1); }}
                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="All">All Auth Methods</option>
                                        <option value="Google">Google Sign-In ({data.users.filter(u => u.googleId).length})</option>
                                        <option value="Manual">Email & Password ({data.users.filter(u => !u.googleId || u.hasPassword).length})</option>
                                    </select>

                                    <span className="text-[11px] font-black uppercase text-slate-400 shrink-0 ml-1">Status:</span>
                                    <select
                                        value={selectedUserStatus}
                                        onChange={(e) => { setSelectedUserStatus(e.target.value); setUsersPage(1); }}
                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="All">All Statuses</option>
                                        <option value="Active">Active Only</option>
                                        <option value="Suspended">Suspended</option>
                                        <option value="Disabled">Disabled</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-slate-100 bg-slate-50/50">
                                        <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="py-3.5 px-5">Sr.</th>
                                            <th className="py-3.5 px-4">User Details</th>
                                            <th className="py-3.5 px-4">Login Method</th>
                                            <th className="py-3.5 px-4">Phone</th>
                                            <th className="py-3.5 px-4">Role</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4">Listings</th>
                                            <th className="py-3.5 px-4">Wallet</th>
                                            <th className="py-3.5 px-4">Joined Date</th>
                                            <th className="py-3.5 px-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-sm">
                                        {(() => {
                                            const filteredUsers = data.users
                                                .filter(u => selectedUserRole === 'All' || u.role === selectedUserRole)
                                                .filter(u => {
                                                    if (selectedUserAuth === 'All') return true;
                                                    if (selectedUserAuth === 'Google') return Boolean(u.googleId);
                                                    if (selectedUserAuth === 'Manual') return !u.googleId || Boolean(u.hasPassword);
                                                    return true;
                                                })
                                                .filter(u => selectedUserStatus === 'All' || (u.accountStatus || 'Active') === selectedUserStatus)
                                                .filter(u => {
                                                    if (!searchQuery) return true;
                                                    const q = searchQuery.toLowerCase();
                                                    return (
                                                        (u.name || '').toLowerCase().includes(q) ||
                                                        (u.email || '').toLowerCase().includes(q) ||
                                                        (u.phone || '').includes(q) ||
                                                        (u.referralCode || '').toLowerCase().includes(q) ||
                                                        (u.role || '').toLowerCase().includes(q)
                                                    );
                                                });

                                            if (filteredUsers.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan="10" className="py-16 text-center text-slate-400 font-semibold">
                                                            No users found matching your search or filters.
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            const pageSlice = filteredUsers.slice((usersPage - 1) * usersPageSize, usersPage * usersPageSize);
                                            const globalOffset = (usersPage - 1) * usersPageSize;

                                            return pageSlice.map((u, idx) => {
                                                const initials = (u.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                                                const roleColors = {
                                                    Admin: 'bg-rose-100 text-rose-700 border-rose-200',
                                                    Broker: 'bg-amber-100 text-amber-700 border-amber-200',
                                                    User: 'bg-blue-100 text-blue-700 border-blue-200'
                                                };
                                                const roleColor = roleColors[u.role] || roleColors.User;
                                                const status = u.accountStatus || 'Active';
                                                const statusColors = {
                                                    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                    Disabled: 'bg-slate-100 text-slate-500 border-slate-200',
                                                    Suspended: 'bg-amber-50 text-amber-700 border-amber-200'
                                                };
                                                const statusColor = statusColors[status] || statusColors.Active;

                                                const isGoogle = Boolean(u.googleId);
                                                const hasManualPass = Boolean(u.hasPassword);

                                                return (
                                                    <tr key={u._id} className="hover:bg-slate-50/60 transition-colors group">
                                                        <td className="py-4 px-5 text-slate-400 font-bold text-xs">{globalOffset + idx + 1}</td>
                                                        <td className="py-4 px-4 min-w-[200px]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-800 text-white font-black text-xs flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
                                                                    {u.profileImage ? (
                                                                        <img src={getImageUrl(u.profileImage)} alt={u.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        initials
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <p className="font-bold text-slate-900 truncate">{u.name || 'Unnamed'}</p>
                                                                        {u.identityVerified && (
                                                                            <BadgeCheck size={14} className="text-blue-500 shrink-0" title="Identity Verified" />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-slate-400 truncate">{u.email || '—'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            {isGoogle && hasManualPass ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-purple-50 text-purple-700 border border-purple-200" title="User has linked Google Auth AND password configured">
                                                                    <Sparkles size={13} className="text-purple-600" />
                                                                    <span>Google + Pass</span>
                                                                </span>
                                                            ) : isGoogle ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200" title={`Google OAuth ID: ${u.googleId}`}>
                                                                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                                                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                                                    </svg>
                                                                    <span>Google Sign-In</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-700 border border-slate-200" title="Manual Password Account">
                                                                    <Key size={13} className="text-slate-500" />
                                                                    <span>Manual Pass</span>
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            <span className="text-sm text-slate-600 font-mono">{u.phone || '—'}</span>
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${roleColor}`}>{u.role}</span>
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${statusColor}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : status === 'Suspended' ? 'bg-amber-500' : 'bg-slate-400'
                                                                    }`}></span>
                                                                {status}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            {u.listingCount > 0 ? (
                                                                <button
                                                                    onClick={() => handleFilterByUser(u.name || u.email)}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all cursor-pointer"
                                                                    title="Click to manage all listings of this user"
                                                                >
                                                                    <Home size={12} />
                                                                    <span>{u.listingCount}</span>
                                                                </button>
                                                            ) : (
                                                                <span className="text-slate-300 text-xs font-semibold">0</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            <span className="text-xs font-bold text-amber-700">{u.coinsBalance || 0} coins</span>
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500 font-semibold">
                                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                        </td>
                                                        <td className="py-4 px-5 text-right whitespace-nowrap">
                                                            <div className="inline-flex items-center gap-1">
                                                                {/* View */}
                                                                <button
                                                                    onClick={() => setViewUserModal(u)}
                                                                    title="View Details"
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                                                                >
                                                                    <Eye size={15} />
                                                                </button>
                                                                {/* Reset Password */}
                                                                <button
                                                                    onClick={() => {
                                                                        setResetPasswordModal(u);
                                                                        setNewPasswordInput('');
                                                                        setShowPasswordText(false);
                                                                    }}
                                                                    title="Change / Reset Password"
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all cursor-pointer"
                                                                >
                                                                    <Key size={15} />
                                                                </button>
                                                                {/* Edit */}
                                                                <button
                                                                    onClick={() => {
                                                                        setEditUserModal(u);
                                                                        setEditUserForm({
                                                                            name: u.name || '',
                                                                            email: u.email || '',
                                                                            phone: u.phone || '',
                                                                            role: u.role || 'User',
                                                                            accountStatus: u.accountStatus || 'Active',
                                                                            coinsBalance: u.coinsBalance || 0,
                                                                            password: ''
                                                                        });
                                                                        setShowEditPassword(false);
                                                                    }}
                                                                    title="Edit User"
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all cursor-pointer"
                                                                >
                                                                    <Pencil size={15} />
                                                                </button>
                                                                {/* Delete */}
                                                                {u._id !== user?._id && (
                                                                    <button
                                                                        onClick={() => handleDeleteUser(u)}
                                                                        disabled={userActionLoadingId === u._id}
                                                                        title="Delete User"
                                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer disabled:opacity-40"
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                totalItems={
                                    data.users
                                        .filter(u => selectedUserRole === 'All' || u.role === selectedUserRole)
                                        .filter(u => {
                                            if (selectedUserAuth === 'All') return true;
                                            if (selectedUserAuth === 'Google') return Boolean(u.googleId);
                                            if (selectedUserAuth === 'Manual') return !u.googleId || Boolean(u.hasPassword);
                                            return true;
                                        })
                                        .filter(u => selectedUserStatus === 'All' || (u.accountStatus || 'Active') === selectedUserStatus)
                                        .filter(u => {
                                            if (!searchQuery) return true;
                                            const q = searchQuery.toLowerCase();
                                            return (
                                                (u.name || '').toLowerCase().includes(q) ||
                                                (u.email || '').toLowerCase().includes(q) ||
                                                (u.phone || '').includes(q) ||
                                                (u.referralCode || '').toLowerCase().includes(q) ||
                                                (u.role || '').toLowerCase().includes(q)
                                            );
                                        }).length
                                }
                                currentPage={usersPage}
                                onPageChange={setUsersPage}
                                pageSize={usersPageSize}
                                onPageSizeChange={setUsersPageSize}
                            />
                        </div>
                    </div>
                )}

                {/* LISTINGS TAB */}
                {activeTab === 'Listings' && data && (
                    <div className="animate-fade-in max-w-7xl mx-auto space-y-6">
                        {/* Listings Header & Search */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Property Listings & CRM</h1>
                                <p className="text-xs font-semibold text-slate-500 mt-1">Manage verified plots, active inventory, pricing, reservations, and broker listings.</p>
                            </div>

                            {/* Listing Status Filter Pills */}
                            <div className="flex flex-wrap items-center gap-2">
                                {['All', 'Active', 'Inactive', 'Sold'].map(f => {
                                    const count = data.allListings.filter(l => {
                                        if (f === 'All') return true;
                                        return (l.status || 'Active') === f;
                                    }).length;

                                    const isSelected = listingStatusFilter === f;

                                    return (
                                        <button
                                            key={f}
                                            onClick={() => { setListingStatusFilter(f); setListingsPage(1); }}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${isSelected
                                                    ? 'bg-slate-900 text-white shadow-md'
                                                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                                                }`}
                                        >
                                            <span>{f}</span>
                                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200/80 flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by title, location, or owner name..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setListingsPage(1);
                                    }}
                                    className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setListingsPage(1); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Listings Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-slate-100">
                                        <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="py-3.5 px-5">Sr. No.</th>
                                            <th className="py-3.5 px-4">Property & Location</th>
                                            <th className="py-3.5 px-4">Owner</th>
                                            <th className="py-3.5 px-4">Price (INR)</th>
                                            <th className="py-3.5 px-4">Area / Size</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4">Verification</th>
                                            <th className="py-3.5 px-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-sm">
                                        {(() => {
                                            const filtered = data.allListings
                                                .filter(l => {
                                                    const q = searchQuery.toLowerCase();
                                                    const matchesSearch =
                                                        (l.title || '').toLowerCase().includes(q) ||
                                                        (l.location || '').toLowerCase().includes(q) ||
                                                        (l.createdBy?.name || '').toLowerCase().includes(q) ||
                                                        (l.createdBy?.email || '').toLowerCase().includes(q);
                                                    const matchesStatus = listingStatusFilter === 'All' ? true : (l.status || 'Active') === listingStatusFilter;
                                                    return matchesSearch && matchesStatus;
                                                });

                                            if (filtered.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan="8" className="py-16 text-center text-slate-400 font-semibold">
                                                            No property listings found matching your search.
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            const pageSlice = filtered.slice((listingsPage - 1) * listingsPageSize, listingsPage * listingsPageSize);
                                            const globalOffset = (listingsPage - 1) * listingsPageSize;

                                            return pageSlice.map((l, idx) => {
                                                const status = l.status || 'Active';
                                                const statusColors = {
                                                    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                    Inactive: 'bg-slate-100 text-slate-700 border-slate-200',
                                                    Sold: 'bg-amber-50 text-amber-700 border-amber-200',
                                                    Reserved: 'bg-blue-50 text-blue-700 border-blue-200'
                                                };
                                                const statusColor = statusColors[status] || statusColors.Active;

                                                const isVerified = l.listingType === 'Verified';

                                                return (
                                                    <tr key={l._id} className="hover:bg-slate-50/60 transition-colors group">
                                                        <td className="py-4 px-5 text-slate-400 font-bold text-xs">{globalOffset + idx + 1}</td>
                                                        <td className="py-4 px-4 min-w-[220px]">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                                                                    <Home size={16} className="text-slate-600" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-slate-900 truncate max-w-xs">{l.title}</p>
                                                                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-0.5 truncate max-w-xs">
                                                                        <MapPin size={11} className="text-slate-400 shrink-0" />
                                                                        <span>{l.location}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            <div className="font-bold text-slate-800 text-xs">{l.createdBy?.name || 'Unknown'}</div>
                                                            <div className="text-[10px] text-slate-400 font-semibold uppercase">{l.createdBy?.role || 'User'}</div>
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            <span className="font-black text-slate-900 text-sm">₹{l.price?.toLocaleString('en-IN')}</span>
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                                                            {l.area || '—'}
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${statusColor}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : status === 'Reserved' ? 'bg-blue-500' : 'bg-slate-400'
                                                                    }`}></span>
                                                                {status}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            {isVerified ? (
                                                                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                    Verified
                                                                </span>
                                                            ) : l.verificationStatus === 'Pending' ? (
                                                                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                                                    Pending
                                                                </span>
                                                            ) : (
                                                                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                                                    Standard
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-5 text-right whitespace-nowrap">
                                                            <div className="inline-flex items-center gap-1">
                                                                {/* Quick Activate button for Inactive or Sold listings */}
                                                                {(status === 'Inactive' || status === 'Sold') && (
                                                                    <button
                                                                        onClick={() => handleListingAction(l._id, 'activate')}
                                                                        disabled={listingActionLoadingId === l._id + 'activate'}
                                                                        title="Activate Listing"
                                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer disabled:opacity-40"
                                                                    >
                                                                        <Check size={14} />
                                                                    </button>
                                                                )}
                                                                {/* View */}
                                                                <button
                                                                    onClick={() => setViewListingModal(l)}
                                                                    title="View Details"
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                                                                >
                                                                    <Eye size={15} />
                                                                </button>
                                                                {/* Edit */}
                                                                <button
                                                                    onClick={() => {
                                                                        setEditListingModal(l);
                                                                        setEditListingForm({
                                                                            title: l.title || '',
                                                                            price: l.price || '',
                                                                            location: l.location || '',
                                                                            area: l.area || '',
                                                                            status: l.status || 'Active',
                                                                            listingType: l.listingType || 'NonVerified',
                                                                            description: l.description || ''
                                                                        });
                                                                    }}
                                                                    title="Edit Property"
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all cursor-pointer"
                                                                >
                                                                    <Pencil size={15} />
                                                                </button>
                                                                {/* External Link */}
                                                                <a
                                                                    href={`/listings/${l._id}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    title="Open Public Page"
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all cursor-pointer"
                                                                >
                                                                    <ExternalLink size={15} />
                                                                </a>
                                                                {/* Delete */}
                                                                <button
                                                                    onClick={() => handleListingAction(l._id, 'delete')}
                                                                    disabled={listingActionLoadingId === l._id + 'delete'}
                                                                    title="Delete Property"
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer disabled:opacity-40"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                totalItems={data.allListings.filter(l => {
                                    const q = searchQuery.toLowerCase();
                                    const matchesSearch =
                                        (l.title || '').toLowerCase().includes(q) ||
                                        (l.location || '').toLowerCase().includes(q) ||
                                        (l.createdBy?.name || '').toLowerCase().includes(q) ||
                                        (l.createdBy?.email || '').toLowerCase().includes(q);
                                    const matchesStatus = listingStatusFilter === 'All' ? true : (l.status || 'Active') === listingStatusFilter;
                                    return matchesSearch && matchesStatus;
                                }).length}
                                currentPage={listingsPage}
                                onPageChange={setListingsPage}
                                pageSize={listingsPageSize}
                                onPageSizeChange={setListingsPageSize}
                            />
                        </div>
                    </div>
                )}

                {/* INQUIRIES TAB */}
                {activeTab === 'Inquiries' && inquiries && (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h1 className="text-3xl font-bold text-slate-900">Global Site Requests & Leads</h1>
                            <div className="relative w-full sm:w-80">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search buyer or listing..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setInquiriesPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:border-blue-400 transition-all text-sm font-semibold"
                                />
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                            {inquiries.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 font-medium">No site requests logged globally.</div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 border-b border-slate-100">
                                                <tr>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Property Owner</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Buyer Detail</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Requested Listing</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status Tracker</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {inquiries
                                                    .filter(inq =>
                                                        inq.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        inq.listingId?.title?.toLowerCase().includes(searchQuery.toLowerCase())
                                                    )
                                                    .slice((inquiriesPage - 1) * inquiriesPageSize, inquiriesPage * inquiriesPageSize)
                                                    .map(inq => (
                                                        <tr key={inq._id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="p-4">
                                                                {inq.listingId?.createdBy?.name ? (
                                                                    <>
                                                                        <p className="font-bold text-slate-900 truncate max-w-xs">{inq.listingId.createdBy.name}</p>
                                                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded mt-1 inline-block border border-slate-200 shadow-sm">{inq.listingId.createdBy.role}</span>
                                                                    </>
                                                                ) : (
                                                                    <p className="text-slate-400 italic">Unknown</p>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                <p className="font-bold text-blue-700 whitespace-nowrap">{inq.userId?.name}</p>
                                                                <p className="text-sm font-semibold text-slate-500 mt-0.5">{inq.userId?.phone}</p>
                                                            </td>
                                                            <td className="p-4">
                                                                <p className="font-semibold text-slate-800 truncate max-w-[200px]" title={inq.listingId?.title}>{inq.listingId?.title}</p>
                                                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(inq.createdAt).toLocaleDateString()}</p>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <select
                                                                    value={inq.status || 'Pending'}
                                                                    disabled={inquiryActionLoadingId === inq._id}
                                                                    onChange={(e) => {
                                                                        const newStatus = e.target.value;
                                                                        if (newStatus === inq.status) return;
                                                                        handleUpdateInquiryStatus(inq._id, newStatus);
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer outline-none transition-all ${inq.status === 'Resolved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                                                            inq.status === 'Contacted' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                                                                'bg-amber-50 text-amber-800 border-amber-200'
                                                                        }`}
                                                                >
                                                                    <option value="Pending">Pending</option>
                                                                    <option value="Contacted">Contacted</option>
                                                                    <option value="Resolved">Resolved</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination
                                        totalItems={inquiries.filter(inq => inq.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || inq.listingId?.title?.toLowerCase().includes(searchQuery.toLowerCase())).length}
                                        currentPage={inquiriesPage}
                                        onPageChange={setInquiriesPage}
                                        pageSize={inquiriesPageSize}
                                        onPageSizeChange={setInquiriesPageSize}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}


                {/* WITHDRAWALS TAB */}
                {activeTab === 'Withdrawals' && (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 font-['Outfit']">Cashout Requests</h1>
                                <p className="text-xs font-semibold text-slate-500 mt-1">Review user earning history → Manually send money → Click "Pay & Approve" to deduct coins.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['ALL', 'PENDING', 'PAID', 'REJECTED'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => {
                                            setWithdrawalFilter(st);
                                            setWithdrawalsPage(1);
                                        }}
                                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${withdrawalFilter === st
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {st} {st !== 'ALL' && `(${withdrawals.filter(w => w.status === st).length})`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Info Banner */}
                        <div className="mb-5 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                            <div className="text-blue-500"><Info size={20} /></div>
                            <div>
                                <p className="text-sm font-bold text-blue-800">How Withdrawal Approval Works</p>
                                <p className="text-xs text-blue-700 mt-0.5">
                                    1. User submits a cashout request — <strong>coins stay in their wallet</strong> (NOT deducted yet).<br />
                                    2. You review the earning history below, then send money manually via UPI/Bank.<br />
                                    3. Click <strong>"Pay & Approve"</strong> (enter UTR) → coins are <strong>permanently deducted</strong> from user wallet.<br />
                                    4. If you <strong>Reject</strong>, coins remain untouched — no refund needed.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {withdrawals.filter(w => withdrawalFilter === 'ALL' || w.status === withdrawalFilter).length === 0 ? (
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3"><IndianRupee size={24} /></div>
                                    <p className="text-slate-500 font-bold">No withdrawal requests found.</p>
                                </div>
                            ) : (
                                <>
                                    {withdrawals
                                        .filter(w => withdrawalFilter === 'ALL' || w.status === withdrawalFilter)
                                        .slice((withdrawalsPage - 1) * withdrawalsPageSize, withdrawalsPage * withdrawalsPageSize)
                                        .map(w => (
                                            <div key={w._id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${w.status === 'PENDING' ? 'border-amber-300 shadow-amber-50' :
                                                    w.status === 'PAID' ? 'border-emerald-200' : 'border-rose-200'
                                                }`}>
                                                {/* Main Row */}
                                                <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                                                    {/* User Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${w.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                    : w.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                }`}>{w.status}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono">{new Date(w.createdAt).toLocaleString('en-IN')}</span>
                                                        </div>
                                                        <div className="font-extrabold text-slate-900 text-base">{w.userId?.name || 'User'}</div>
                                                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                                            <span>Current Balance:</span>
                                                            <CoinBadge coins={w.userId?.coinsBalance ?? '?'} size="xs" showSuffix textClassName="font-bold text-slate-600" />
                                                        </div>
                                                    </div>

                                                    {/* Payout Info */}
                                                    <div className="text-sm">
                                                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-black uppercase mb-1">{w.paymentType}</span>
                                                        {w.paymentType === 'UPI' ? (
                                                            <div className="font-mono font-bold text-blue-700 text-sm select-all">{w.upiId}</div>
                                                        ) : (
                                                            <div className="text-xs text-slate-700 font-semibold">
                                                                <div>{w.bankDetails?.holderName}</div>
                                                                <div className="font-mono">A/C: {w.bankDetails?.accountNumber}</div>
                                                                <div className="font-mono text-slate-500">IFSC: {w.bankDetails?.ifscCode}</div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Amount */}
                                                    <div className="text-center px-4">
                                                        <div className="text-2xl font-black text-emerald-600">₹{w.amountINR?.toFixed(2)}</div>
                                                        <div className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                                                            <CoinBadge coins={w.coins} size="sm" showSuffix textClassName="font-bold text-slate-600" />
                                                        </div>
                                                        {w.transactionRef && <div className="text-[10px] font-mono text-slate-400 mt-1">{w.transactionRef}</div>}
                                                        {w.adminNote && <div className="text-[10px] text-rose-600 mt-0.5 max-w-[160px] line-clamp-2">{w.adminNote}</div>}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex flex-col gap-2 min-w-[160px]">
                                                        {w.status === 'PENDING' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApproveWithdrawal(w._id)}
                                                                    disabled={actionWithdrawalLoadingId === w._id}
                                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                                                                >
                                                                    <Check size={14} /> Pay & Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectWithdrawal(w._id)}
                                                                    disabled={actionWithdrawalLoadingId === w._id}
                                                                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                                                                >
                                                                    <X size={14} /> Reject
                                                                </button>
                                                                <button
                                                                    onClick={() => setExpandedWithdrawalId(expandedWithdrawalId === w._id ? null : w._id)}
                                                                    className="px-4 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                                >
                                                                    {expandedWithdrawalId === w._id ? '▲ Hide History' : '▼ View Earning History'}
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="text-xs text-slate-400 font-bold text-center">Processed</span>
                                                                <button
                                                                    onClick={() => setExpandedWithdrawalId(expandedWithdrawalId === w._id ? null : w._id)}
                                                                    className="px-4 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                                >
                                                                    {expandedWithdrawalId === w._id ? '▲ Hide History' : '▼ View Earning History'}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Earning Summary Banner */}
                                                {w.earningSummary && (
                                                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 flex flex-wrap gap-4 text-xs">
                                                        <div className="flex items-center gap-1"><span className="font-bold text-slate-600">Total Earned:</span> <CoinBadge coins={w.earningSummary.totalCoinsEarned} size="xs" textClassName="font-black text-blue-600" /></div>
                                                        <div><span className="font-bold text-slate-500">Welcome:</span> {w.earningSummary.welcomeCoins}</div>
                                                        <div><span className="font-bold text-slate-500">Daily Check-in:</span> {w.earningSummary.dailyCheckinCoins}</div>
                                                        <div><span className="font-bold text-slate-500">Feature Usage:</span> {w.earningSummary.featureUsageCoins}</div>
                                                        <div><span className="font-bold text-slate-500">Referrals:</span> {w.earningSummary.referralCoins}</div>
                                                        <div><span className="font-bold text-slate-500">Transactions:</span> {w.earningSummary.transactionCount}</div>
                                                    </div>
                                                )}

                                                {/* Expanded Earning History */}
                                                {expandedWithdrawalId === w._id && w.userEarningHistory && (
                                                    <div className="border-t border-slate-200 bg-white px-5 py-4">
                                                        <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Full Earning History (Last 50 transactions)</p>
                                                        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-2">
                                                            {w.userEarningHistory.length === 0 ? (
                                                                <p className="text-slate-400 text-xs text-center py-4">No transaction history found.</p>
                                                            ) : w.userEarningHistory.map((txn, idx) => (
                                                                <div key={idx} className={`flex justify-between items-center px-3 py-2 rounded-lg text-xs ${txn.coins > 0 ? 'bg-emerald-50 border border-emerald-100' :
                                                                        txn.coins < 0 ? 'bg-rose-50 border border-rose-100' :
                                                                            'bg-slate-50 border border-slate-100'
                                                                    }`}>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-semibold text-slate-800 truncate">{txn.description}</div>
                                                                        <div className="text-[10px] text-slate-400 font-mono">{txn.type} • {new Date(txn.createdAt).toLocaleString('en-IN')}</div>
                                                                    </div>
                                                                    <div className={`font-black ml-3 whitespace-nowrap ${txn.coins > 0 ? 'text-emerald-600' : txn.coins < 0 ? 'text-rose-600' : 'text-slate-400'
                                                                        }`}>
                                                                        <CoinBadge coins={Math.abs(txn.coins)} prefix={txn.coins > 0 ? '+' : txn.coins < 0 ? '-' : ''} size="xs" textClassName={txn.coins > 0 ? 'text-emerald-600' : txn.coins < 0 ? 'text-rose-600' : 'text-slate-400'} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    <Pagination
                                        totalItems={withdrawals.filter(w => withdrawalFilter === 'ALL' || w.status === withdrawalFilter).length}
                                        currentPage={withdrawalsPage}
                                        onPageChange={setWithdrawalsPage}
                                        pageSize={withdrawalsPageSize}
                                        onPageSizeChange={setWithdrawalsPageSize}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'Settings' && (
                    <div className="animate-fade-in max-w-5xl mx-auto space-y-8 pb-12">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black uppercase tracking-wider mb-2">
                                    <Sliders size={14} className="text-blue-600" />
                                    <span>Master Control Station</span>
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight font-['Outfit']">System & Economy Controls</h1>
                                <p className="text-sm font-semibold text-slate-500 mt-1">
                                    Instantly toggle pages on/off across the platform and dynamically configure withdrawal thresholds & reward coins.
                                </p>
                            </div>
                        </div>

                        {/* SECTION 1: MASTER PAGE & FEATURE TOGGLES */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Platform Feature & Page Toggles</h2>
                                    <p className="text-xs font-bold text-slate-400">Turn on or off specific tools, directory pages, and features in real-time.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    {
                                        key: 'enableRewardsSystem',
                                        title: 'Coin Rewards & Cashout System',
                                        desc: 'Master toggle: Hides all coin badges, wallet from navbar, routes, task bonuses, and referral programs across entire website when OFF.',
                                        icon: <Coins size={20} className="text-amber-500" />,
                                        highlight: true
                                    },
                                    {
                                        key: 'enableBoundaryMap',
                                        title: 'Land Measure GPS Boundary Map',
                                        desc: 'Interactive GPS polygon mapping tool for calculating land perimeter and coordinates.',
                                        icon: <Layers size={20} className="text-blue-500" />
                                    },
                                    {
                                        key: 'enableAreaConverter',
                                        title: 'Land Area Unit Converter',
                                        desc: 'Real-time land measurement converter (Bigha, Acre, Guntha, Sqft, Vigha, Sq Meter).',
                                        icon: <Calculator size={20} className="text-emerald-500" />
                                    },
                                    {
                                        key: 'enableLoanCalculator',
                                        title: 'Land Loan & EMI Calculator',
                                        desc: 'Financial mortgage and monthly installment estimation tool for buyers.',
                                        icon: <DollarSign size={20} className="text-purple-500" />
                                    },
                                    {
                                        key: 'enableBrokersDirectory',
                                        title: 'Verified Brokers Directory',
                                        desc: 'Public directory of trusted land brokers and verified agents.',
                                        icon: <UsersIcon size={20} className="text-teal-500" />
                                    },
                                    {
                                        key: 'enablePostProperty',
                                        title: 'User Property Listing Creation',
                                        desc: 'Allows users and landowners to post new properties for sale.',
                                        icon: <Home size={20} className="text-indigo-500" />
                                    },
                                    {
                                        key: 'enableTokenBooking',
                                        title: 'Online Token Booking & Escrow',
                                        desc: 'Allows sellers to offer 2% online token reservations and buyers to place earnest money deposits online.',
                                        icon: <CreditCard size={20} className="text-blue-600" />,
                                        defaultOff: true
                                    }
                                ].map((feature) => {
                                    const currentSetting = settings.find(s => s.key === feature.key);
                                    const isEnabled = currentSetting 
                                        ? currentSetting.value === true 
                                        : (feature.defaultOff ? false : true);

                                    return (
                                        <div
                                            key={feature.key}
                                            className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${isEnabled
                                                    ? (feature.highlight ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50/60 border-slate-200/90')
                                                    : 'bg-slate-100/60 border-slate-200 opacity-60'
                                                }`}
                                        >
                                            <div className="flex gap-3.5">
                                                <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                                    {feature.icon}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-black text-slate-900">{feature.title}</h4>
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                                            }`}>
                                                            {isEnabled ? 'ON' : 'OFF'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">
                                                        {feature.desc}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                disabled={updatingSetting === feature.key}
                                                onClick={() => handleUpdateSetting(feature.key, !isEnabled)}
                                                className={`shrink-0 relative inline-flex h-7 w-13 items-center rounded-full transition-all focus:outline-none ${isEnabled
                                                        ? (feature.highlight ? 'bg-amber-500 shadow-md shadow-amber-200' : 'bg-blue-600 shadow-md shadow-blue-200')
                                                        : 'bg-slate-300'
                                                    } ${updatingSetting === feature.key ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                                            >
                                                <span className="sr-only">Toggle {feature.key}</span>
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all shadow-sm ${isEnabled ? 'translate-x-7' : 'translate-x-1'
                                                        } flex items-center justify-center`}
                                                >
                                                    {isEnabled ? <Zap size={11} className={feature.highlight ? 'text-amber-600' : 'text-blue-600'} /> : <ZapOff size={11} className="text-slate-400" />}
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SECTION 2: COIN ECONOMY & REWARDS CONFIGURATION */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                        <Coins size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Coins & Cashout Economy Rules</h2>
                                        <p className="text-xs font-bold text-slate-400">Configure minimum withdrawal money, registration bonus, referral payout, and task coins.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveEconomyBatch}
                                    disabled={savingEconomy}
                                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {savingEconomy ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                    <span>{savingEconomy ? 'Saving...' : 'Save Economy Rules'}</span>
                                </button>
                            </div>

                            {/* Live Formula Preview Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Minimum Cashout</div>
                                    <div className="text-xl font-black mt-0.5">₹{economyForm.minWithdrawalINR || 50}.00</div>
                                    <div className="text-xs font-bold text-emerald-700">
                                        Requires {((Number(economyForm.minWithdrawalINR) || 50) * (Number(economyForm.coinToINRRate) || 20))} Coins
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-blue-700">Referral Reward Per Friend</div>
                                    <div className="text-xl font-black mt-0.5">
                                        ₹{((Number(economyForm.referralBonusCoins) || 200) / (Number(economyForm.coinToINRRate) || 20)).toFixed(2)}
                                    </div>
                                    <div className="text-xs font-bold text-blue-700">
                                        {economyForm.referralBonusCoins || 200} Coins per invite
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-950">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-purple-700">Welcome Login Bonus</div>
                                    <div className="text-xl font-black mt-0.5">
                                        ₹{((Number(economyForm.welcomeLoginCoins) || 100) / (Number(economyForm.coinToINRRate) || 20)).toFixed(2)}
                                    </div>
                                    <div className="text-xs font-bold text-purple-700">
                                        {economyForm.welcomeLoginCoins || 100} Coins on login
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-700">1st Property Listing Bonus</div>
                                    <div className="text-xl font-black mt-0.5">
                                        ₹{((Number(economyForm.firstPropertyCoins) || 500) / (Number(economyForm.coinToINRRate) || 20)).toFixed(2)}
                                    </div>
                                    <div className="text-xs font-bold text-amber-700">
                                        {economyForm.firstPropertyCoins || 500} Coins on 1st listing
                                    </div>
                                </div>
                            </div>

                            {/* Form Inputs Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                        Minimum Cashout (₹ INR) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={economyForm.minWithdrawalINR ?? ''}
                                        onChange={(e) => handleEconomyInputChange('minWithdrawalINR', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all"
                                        placeholder="50"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Default: ₹50.00</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                        Coin Conversion Rate <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={economyForm.coinToINRRate ?? ''}
                                        onChange={(e) => handleEconomyInputChange('coinToINRRate', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all"
                                        placeholder="20"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">How many coins equal ₹1 (Default: 20 coins = ₹1)</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                        Direct Tasks Daily Cap (₹ INR)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={economyForm.directDailyCapINR ?? ''}
                                        onChange={(e) => handleEconomyInputChange('directDailyCapINR', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all"
                                        placeholder="30"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Max direct non-referral earning cap (Default: ₹30)</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                        Welcome Bonus (Coins)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="5"
                                        value={economyForm.welcomeLoginCoins ?? ''}
                                        onChange={(e) => handleEconomyInputChange('welcomeLoginCoins', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all"
                                        placeholder="100"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Given to new user on registration (100 coins = ₹5)</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                        Referral Bonus Per Friend (Coins)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="10"
                                        value={economyForm.referralBonusCoins ?? ''}
                                        onChange={(e) => handleEconomyInputChange('referralBonusCoins', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all"
                                        placeholder="200"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Given to inviter per friend (200 coins = ₹10)</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                        1st Property Listing Reward (Coins)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="50"
                                        value={economyForm.firstPropertyCoins ?? ''}
                                        onChange={(e) => handleEconomyInputChange('firstPropertyCoins', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all"
                                        placeholder="500"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Awarded when user posts their 1st land plot (500 coins = ₹25)</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                        Daily Check-in Reward (Coins)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={economyForm.dailyCheckinCoins ?? ''}
                                        onChange={(e) => handleEconomyInputChange('dailyCheckinCoins', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all"
                                        placeholder="20"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Coins for daily check-in streak (20 coins = ₹1)</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                        Land Measure Map Task (Coins)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={economyForm.landMapCoins ?? ''}
                                        onChange={(e) => handleEconomyInputChange('landMapCoins', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all"
                                        placeholder="20"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Coins for opening GPS boundary map (20 coins = ₹1)</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                        Area Converter Task (Coins)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={economyForm.areaConverterCoins ?? ''}
                                        onChange={(e) => handleEconomyInputChange('areaConverterCoins', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all"
                                        placeholder="20"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Coins for using unit converter (20 coins = ₹1)</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                        Browse Listings Task (Coins)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={economyForm.viewListingsCoins ?? ''}
                                        onChange={(e) => handleEconomyInputChange('viewListingsCoins', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all"
                                        placeholder="20"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Coins for viewing verified land plots (20 coins = ₹1)</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={handleSaveEconomyBatch}
                                    disabled={savingEconomy}
                                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {savingEconomy ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                    <span>{savingEconomy ? 'Saving Configuration...' : 'Save Economy Configuration'}</span>
                                </button>
                            </div>
                        </div>

                        {/* SECTION 3: ENTERPRISE MASTER PIN & 2FA ACCESS PROTECTION */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Master Security PIN & 2FA Protection</h2>
                                            {sessionAdminPin ? (
                                                <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                                                    <CheckCircle size={12} />
                                                    <span>Session Unlocked</span>
                                                </div>
                                            ) : (
                                                <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                                                    <Lock size={12} />
                                                    <span>Verification Required</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs font-semibold text-slate-500 mt-1 max-w-xl leading-relaxed">
                                            Big-tech financial grade security: All sensitive economy rate modifications, feature disables, and cashout approvals are strictly locked behind your encrypted Master Security PIN.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <button
                                        onClick={() => setShowChangePinModal(true)}
                                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                                    >
                                        Change Master PIN
                                    </button>
                                    {sessionAdminPin && (
                                        <button
                                            onClick={() => {
                                                setSessionAdminPin('');
                                                sessionStorage.removeItem('admin_master_pin');
                                                toast.info('Admin session locked. PIN will be required for subsequent sensitive actions.');
                                            }}
                                            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                        >
                                            Lock Session Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PUSH NOTIFICATIONS BROADCAST CENTER */}
                {activeTab === 'Push Notifications' && (
                    <div className="animate-fade-in max-w-6xl mx-auto space-y-8 pb-12 font-['Nunito_Sans',sans-serif]">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black uppercase tracking-wider mb-2">
                                    <Bell size={14} className="text-blue-600" />
                                    <span>Mobile & Web Push Engine</span>
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight font-['Outfit']">Push Notifications & Re-Engagement Hub</h1>
                                <p className="text-sm font-semibold text-slate-500 mt-1">
                                    Broadcast high-impact property alerts, price drops, and retention notifications directly to mobile app lockscreens like Zepto & Zomato.
                                </p>
                            </div>
                        </div>

                        {/* DEVICE ANALYTICS BAR */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Active Devices</span>
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Smartphone size={18} />
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-slate-900">{pushStats?.totalDevices || 0}</div>
                                <div className="text-[11px] font-semibold text-slate-500 mt-1">Registered push recipients</div>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Android App Devices</span>
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <CheckCircle size={18} />
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-slate-900">{pushStats?.androidDevices || 0}</div>
                                <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                    <span>Google Play App Installs</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Web & Other Devices</span>
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <Layers size={18} />
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-slate-900">{pushStats?.webDevices || 0}</div>
                                <div className="text-[11px] font-semibold text-slate-500 mt-1">Web browser clients</div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-black uppercase tracking-wider text-blue-300">Automated Cron</span>
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                </div>
                                <div className="text-lg font-black text-white">Smart Engine Active</div>
                                <div className="text-[10px] text-slate-300 font-semibold mt-1">
                                    Daily 10:30 AM Discovery & 48h Inactivity Auto-Triggers
                                </div>
                            </div>
                        </div>

                        {/* BROADCAST CREATOR & LIVE PREVIEW */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* Left: Compose Form */}
                            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Send size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">Compose Push Notification</h3>
                                            <p className="text-xs font-semibold text-slate-400">Send an instant alert to all devices.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Marketing Templates */}
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                        Quick Templates (Zepto / Zomato Style)
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            {
                                                label: '🏡 New Plots Alert',
                                                title: '🏡 3 New Verified Land Plots Just Listed!',
                                                body: 'Check out newly approved agricultural & NA plots with clear legal titles in Gujarat. 0 brokerage fee.',
                                                route: '/search'
                                            },
                                            {
                                                label: '🔥 Weekend Special',
                                                title: '🚀 Weekend Land Hotspots & Price Drops',
                                                body: 'High-growth investment plots in Dholera & Ahmedabad with verified documentation. Explore now!',
                                                route: '/search?sort=trending'
                                            },
                                            {
                                                label: '📉 Price Drop Alert',
                                                title: '📉 Price Drop Alert on Prime Plots!',
                                                body: 'Sellers just lowered prices on featured residential & agricultural lands. Check them before they are booked.',
                                                route: '/search'
                                            },
                                            {
                                                label: '🎁 Coin Rewards Promo',
                                                title: '🎁 Claim Free Earning Coins Today!',
                                                body: 'Daily check-in bonus & referral rewards are waiting. Cash out directly to your Bank or UPI.',
                                                route: '/rewards'
                                            }
                                        ].map((tmpl, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setPushForm(p => ({
                                                    ...p,
                                                    title: tmpl.title,
                                                    body: tmpl.body,
                                                    route: tmpl.route
                                                }))}
                                                className="px-3 py-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-extrabold text-slate-700 transition-all cursor-pointer truncate"
                                            >
                                                {tmpl.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <form onSubmit={handleSendPushBroadcast} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                            Target Audience
                                        </label>
                                        <select
                                            value={pushForm.targetRole}
                                            onChange={(e) => setPushForm(p => ({ ...p, targetRole: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                        >
                                            <option value="ALL">All Registered Users ({pushStats?.totalDevices || 0} Devices)</option>
                                            <option value="Buyer">Buyers Only</option>
                                            <option value="Seller">Sellers & Land Owners</option>
                                            <option value="Broker">Verified Brokers</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                            Notification Title <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={pushForm.title}
                                            onChange={(e) => setPushForm(p => ({ ...p, title: e.target.value }))}
                                            placeholder="e.g. 🏡 New Plot Listed in Sanand!"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                            Message Body <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={pushForm.body}
                                            onChange={(e) => setPushForm(p => ({ ...p, body: e.target.value }))}
                                            placeholder="Write high-converting alert message..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                                Deep-Link Route / URL
                                            </label>
                                            <input
                                                type="text"
                                                value={pushForm.route}
                                                onChange={(e) => setPushForm(p => ({ ...p, route: e.target.value }))}
                                                placeholder="/search or /rewards"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                                Image URL (Optional Rich Banner)
                                            </label>
                                            <input
                                                type="url"
                                                value={pushForm.imageUrl}
                                                onChange={(e) => setPushForm(p => ({ ...p, imageUrl: e.target.value }))}
                                                placeholder="https://.../banner.jpg"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-3">
                                        <button
                                            type="submit"
                                            disabled={sendingPush || !pushForm.title.trim() || !pushForm.body.trim()}
                                            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                        >
                                            {sendingPush ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                            <span>{sendingPush ? 'Broadcasting to Devices...' : 'Send Instant Push Broadcast'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Right: Live Android Lockscreen Notification Preview */}
                            <div className="lg:col-span-5 space-y-4">
                                <div className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
                                    Live Android Phone Notification Shade Preview
                                </div>

                                <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl border-4 border-slate-800 max-w-sm mx-auto relative overflow-hidden">
                                    {/* Mock Phone Status Bar */}
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-6 px-1">
                                        <span>10:30 AM</span>
                                        <div className="flex items-center gap-2">
                                            <span>5G</span>
                                            <span>100%</span>
                                        </div>
                                    </div>

                                    {/* Android Push Card */}
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-lg space-y-2.5 transition-all">
                                        {/* App Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[9px] font-black">
                                                    KP
                                                </div>
                                                <span className="text-[11px] font-extrabold text-slate-200 tracking-tight">Kharsan Properties</span>
                                                <span className="text-[10px] text-slate-400 font-semibold">• now</span>
                                            </div>
                                            <span className="text-[10px] text-blue-300 font-bold">Alert</span>
                                        </div>

                                        {/* Notification Content */}
                                        <div>
                                            <h4 className="text-xs font-black text-white leading-tight">
                                                {pushForm.title || 'Notification Title'}
                                            </h4>
                                            <p className="text-[11px] text-slate-300 font-medium mt-1 leading-snug">
                                                {pushForm.body || 'Message body will appear here in real-time as you type...'}
                                            </p>
                                        </div>

                                        {/* Optional Image Banner Preview */}
                                        {pushForm.imageUrl && (
                                            <div className="rounded-xl overflow-hidden border border-white/10 mt-2">
                                                <img
                                                    src={pushForm.imageUrl}
                                                    alt="Push Banner"
                                                    className="w-full h-24 object-cover"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <div className="pt-1 flex justify-end">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-400 bg-blue-500/20 px-2.5 py-1 rounded-lg">
                                                <span>Open in App</span>
                                                <ExternalLink size={10} />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Security Guarantee */}
                                    <div className="mt-8 text-center text-[10px] font-bold text-slate-500">
                                        🔒 End-to-end FCM Encrypted Payload
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

            </div>


            {/* VIEW USER MODAL */}
            {viewUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setViewUserModal(null)}>
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewUserModal(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md overflow-hidden">
                                {viewUserModal.profileImage ? (
                                    <img src={getImageUrl(viewUserModal.profileImage)} alt={viewUserModal.name} className="w-full h-full object-cover" />
                                ) : (
                                    (viewUserModal.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-black text-slate-900 text-xl truncate">{viewUserModal.name || 'Unnamed'}</p>
                                    {viewUserModal.identityVerified && (
                                        <BadgeCheck size={18} className="text-blue-500 shrink-0" title="Identity Verified" />
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 font-semibold truncate">{viewUserModal.email || 'No email provided'}</p>
                                {viewUserModal.phone && (
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">{viewUserModal.phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Auth / Login Method Banner */}
                        <div className="mb-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Authentication Method</p>
                                <p className="text-xs font-bold text-slate-800 mt-0.5">
                                    {viewUserModal.googleId && viewUserModal.hasPassword 
                                        ? 'Google Sign-In + Manual Password (Linked Account)'
                                        : viewUserModal.googleId 
                                        ? 'Google Sign-In (OAuth 2.0)'
                                        : 'Manual Registration (Email / Password)'}
                                </p>
                            </div>
                            {viewUserModal.googleId ? (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 shrink-0">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                    </svg>
                                    <span>Google Auth</span>
                                </span>
                            ) : (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1.5 shrink-0">
                                    <Key size={12} className="text-slate-600" />
                                    <span>Password</span>
                                </span>
                            )}
                        </div>

                        {/* Key Account Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">User Role</p>
                                <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider border ${viewUserModal.role === 'Admin' ? 'bg-rose-100 text-rose-700 border-rose-200' : viewUserModal.role === 'Broker' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{viewUserModal.role}</span>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Account Status</p>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase border ${(viewUserModal.accountStatus || 'Active') === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${(viewUserModal.accountStatus || 'Active') === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                    {viewUserModal.accountStatus || 'Active'}
                                </span>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Coin Balance</p>
                                <p className="font-black text-amber-700 text-base">{viewUserModal.coinsBalance || 0} Coins</p>
                                <p className="text-[10px] text-slate-400">= ₹{((viewUserModal.coinsBalance || 0) / 20).toFixed(2)} INR</p>
                            </div>
                            <div
                                onClick={() => handleFilterByUser(viewUserModal.name || viewUserModal.email)}
                                className="bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all rounded-2xl p-3.5 border border-slate-100 cursor-pointer group"
                                title="Click to view and manage this user's listings"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-blue-600 mb-1">Listings</p>
                                    <span className="text-[10px] text-blue-600 font-bold group-hover:underline">Manage →</span>
                                </div>
                                <p className="font-black text-slate-800 text-base group-hover:text-blue-700">{viewUserModal.listingCount || 0} Properties</p>
                            </div>
                        </div>

                        {/* Referral & Account Details */}
                        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2 mb-6">
                            {viewUserModal.referralCode && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-400 uppercase text-[10px]">Referral Code</span>
                                    <span className="font-mono font-black text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">{viewUserModal.referralCode}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400 uppercase text-[10px]">Account Registered</span>
                                <span className="font-bold text-slate-700">{viewUserModal.createdAt ? new Date(viewUserModal.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    const u = viewUserModal;
                                    setViewUserModal(null);
                                    setResetPasswordModal(u);
                                    setNewPasswordInput('');
                                    setShowPasswordText(false);
                                }}
                                className="py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Key size={14} /> Change Password
                            </button>
                            <button
                                onClick={() => {
                                    const u = viewUserModal;
                                    setViewUserModal(null);
                                    setEditUserModal(u);
                                    setEditUserForm({
                                        name: u.name || '',
                                        email: u.email || '',
                                        phone: u.phone || '',
                                        role: u.role || 'User',
                                        accountStatus: u.accountStatus || 'Active',
                                        coinsBalance: u.coinsBalance || 0,
                                        password: ''
                                    });
                                    setShowEditPassword(false);
                                }}
                                className="py-3 px-4 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Pencil size={14} /> Edit User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT USER MODAL */}
            {editUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditUserModal(null)}>
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditUserModal(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
                            <X size={18} />
                        </button>
                        
                        <div className="flex items-center gap-3.5 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                                {(editUserModal.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Edit User Account</h3>
                                <p className="text-xs text-slate-400">{editUserModal.email || 'No email'}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveEditUser} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editUserForm.name}
                                    onChange={e => setEditUserForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                    placeholder="Full name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={editUserForm.email}
                                        onChange={e => setEditUserForm(p => ({ ...p, email: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Mobile Phone</label>
                                    <input
                                        type="text"
                                        value={editUserForm.phone}
                                        onChange={e => setEditUserForm(p => ({ ...p, phone: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                        placeholder="9876543210"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Role</label>
                                    <select
                                        value={editUserForm.role}
                                        onChange={e => setEditUserForm(p => ({ ...p, role: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="User">User</option>
                                        <option value="Buyer">Buyer</option>
                                        <option value="Seller">Seller</option>
                                        <option value="Broker">Broker</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Account Status</label>
                                    <select
                                        value={editUserForm.accountStatus}
                                        onChange={e => setEditUserForm(p => ({ ...p, accountStatus: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Suspended">Suspended</option>
                                        <option value="Disabled">Disabled</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Coin Balance Adjustment</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editUserForm.coinsBalance}
                                    onChange={e => setEditUserForm(p => ({ ...p, coinsBalance: Number(e.target.value) }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 font-semibold">= ₹{(Number(editUserForm.coinsBalance || 0) / 20).toFixed(2)} INR cashout equivalent</p>
                            </div>

                            {/* Optional Password Change Accordion */}
                            <div className="pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowEditPassword(!showEditPassword)}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Key size={13} />
                                    <span>{showEditPassword ? 'Hide Password Change' : '+ Set / Change Password with this update'}</span>
                                </button>

                                {showEditPassword && (
                                    <div className="mt-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-amber-800">New Password (Min 6 Chars)</label>
                                        <input
                                            type="text"
                                            value={editUserForm.password}
                                            onChange={e => setEditUserForm(p => ({ ...p, password: e.target.value }))}
                                            placeholder="Leave empty to keep existing password"
                                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:border-amber-500"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditUserModal(null)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingUser}
                                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {savingUser ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />} Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DIRECT PASSWORD RESET MODAL */}
            {resetPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setResetPasswordModal(null)}>
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setResetPasswordModal(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3.5 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                                <Key size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Change User Password</h3>
                                <p className="text-xs text-slate-500 font-semibold">{resetPasswordModal.name || resetPasswordModal.email}</p>
                            </div>
                        </div>

                        {/* Informational Guidance for Google Users */}
                        {resetPasswordModal.googleId && (
                            <div className="mb-4 p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
                                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="font-black">Google Sign-In User:</strong> Setting a password enables this user to log in with <strong>both</strong> Google Sign-In and Email/Password.
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleResetUserPassword} className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">New Password</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const pass = generateStrongPassword();
                                            setNewPasswordInput(pass);
                                            setShowPasswordText(true);
                                        }}
                                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                        <Sparkles size={12} />
                                        <span>Generate Strong</span>
                                    </button>
                                </div>

                                <div className="relative">
                                    <input
                                        type={showPasswordText ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={newPasswordInput}
                                        onChange={e => setNewPasswordInput(e.target.value)}
                                        placeholder="Enter new password (min 6 chars)..."
                                        className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {newPasswordInput && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopyPassword(newPasswordInput)}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all"
                                                title="Copy Password"
                                            >
                                                {copiedPassword ? <CheckCheck size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordText(!showPasswordText)}
                                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all"
                                            title={showPasswordText ? 'Hide' : 'Show'}
                                        >
                                            {showPasswordText ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 font-semibold">User's existing sessions will be invalidated for security.</p>
                            </div>

                            <div className="flex gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setResetPasswordModal(null)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resettingPassword || !newPasswordInput || newPasswordInput.trim().length < 6}
                                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg"
                                >
                                    {resettingPassword ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />} Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MASTER SECURITY PIN VERIFICATION MODAL ── */}

            {/* VIEW LISTING MODAL */}
            {viewListingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setViewListingModal(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewListingModal(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"><X size={16} /></button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                                <Home size={22} />
                            </div>
                            <div className="min-w-0 pr-8">
                                <h3 className="text-lg font-black text-slate-900 truncate leading-snug">{viewListingModal.title}</h3>
                                <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                                    <MapPin size={12} className="shrink-0 text-slate-400" />
                                    <span>{viewListingModal.location}</span>
                                </p>
                            </div>
                        </div>

                        {/* Image Preview if available */}
                        {viewListingModal.images && viewListingModal.images.length > 0 && (
                            <div className="mb-4 rounded-xl overflow-hidden border border-slate-100 h-44 bg-slate-50">
                                <img
                                    src={typeof viewListingModal.images[0] === 'string' ? viewListingModal.images[0] : viewListingModal.images[0]?.url}
                                    alt={viewListingModal.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Price (INR)</p>
                                <p className="font-black text-slate-900 text-base">₹{viewListingModal.price?.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Area / Land Size</p>
                                <p className="font-bold text-slate-800 text-sm">{viewListingModal.area || 'Not Specified'}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Status</p>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase border ${viewListingModal.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        viewListingModal.status === 'Reserved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${viewListingModal.status === 'Active' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                                    {viewListingModal.status}
                                </span>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Verification</p>
                                <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider border ${viewListingModal.listingType === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                    {viewListingModal.listingType === 'Verified' ? 'Verified' : 'Standard'}
                                </span>
                            </div>
                        </div>

                        {/* Owner Information */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Property Owner</p>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{viewListingModal.createdBy?.name || 'Unknown'}</p>
                                    <p className="text-xs text-slate-400">{viewListingModal.createdBy?.role || 'User'}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setViewListingModal(null);
                                        handleFilterByUser(viewListingModal.createdBy?.name || '');
                                    }}
                                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                >
                                    Filter by owner →
                                </button>
                            </div>
                        </div>

                        {/* Description */}
                        {viewListingModal.description && (
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-5">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Description</p>
                                <p className="text-xs text-slate-700 leading-relaxed max-h-24 overflow-y-auto">{viewListingModal.description}</p>
                            </div>
                        )}

                        {/* Quick Activate Button for Inactive/Sold listings in Modal */}
                        {viewListingModal.status !== 'Active' && (
                            <button
                                onClick={async () => {
                                    await handleListingAction(viewListingModal._id, 'activate');
                                    setViewListingModal(prev => ({ ...prev, status: 'Active' }));
                                }}
                                className="w-full mb-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Check size={14} /> Activate Listing Now
                            </button>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const l = viewListingModal;
                                    setViewListingModal(null);
                                    setEditListingModal(l);
                                    setEditListingForm({
                                        title: l.title || '',
                                        price: l.price || '',
                                        location: l.location || '',
                                        area: l.area || '',
                                        status: l.status || 'Active',
                                        listingType: l.listingType || 'NonVerified',
                                        description: l.description || ''
                                    });
                                }}
                                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Pencil size={13} /> Edit Property
                            </button>
                            <a
                                href={`/listings/${viewListingModal._id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <ExternalLink size={13} /> Public Page
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT LISTING MODAL */}
            {editListingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditListingModal(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditListingModal(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"><X size={16} /></button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                                <Pencil size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900">Edit Property Listing</h3>
                                <p className="text-xs text-slate-400">Update property details, price, verification, and status.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveEditListing} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Property Title</label>
                                <input
                                    type="text"
                                    value={editListingForm.title}
                                    onChange={e => setEditListingForm(p => ({ ...p, title: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                    placeholder="Property Title"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Price in INR (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editListingForm.price}
                                        onChange={e => setEditListingForm(p => ({ ...p, price: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                        placeholder="Price in INR"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Area / Land Size</label>
                                    <input
                                        type="text"
                                        value={editListingForm.area}
                                        onChange={e => setEditListingForm(p => ({ ...p, area: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                        placeholder="e.g. 500 Sq. Yards"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Location Address</label>
                                <input
                                    type="text"
                                    value={editListingForm.location}
                                    onChange={e => setEditListingForm(p => ({ ...p, location: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                    placeholder="City, Highway, Landmark..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Status</label>
                                    <select
                                        value={editListingForm.status}
                                        onChange={e => setEditListingForm(p => ({ ...p, status: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Reserved">Reserved</option>
                                        <option value="Sold">Sold</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Verification Badge</label>
                                    <select
                                        value={editListingForm.listingType}
                                        onChange={e => setEditListingForm(p => ({ ...p, listingType: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="Verified">Verified</option>
                                        <option value="NonVerified">Standard (Non-Verified)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                                <textarea
                                    rows="3"
                                    value={editListingForm.description}
                                    onChange={e => setEditListingForm(p => ({ ...p, description: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none"
                                    placeholder="Property description details..."
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditListingModal(null)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingListing}
                                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {savingListing ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                                    <span>Save Property</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-['Nunito_Sans',sans-serif]">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center relative animate-scale-up">
                        <button
                            onClick={() => {
                                setShowPinModal(false);
                                setPendingAction(null);
                                setPinInput('');
                            }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Shield size={32} />
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Security Authorization</h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1 mb-6">
                            Enter your confidential <strong>Master Admin Security PIN</strong> to authorize this financial change.
                        </p>

                        <form onSubmit={handleVerifyPinSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    autoFocus
                                    maxLength={8}
                                    value={pinInput}
                                    onChange={(e) => setPinInput(e.target.value)}
                                    placeholder="••••••"
                                    className="w-full text-center text-2xl font-black tracking-widest px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-amber-500 outline-none transition-all"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPinModal(false);
                                        setPendingAction(null);
                                        setPinInput('');
                                    }}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={verifyingPin || !pinInput.trim()}
                                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {verifyingPin ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                                    <span>{verifyingPin ? 'Verifying...' : 'Authorize'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── CHANGE MASTER PIN MODAL ── */}
            {showChangePinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-['Nunito_Sans',sans-serif]">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center relative animate-scale-up">
                        <button
                            onClick={() => {
                                setShowChangePinModal(false);
                                setCurrentPinInput('');
                                setNewPinInput('');
                                setConfirmPinInput('');
                            }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Sliders size={32} />
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Change Master Security PIN</h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1 mb-6">
                            Set a new 4 to 8 digit cryptographic passcode for admin operations.
                        </p>

                        <form onSubmit={handleChangePinSubmit} className="space-y-4 text-left">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                    Current Master PIN <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={currentPinInput}
                                    onChange={(e) => setCurrentPinInput(e.target.value)}
                                    placeholder="Enter current security PIN"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                    New Security PIN (4-8 Digits) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    maxLength={8}
                                    value={newPinInput}
                                    onChange={(e) => setNewPinInput(e.target.value)}
                                    placeholder="Enter new PIN"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                    Confirm New Security PIN <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    maxLength={8}
                                    value={confirmPinInput}
                                    onChange={(e) => setConfirmPinInput(e.target.value)}
                                    placeholder="Re-enter new PIN"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="flex gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowChangePinModal(false);
                                        setCurrentPinInput('');
                                        setNewPinInput('');
                                        setConfirmPinInput('');
                                    }}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={changingPin || !currentPinInput || !newPinInput}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {changingPin ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                    <span>{changingPin ? 'Saving...' : 'Update PIN'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRMATION & ACTION MODAL */}
            {confirmModal && <ConfirmModal {...confirmModal} />}

        </div>
    );
};

export default Admin;
