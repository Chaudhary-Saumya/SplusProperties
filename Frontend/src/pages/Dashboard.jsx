import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import {
  Edit,
  EyeOff,
  Trash2,
  Eye,
  Users,
  Calendar,
  Mail,
  Phone,
  Wallet,
  Plus,
  X,
  Landmark,
  CreditCard,
  LayoutDashboard,
  List,
  History,
  Settings,
  Receipt,
  PhoneCall,
  Download,
  MapPin,
  CheckCircle2,
  Shield,
  LogOut,
  ChevronRight,
  Building2,
  TrendingUp,
  Award,
  FileText,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight,
  ZapOff,
  Compass,
  Map,
  Heart,
  KeyRound,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import ReceiptModal from "../components/ReceiptModal";
import socket from "../utils/socket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ListingSkeleton from "../components/ListingSkeleton";
import ErrorBox from "../components/ErrorBox";
import EmptyState from "../components/EmptyState";
import { getImageUrl } from "../utils/imageUrl";

/* ─── Shared Input class ───────────────────────────────────────────────────── */
const inp =
  "w-full px-4 py-3 bg-[#fdfaf5] border border-[#e2d9c5] rounded-lg text-sm font-bold text-[#1a2340] placeholder-[#b0a898] focus:outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/20 transition-all";

/* ─── Stat Card ────────────────────────────────────────────────────────────── */
const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  subColor = "text-[#c9a84c]",
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`bg-white border border-[#e2d9c5]/80 rounded-xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 active:scale-98 ${
      onClick ? "cursor-pointer hover:border-[#c9a84c] hover:shadow-md hover:-translate-y-0.5 group" : ""
    }`}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="w-9 h-9 rounded-lg bg-[#1a2340] flex items-center justify-center shadow-xs">
        <Icon size={16} className="text-[#c9a84c]" />
      </div>
      {onClick && (
        <ChevronRight 
          size={14} 
          className="text-[#d1c9b8] transition-transform duration-200 group-hover:translate-x-0.5" 
        />
      )}
    </div>
    <div className="text-xl sm:text-2xl font-black text-[#1a2340] tracking-tight leading-none mb-1">
      {value}
    </div>
    <div className="text-[9px] sm:text-xs font-black text-[#9ca3af] uppercase tracking-widest mt-0.5">
      {label}
    </div>
    {sub && (
      <div className={`text-[10px] font-bold mt-1.5 flex items-center gap-0.5 ${subColor}`}>
        {sub}
      </div>
    )}
  </div>
);

/* ─── Section Header ───────────────────────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#f0ebe0]">
    <h2
      className="text-xl font-bold text-[#1a2340] flex items-center gap-2"

    >
      <Icon size={20} className="text-[#c9a84c]" /> {title}
    </h2>
    {action}
  </div>
);

/* ─── Toggle Switch ────────────────────────────────────────────────────────── */
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-[#c9a84c]" : "bg-[#d1d5db]"}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`}
    />
  </button>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, deleteAccount } = useContext(AuthContext);
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [openAccordion, setOpenAccordion] = useState("profile");
  const queryClient = useQueryClient();

  /* ── Queries ── */
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["dashboardListings", user?.id || user?._id],
    enabled: !!user,
    queryFn: async () => {
      if (user?.role === "Buyer") {
        const res = await axios.get("/api/listings/my/tokened");
        return res.data.data;
      } else {
        // Use the secure /mine endpoint — filtered by JWT identity on the server,
        // not by an unenforced createdBy query param on the public search route.
        const res = await axios.get("/api/listings/mine");
        return res.data.data;
      }
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always",
  });

  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery({
    queryKey: ["dashboardInquiries", user?.id || user?._id],
    enabled: !!user,
    queryFn: async () => {
      const res = await axios.get("/api/inquiries");
      return res.data.data;
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always",
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["dashboardTransactions", user?.id || user?._id],
    enabled: !!user,
    queryFn: async () => {
      const res = await axios.get("/api/payments");
      return res.data.data;
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always",
  });

  const { data: systemSettings } = useQuery({
    queryKey: ["systemSettings"],
    queryFn: async () => {
      const res = await axios.get("/api/settings");
      return res.data.data;
    },
  });

  const listings = listingsData || [];
  const inquiries = inquiriesData || [];
  const transactions = transactionsData || [];

  /* ── Settings state ── */
  const [sessions, setSessions] = useState([]);
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

  const sentInquiries = inquiries.filter(
    (inq) => (inq.userId?._id || inq.userId) === (user?.id || user?._id),
  );
  const receivedInquiries = inquiries.filter(
    (inq) =>
      (inq.listingId?.createdBy?._id || inq.listingId?.createdBy) ===
      (user?.id || user?._id),
  );

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      if (editingAccountId) {
        await axios.put(
          `/api/auth/payment-accounts/${editingAccountId}`,
          newAccount,
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

  const toggleStatus = async (id, newStatus) => {
    try {
      await axios.put(`/api/listings/${id}`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["dashboardListings"] });
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanently delete this property?")) {
      try {
        await axios.delete(`/api/listings/${id}`);
        queryClient.invalidateQueries({ queryKey: ["dashboardListings"] });
      } catch {
        toast.error("Failed to delete property");
      }
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get("/api/auth/sessions");
      setSessions(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (window.confirm("Log out from this device?")) {
      try {
        await axios.delete(`/api/auth/sessions/${sessionId}`);
        setSessions(sessions.filter((s) => s._id !== sessionId));
      } catch {
        toast.error("Failed to revoke session");
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put("/api/auth/updatedetails", profileForm);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await axios.put("/api/auth/updatepassword", passwordForm);
      toast.success("Password updated!");
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
    setIsDeleting(true);
    try {
      await deleteAccount(deleteConfirmPassword);
      toast.success("Account deleted successfully. Goodbye!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmPassword("");
    }
  };

  const updateInquiryStatus = async (id, newStatus) => {
    try {
      await axios.patch(`/api/inquiries/${id}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["dashboardInquiries"] });
      if (newStatus === "Contacted") {
        toast.success("Inquiry marked as Connected!");
      } else if (newStatus === "Pending") {
        toast.success("Inquiry status reverted to Pending");
      } else {
        toast.success(`Inquiry status updated to ${newStatus}`);
      }
    } catch {
      toast.error("Failed to update inquiry status");
    }
  };

  // Main useEffect
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileForm({ name: user.name, email: user.email, phone: user.phone });
    if (activeSection === "settings") fetchSessions();

    const inv = () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardListings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardInquiries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardTransactions"] });
    };

    socket.on("listing_updated", inv);
    socket.on("listing_verified", inv);
    socket.on("listing_rejected", inv);
    socket.on("listing_reserved", inv);
    socket.on("new_inquiry", inv);
    socket.on("inquiry_status_updated", inv);
    socket.on("payment_created", inv);
    socket.on("token_reserved", inv);
    socket.on("connect", inv);

    return () => {
      socket.off("listing_updated", inv);
      socket.off("listing_verified", inv);
      socket.off("listing_rejected", inv);
      socket.off("listing_reserved", inv);
      socket.off("new_inquiry", inv);
      socket.off("inquiry_status_updated", inv);
      socket.off("payment_created", inv);
      socket.off("token_reserved", inv);
      socket.off("connect", inv);
    };
  }, [user, activeSection, queryClient]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Tab config ── */
  const tabs = [
    { id: "overview", label: t("dashboard.overview_tab"), icon: LayoutDashboard },
    {
      id: "listings",
      label: user.role === "Buyer" ? t("dashboard.reserved_plots_tab") : t("dashboard.listings_tab"),
      icon: List,
    },
    ...(user.role === "Seller" || user.role === "Broker"
      ? [
          { id: "inquiries", label: t("dashboard.inquiries_tab"), icon: Users },
        ]
      : []),
    { id: "transactions", label: t("dashboard.history_tab"), icon: History },
    ...(user.role === "Seller" || user.role === "Broker"
      ? [
          { id: "payouts", label: t("dashboard.payouts_tab"), icon: Wallet },
        ]
      : []),
    { id: "settings", label: t("dashboard.settings_tab"), icon: Settings },
  ];

  return (
    <div
      className="min-h-screen bg-[#f8f5ee]"
      style={{ fontFamily: "'Nunito Sans', sans-serif" }}
    >
      {/* Gold top bar */}
      <div className="h-1 w-full bg-linear-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-8">
        {/* Page Header (Desktop only) */}
        <div className="hidden lg:flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#1a2340]"
              style={{ fontFamily: "'Nunito Sans', serif" }}
            >
              {t("dashboard.welcome")} {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {t("dashboard.subtitle")}
            </p>
          </div>

          <div className="flex gap-2">
            {(user.role === "Seller" || user.role === "Broker") && (
              <Link
                to="/create-listing"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1a2340] hover:bg-[#c9a84c] hover:text-[#1a1200] text-white text-sm font-bold rounded-lg transition-all uppercase tracking-wider shadow-sm hover:scale-105"
              >
                <Plus size={16} /> {t("dashboard.new_listing_btn")}
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar (Desktop only) */}
          <div className="hidden lg:col-span-3 lg:flex flex-col gap-6 sticky top-[100px]">
            {/* User profile card */}
            <div className="bg-white border border-[#e2d9c5] rounded-2xl p-5 shadow-xs flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1a2340] text-[#c9a84c] font-black text-lg rounded-xl flex items-center justify-center shadow-inner shrink-0">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-[#1a2340] truncate">{user.name}</h3>
                <p className="text-[10px] font-extrabold uppercase text-[#c9a84c] tracking-wider">{user.role}</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="bg-white border border-[#e2d9c5] rounded-2xl p-3 shadow-xs flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                      isActive
                        ? "bg-[#1a2340] text-[#c9a84c]"
                        : "text-slate-600 hover:bg-[#fdfaf5] hover:text-[#1a2340]"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="flex-1">{tab.label}</span>
                    {tab.id === "inquiries" && receivedInquiries.length > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? "bg-[#c9a84c] text-[#1a2340]" : "bg-[#eff6ff] text-[#2563eb]"
                      }`}>
                        {receivedInquiries.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Navigation & Main Content */}
          <div className="col-span-1 lg:col-span-9 flex flex-col gap-6">

            {/* Section Render Area */}
            <div className="animate-fade-in">
              {activeSection === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Info */}
            <div className="bg-white border border-[#e2d9c5] rounded-xl p-5 sm:p-6 shadow-sm">
              <div 
                onClick={() => { if (window.innerWidth < 1024) setOpenAccordion(openAccordion === "profile" ? null : "profile"); }}
                className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#f0ebe0] cursor-pointer lg:cursor-default"
              >
                <h2 className="text-base sm:text-lg font-bold text-[#1a2340] flex items-center gap-2">
                  <UserCheck size={18} className="text-[#c9a84c]" /> {t("dashboard.profile_info")}
                </h2>
                <ChevronDown 
                  size={16} 
                  className={`text-[#c9a84c] transition-transform duration-300 lg:hidden ${
                    openAccordion === "profile" ? "rotate-180" : ""
                  }`} 
                />
              </div>

              <div className={`mt-4 ${openAccordion === "profile" ? "block animate-fade-in" : "hidden lg:block"}`}>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">
                        {t("dashboard.full_name")}
                      </label>
                      <input
                        type="text"
                        className={inp}
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">
                        {t("dashboard.phone_readonly")}
                      </label>
                      <input
                        type="text"
                        className={`${inp} bg-[#f0ebe0] cursor-not-allowed opacity-60`}
                        value={profileForm.phone}
                        disabled
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">
                      {t("dashboard.email_readonly")}
                    </label>
                    <input
                      type="email"
                      className={`${inp} bg-[#f0ebe0] cursor-not-allowed opacity-60`}
                      value={profileForm.email}
                      disabled
                    />
                  </div>
                  <div className="bg-[#fffbf0] border border-[#e2d9c5] rounded-lg p-3 text-xs text-[#b8933a] font-600">
                    {t("dashboard.security_note")}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1a2340] hover:bg-[#c9a84c] hover:text-[#1a1200] text-white font-bold rounded-lg transition-all uppercase tracking-widest text-sm"
                  >
                    {t("dashboard.save_changes")}
                  </button>
                </form>
              </div>
            </div>

            {/* Password */}
            <div className="bg-white border border-[#e2d9c5] rounded-xl p-5 sm:p-6 shadow-sm">
              <div 
                onClick={() => { if (window.innerWidth < 1024) setOpenAccordion(openAccordion === "security" ? null : "security"); }}
                className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#f0ebe0] cursor-pointer lg:cursor-default"
              >
                <h2 className="text-base sm:text-lg font-bold text-[#1a2340] flex items-center gap-2">
                  <Shield size={18} className="text-[#c9a84c]" /> {t("dashboard.change_password")}
                </h2>
                <ChevronDown 
                  size={16} 
                  className={`text-[#c9a84c] transition-transform duration-300 lg:hidden ${
                    openAccordion === "security" ? "rotate-180" : ""
                  }`} 
                />
              </div>

              <div className={`mt-4 ${openAccordion === "security" ? "block animate-fade-in" : "hidden lg:block"}`}>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  {[
                    {
                      key: "currentPassword",
                      label: "Current Password",
                      field: "current",
                    },
                    { key: "newPassword", label: "New Password", field: "new" },
                    {
                      key: "confirmPassword",
                      label: "Confirm New Password",
                      field: "confirm",
                    },
                  ].map(({ key, label, field }) => (
                    <div key={key}>
                      <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">
                        {label}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords[field] ? "text" : "password"}
                          className={inp}
                          placeholder="••••••••"
                          value={passwordForm[key]}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              [key]: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              [field]: !showPasswords[field],
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#1a2340]"
                        >
                          {showPasswords[field] ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#c9a84c] hover:bg-[#b8933a] text-[#1a1200] font-bold rounded-lg transition-all uppercase tracking-widest text-sm"
                  >
                    {t("dashboard.update_password_btn")}
                  </button>
                </form>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white border border-[#e2d9c5] rounded-xl p-5 sm:p-6 shadow-sm lg:col-span-2">
              <div 
                onClick={() => { if (window.innerWidth < 1024) setOpenAccordion(openAccordion === "sessions" ? null : "sessions"); }}
                className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#f0ebe0] cursor-pointer lg:cursor-default"
              >
                <h2 className="text-base sm:text-lg font-bold text-[#1a2340] flex items-center gap-2">
                  <Users size={18} className="text-[#c9a84c]" /> {t("dashboard.active_logins")}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm("Log out from all other devices?")) {
                        await axios.delete("/api/auth/sessions");
                        fetchSessions();
                      }
                    }}
                    className="hidden sm:inline-block text-[10px] font-bold text-[#dc2626] bg-[#fff0f0] border border-[#fecaca] px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-all active:scale-95"
                  >
                    {t("dashboard.logout_others_btn")}
                  </button>
                  <ChevronDown 
                    size={16} 
                    className={`text-[#c9a84c] transition-transform duration-300 lg:hidden ${
                      openAccordion === "sessions" ? "rotate-180" : ""
                    }`} 
                  />
                </div>
              </div>

              <div className={`mt-4 ${openAccordion === "sessions" ? "block animate-fade-in" : "hidden lg:block"}`}>
                <button
                  onClick={async () => {
                    if (window.confirm("Log out from all other devices?")) {
                      await axios.delete("/api/auth/sessions");
                      fetchSessions();
                    }
                  }}
                  className="sm:hidden w-full mb-4 text-center text-xs font-bold text-[#dc2626] bg-[#fff0f0] border border-[#fecaca] py-2.5 rounded-lg uppercase tracking-wider"
                >
                  {t("dashboard.logout_others_btn")}
                </button>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session._id}
                      className="flex items-center justify-between bg-white border border-[#e2d9c5]/60 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#1a2340] flex items-center justify-center">
                          <Shield size={15} className="text-[#c9a84c]" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#1a2340] flex items-center gap-2">
                            {session.deviceInfo?.os} ·{" "}
                            {session.deviceInfo?.browser}
                            {session.token === localStorage.getItem("token") && (
                              <span className="text-[9px] font-bold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {t("dashboard.current_badge")}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#9ca3af] font-600">
                            IP: {session.ipAddress} · Last active{" "}
                            {new Date(session.lastActive).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {session.token !== localStorage.getItem("token") && (
                        <button
                          onClick={() => handleRevokeSession(session._id)}
                          className="p-2 text-[#dc2626] hover:bg-[#fff0f0] rounded-lg transition-all"
                          title="Revoke"
                        >
                          <LogOut size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Danger Zone (Delete Account) */}
            <div className="bg-white border border-red-200 rounded-xl p-5 sm:p-6 shadow-sm lg:col-span-2">
              <div 
                onClick={() => { if (window.innerWidth < 1024) setOpenAccordion(openAccordion === "danger" ? null : "danger"); }}
                className="flex items-center justify-between pb-3 sm:pb-4 border-b border-red-100 cursor-pointer lg:cursor-default"
              >
                <h2 className="text-base sm:text-lg font-bold text-[#b91c1c] flex items-center gap-2">
                  <Trash2 size={18} className="text-[#b91c1c]" /> {t("dashboard.danger_zone")}
                </h2>
                <ChevronDown 
                  size={16} 
                  className={`text-red-500 transition-transform duration-300 lg:hidden ${
                    openAccordion === "danger" ? "rotate-180" : ""
                  }`} 
                />
              </div>

              <div className={`mt-4 space-y-4 ${openAccordion === "danger" ? "block animate-fade-in" : "hidden lg:block"}`}>
                <p className="text-sm font-semibold text-slate-600">
                  {t("dashboard.delete_account_desc")}
                </p>
                <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-4 text-xs text-[#b91c1c] font-bold flex flex-col gap-2">
                  <span>{t("dashboard.app_guidelines_note")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-5 py-3 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold rounded-lg transition-all uppercase tracking-widest text-sm"
                >
                  {t("dashboard.delete_account_btn")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD SECTIONS */}
        {activeSection === "overview" && (
              <div className="space-y-6">
                {/* Mobile Profile Banner */}
                <div className="lg:hidden bg-gradient-to-br from-[#1a2340] via-[#24315c] to-[#1a2340] text-white rounded-2xl p-5 shadow-md border border-[#c9a84c]/20 relative overflow-hidden">
                  <div className="absolute top-[-50px] right-[-50px] w-36 h-36 rounded-full bg-[#c9a84c]/10 blur-xl animate-pulse" />
                  <div className="absolute bottom-[-30px] left-[-30px] w-28 h-28 rounded-full bg-blue-500/10 blur-xl" />
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#c9a84c] to-[#e5c158] text-[#1a2340] font-black text-xl flex items-center justify-center shadow-inner border-2 border-white/20">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-black tracking-tight text-white leading-tight">
                        {user.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                          user.role === "Buyer" 
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/30" 
                            : "bg-[#c9a84c]/20 text-[#e5c158] border-[#c9a84c]/30"
                        }`}>
                          {user.role}
                        </span>
                        <span className="text-[10px] text-slate-300 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 size={10} className="text-[#c9a84c]" /> Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Quick Actions Grid */}
                <div className="lg:hidden bg-white border border-[#e2d9c5]/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <h3 className="text-[10px] font-black text-[#1a2340] uppercase tracking-widest mb-3">
                    {t("dashboard.quick_actions")}
                  </h3>
                  <div className="grid grid-cols-4 gap-2.5">
                    {user.role === "Buyer" ? (
                      <>
                        <button
                          onClick={() => navigate("/search")}
                          className="flex flex-col items-center gap-1.5 py-1"
                        >
                          <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#c9a84c] border border-amber-100 flex items-center justify-center transition-all active:scale-90">
                            <Compass size={18} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">
                            {t("dashboard.explore_plots")}
                          </span>
                        </button>
                        <button
                          onClick={() => navigate("/boundary-map")}
                          className="flex flex-col items-center gap-1.5 py-1"
                        >
                          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center transition-all active:scale-90">
                            <Map size={18} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">
                            {t("dashboard.draw_boundary")}
                          </span>
                        </button>
                        <button
                          onClick={() => navigate("/saved-maps")}
                          className="flex flex-col items-center gap-1.5 py-1"
                        >
                          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center transition-all active:scale-90">
                            <FileText size={18} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">
                            {t("dashboard.saved_maps")}
                          </span>
                        </button>
                        <button
                          onClick={() => navigate("/favorites")}
                          className="flex flex-col items-center gap-1.5 py-1"
                        >
                          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center transition-all active:scale-90">
                            <Heart size={18} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">
                            {t("dashboard.my_favorites")}
                          </span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate("/create-listing")}
                          className="flex flex-col items-center gap-1.5 py-1"
                        >
                          <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#c9a84c] border border-amber-100 flex items-center justify-center transition-all active:scale-90">
                            <Plus size={18} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">
                            {t("dashboard.new_listing_btn")}
                          </span>
                        </button>
                        <button
                          onClick={() => setActiveSection("payouts")}
                          className="flex flex-col items-center gap-1.5 py-1"
                        >
                          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center transition-all active:scale-90">
                            <Wallet size={18} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">
                            {t("dashboard.link_bank")}
                          </span>
                        </button>
                        <button
                          onClick={() => setActiveSection("inquiries")}
                          className="flex flex-col items-center gap-1.5 py-1"
                        >
                          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center transition-all active:scale-90">
                            <Users size={18} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">
                            {t("dashboard.inquiries_tab")}
                          </span>
                        </button>
                        <button
                          onClick={() => { setActiveSection("settings"); setOpenAccordion("security"); }}
                          className="flex flex-col items-center gap-1.5 py-1"
                        >
                          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-500 border border-purple-100 flex items-center justify-center transition-all active:scale-90">
                            <KeyRound size={18} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">
                            {t("dashboard.change_password")}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={History}
                    label={t("dashboard.total_reservations")}
                    value={transactions.length}
                    sub={t("dashboard.view_all")}
                    onClick={() => setActiveSection("transactions")}
                  />
                  {(user.role === "Seller" || user.role === "Broker") && (
                    <>
                      <StatCard
                        icon={List}
                        label={t("dashboard.active_listings")}
                        value={
                          listings.filter((l) => l.status === "Active").length
                        }
                        sub={t("dashboard.manage")}
                        onClick={() => setActiveSection("listings")}
                      />
                      <StatCard
                        icon={Users}
                        label={t("dashboard.received_inquiries")}
                        value={receivedInquiries.length}
                        sub={t("dashboard.view_all")}
                        onClick={() => setActiveSection("inquiries")}
                        subColor="text-[#2563eb]"
                      />
                      <StatCard
                        icon={Wallet}
                        label={t("dashboard.payout_accounts")}
                        value={`${user.paymentAccounts?.length || 0}/3`}
                        sub={t("dashboard.manage")}
                        onClick={() => setActiveSection("payouts")}
                      />
                    </>
                  )}
                  {user.role === "Buyer" && (
                    <>
                      <StatCard
                        icon={List}
                        label={t("dashboard.reserved_plots")}
                        value={listings.length}
                        sub={t("dashboard.view_all")}
                        onClick={() => setActiveSection("listings")}
                      />
                      <StatCard
                        icon={Users}
                        label={t("dashboard.received_inquiries")}
                        value={sentInquiries.length}
                      />
                      <StatCard
                        icon={Award}
                        label={t("dashboard.role")}
                        value={user.role}
                      />
                    </>
                  )}
                </div>

                {/* Recent Listings */}
                {listings.length > 0 && (
                  <div className="bg-white border border-[#e2d9c5] rounded-xl p-5 sm:p-6 shadow-sm">
                    <SectionHeader
                      icon={TrendingUp}
                      title="Recent Properties"
                      action={
                        <button
                          onClick={() => setActiveSection("listings")}
                          className="text-xs font-bold text-[#c9a84c] uppercase tracking-wider flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#1a1200] transition-all"
                        >
                          View All <ArrowUpRight size={12} />
                        </button>
                      }
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {listings.slice(0, 3).map((l) => (
                        <div
                          key={l._id}
                          onClick={() => navigate(`/listings/${l._id}`)}
                          className="flex items-center gap-3.5 bg-white border border-[#e2d9c5]/80 hover:border-[#c9a84c] rounded-xl p-3 cursor-pointer transition-all duration-300 active:scale-98 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-md group"
                        >
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#e5e7eb] shrink-0">
                            {l.images?.[0] ? (
                              <img
                                src={getImageUrl(l.images[0])}
                                alt=""
                                className="w-full h-full object-cover animate-fade-in"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#9ca3af] text-xs">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-[#1a2340] truncate group-hover:text-[#c9a84c] transition-colors">
                              {l.title}
                            </div>
                            <div className="text-xs text-[#9ca3af] font-600 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} /> {l.plotNumber ? `Plot: ${l.plotNumber}, ` : ''}{l.areaName ? `Area: ${l.areaName}, ` : ''}{l.location}
                            </div>
                            <div className="text-sm font-black text-[#1a2340] mt-1">
                              ₹{l.price?.toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Listings Section */}
            {activeSection === "listings" && (
              <div className="bg-white border border-[#e2d9c5] rounded-xl p-6 shadow-sm">
                <SectionHeader
                  icon={List}
                  title={
                    user.role === "Buyer"
                      ? t("dashboard.reserved_plots_tab")
                      : t("dashboard.listings_tab")
                  }
                  action={
                    (user.role === "Seller" || user.role === "Broker") && (
                      <Link
                        to="/create-listing"
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#1a2340] hover:bg-[#c9a84c] hover:text-[#1a1200] text-white text-sm font-bold rounded-lg transition-all uppercase tracking-wider"
                      >
                        <Plus size={14} /> {t("dashboard.new_listing_btn")}
                      </Link>
                    )
                  }
                />

                {listingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <ListingSkeleton key={i} variant="list" />
                    ))}
                  </div>
                ) : user.role === "Buyer" ? (
                  <div className="space-y-6">
                    {systemSettings?.isInstantBookingEnabled === false && listings.length === 0 && (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <ZapOff size={28} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-[#1a2340] mb-2 font-['Playfair Display']">Booking System Disabled</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto mb-6">
                          The Instant Token Booking system is currently disabled by the administrator. Any future plots you reserve will appear here once the system is back online.
                        </p>
                        <button onClick={() => navigate('/search')} className="bg-[#1a2340] text-[#c9a84c] px-6 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-[#c9a84c] hover:text-[#1a1200] transition-all">
                          Explore Properties
                        </button>
                      </div>
                    )}

                    {(systemSettings?.isInstantBookingEnabled !== false || listings.length > 0) && listings.length === 0 ? (
                      <EmptyState
                        title="No Reserved Plots"
                        message="You haven't reserved any properties yet. Start exploring to find your dream plot."
                        actionText="Explore Properties"
                        actionLink="/search"
                      />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map((l) => (
                          <div
                            key={l._id}
                            className="bg-[#fdfaf5] border border-[#e2d9c5] rounded-xl overflow-hidden shadow-sm group hover:border-[#c9a84c] transition-all hover:shadow-md"
                          >
                            <div className="h-40 bg-[#e5e7eb] relative">
                              {l.images?.[0] ? (
                                <img
                                  src={getImageUrl(l.images[0])}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[#9ca3af]">
                                  No image
                                </div>
                              )}
                              <div className="absolute top-3 left-3 bg-[#1a2340]/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                <span className="text-[10px] font-black text-[#c9a84c] uppercase tracking-widest whitespace-nowrap">
                                  Reserved
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-[#1a2340] line-clamp-1 group-hover:text-[#c9a84c] transition-colors">
                                {l.title}
                              </h3>
                              <p className="text-xs text-[#9ca3af] font-600 flex items-center gap-1 mt-1">
                                <MapPin size={10} /> {l.plotNumber ? `Plot: ${l.plotNumber}, ` : ''}{l.areaName ? `Area: ${l.areaName}, ` : ''}{l.location}
                              </p>
                              <div className="flex items-center justify-between mt-4">
                                <div className="text-base font-black text-[#1a2340]">
                                  ₹{l.price?.toLocaleString("en-IN")}
                                </div>
                                <Link
                                  to={`/listings/${l._id}`}
                                  className="text-[10px] font-black bg-[#1a2340] text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-[#c9a84c] hover:text-[#1a1200] transition-all uppercase tracking-widest"
                                >
                                  Details
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : listings.length === 0 ? (
                  <EmptyState
                    title="Your portfolio is empty"
                    message="Launch your first legacy property."
                    actionText="Create Listing"
                    actionLink="/create-listing"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#f0ebe0]">
                          <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest pr-4 hidden md:table-cell">Property</th>
                          <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest pr-4 hidden md:table-cell">Status</th>
                          <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest pr-4 hidden md:table-cell">Price</th>
                          <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest hidden md:table-cell text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f8f5ee]">
                        {listings.map((l) => (
                          <React.Fragment key={l._id}>
                            <tr className="hidden md:table-row hover:bg-[#fdfaf5] transition-colors">
                              <td className="py-4 pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#e5e7eb] shrink-0">
                                    {l.images?.[0] ? (
                                      <img src={getImageUrl(l.images[0])} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-[#f0ebe0]" />
                                    )}
                                  </div>
                                  <Link to={`/listings/${l._id}`} className="text-sm font-bold text-[#1a2340] hover:text-[#c9a84c] transition-colors line-clamp-2 max-w-45">
                                    {l.title}
                                  </Link>
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                <div className="flex items-center gap-2">
                                  <Toggle
                                    checked={l.status === "Active"}
                                    onChange={() => toggleStatus(l._id, l.status === "Active" ? "Inactive" : "Active")}
                                  />
                                  <span className={`text-xs font-bold ${l.status === "Active" ? "text-[#15803d]" : "text-[#9ca3af]"}`}>
                                    {l.status}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                <span className="text-sm font-black text-[#1a2340]">₹{l.price?.toLocaleString("en-IN")}</span>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => navigate(`/listings/${l._id}`)} className="p-2 text-[#6b7280] hover:bg-[#f0ebe0] rounded-lg transition-all" title="View"><Eye size={15} /></button>
                                  <button onClick={() => navigate(`/edit-listing/${l._id}`)} className="p-2 text-[#2563eb] hover:bg-[#eff6ff] rounded-lg transition-all" title="Edit"><Edit size={15} /></button>
                                  <button onClick={() => handleDelete(l._id)} className="p-2 text-[#dc2626] hover:bg-[#fff0f0] rounded-lg transition-all" title="Delete"><Trash2 size={15} /></button>
                                </div>
                              </td>
                            </tr>
                            <tr className="md:hidden">
                              <td colSpan="4" className="py-2.5">
                                <div className="bg-white border border-[#e2d9c5]/80 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                  <div className="flex items-start gap-3.5 mb-3">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#e5e7eb] shrink-0 border border-slate-100">
                                      {l.images?.[0] ? (
                                        <img src={getImageUrl(l.images[0])} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-[#f8f5ee] flex items-center justify-center text-slate-300"><LayoutDashboard size={18} /></div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <Link to={`/listings/${l._id}`} className="text-sm font-bold text-[#1a2340] line-clamp-2 leading-snug hover:text-[#c9a84c] transition-colors">{l.title}</Link>
                                      <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-0.5">
                                        <MapPin size={10} /> {l.plotNumber ? `Plot: ${l.plotNumber}, ` : ''}{l.areaName ? `Area: ${l.areaName}` : l.location}
                                      </p>
                                      <p className="text-sm font-black text-[#c9a84c] mt-1">₹{l.price?.toLocaleString("en-IN")}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                      <Toggle
                                        checked={l.status === "Active"}
                                        onChange={() => toggleStatus(l._id, l.status === "Active" ? "Inactive" : "Active")}
                                      />
                                      <span className={`text-[10px] font-black uppercase tracking-wider ${l.status === "Active" ? "text-emerald-600" : "text-slate-400"}`}>{l.status}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => navigate(`/listings/${l._id}`)} className="w-8 h-8 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg flex items-center justify-center transition-all active:scale-90" title="View"><Eye size={14} /></button>
                                      <button onClick={() => navigate(`/edit-listing/${l._id}`)} className="w-8 h-8 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg flex items-center justify-center transition-all active:scale-90" title="Edit"><Edit size={14} /></button>
                                      <button onClick={() => handleDelete(l._id)} className="w-8 h-8 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all active:scale-90" title="Delete"><Trash2 size={14} /></button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Transactions Section */}
            {activeSection === "transactions" && (
              <div className="bg-white border border-[#e2d9c5] rounded-xl p-6 shadow-sm">
                <SectionHeader icon={History} title={t("dashboard.history_tab")} />

                {transactionsLoading ? (
                  <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    {[1, 2].map((i) => <div key={i} className="h-40 bg-[#f8f5ee] rounded-xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {systemSettings?.isInstantBookingEnabled === false && transactions.length === 0 && (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <History size={28} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-[#1a2340] mb-2 font-['Playfair Display']">History Unavailable</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto">
                          The Token Booking system is disabled. No new records can be created, and you have no previous transaction history.
                        </p>
                      </div>
                    )}

                    {(systemSettings?.isInstantBookingEnabled !== false || transactions.length > 0) && transactions.length === 0 ? (
                      <EmptyState
                        title="No Transactions"
                        message="Your payment history and receipts will appear here after your first reservation."
                        actionText="Start Reservation"
                        actionLink="/search"
                      />
                    ) : (
                      <div className="bg-white border border-[#e2d9c5] rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-[#fdfaf5] border-b border-[#e2d9c5]">
                              <tr>
                                <th className="p-4 text-[10px] font-bold text-[#1a2340] uppercase tracking-widest hidden md:table-cell">Property</th>
                                <th className="p-4 text-[10px] font-bold text-[#1a2340] uppercase tracking-widest hidden md:table-cell">Amount</th>
                                <th className="p-4 text-[10px] font-bold text-[#1a2340] uppercase tracking-widest hidden md:table-cell">Status</th>
                                <th className="p-4 text-[10px] font-bold text-[#1a2340] uppercase tracking-widest hidden md:table-cell text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0ebe0]">
                              {transactions.map((t) => (
                                <React.Fragment key={t._id}>
                                  <tr className="hidden md:table-row hover:bg-[#fdfaf5]/50">
                                    <td className="p-4 min-w-[200px]">
                                      <p className="text-sm font-bold text-[#1a2340]">{t.listingId?.title}</p>
                                      <p className="text-[10px] text-[#9ca3af] font-600 mt-0.5">Ref: {t.razorpayOrderId}</p>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                      <p className="text-sm font-black text-[#1a2340]">₹{t.amount?.toLocaleString("en-IN")}</p>
                                      <p className="text-[10px] text-[#9ca3af] font-600">{new Date(t.createdAt).toLocaleDateString()}</p>
                                    </td>
                                    <td className="p-4">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${t.status === "Success" ? "bg-[#f0fdf4] text-[#15803d]" : "bg-[#fff0f0] text-[#dc2626]"}`}>
                                        {t.status}
                                      </span>
                                    </td>
                                    <td className="p-4 text-right">
                                      <button onClick={() => setSelectedTransaction(t)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2d9c5] text-[#1a2340] rounded-lg text-xs font-bold hover:bg-[#1a2340] hover:text-white transition-all ml-auto">
                                        <Receipt size={14} /> Receipt
                                      </button>
                                    </td>
                                  </tr>
                                  {/* Mobile card */}
                                  <tr className="md:hidden">
                                    <td colSpan="4" className="py-2.5">
                                      <div className="bg-white border border-[#e2d9c5]/80 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                        <div className="flex justify-between items-start mb-3">
                                          <div className="min-w-0 flex-1 pr-2">
                                            <p className="text-sm font-bold text-[#1a2340] line-clamp-1">{t.listingId?.title}</p>
                                            <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Ref: {t.razorpayOrderId}</p>
                                          </div>
                                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            t.status === "Success" 
                                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                              : "bg-red-50 text-red-600 border border-red-100"
                                          }`}>
                                            {t.status}
                                          </span>
                                        </div>
                                        <div className="flex items-end justify-between pt-3 border-t border-slate-50">
                                          <div>
                                            <p className="text-xs text-slate-400 font-semibold">{new Date(t.createdAt).toLocaleDateString()}</p>
                                            <p className="text-base font-black text-[#1a2340] mt-0.5">₹{t.amount?.toLocaleString("en-IN")}</p>
                                          </div>
                                          <button 
                                            onClick={() => setSelectedTransaction(t)} 
                                            className="flex items-center gap-1 px-3 py-2 bg-[#1a2340] text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#1a1200] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                                          >
                                            <Receipt size={12} /> {t("dashboard.view_receipt")}
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Inquiries Section */}
            {activeSection === "inquiries" &&
              (user.role === "Seller" || user.role === "Broker") && (
                <div className="bg-white border border-[#e2d9c5] rounded-xl p-6 shadow-sm">
                  <SectionHeader icon={Users} title={t("dashboard.inquiries_tab")} />

                  {inquiriesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-[#f8f5ee] rounded-lg animate-pulse" />)}
                    </div>
                  ) : receivedInquiries.length === 0 ? (
                    <EmptyState title="No Inquiries Yet" message="Buyers haven't inquired about your listings yet." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[#f0ebe0]">
                            <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest pr-4 hidden md:table-cell">Buyer</th>
                            <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest pr-4 hidden md:table-cell">Property</th>
                            <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest pr-4 hidden md:table-cell">Status</th>
                            <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest pr-4 hidden md:table-cell text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f8f5ee]">
                          {receivedInquiries.map((inq) => (
                            <React.Fragment key={inq._id}>
                              <tr className="hidden md:table-row hover:bg-[#fdfaf5] transition-colors">
                                <td className="py-4 pr-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#1a2340] rounded-full flex items-center justify-center text-[#c9a84c] font-bold text-sm shrink-0">
                                      {inq.userId?.name?.[0]?.toUpperCase() || "B"}
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-[#1a2340]">{inq.userId?.name}</div>
                                      <div className="text-xs text-[#6b7280]">{inq.userId?.phone}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 pr-4">
                                  <Link to={`/listings/${inq.listingId?._id}`} className="text-sm font-bold text-[#1a2340] hover:text-[#c9a84c]">
                                    {inq.listingId?.title}
                                  </Link>
                                </td>
                                <td className="py-4 pr-4 hidden md:table-cell">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${inq.status === "Contacted" ? "bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe]" :
                                        "bg-[#fffbeb] text-[#d97706] border border-[#fef3c7]"
                                    }`}>
                                    {inq.status === "Contacted" ? "Connected" : inq.status}
                                  </span>
                                </td>
                                <td className="py-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => updateInquiryStatus(inq._id, inq.status === "Pending" ? "Contacted" : "Pending")}
                                      className={`p-2 rounded-lg transition-all ${inq.status === "Contacted"
                                          ? "text-[#2563eb] bg-[#eff6ff] hover:bg-[#dbeafe]"
                                          : "text-gray-400 hover:bg-gray-100"
                                        }`}
                                      title={inq.status === "Contacted" ? "Mark as Pending" : "Mark as Connected"}
                                    >
                                      <CheckCircle2 size={15} />
                                    </button>
                                    {inq.userId?.phone && (
                                      <a href={`tel:${inq.userId.phone}`} className="p-2 text-[#15803d] hover:bg-[#f0fdf4] rounded-lg transition-all" title="Call"><Phone size={15} /></a>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {/* Mobile card */}
                              <tr className="md:hidden">
                                <td colSpan="3" className="py-2.5">
                                  <div className="bg-white border border-[#e2d9c5]/80 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                    <div className="flex items-center gap-3.5 mb-3">
                                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-[#1a2340] font-black text-sm border border-slate-200">
                                        {inq.userId?.name?.[0]?.toUpperCase() || "B"}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#1a2340] truncate">{inq.userId?.name}</p>
                                        <p className="text-xs text-slate-400 font-medium flex items-center gap-0.5 mt-0.5">
                                          <Phone size={10} /> {inq.userId?.phone}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-500 mb-3 bg-[#f8f5ee] px-2.5 py-1.5 rounded-lg line-clamp-1 border border-[#e2d9c5]/40">
                                      <span className="font-extrabold text-[#1a2340]">Property:</span> {inq.listingId?.title}
                                    </p>
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        inq.status === "Contacted" 
                                          ? "bg-blue-50 text-blue-700 border border-blue-100" 
                                          : "bg-amber-50 text-amber-700 border border-amber-100"
                                      }`}>{inq.status === "Contacted" ? "Connected" : inq.status}</span>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => updateInquiryStatus(inq._id, inq.status === "Pending" ? "Contacted" : "Pending")}
                                          className={`w-8 h-8 border rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                                            inq.status === "Contacted" 
                                              ? "bg-blue-50 border-blue-100 text-blue-600" 
                                              : "bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600"
                                          }`}
                                          title={inq.status === "Contacted" ? "Mark as Pending" : "Mark as Connected"}
                                        >
                                          <CheckCircle2 size={14} />
                                        </button>
                                        {inq.userId?.phone && (
                                          <a 
                                            href={`tel:${inq.userId.phone}`} 
                                            className="w-8 h-8 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center transition-all active:scale-90"
                                            title="Call"
                                          >
                                            <Phone size={14} />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            {/* Payouts Section */}
            {activeSection === "payouts" &&
              (user.role === "Seller" || user.role === "Broker") && (
                <div className="bg-white border border-[#e2d9c5] rounded-xl p-6 shadow-sm">
                  <SectionHeader
                    icon={Wallet}
                    title={t("dashboard.payout_accounts")}
                    action={
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg ${user.paymentAccounts?.length >= 3 ? "bg-[#fff0f0] text-[#dc2626] border border-[#fecaca]" : "bg-[#fffbf0] text-[#b8933a] border border-[#e2d9c5]"}`}
                      >
                        {user.paymentAccounts?.length || 0}/3
                      </span>
                    }
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {user.paymentAccounts?.map((acc) => (
                      <div
                        key={acc._id}
                        className="group bg-[#fdfaf5] border border-[#e2d9c5] hover:border-[#c9a84c] rounded-xl p-5 transition-all relative"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 bg-[#1a2340] rounded-lg flex items-center justify-center">
                            {acc.accountType === "UPI" ? (
                              <CreditCard size={16} className="text-[#c9a84c]" />
                            ) : (
                              <Landmark size={16} className="text-[#c9a84c]" />
                            )}
                          </div>
                          <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditAccount(acc)}
                              className="p-1.5 text-[#6b7280] hover:text-[#2563eb] hover:bg-[#eff6ff] rounded-lg transition-all"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(acc._id)}
                              className="p-1.5 text-[#6b7280] hover:text-[#dc2626] hover:bg-[#fff0f0] rounded-lg transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">
                          {acc.accountType} Account
                        </div>
                        <div className="text-sm font-bold text-[#1a2340] mb-1">{acc.holderName}</div>
                        <div className="text-xs text-[#6b7280] font-600">
                          {acc.accountType === "UPI" ? acc.upiId : acc.accountNumber}
                        </div>
                        {acc.bankName && (
                          <div className="text-[10px] text-[#9ca3af] font-600 mt-1">
                            {acc.bankName} · {acc.ifscCode}
                          </div>
                        )}
                      </div>
                    ))}

                    {(!user.paymentAccounts || user.paymentAccounts.length < 3) && (
                      <button
                        onClick={() => setShowAddAccountModal(true)}
                        className="border-2 border-dashed border-[#e2d9c5] hover:border-[#c9a84c] hover:bg-[#fffbf0] rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-[#9ca3af] hover:text-[#c9a84c] transition-all min-h-35"
                      >
                        <div className="w-10 h-10 border-2 border-dashed border-current rounded-lg flex items-center justify-center">
                          <Plus size={18} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">{t("dashboard.add_bank_btn")}</span>
                      </button>
                    )}
                  </div>

                  <div className="bg-[#fffbf0] border border-[#e2d9c5] rounded-lg p-4 text-sm text-[#b8933a] font-600">
                    💡 Token money from buyers will be transferred directly to your chosen account. We don't hold any funds.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Payout Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a2340]/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-linear-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ebe0]">
              <h3 className="text-lg font-bold text-[#1a2340]">
                {t("dashboard.add_account_modal_title")}
              </h3>
              <button
                onClick={() => { setShowAddAccountModal(false); setEditingAccountId(null); }}
                className="text-[#9ca3af] hover:text-[#1a2340] p-1.5 hover:bg-[#f8f5ee] rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              <div className="flex gap-2 bg-[#f8f5ee] p-1 rounded-lg">
                {["Bank", "UPI"].map((type) => (
                  <button
                    key={type} type="button"
                    onClick={() => setNewAccount({ ...newAccount, accountType: type })}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${newAccount.accountType === type ? "bg-[#1a2340] text-[#c9a84c] shadow-sm" : "text-[#9ca3af] hover:text-[#1a2340]"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">{t("dashboard.holder_name")}</label>
                <input
                  type="text" required className={inp} placeholder="Name as per bank"
                  value={newAccount.holderName} onChange={(e) => setNewAccount({ ...newAccount, holderName: e.target.value })}
                />
              </div>
              {newAccount.accountType === "Bank" ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">{t("dashboard.bank_name")}</label>
                    <input
                      type="text" required className={inp} placeholder="e.g. HDFC Bank"
                      value={newAccount.bankName} onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">{t("dashboard.account_number")}</label>
                      <input
                        type="text" required className={inp} placeholder="1234..."
                        value={newAccount.accountNumber} onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">{t("dashboard.ifsc_code")}</label>
                      <input
                        type="text" required className={inp} placeholder="HDFC0..."
                        value={newAccount.ifscCode} onChange={(e) => setNewAccount({ ...newAccount, ifscCode: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">{t("dashboard.upi_id")}</label>
                  <input
                    type="text" required className={inp} placeholder="username@bank"
                    value={newAccount.upiId} onChange={(e) => setNewAccount({ ...newAccount, upiId: e.target.value })}
                  />
                </div>
              )}
              <button type="submit" className="w-full py-3 bg-[#1a2340] hover:bg-[#c9a84c] hover:text-[#1a1200] text-white font-bold rounded-lg transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                {editingAccountId ? <Edit size={16} /> : <Plus size={16} />}
                {t("dashboard.save_account_btn")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a2340]/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-red-100">
            <div className="h-1 w-full bg-linear-to-r from-[#ef4444] via-[#f87171] to-[#ef4444]" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ebe0]">
              <h3 className="text-lg font-bold text-[#b91c1c] flex items-center gap-2">
                <Trash2 size={18} /> {t("dashboard.confirm_delete_title")}
              </h3>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmPassword(""); }}
                className="text-[#9ca3af] hover:text-[#1a2340] p-1.5 hover:bg-[#f8f5ee] rounded-lg transition-all"
                disabled={isDeleting}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDeleteAccountConfirm} className="p-6 space-y-4">
              <p className="text-xs font-bold text-slate-500">
                Are you absolutely sure you want to delete your account? All listings, inquiries, token histories, and user profile data will be permanently wiped.
              </p>
              
              {!user?.googleId && (
                <div>
                  <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">
                    {t("dashboard.delete_confirm_prompt")}
                  </label>
                  <input
                    type="password"
                    required
                    className={inp}
                    placeholder="Enter your current password"
                    value={deleteConfirmPassword}
                    onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                    disabled={isDeleting}
                  />
                </div>
              )}

              <div className="bg-[#fff5f5] border border-[#fed7d7] rounded-lg p-3 text-xs text-[#c53030] font-bold">
                ⚠️ This action cannot be undone. Please proceed with caution.
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmPassword(""); }}
                  className="flex-1 py-3 border border-[#e2d9c5] hover:bg-[#f8f5ee] text-[#1a2340] font-bold rounded-lg transition-all uppercase tracking-widest text-xs"
                  disabled={isDeleting}
                >
                  {t("dashboard.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold rounded-lg transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? t("dashboard.deleting_processing") : t("dashboard.delete_account_btn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedTransaction && (
        <ReceiptModal
          isOpen={!!selectedTransaction}
          receiptData={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      {/* Mobile Sticky Bottom Nav Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e2d9c5]/60 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom,12px)] pt-2">
        <div className="flex justify-around items-center px-2">
          {tabs.filter(t => t.id !== "payouts").map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className="flex flex-col items-center gap-1 py-1 px-3 relative transition-all active:scale-95"
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive 
                    ? "bg-[#1a2340] text-[#c9a84c] scale-105 shadow-xs" 
                    : "text-slate-500 hover:text-[#1a2340]"
                }`}>
                  <Icon size={18} />
                </div>
                <span className={`text-[9px] font-bold tracking-tight transition-colors ${
                  isActive ? "text-[#1a2340] font-extrabold" : "text-slate-400"
                }`}>
                  {tab.label.split(" ")[0]}
                </span>
                {/* Active Underline Dot */}
                {isActive && (
                  <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
                )}
                
                {/* Notification Badge for Inquiries */}
                {tab.id === "inquiries" && receivedInquiries.length > 0 && (
                  <span className="absolute top-0 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white">
                    {receivedInquiries.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;