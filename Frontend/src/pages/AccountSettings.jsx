import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { getImageUrl } from "../utils/imageUrl";
import axios from "axios";
import {
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  Laptop,
  Smartphone,
  AlertTriangle,
  Wallet,
  Plus,
  Edit,
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
  User,
  ArrowRight,
  Building2,
  BadgeCheck,
  LandPlot
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all font-semibold text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 shadow-2xs";
const labelCls = "block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider";

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user, loading, deleteAccount, updateProfileDetails } = useContext(AuthContext);
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [uploadingImage, setUploadingImage] = useState(false);

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const { data: systemSettings } = useQuery({
    queryKey: ["systemSettings"],
    queryFn: async () => {
      const res = await axios.get("/api/settings");
      return res.data.data;
    },
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

  const handleRevokeSession = async (sessionId) => {
    if (window.confirm("Log out from this device session?")) {
      try {
        await axios.delete(`/api/auth/sessions/${sessionId}`);
        setSessions(sessions.filter((s) => s._id !== sessionId));
        toast.success("Session revoked successfully");
      } catch {
        toast.error("Failed to revoke session");
      }
    }
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

  const handleRemoveImage = async () => {
    if (!user.profileImage) return;
    if (window.confirm("Remove your profile picture?")) {
      setUploadingImage(true);
      try {
        await updateProfileDetails({ profileImage: "" });
        toast.success("Profile photo removed.");
      } catch {
        toast.error("Failed to remove profile photo.");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSwitchRole = async (newRole) => {
    try {
      await updateProfileDetails({ role: newRole });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(newRole === 'Broker' 
        ? '🎉 Congratulations! You are now registered as an Authorized Broker!' 
        : 'Account type updated to Individual Property Owner'
      );
    } catch {
      toast.error('Failed to update account role');
    }
  };

  const handleUpdateProfile = async (e) => {

    e.preventDefault();
    try {
      await updateProfileDetails({ name: profileForm.name });
      toast.success("Profile updated successfully!");
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
      setShowDeleteModal(false);
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

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm("Remove this payment account?")) {
      try {
        await axios.delete(`/api/auth/payment-accounts/${accountId}`);
        toast.success("Account removed");
      } catch {
        toast.error("Failed to delete account");
      }
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: t('account_settings.personal_info'), icon: UserCheck },
    { id: "security", label: t('account_settings.change_password'), icon: Lock },
    ...(systemSettings?.isInstantBookingEnabled !== false
      ? [{ id: "payout", label: t('account_settings.linked_payouts'), icon: Wallet }]
      : []),
    { id: "sessions", label: t('account_settings.active_sessions'), icon: Laptop },
    { id: "danger", label: t('dashboard.danger_zone'), icon: AlertTriangle, color: "text-rose-600 hover:text-rose-700" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'Nunito Sans', sans-serif" }} className="bg-[#f8fafc] min-h-screen text-slate-800 antialiased pb-20">
      
      {/* Production Level Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-[#1a2340] to-slate-950 text-white border-b border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
            
            {/* Interactive Header Profile Image */}
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#c9a84c] text-slate-950 font-black text-2xl sm:text-3xl flex items-center justify-center shadow-xl border-4 border-slate-800 ring-4 ring-amber-400/20 overflow-hidden shrink-0 cursor-pointer transition-all hover:scale-105 group"
                title="Click to change profile picture"
              >
                {user.profileImage ? (
                  <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.name?.[0]?.toUpperCase() || "U"}</span>
                )}
                
                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  {uploadingImage ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-slate-900 hover:bg-blue-700 transition-colors cursor-pointer"
                title="Upload Photo"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">{user.name}</h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {formatRoleLabel(user.role)}
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-300 flex-wrap">
                <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                  <Mail size={13} className="text-blue-400" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    <Phone size={13} className="text-emerald-400" />
                    +91 {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-400/20">
              <ShieldCheck size={14} /> Account Status: Verified
            </span>
          </div>
        </div>
      </div>

      {/* Production 2-Column Control Center */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side Tab Navigation */}
          <div className="lg:col-span-3 space-y-2">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs space-y-1 sticky top-24">
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Account Settings
              </div>
              
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={isActive ? "text-amber-400" : tab.color || "text-slate-400"} />
                      <span>{tab.label}</span>
                    </div>
                    {isActive && <ArrowRight size={14} className="text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side Content Panel */}
          <div className="lg:col-span-9 space-y-6">

            {/* TAB 1: PROFILE & PERSONAL INFO */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-8">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <UserCheck size={20} className="text-blue-600" /> Personal Details & Profile Photo
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Manage your personal account profile, contact credentials and public avatar.
                  </p>
                </div>

                {/* Profile Photo Widget */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200 rounded-2xl">
                  <div
                    onClick={() => !uploadingImage && fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-2xl bg-[#1a2340] text-[#c9a84c] font-black text-3xl flex items-center justify-center shadow-md overflow-hidden shrink-0 border-2 border-white ring-4 ring-slate-100 group cursor-pointer"
                  >
                    {user.profileImage ? (
                      <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <span>{user.name?.[0]?.toUpperCase() || "U"}</span>
                    )}

                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      {uploadingImage ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Profile Photo</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        This image will be displayed on your property listings, public broker card & headers.
                      </p>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1">
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>{user.profileImage ? "Change Photo" : "Upload Photo"}</span>
                          </>
                        )}
                      </button>

                      {user.profileImage && (
                        <button
                          type="button"
                          disabled={uploadingImage}
                          onClick={handleRemoveImage}
                          className="px-3.5 py-2.5 bg-slate-200/80 hover:bg-rose-100 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div>
                    <label className={labelCls}>{t('account_settings.full_name')}</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={labelCls}>{t('account_settings.phone')}</label>
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
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={labelCls}>{t('account_settings.email')}</label>
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
                  </div>

                  {/* Account Type & Broker Verification Selection Card */}
                  <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white space-y-4 shadow-lg border border-slate-800 font-['Nunito_Sans',sans-serif]">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-white">Account Role & Broker Registration</h3>
                          <p className="text-[11px] font-semibold text-slate-300">
                            {user.role === 'Broker' 
                              ? 'You are registered as an Authorized Real Estate Broker.' 
                              : 'Become a Registered Broker to get listed in the Brokers Directory & gain client trust.'
                            }
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                        user.role === 'Broker' 
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm' 
                          : 'bg-white/10 text-slate-300 border-white/20'
                      }`}>
                        {user.role === 'Broker' ? '⭐ Verified Broker' : 'Individual Owner'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Option 1: Individual Property Owner */}
                      <button
                        type="button"
                        onClick={() => handleSwitchRole('User')}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          user.role !== 'Broker'
                            ? 'bg-white text-slate-950 border-amber-400 shadow-md font-bold'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black inline-flex items-center gap-1.5"><LandPlot size={14} className="text-amber-500" /> Individual Property Owner</span>
                          {user.role !== 'Broker' && <CheckCircle2 size={16} className="text-emerald-600" />}
                        </div>
                        <p className="text-[10px] font-semibold opacity-80 leading-relaxed">
                          For individual land buyers & property sellers listing personal plots or land.
                        </p>
                      </button>

                      {/* Option 2: Registered Real Estate Broker */}
                      <button
                        type="button"
                        onClick={() => handleSwitchRole('Broker')}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          user.role === 'Broker'
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-bold'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black inline-flex items-center gap-1.5"><BadgeCheck size={14} className="text-blue-600" /> Registered Real Estate Broker</span>
                          {user.role === 'Broker' && <CheckCircle2 size={16} className="text-slate-950" />}
                        </div>
                        <p className="text-[10px] font-semibold opacity-90 leading-relaxed">
                          Public profile in Brokers Directory (/brokers), Verified Broker Badge & direct buyer leads.
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Save Profile Details
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* TAB 2: SECURITY & PASSWORD */}
            {activeTab === "security" && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Lock size={20} className="text-slate-900" /> Password & Authentication
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Ensure your account is using a strong password to protect your land listings & inquiries.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div>
                    <label className={labelCls}>{t('account_settings.current_password')}</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className={inputCls}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>{t('account_settings.new_password')}</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className={inputCls}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>{t('account_settings.confirm_new_password')}</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className={inputCls}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 text-xs font-semibold text-slate-600">
                    <Shield size={18} className="text-blue-600 shrink-0" />
                    <span>Password should be at least 6 characters long and contain numbers for security.</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-7 py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: PAYOUT ACCOUNTS */}
            {activeTab === "payout" && systemSettings?.isInstantBookingEnabled !== false && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Wallet size={20} className="text-emerald-600" /> Bank & Payout Accounts
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Configure your bank details or UPI ID to receive buyer token booking payments directly.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingAccountId(null);
                      setShowAddAccountModal(true);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                  >
                    <Plus size={15} /> Add Account
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {user.paymentAccounts?.map((acc) => (
                    <div
                      key={acc._id}
                      className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200 rounded-2xl space-y-3 relative group hover:border-blue-500 transition-all shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md border border-blue-200">
                          {acc.accountType}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditAccount(acc)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 cursor-pointer rounded-lg hover:bg-white transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(acc._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 cursor-pointer rounded-lg hover:bg-white transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">{acc.holderName}</h4>
                        <p className="text-xs text-slate-600 font-bold mt-0.5 flex items-center gap-1.5">
                          {acc.accountType === "Bank" ? (
                            <>
                              <Landmark size={14} className="text-blue-600" />
                              <span>{acc.bankName}</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={14} className="text-emerald-600" />
                              <span>{acc.upiId}</span>
                            </>
                          )}
                        </p>

                        {acc.accountNumber && (
                          <div className="mt-3 text-xs font-mono text-slate-500 bg-white p-2 rounded-xl border border-slate-200/80">
                            Account: •••• {acc.accountNumber.slice(-4)} | IFSC: {acc.ifscCode}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!user.paymentAccounts || user.paymentAccounts.length === 0) && (
                    <div className="col-span-full p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                      <p className="text-xs font-bold text-slate-500">No payout accounts configured yet.</p>
                      <button
                        onClick={() => {
                          setEditingAccountId(null);
                          setShowAddAccountModal(true);
                        }}
                        className="text-xs font-black text-blue-600 hover:underline cursor-pointer"
                      >
                        + Add Bank Account or UPI ID
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ACTIVE SESSIONS */}
            {activeTab === "sessions" && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Laptop size={20} className="text-blue-600" /> Active Login Sessions
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Manage devices currently authenticated into your account.
                  </p>
                </div>

                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div
                      key={s._id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          {s.deviceType === "Mobile" ? <Smartphone size={18} /> : <Laptop size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 truncate">
                            {s.userAgent || "Web Browser Session"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            IP: {s.ipAddress || "Active Device"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeSession(s._id)}
                        className="px-3.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}

                  {sessions.length === 0 && (
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs font-semibold text-slate-500">
                      Your current session is active.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: DANGER ZONE */}
            {activeTab === "danger" && (
              <div className="bg-rose-50/40 rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-rose-950 tracking-tight">Permanently Delete Account</h2>
                    <p className="text-xs font-medium text-rose-700/90 leading-relaxed">
                      Once you delete your account, all your posted property listings, buyer leads, inquiries, and saved details will be permanently removed. This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-rose-100">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Confirm Account Deletion</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Please enter your password to confirm.</p>
              </div>
            </div>

            <form onSubmit={handleDeleteAccountConfirm} className="space-y-4 pt-2">
              <div>
                <label className={labelCls}>Password</label>
                <input
                  type="password"
                  required
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  className={inputCls}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Payout Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingAccountId ? "Edit Payout Account" : "Add Payout Account"}
              </h3>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className={labelCls}>Account Type</label>
                <select
                  value={newAccount.accountType}
                  onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value })}
                  className={inputCls}
                >
                  <option value="Bank">Bank Account</option>
                  <option value="UPI">UPI ID</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={newAccount.holderName}
                  onChange={(e) => setNewAccount({ ...newAccount, holderName: e.target.value })}
                  className={inputCls}
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
                      placeholder="e.g. HDFC Bank, SBI"
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
                    />
                  </div>
                  <div>
                    <label className={labelCls}>IFSC Code</label>
                    <input
                      type="text"
                      required
                      value={newAccount.ifscCode}
                      onChange={(e) => setNewAccount({ ...newAccount, ifscCode: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. SBIN0001234"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className={labelCls}>UPI ID</label>
                  <input
                    type="text"
                    required
                    value={newAccount.upiId}
                    onChange={(e) => setNewAccount({ ...newAccount, upiId: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. 9876543210@paytm"
                  />
                </div>
              )}
              <div className="flex gap-2.5 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase shadow-md transition-all cursor-pointer"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
