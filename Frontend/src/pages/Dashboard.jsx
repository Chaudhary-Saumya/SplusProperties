import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
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
  ZapOff
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
    className={`bg-white border border-[#e2d9c5] rounded-xl p-5 shadow-sm transition-all ${onClick ? "cursor-pointer hover:border-[#c9a84c] hover:shadow-md" : ""}`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-lg bg-[#1a2340] flex items-center justify-center">
        <Icon size={18} className="text-[#c9a84c]" />
      </div>
      {onClick && <ChevronRight size={16} className="text-[#d1c9b8] mt-1" />}
    </div>
    <div
      className="text-2xl font-black text-[#1a2340] mb-1"
      style={{ fontFamily: "'Playfair Display', serif" }}
    >
      {value}
    </div>
    <div className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-1">
      {label}
    </div>
    {sub && <div className={`text-xs font-bold ${subColor}`}>{sub}</div>}
  </div>
);

/* ─── Section Header ───────────────────────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#f0ebe0]">
    <h2
      className="text-xl font-bold text-[#1a2340] flex items-center gap-2"
      style={{ fontFamily: "'Playfair Display', serif" }}
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
  const { user, loading } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
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
        const res = await axios.get(
          "/api/listings?createdBy=" + (user.id || user._id),
        );
        return res.data.data;
      }
    },
    refetchInterval: user?.role === 'Seller' || user?.role === 'Broker' ? 5000 : 15000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery({
    queryKey: ["dashboardInquiries", user?.id || user?._id],
    enabled: !!user,
    queryFn: async () => {
      const res = await axios.get("/api/inquiries");
      return res.data.data;
    },
    refetchInterval: user?.role === 'Seller' || user?.role === 'Broker' ? 3000 : 10000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["dashboardTransactions", user?.id || user?._id],
    enabled: !!user,
    queryFn: async () => {
      const res = await axios.get("/api/payments");
      return res.data.data;
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
  const [showSettings, setShowSettings] = useState(false);
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

  const updateInquiryStatus = async (id, newStatus) => {
    try {
      await axios.patch(`/api/inquiries/${id}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["dashboardInquiries"] });
    } catch {
      toast.error("Failed to update inquiry status");
    }
  };

  // Main useEffect
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileForm({ name: user.name, email: user.email, phone: user.phone });
    if (showSettings) fetchSessions();

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
  }, [user, showSettings, queryClient]);

  // Polling fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["dashboardListings"] });
        queryClient.invalidateQueries({ queryKey: ["dashboardInquiries"] });
        queryClient.invalidateQueries({ queryKey: ["dashboardTransactions"] });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user, queryClient]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Tab config ── */
  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "listings",
      label: user.role === "Buyer" ? "My Reserved Plots" : "My Listings",
      icon: List,
    },
    { id: "transactions", label: "Token History", icon: History },
    ...(user.role === "Seller" || user.role === "Broker"
      ? [
          { id: "inquiries", label: "Received Inquiries", icon: Users },
          { id: "payouts", label: "Payout Accounts", icon: Wallet },
        ]
      : []),
  ];

  return (
    <div
      className="min-h-screen bg-[#f8f5ee]"
      style={{ fontFamily: "'Nunito Sans', sans-serif" }}
    >
      {/* Gold top bar */}
      <div className="h-1 w-full bg-linear-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div>
                <h1
                  className="text-2xl sm:text-3xl font-bold text-[#1a2340]"
                  style={{ fontFamily: "'Nunito Sans', serif" }}
                >
                  Welcome, {user.name}
                </h1>
                <span className="inline-block bg-[#1a2340] text-[#c9a84c] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mt-3">
                  {user.role} Dashboard
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowSettings(!showSettings);
                if (!showSettings) setActiveSection("overview");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all border-2 ${
                showSettings
                  ? "bg-[#1a2340] text-[#c9a84c] border-[#1a2340]"
                  : "bg-white text-[#1a2340] border-[#e2d9c5] hover:border-[#1a2340]"
              }`}
            >
              {showSettings ? (
                <LayoutDashboard size={16} />
              ) : (
                <Settings size={16} />
              )}
              {showSettings ? "Back to Dashboard" : "Settings"}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        {!showSettings && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all border-2 ${
                  activeSection === tab.id
                    ? "bg-[#1a2340] text-[#c9a84c] border-[#1a2340] shadow-md"
                    : "bg-white text-[#1a2340] border-[#e2d9c5] hover:border-[#c9a84c]"
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* SETTINGS VIEW */}
        {showSettings ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Info */}
            <div className="bg-white border border-[#e2d9c5] rounded-xl p-6 shadow-sm">
              <SectionHeader icon={UserCheck} title="Profile Information" />
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">
                      Full Name
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
                      Phone{" "}
                      <span className="text-[#c9a84c] normal-case text-[9px]">
                        (Read-only)
                      </span>
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
                    Email{" "}
                    <span className="text-[#c9a84c] normal-case text-[9px]">
                      (Read-only)
                    </span>
                  </label>
                  <input
                    type="email"
                    className={`${inp} bg-[#f0ebe0] cursor-not-allowed opacity-60`}
                    value={profileForm.email}
                    disabled
                  />
                </div>
                <div className="bg-[#fffbf0] border border-[#e2d9c5] rounded-lg p-3 text-xs text-[#b8933a] font-600">
                  ⚠️ Email and phone cannot be changed for security reasons.
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#1a2340] hover:bg-[#c9a84c] hover:text-[#1a1200] text-white font-bold rounded-lg transition-all uppercase tracking-widest text-sm"
                >
                  Save Changes
                </button>
              </form>
            </div>

            {/* Password */}
            <div className="bg-white border border-[#e2d9c5] rounded-xl p-6 shadow-sm">
              <SectionHeader icon={Shield} title="Change Password" />
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
                  Update Password
                </button>
              </form>
            </div>

            {/* Active Sessions */}
            <div className="bg-white border border-[#e2d9c5] rounded-xl p-6 shadow-sm lg:col-span-2">
              <SectionHeader
                icon={Users}
                title="Active Logins"
                action={
                  <button
                    onClick={async () => {
                      if (window.confirm("Log out from all other devices?")) {
                        await axios.delete("/api/auth/sessions");
                        fetchSessions();
                      }
                    }}
                    className="text-xs font-bold text-[#dc2626] bg-[#fff0f0] border border-[#fecaca] px-3 py-1.5 rounded-lg uppercase tracking-wider"
                  >
                    Log out all others
                  </button>
                }
              />
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session._id}
                    className="flex items-center justify-between bg-[#fdfaf5] border border-[#e2d9c5] rounded-lg p-4"
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
                              Current
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
        ) : (
          /* DASHBOARD SECTIONS */
          <div>
            {/* Overview */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={History}
                    label="Total Reservations"
                    value={transactions.length}
                    sub="View all →"
                    onClick={() => setActiveSection("transactions")}
                  />
                  {(user.role === "Seller" || user.role === "Broker") && (
                    <>
                      <StatCard
                        icon={List}
                        label="Active Listings"
                        value={
                          listings.filter((l) => l.status === "Active").length
                        }
                        sub="Manage →"
                        onClick={() => setActiveSection("listings")}
                      />
                      <StatCard
                        icon={Users}
                        label="Received Inquiries"
                        value={receivedInquiries.length}
                        sub="View all →"
                        onClick={() => setActiveSection("inquiries")}
                        subColor="text-[#2563eb]"
                      />
                      <StatCard
                        icon={Wallet}
                        label="Payout Accounts"
                        value={`${user.paymentAccounts?.length || 0}/3`}
                        sub="Manage →"
                        onClick={() => setActiveSection("payouts")}
                      />
                    </>
                  )}
                  {user.role === "Buyer" && (
                    <>
                      <StatCard
                        icon={List}
                        label="Reserved Plots"
                        value={listings.length}
                        sub="View all →"
                        onClick={() => setActiveSection("listings")}
                      />
                      <StatCard
                        icon={Users}
                        label="Inquiries Sent"
                        value={sentInquiries.length}
                      />
                      <StatCard
                        icon={Award}
                        label="Account Role"
                        value={user.role}
                        sub="Verified Profile"
                      />
                    </>
                  )}
                </div>

                {/* Recent Listings */}
                {listings.length > 0 && (
                  <div className="bg-white border border-[#e2d9c5] rounded-xl p-6 shadow-sm">
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
                          className="flex items-center gap-3 bg-[#fdfaf5] border border-[#e2d9c5] hover:border-[#c9a84c] rounded-lg p-3 cursor-pointer transition-all group"
                        >
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#e5e7eb] shrink-0">
                            {l.images?.[0] ? (
                              <img
                                src={getImageUrl(l.images[0])}
                                alt=""
                                className="w-full h-full object-cover"
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
                              <MapPin size={10} /> {l.location}
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
                      ? "My Reserved Plots"
                      : "My Property Listings"
                  }
                  action={
                    (user.role === "Seller" || user.role === "Broker") && (
                      <Link
                        to="/create-listing"
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#1a2340] hover:bg-[#c9a84c] hover:text-[#1a1200] text-white text-sm font-bold rounded-lg transition-all uppercase tracking-wider"
                      >
                        <Plus size={14} /> New Listing
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
                            desc="You haven't reserved any properties yet. Start exploring to find your dream plot."
                            action={
                                <Link
                                    to="/search"
                                    className="px-6 py-2.5 bg-[#1a2340] text-[#c9a84c] font-bold text-sm rounded-lg uppercase tracking-wider"
                                >
                                    Explore Properties
                                </Link>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                            <MapPin size={10} /> {l.location}
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
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#f0ebe0]">
                          {[
                            "Property",
                            "Status",
                            "Price",
                            "Actions",
                          ].map((h) => (
                            <th
                              key={h}
                              className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest pr-4 last:text-right"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f8f5ee]">
                        {listings.map((l) => (
                          <tr
                            key={l._id}
                            className="hover:bg-[#fdfaf5] transition-colors"
                          >
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#e5e7eb] shrink-0">
                                  {l.images?.[0] ? (
                                    <img
                                      src={getImageUrl(l.images[0])}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-[#f0ebe0]" />
                                  )}
                                </div>
                                <Link
                                  to={`/listings/${l._id}`}
                                  className="text-sm font-bold text-[#1a2340] hover:text-[#c9a84c] transition-colors line-clamp-2 max-w-45"
                                >
                                  {l.title}
                                </Link>
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                                <div className="flex items-center gap-2">
                                  <Toggle
                                    checked={l.status === "Active"}
                                    onChange={() =>
                                      toggleStatus(
                                        l._id,
                                        l.status === "Active"
                                          ? "Inactive"
                                          : "Active",
                                      )
                                    }
                                  />
                                  <span
                                    className={`text-xs font-bold ${l.status === "Active" ? "text-[#15803d]" : "text-[#9ca3af]"}`}
                                  >
                                    {l.status}
                                  </span>
                                </div>
                            </td>
                            <td className="py-4 pr-4">
                              <span className="text-sm font-black text-[#1a2340]">
                                ₹{l.price?.toLocaleString("en-IN")}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => navigate(`/listings/${l._id}`)}
                                  className="p-2 text-[#6b7280] hover:bg-[#f0ebe0] rounded-lg transition-all"
                                  title="View"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(`/edit-listing/${l._id}`)
                                  }
                                  className="p-2 text-[#2563eb] hover:bg-[#eff6ff] rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Edit size={15} />
                                </button>
                                <button
                                  onClick={() => handleDelete(l._id)}
                                  className="p-2 text-[#dc2626] hover:bg-[#fff0f0] rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
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
                <SectionHeader
                  icon={History}
                  title="Token Transaction History"
                />

                {transactionsLoading ? (
                  <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-40 bg-[#f8f5ee] rounded-xl animate-pulse"
                      />
                    ))}
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
                            desc="Your payment history and receipts will appear here after your first reservation."
                            action={
                                <Link
                                    to="/search"
                                    className="px-6 py-2.5 bg-[#1a2340] text-[#c9a84c] font-bold text-sm rounded-lg uppercase tracking-wider"
                                >
                                    Start Reservation
                                </Link>
                            }
                        />
                    ) : (
                        <div className="bg-white border border-[#e2d9c5] rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[#fdfaf5] border-b border-[#e2d9c5]">
                                        <tr>
                                            <th className="p-4 text-[10px] font-bold text-[#1a2340] uppercase tracking-widest">
                                                Property
                                            </th>
                                            <th className="p-4 text-[10px] font-bold text-[#1a2340] uppercase tracking-widest">
                                                Amount
                                            </th>
                                            <th className="p-4 text-[10px] font-bold text-[#1a2340] uppercase tracking-widest">
                                                Status
                                            </th>
                                            <th className="p-4 text-[10px] font-bold text-[#1a2340] uppercase tracking-widest text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f0ebe0]">
                                        {transactions.map((t) => (
                                            <tr key={t._id} className="hover:bg-[#fdfaf5]/50">
                                                <td className="p-4 min-w-[200px]">
                                                    <p className="text-sm font-bold text-[#1a2340]">
                                                        {t.listingId?.title}
                                                    </p>
                                                    <p className="text-[10px] text-[#9ca3af] font-600 mt-0.5">
                                                        Ref: {t.razorpayOrderId}
                                                    </p>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <p className="text-sm font-black text-[#1a2340]">
                                                        ₹{t.amount?.toLocaleString("en-IN")}
                                                    </p>
                                                    <p className="text-[10px] text-[#9ca3af] font-600">
                                                        {new Date(t.createdAt).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td className="p-4">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                            t.status === "Success"
                                                                ? "bg-[#f0fdf4] text-[#15803d]"
                                                                : "bg-[#fff0f0] text-[#dc2626]"
                                                        }`}
                                                    >
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedTransaction(t)}
                                                        className="p-2 bg-white border border-[#e2d9c5] text-[#1a2340] rounded-lg hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all"
                                                        title="Receipt"
                                                    >
                                                        <Receipt size={16} />
                                                    </button>
                                                </td>
                                            </tr>
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
                  <SectionHeader icon={Users} title="Received Inquiries" />

                  {inquiriesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-16 bg-[#f8f5ee] rounded-lg animate-pulse"
                        />
                      ))}
                    </div>
                  ) : receivedInquiries.length === 0 ? (
                    <EmptyState
                      title="No Inquiries Yet"
                      message="Buyers haven't inquired about your listings yet."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[#f0ebe0]">
                            <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest pr-4">
                              Buyer
                            </th>
                            <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest pr-4">
                              Property
                            </th>
                            <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest pr-4">
                              Date
                            </th>
                            <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest pr-4">
                              Status
                            </th>
                            <th className="pb-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest text-right">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f8f5ee]">
                          {receivedInquiries.map((inq) => (
                            <tr
                              key={inq._id}
                              className="hover:bg-[#fdfaf5] transition-colors"
                            >
                              <td className="py-4 pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-[#1a2340] rounded-full flex items-center justify-center text-[#c9a84c] font-bold text-sm shrink-0">
                                    {inq.userId?.name?.[0]?.toUpperCase() ||
                                      "B"}
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-[#1a2340]">
                                      {inq.userId?.name}
                                    </div>
                                    <div className="text-xs text-[#6b7280]">
                                      {inq.userId?.phone}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                <Link
                                  to={`/listings/${inq.listingId?._id}`}
                                  className="text-sm font-bold text-[#1a2340] hover:text-[#c9a84c]"
                                >
                                  {inq.listingId?.title}
                                </Link>
                              </td>
                              <td className="py-4 pr-4">
                                <div className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider">
                                  {new Date(inq.createdAt).toLocaleDateString(
                                    "en-IN",
                                  )}
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                <span
                                  className={`px-2 py-1 text-xs font-bold rounded-full ${
                                    inq.status === "Contacted"
                                      ? "bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]"
                                      : inq.status === "Pending"
                                        ? "bg-[#fffbeb] text-[#d97706] border border-[#fcd34d]"
                                        : "bg-[#f3f4f6] text-[#6b7280]"
                                  }`}
                                >
                                  {inq.status}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() =>
                                      updateInquiryStatus(
                                        inq._id,
                                        inq.status === "Pending"
                                          ? "Contacted"
                                          : "Pending",
                                      )
                                    }
                                    className="p-2 text-[#2563eb] hover:bg-[#eff6ff] rounded-lg transition-all"
                                    title="Toggle Status"
                                  >
                                    <CheckCircle2 size={15} />
                                  </button>
                                  {inq.userId?.phone && (
                                    <a
                                      href={`tel:${inq.userId.phone}`}
                                      className="p-2 text-[#15803d] hover:bg-[#f0fdf4] rounded-lg transition-all"
                                      title="Call"
                                    >
                                      <Phone size={15} />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
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
                    title="Payout Accounts"
                    action={
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg ${user.paymentAccounts?.length >= 3 ? "bg-[#fff0f0] text-[#dc2626] border border-[#fecaca]" : "bg-[#fffbf0] text-[#b8933a] border border-[#e2d9c5]"}`}
                      >
                        {user.paymentAccounts?.length || 0}/3 Accounts
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
                              <CreditCard
                                size={16}
                                className="text-[#c9a84c]"
                              />
                            ) : (
                              <Landmark size={16} className="text-[#c9a84c]" />
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <div className="text-sm font-bold text-[#1a2340] mb-1">
                          {acc.holderName}
                        </div>
                        <div className="text-xs text-[#6b7280] font-600">
                          {acc.accountType === "UPI"
                            ? acc.upiId
                            : acc.accountNumber}
                        </div>
                        {acc.bankName && (
                          <div className="text-[10px] text-[#9ca3af] font-600 mt-1">
                            {acc.bankName} · {acc.ifscCode}
                          </div>
                        )}
                      </div>
                    ))}

                    {(!user.paymentAccounts ||
                      user.paymentAccounts.length < 3) && (
                      <button
                        onClick={() => setShowAddAccountModal(true)}
                        className="border-2 border-dashed border-[#e2d9c5] hover:border-[#c9a84c] hover:bg-[#fffbf0] rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-[#9ca3af] hover:text-[#c9a84c] transition-all min-h-35"
                      >
                        <div className="w-10 h-10 border-2 border-dashed border-current rounded-lg flex items-center justify-center">
                          <Plus size={18} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Add Account
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="bg-[#fffbf0] border border-[#e2d9c5] rounded-lg p-4 text-sm text-[#b8933a] font-600">
                    💡 Token money from buyers will be transferred directly to
                    your chosen account. We don't hold any funds.
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Add Payout Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a2340]/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-linear-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ebe0]">
              <h3
                className="text-lg font-bold text-[#1a2340]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {editingAccountId ? "Edit Account" : "Add Payout Account"}
              </h3>
              <button
                onClick={() => {
                  setShowAddAccountModal(false);
                  setEditingAccountId(null);
                }}
                className="text-[#9ca3af] hover:text-[#1a2340] p-1.5 hover:bg-[#f8f5ee] rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              <div className="flex gap-2 bg-[#f8f5ee] p-1 rounded-lg">
                {["Bank", "UPI"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setNewAccount({ ...newAccount, accountType: type })
                    }
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${newAccount.accountType === type ? "bg-[#1a2340] text-[#c9a84c] shadow-sm" : "text-[#9ca3af] hover:text-[#1a2340]"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  className={inp}
                  placeholder="Name as per bank"
                  value={newAccount.holderName}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, holderName: e.target.value })
                  }
                />
              </div>

              {newAccount.accountType === "Bank" ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      required
                      className={inp}
                      placeholder="e.g. HDFC Bank"
                      value={newAccount.bankName}
                      onChange={(e) =>
                        setNewAccount({
                          ...newAccount,
                          bankName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">
                        Account Number
                      </label>
                      <input
                        type="text"
                        required
                        className={inp}
                        placeholder="1234..."
                        value={newAccount.accountNumber}
                        onChange={(e) =>
                          setNewAccount({
                            ...newAccount,
                            accountNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        required
                        className={inp}
                        placeholder="HDFC0..."
                        value={newAccount.ifscCode}
                        onChange={(e) =>
                          setNewAccount({
                            ...newAccount,
                            ifscCode: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-[#1a2340] uppercase tracking-widest mb-2">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    required
                    className={inp}
                    placeholder="username@bank"
                    value={newAccount.upiId}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, upiId: e.target.value })
                    }
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#1a2340] hover:bg-[#c9a84c] hover:text-[#1a1200] text-white font-bold rounded-lg transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
              >
                {editingAccountId ? <Edit size={16} /> : <Plus size={16} />}
                {editingAccountId ? "Update Account" : "Save Account"}
              </button>
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
    </div>
  );
};

export default Dashboard;