import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { getImageUrl } from "../utils/imageUrl";
import axios from "axios";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Laptop,
  Smartphone,
  AlertTriangle,
  Wallet,
  Plus,
  Edit2,
  Trash2,
  X,
  CreditCard,
  Landmark,
  ShieldCheck,
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Shield,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  Building2,
  BadgeCheck,
  LandPlot,
  Globe,
  Bell,
  ChevronRight,
  LogOut,
  HelpCircle,
  FileText,
  Info,
  ExternalLink,
  Coins,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ConfirmModal from "../components/ConfirmModal";
import SEO from "../components/SEO";

const inputCls =
  "w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all font-semibold text-slate-800 text-sm placeholder:text-slate-400";
const labelCls = "block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider";

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user, loading, logout, deleteAccount, updateProfileDetails } = useContext(AuthContext);
  const { language, toggleLanguage, setLanguage, t } = useLanguage();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // Active sub-sheet / modal state ('profile', 'password', 'payout', 'sessions', 'role', 'delete', null)
  const [activeSheet, setActiveSheet] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  /* ── Delete Account State ── */
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  /* ── Sessions State ── */
  const [sessions, setSessions] = useState([]);

  /* ── Payout Account State ── */
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [newAccount, setNewAccount] = useState({
    accountType: "Bank",
    holderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });

  const formatRoleLabel = (role) => {
    if (role === "Broker") return "Real Estate Broker";
    if (role === "Admin") return "System Administrator";
    return "Property Owner";
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get("/api/auth/sessions");
      setSessions(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user) return;
    setProfileForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
    fetchSessions();
  }, [user]);

  const handleRevokeSession = (sessionId) => {
    setConfirmModal({
      isOpen: true,
      title: "Terminate Device Session",
      message: "Are you sure you want to log out this device session?",
      confirmText: "Log Out Session",
      type: "warning",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await axios.delete(`/api/auth/sessions/${sessionId}`);
          setSessions(sessions.filter((s) => s._id !== sessionId));
          toast.success("Session revoked successfully");
        } catch {
          toast.error("Failed to revoke session");
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("/api/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = res.data?.data;
      if (imageUrl) {
        await updateProfileDetails({ profileImage: imageUrl });
        toast.success("Profile photo updated successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to upload profile photo.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    if (!user.profileImage) return;
    setConfirmModal({
      isOpen: true,
      title: "Remove Profile Picture",
      message: "Are you sure you want to remove your profile photo?",
      confirmText: "Remove Photo",
      type: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        setUploadingImage(true);
        try {
          await updateProfileDetails({ profileImage: "" });
          toast.success("Profile photo removed.");
        } catch {
          toast.error("Failed to remove profile photo.");
        } finally {
          setUploadingImage(false);
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const handleSwitchRole = async (newRole) => {
    try {
      await updateProfileDetails({ role: newRole });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(newRole === 'Broker' 
        ? 'Congratulations! You are now registered as an Authorized Broker!' 
        : 'Account type updated to Individual Property Owner'
      );
      setActiveSheet(null);
    } catch {
      toast.error('Failed to update account role');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfileDetails({ name: profileForm.name });
      toast.success("Profile updated successfully!");
      setActiveSheet(null);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      await axios.put("/api/auth/updatepassword", passwordForm);
      toast.success("Password updated successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setActiveSheet(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update password");
    }
  };

  const handleDeleteAccountConfirm = async (e) => {
    e.preventDefault();
    if (!deleteConfirmPassword) {
      toast.error("Please enter your password to confirm deletion.");
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccount(deleteConfirmPassword);
      toast.success("Account deleted successfully.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete account.");
    } finally {
      setIsDeleting(false);
      setActiveSheet(null);
      setDeleteConfirmPassword("");
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      if (editingAccountId) {
        await axios.put(
          `/api/auth/payment-accounts/${editingAccountId}`,
          newAccount
        );
        toast.success("Account updated!");
      } else {
        await axios.post("/api/auth/payment-accounts", newAccount);
        toast.success("Account added!");
      }
      setShowAddAccountModal(false);
      setEditingAccountId(null);
      setNewAccount({
        accountType: "Bank",
        holderName: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        upiId: "",
      });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save account");
    }
  };

  const handleEditAccount = (acc) => {
    setEditingAccountId(acc._id);
    setNewAccount({
      accountType: acc.accountType,
      holderName: acc.holderName,
      bankName: acc.bankName || "",
      accountNumber: acc.accountNumber || "",
      ifscCode: acc.ifscCode || "",
      upiId: acc.upiId || "",
    });
    setShowAddAccountModal(true);
  };

  const handleDeleteAccount = (accountId) => {
    setConfirmModal({
      isOpen: true,
      title: "Remove Payment Method",
      message: "Are you sure you want to remove this Bank / UPI payment account?",
      confirmText: "Remove Account",
      type: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await axios.delete(`/api/auth/payment-accounts/${accountId}`);
          toast.success("Payment method removed");
          queryClient.invalidateQueries({ queryKey: ["user"] });
        } catch {
          toast.error("Failed to remove payment method");
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const handleLogoutClick = () => {
    setConfirmModal({
      isOpen: true,
      title: "Log Out",
      message: "Are you sure you want to log out of your account on this device?",
      confirmText: "Log Out",
      type: "danger",
      onConfirm: () => {
        setConfirmModal(null);
        if (logout) logout();
        navigate("/login");
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const payoutAccounts = user.paymentAccounts || [];

  return (
    <div className="min-h-screen bg-[#f6f8fa] font-['Nunito_Sans',sans-serif] text-slate-900 pb-28 sm:pb-16 antialiased">
      <SEO
        title="Settings & Profile • Kharsan Properties"
        description="Manage your Kharsan Properties profile, security, payout methods, and account preferences."
      />

      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 space-y-5">
        
        {/* Page Title with Zepto/Zomato Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')}
              className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Settings
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Account, security & preferences
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-100 transition-all cursor-pointer"
          >
            Dashboard
          </button>
        </div>

        {/* ── 1. Modern Zepto/Insta Tier Profile Card ── */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex items-center gap-4 sm:gap-5">
            
            {/* Avatar with Camera Overlay */}
            <div className="relative group shrink-0">
              <div
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md overflow-hidden cursor-pointer border-2 border-white ring-2 ring-slate-100 hover:scale-105 transition-all"
                title="Tap to change profile picture"
              >
                {user.profileImage ? (
                  <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.name?.[0]?.toUpperCase() || "U"}</span>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  {uploadingImage ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white hover:bg-blue-700 transition-transform active:scale-90 cursor-pointer"
                title="Upload Photo"
              >
                <Camera size={12} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {user.name}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <BadgeCheck size={12} className="text-blue-600" />
                  <span>{formatRoleLabel(user.role)}</span>
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                {user.email || user.phone}
              </p>

              {user.phone && user.email && (
                <p className="text-[11px] font-medium text-slate-400 truncate">
                  {user.phone}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={() => setActiveSheet('profile')}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit2 size={12} /> Edit Profile
                </button>
                <Link
                  to="/rewards"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200/60 transition-colors"
                >
                  <Coins size={12} className="text-amber-600" /> Rewards
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* ── 2. Grouped Section: Account & Management ── */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3">
            Account Details
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            
            {/* Personal Details Row */}
            <button
              onClick={() => setActiveSheet('profile')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Personal Information</div>
                  <div className="text-xs text-slate-400 font-medium truncate">{user.name} &bull; {user.phone || user.email}</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>

            {/* Payout & Bank Accounts Row */}
            <button
              onClick={() => setActiveSheet('payout')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Landmark size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Bank & Payout Accounts</div>
                  <div className="text-xs text-slate-400 font-medium">
                    {payoutAccounts.length > 0 ? `${payoutAccounts.length} account(s) linked` : 'Add UPI / Bank for token bookings'}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>

            {/* Role & Broker Registration */}
            <button
              onClick={() => setActiveSheet('role')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Building2 size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Account Role & Broker Portal</div>
                  <div className="text-xs text-slate-400 font-medium">Current: {formatRoleLabel(user.role)}</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>

          </div>
        </div>

        {/* ── 3. Grouped Section: Security & Devices ── */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3">
            Security & Access
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            
            {/* Change Password Row */}
            <button
              onClick={() => setActiveSheet('password')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <KeyRound size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Change Password</div>
                  <div className="text-xs text-slate-400 font-medium">Update authentication credentials</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>

            {/* Active Sessions Row */}
            <button
              onClick={() => setActiveSheet('sessions')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                  <Laptop size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">Active Login Sessions</div>
                  <div className="text-xs text-slate-400 font-medium">{sessions.length || 1} active device session(s)</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>

          </div>
        </div>

        {/* ── 4. Grouped Section: Preferences & Language ── */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3">
            Preferences & Language
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            
            {/* Quick Language Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <Globe size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">App Language</div>
                  <div className="text-xs text-slate-400 font-medium">
                    {language === 'gu' ? 'ગુજરાતી (Gujarati)' : 'English (English)'}
                  </div>
                </div>
              </div>

              {/* Language Switch Pills */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    language === 'en' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('gu')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    language === 'gu' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  GU
                </button>
              </div>
            </div>

            {/* Quick Link to Area Converter */}
            <Link
              to="/area-converter"
              className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <LandPlot size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Land Units & 7/12 Converter</div>
                  <div className="text-xs text-slate-400 font-medium">Bigha, Guntha, Acre, Vigha calculator</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>

          </div>
        </div>

        {/* ── 5. Grouped Section: Support & Legal ── */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3">
            Support & Legal
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            
            <a
              href="mailto:support@kharsan.com"
              className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">Help & Customer Support</div>
                  <div className="text-xs text-slate-400 font-medium">support@kharsan.com</div>
                </div>
              </div>
              <ExternalLink size={16} className="text-slate-400 shrink-0" />
            </a>

            <Link
              to="/privacy-policy"
              className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Shield size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Privacy Policy</div>
                  <div className="text-xs text-slate-400 font-medium">Data privacy & protection standard</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>

            <Link
              to="/about"
              className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Info size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">About Kharsan Properties</div>
                  <div className="text-xs text-slate-400 font-medium">The Kharsan IT Solution Ecosystem</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>

          </div>
        </div>

        {/* ── 6. Grouped Section: Log Out & Danger Zone ── */}
        <div className="space-y-3 pt-2">
          
          {/* Log Out Button */}
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 p-3.5 bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-700 font-bold text-sm rounded-2xl transition-all shadow-2xs cursor-pointer active:scale-98"
          >
            <LogOut size={16} className="text-slate-500" />
            <span>Log Out</span>
          </button>

          {/* Delete Account Button */}
          <button
            onClick={() => setActiveSheet('delete')}
            className="w-full flex items-center justify-center gap-2 p-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete Account</span>
          </button>

          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
            Kharsan Properties &bull; v2.4.0 (Enterprise)
          </p>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SLIDE-OVER / BOTTOM SHEET MODALS FOR SETTINGS (ZEPTO / INSTA STYLE)
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeSheet && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4">
            
            {/* Backdrop click */}
            <div className="absolute inset-0" onClick={() => setActiveSheet(null)} />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden z-10"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                    {activeSheet === 'profile' && <User size={16} />}
                    {activeSheet === 'password' && <Lock size={16} />}
                    {activeSheet === 'payout' && <Landmark size={16} />}
                    {activeSheet === 'sessions' && <Laptop size={16} />}
                    {activeSheet === 'role' && <Building2 size={16} />}
                    {activeSheet === 'delete' && <AlertTriangle size={16} className="text-rose-500" />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {activeSheet === 'profile' && 'Edit Personal Details'}
                      {activeSheet === 'password' && 'Change Password'}
                      {activeSheet === 'payout' && 'Bank & Payout Accounts'}
                      {activeSheet === 'sessions' && 'Active Devices & Sessions'}
                      {activeSheet === 'role' && 'Account Role & Type'}
                      {activeSheet === 'delete' && 'Delete Account Permanently'}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSheet(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                
                {/* ── SHEET: PROFILE ── */}
                {activeSheet === 'profile' && (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className={inputCls}
                        placeholder="Your full legal name"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelCls}>Phone Number</label>
                        <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-wider">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      </div>
                      <input
                        type="text"
                        value={profileForm.phone}
                        disabled
                        className={inputCls + " opacity-60 cursor-not-allowed bg-slate-100 font-mono"}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelCls}>Email Address</label>
                        <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-wider">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      </div>
                      <input
                        type="email"
                        value={profileForm.email}
                        disabled
                        className={inputCls + " opacity-60 cursor-not-allowed bg-slate-100 font-mono"}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}

                {/* ── SHEET: PASSWORD ── */}
                {activeSheet === 'password' && (
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label className={labelCls}>Current Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          required
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className={inputCls}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className={inputCls}
                          placeholder="Minimum 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className={inputCls}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                )}

                {/* ── SHEET: PAYOUT ACCOUNTS ── */}
                {activeSheet === 'payout' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 font-semibold">
                        Connected accounts to receive direct buyer reservation tokens.
                      </p>
                      <button
                        onClick={() => {
                          setEditingAccountId(null);
                          setNewAccount({ accountType: "Bank", holderName: "", bankName: "", accountNumber: "", ifscCode: "", upiId: "" });
                          setShowAddAccountModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                      >
                        <Plus size={14} /> Add Account
                      </button>
                    </div>

                    {payoutAccounts.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Landmark size={32} className="mx-auto text-slate-400 mb-2" />
                        <div className="text-xs font-bold text-slate-700">No payout methods added yet</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Add your Bank or UPI ID to accept instant tokens</div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {payoutAccounts.map((acc) => (
                          <div
                            key={acc._id}
                            className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                                {acc.accountType === "UPI" ? <Smartphone size={18} /> : <Landmark size={18} />}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold text-slate-900 truncate">
                                  {acc.accountType === "UPI" ? acc.upiId : `${acc.bankName} (${acc.accountNumber?.slice(-4)})`}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {acc.holderName} &bull; {acc.accountType}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleEditAccount(acc)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteAccount(acc._id)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── SHEET: SESSIONS ── */}
                {activeSheet === 'sessions' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-semibold">
                      Devices currently authenticated into your account.
                    </p>

                    <div className="space-y-2.5">
                      {sessions.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Laptop size={18} className="text-blue-600" />
                            <div>
                              <div className="text-xs font-bold text-slate-900">Current Device Session</div>
                              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Active Now</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        sessions.map((sess) => (
                          <div
                            key={sess._id}
                            className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                                {sess.device?.toLowerCase().includes("mobile") ? <Smartphone size={18} /> : <Laptop size={18} />}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {sess.device || "Web Browser Session"}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  IP: {sess.ip || "::1"} &bull; {new Date(sess.lastActive).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRevokeSession(sess._id)}
                              className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                            >
                              Revoke
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ── SHEET: ROLE / BROKER PORTAL ── */}
                {activeSheet === 'role' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-semibold">
                      Choose your preferred account profile type across Gujarat.
                    </p>

                    {/* Role Option 1: Owner */}
                    <div
                      onClick={() => handleSwitchRole('Owner')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        user.role !== 'Broker'
                          ? 'bg-blue-50/50 border-blue-600 text-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                          <User size={16} className="text-blue-600" />
                          <span>Individual Property Owner</span>
                        </div>
                        {user.role !== 'Broker' && <Check size={16} className="text-blue-600" />}
                      </div>
                      <p className="text-xs text-slate-500 font-medium pl-6">
                        Best for landowners and individuals posting their own agricultural lands or plots.
                      </p>
                    </div>

                    {/* Role Option 2: Broker */}
                    <div
                      onClick={() => handleSwitchRole('Broker')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        user.role === 'Broker'
                          ? 'bg-amber-50/50 border-amber-500 text-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                          <Building2 size={16} className="text-amber-500" />
                          <span>Registered Real Estate Broker</span>
                        </div>
                        {user.role === 'Broker' && <Check size={16} className="text-amber-500" />}
                      </div>
                      <p className="text-xs text-slate-500 font-medium pl-6">
                        Get listed on the Gujarat Brokers Directory, receive verified buyer leads, and showcase client portfolios.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── SHEET: DELETE ACCOUNT ── */}
                {activeSheet === 'delete' && (
                  <form onSubmit={handleDeleteAccountConfirm} className="space-y-4">
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold leading-relaxed">
                      ⚠️ Deleting your account will permanently wipe all your property listings, inquiries, token bookings, and profile data from our live database. This action cannot be reversed.
                    </div>

                    <div>
                      <label className={labelCls}>Enter Password to Confirm</label>
                      <input
                        type="password"
                        required
                        value={deleteConfirmPassword}
                        onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                        className={inputCls}
                        placeholder="Your current account password"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isDeleting}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {isDeleting ? "Deleting..." : "Permanently Delete Account"}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add / Edit Payout Account Modal ── */}
      <AnimatePresence>
        {showAddAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 relative z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">
                  {editingAccountId ? "Edit Payout Method" : "Add New Payout Method"}
                </h3>
                <button
                  onClick={() => setShowAddAccountModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleAddAccount} className="space-y-4">
                {/* Type Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewAccount({ ...newAccount, accountType: "Bank" })}
                    className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      newAccount.accountType === "Bank" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                    }`}
                  >
                    Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccount({ ...newAccount, accountType: "UPI" })}
                    className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      newAccount.accountType === "UPI" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                    }`}
                  >
                    UPI ID
                  </button>
                </div>

                <div>
                  <label className={labelCls}>Beneficiary / Account Holder Name</label>
                  <input
                    type="text"
                    required
                    value={newAccount.holderName}
                    onChange={(e) => setNewAccount({ ...newAccount, holderName: e.target.value })}
                    className={inputCls}
                    placeholder="Name as per Bank records"
                  />
                </div>

                {newAccount.accountType === "Bank" ? (
                  <>
                    <div>
                      <label className={labelCls}>Bank Name</label>
                      <input
                        type="text"
                        required
                        value={newAccount.bankName}
                        onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                        className={inputCls}
                        placeholder="e.g. HDFC Bank, SBI, ICICI"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Account Number</label>
                      <input
                        type="text"
                        required
                        value={newAccount.accountNumber}
                        onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                        className={inputCls}
                        placeholder="Full bank account number"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>IFSC Code</label>
                      <input
                        type="text"
                        required
                        value={newAccount.ifscCode}
                        onChange={(e) => setNewAccount({ ...newAccount, ifscCode: e.target.value.toUpperCase() })}
                        className={inputCls + " uppercase"}
                        placeholder="e.g. HDFC0001234"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className={labelCls}>UPI ID (VPA)</label>
                    <input
                      type="text"
                      required
                      value={newAccount.upiId}
                      onChange={(e) => setNewAccount({ ...newAccount, upiId: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. username@okhdfcbank"
                    />
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddAccountModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Save Method
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reusable Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          type={confirmModal.type}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel}
        />
      )}

    </div>
  );
};

export default AccountSettings;
