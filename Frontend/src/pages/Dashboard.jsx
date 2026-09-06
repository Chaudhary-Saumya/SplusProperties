import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import {
  Edit,
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
  MapPin,
  CheckCircle2,
  Shield,
  ChevronRight,
  Building2,
  TrendingUp,
  Award,
  FileText,
  UserCheck,
  ArrowUpRight,
  ZapOff,
  Compass,
  Map,
  Heart,
  KeyRound,
  ExternalLink,
  Sparkles,
  PhoneCall,
  MessageSquare,
  Lock,
  Clock,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  Laptop,
  Smartphone,
  EyeOff
} from "lucide-react";
import ReceiptModal from "../components/ReceiptModal";
import socket from "../utils/socket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ListingSkeleton from "../components/ListingSkeleton";
import EmptyState from "../components/EmptyState";
import { getImageUrl } from "../utils/imageUrl";
import ConfirmModal from "../components/ConfirmModal";

const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all font-semibold text-slate-800 text-xs sm:text-sm placeholder:text-slate-400";
const labelCls = "block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider";

const StatCard = ({ icon: Icon, label, value, sub, colorClass = "bg-blue-50 text-blue-600 border-blue-100", onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all hover:shadow-md ${
      onClick ? "cursor-pointer group hover:border-blue-500 hover:-translate-y-0.5" : ""
    }`}
  >
    <div className="flex items-center justify-between mb-2.5">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shadow-2xs ${colorClass}`}>
        <Icon size={18} className="sm:w-5 sm:h-5" />
      </div>
      {onClick && (
        <div className="w-6 h-6 rounded-full bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition-colors">
          <ChevronRight size={14} />
        </div>
      )}
    </div>
    <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
      {value}
    </div>
    <div className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider truncate">
      {label}
    </div>
    {sub && (
      <div className="text-[10px] sm:text-[11px] font-bold text-blue-600 mt-2 flex items-center gap-1 group-hover:underline">
        <span>{sub}</span>
        <ArrowUpRight size={12} />
      </div>
    )}
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-slate-500 text-xs font-medium">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const Dashboard = ({ tab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, deleteAccount } = useContext(AuthContext);
  const { t } = useLanguage();

  const [activeSection, setActiveSection] = useState(() => {
    if (tab) return tab;
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("tab") || "overview";
  });

  useEffect(() => {
    if (tab) {
      setActiveSection(tab);
    } else {
      const searchParams = new URLSearchParams(location.search);
      const tabParam = searchParams.get("tab");
      if (tabParam) setActiveSection(tabParam);
    }
  }, [tab, location.search]);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const queryClient = useQueryClient();

  /* ── Queries ── */
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["dashboardListings", user?.id || user?._id],
    enabled: !!user,
    queryFn: async () => {
      const res = await axios.get("/api/listings/mine");
      return res.data.data;
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

  /* ── Listing action states ── */
  const [confirmModal, setConfirmModal] = useState(null);
  const [pendingIds, setPendingIds] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);

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

  const receivedInquiries = inquiries.filter(
    (inq) =>
      (inq.listingId?.createdBy?._id || inq.listingId?.createdBy) ===
      (user?.id || user?._id)
  );

  const [lastInquiriesViewedAt, setLastInquiriesViewedAt] = useState(() => {
    return localStorage.getItem("lastInquiriesViewedAt") || "1970-01-01T00:00:00.000Z";
  });

  useEffect(() => {
    if (activeSection === "inquiries") {
      const now = new Date().toISOString();
      localStorage.setItem("lastInquiriesViewedAt", now);
      setLastInquiriesViewedAt(now);
    }
  }, [activeSection]);

  const unreadInquiriesCount = receivedInquiries.filter(
    (inq) =>
      inq.status === "Pending" &&
      new Date(inq.createdAt) > new Date(lastInquiriesViewedAt)
  ).length;

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
      title: "Remove Payment Account",
      message: "Are you sure you want to remove this Bank / UPI payment account?",
      confirmText: "Remove Account",
      type: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await axios.delete(`/api/auth/payment-accounts/${accountId}`);
          toast.success("Account removed");
          queryClient.invalidateQueries({ queryKey: ["dashboardListings"] });
        } catch {
          toast.error("Failed to delete account");
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const toggleStatus = async (id, newStatus) => {
    if (pendingIds.has(id)) return;
    setPendingIds(prev => new Set(prev).add(id));
    queryClient.setQueryData(["dashboardListings", user?.id || user?._id], (old) =>
      old ? old.map(l => l._id === id ? { ...l, status: newStatus } : l) : old
    );
    try {
      await axios.put(`/api/listings/${id}`, { status: newStatus });
      toast.success(`Listing marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
      queryClient.setQueryData(["dashboardListings", user?.id || user?._id], (old) =>
        old ? old.map(l => l._id === id ? { ...l, status: newStatus === 'Active' ? 'Inactive' : 'Active' } : l) : old
      );
    } finally {
      setPendingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleDelete = (id, title) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Property Listing",
      message: `Are you sure you want to permanently delete "${title}"? This action cannot be undone.`,
      confirmText: "Delete Listing",
      type: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        setDeletingId(id);
        queryClient.setQueryData(["dashboardListings", user?.id || user?._id], (old) =>
          old ? old.filter(l => l._id !== id) : old
        );
        try {
          await axios.delete(`/api/listings/${id}`);
          toast.success("Property deleted");
        } catch {
          toast.error("Failed to delete property");
          queryClient.invalidateQueries({ queryKey: ["dashboardListings"] });
        } finally {
          setDeletingId(null);
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put("/api/auth/updatedetails", profileForm);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const [brokerToggling, setBrokerToggling] = useState(false);
  const handleToggleBroker = async () => {
    setBrokerToggling(true);
    try {
      const res = await axios.put("/api/auth/toggle-broker");
      if (res.data?.success) {
        toast.success(res.data.message || "Broker status updated!");
        window.location.reload();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to toggle broker status");
    } finally {
      setBrokerToggling(false);
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

  const updateInquiryStatus = async (id, newStatus) => {
    try {
      await axios.patch(`/api/inquiries/${id}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["dashboardInquiries"] });
      toast.success(`Inquiry marked as ${newStatus === 'Contacted' ? 'Connected' : 'Pending'}`);
    } catch {
      toast.error("Failed to update inquiry status");
    }
  };

  useEffect(() => {
    if (!user) return;
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

    return () => {
      socket.off("listing_updated", inv);
      socket.off("listing_verified", inv);
      socket.off("listing_rejected", inv);
      socket.off("listing_reserved", inv);
      socket.off("new_inquiry", inv);
      socket.off("inquiry_status_updated", inv);
      socket.off("payment_created", inv);
      socket.off("token_reserved", inv);
    };
  }, [user, activeSection, queryClient]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Dashboard", route: "/dashboard", icon: LayoutDashboard },
    { id: "listings", label: "My Listings", route: "/my-listings", icon: List },
    { id: "inquiries", label: "Buyer Leads", route: "/buyer-leads", icon: Users },
    ...(systemSettings?.isInstantBookingEnabled !== false
      ? [
        { id: "transactions", label: "Token Payments", route: "/dashboard?tab=transactions", icon: History },
        { id: "payouts", label: "Bank & Payouts", route: "/my-payouts", icon: Wallet },
      ]
      : []),
    { id: "settings", label: "Account Settings", route: "/account-settings", icon: Settings },
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'Nunito Sans', sans-serif" }} className="bg-[#f8fafc] min-h-screen text-slate-800 antialiased pb-20">

      {/* Hero Header Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white font-extrabold text-lg sm:text-xl rounded-2xl flex items-center justify-center shadow-lg shrink-0 border-2 border-slate-700 overflow-hidden">
              {user.profileImage ? (
                <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name?.[0]?.toUpperCase() || "U"
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">{user.name}</h1>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {formatRoleLabel(user.role)}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1"><Mail size={12} className="text-slate-400" /> {user.email}</span>
                {user.phone && <span className="flex items-center gap-1">• <Phone size={12} className="text-slate-400" /> +91 {user.phone}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleToggleBroker}
              disabled={brokerToggling}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                user.role === "Broker"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Award size={14} className={user.role === "Broker" ? "text-amber-400" : "text-slate-400"} />
              <span>{user.role === "Broker" ? "Broker Active" : "Register as Broker"}</span>
            </button>

            <Link
              to="/create-listing"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider shadow-md active:scale-95 whitespace-nowrap"
            >
              <Plus size={16} /> Post Property
            </Link>
          </div>
        </div>
      </div>

      {/* Main Layout Container with Desktop Sidebar + Mobile Top Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Mobile Horizontal Scrollable Pill Bar */}
        <div className="lg:hidden flex overflow-x-auto gap-2 pb-3 mb-6 border-b border-slate-200 scrollbar-none">
          {tabs.map((tItem) => {
            const Icon = tItem.icon;
            const isActive = activeSection === tItem.id;
            return (
              <button
                key={tItem.id}
                onClick={() => { setActiveSection(tItem.id); navigate(tItem.route); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Icon size={15} className={isActive ? "text-blue-400" : "text-slate-400"} />
                <span>{tItem.label}</span>
                {tItem.id === "inquiries" && unreadInquiriesCount > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    {unreadInquiriesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Left Persistent Sidebar */}
          <div className="hidden lg:col-span-3 lg:flex flex-col gap-4 sticky top-[100px]">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-1">
              <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Portal Navigation</div>
              {tabs.map((tItem) => {
                const Icon = tItem.icon;
                const isActive = activeSection === tItem.id;
                return (
                  <button
                    key={tItem.id}
                    onClick={() => { setActiveSection(tItem.id); navigate(tItem.route); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs transition-all text-left cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-blue-400" : "text-slate-400"} />
                    <span className="flex-1">{tItem.label}</span>
                    {tItem.id === "inquiries" && unreadInquiriesCount > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}>
                        {unreadInquiriesCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sticky Sidebar Post Property CTA Card */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl p-5 border border-blue-500/20 shadow-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Plus size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Sell Land or Plot</h4>
                <p className="text-xs text-blue-200 font-medium mt-0.5">Post verified property listings to thousands of direct buyers.</p>
              </div>
              <Link
                to="/create-listing"
                className="block text-center w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider shadow-sm"
              >
                + Post Property FREE
              </Link>
            </div>
          </div>

          {/* Main Content Render Area */}
          <div className="col-span-1 lg:col-span-9 space-y-6">

            {/* ── Tab Section 1: Overview ── */}
            {activeSection === "overview" && (
              <div className="space-y-6 sm:space-y-8">
                {/* Stat Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <StatCard
                    icon={List}
                    label="My Listed Properties"
                    value={listings.length}
                    sub="Manage Portfolio"
                    colorClass="bg-blue-50 text-blue-600 border-blue-100"
                    onClick={() => { setActiveSection("listings"); navigate("/my-listings"); }}
                  />
                  <StatCard
                    icon={Users}
                    label="Received Leads"
                    value={receivedInquiries.length}
                    sub="View Enquiries"
                    colorClass="bg-emerald-50 text-emerald-600 border-emerald-100"
                    onClick={() => { setActiveSection("inquiries"); navigate("/buyer-leads"); }}
                  />
                  {systemSettings?.isInstantBookingEnabled !== false && (
                    <StatCard
                      icon={History}
                      label="Token Payments"
                      value={transactions.length}
                      sub="View History"
                      colorClass="bg-indigo-50 text-indigo-600 border-indigo-100"
                      onClick={() => { setActiveSection("transactions"); navigate("/dashboard?tab=transactions"); }}
                    />
                  )}
                  <StatCard
                    icon={Award}
                    label="Account Status"
                    value={formatRoleLabel(user.role)}
                    colorClass="bg-amber-50 text-amber-600 border-amber-100"
                  />
                </div>

                {/* Recent Properties Section */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
                  <SectionHeader
                    icon={TrendingUp}
                    title="Recent Properties"
                    subtitle="Your latest posted land and plot listings"
                    action={
                      <button
                        onClick={() => { setActiveSection("listings"); navigate("/my-listings"); }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all self-start sm:self-auto"
                      >
                        View All Portfolio <ArrowUpRight size={12} />
                      </button>
                    }
                  />

                  {listingsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => <ListingSkeleton key={i} variant="card" />)}
                    </div>
                  ) : listings.length === 0 ? (
                    <EmptyState
                      title="No Listings Found"
                      message="You haven't posted any land or plot listings yet."
                      actionText="Post Property for Sale"
                      actionLink="/create-listing"
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {listings.slice(0, 3).map((l) => (
                        <div
                          key={l._id}
                          onClick={() => navigate(`/listings/${l._id}`)}
                          className="flex items-center gap-3.5 bg-slate-50 border border-slate-200 hover:border-blue-500 rounded-xl p-3 cursor-pointer transition-all hover:bg-white hover:shadow-md group"
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                            {l.images?.[0] ? (
                              <img src={getImageUrl(l.images[0])} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">NO IMG</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">{l.title}</h4>
                            <p className="text-[10px] font-extrabold text-blue-600 mt-0.5">₹{l.price?.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{l.location}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab Section 2: My Listings ── */}
            {activeSection === "listings" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-6">
                <SectionHeader
                  icon={List}
                  title="My Listings & Properties"
                  subtitle="Manage your posted land & plot listings"
                  action={
                    <Link
                      to="/create-listing"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
                    >
                      <Plus size={14} /> Post New Property
                    </Link>
                  }
                />

                {listingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <ListingSkeleton key={i} variant="list" />)}
                  </div>
                ) : listings.length === 0 ? (
                  <EmptyState
                    title="Your Portfolio is Empty"
                    message="You haven't posted any land or plot listings yet. Post your first property for sale now!"
                    actionText="Post Property for Sale"
                    actionLink="/create-listing"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {listings.map((l) => (
                      <div key={l._id} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group">
                        <div className="h-44 bg-slate-200 relative overflow-hidden">
                          {l.images?.[0] ? (
                            <img src={getImageUrl(l.images[0])} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">NO PHOTO</div>
                          )}

                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs ${
                              l.status === 'Active' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {l.status}
                            </span>
                            {l.listingType === 'Verified' && (
                              <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                                <ShieldCheck size={10} /> Verified
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{l.title}</h3>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1 truncate">
                              <MapPin size={12} className="text-blue-600 shrink-0" /> {l.location}
                            </p>
                            <div className="text-base font-black text-slate-900 mt-2">₹{l.price?.toLocaleString('en-IN')}</div>
                          </div>

                          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => !pendingIds.has(l._id) && toggleStatus(l._id, l.status === "Active" ? "Inactive" : "Active")}
                                disabled={pendingIds.has(l._id)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${l.status === "Active" ? 'bg-emerald-600' : 'bg-slate-300'}`}
                              >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all ${l.status === "Active" ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                              </button>
                              <span className="text-[10px] font-bold text-slate-500">{l.status === 'Active' ? 'Live' : 'Hidden'}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button onClick={() => navigate(`/listings/${l._id}`)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View">
                                <Eye size={16} />
                              </button>
                              <button onClick={() => navigate(`/edit-listing/${l._id}`)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDelete(l._id, l.title)} disabled={deletingId === l._id} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab Section 3: Buyer Leads ── */}
            {activeSection === "inquiries" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-6">
                <SectionHeader
                  icon={Users}
                  title="Buyer Leads & Enquiries"
                  subtitle="Direct enquiries received from interested buyers"
                />

                {inquiriesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : receivedInquiries.length === 0 ? (
                  <EmptyState title="No Enquiries Yet" message="Buyers haven't inquired about your listings yet." />
                ) : (
                  <div className="space-y-3">
                    {receivedInquiries.map((inq) => (
                      <div key={inq._id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-blue-600 text-white font-extrabold text-base rounded-xl flex items-center justify-center shrink-0">
                            {inq.userId?.name?.[0]?.toUpperCase() || "B"}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">{inq.userId?.name}</h4>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5"><Phone size={12} className="text-slate-400" /> +91 {inq.userId?.phone || 'N/A'}</p>
                            <p className="text-[11px] font-bold text-blue-600 mt-0.5">Property: {inq.listingId?.title}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            inq.status === 'Contacted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {inq.status === 'Contacted' ? 'Connected' : 'Pending'}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateInquiryStatus(inq._id, inq.status === "Pending" ? "Contacted" : "Pending")}
                              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 rounded-lg text-xs font-bold text-slate-700 transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              <span>{inq.status === "Contacted" ? "Mark Pending" : "Mark Connected"}</span>
                            </button>
                            {inq.userId?.phone && (
                              <a href={`tel:${inq.userId.phone}`} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                                <Phone size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab Section 4: Token Payments ── */}
            {activeSection === "transactions" && systemSettings?.isInstantBookingEnabled !== false && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-6">
                <SectionHeader
                  icon={History}
                  title="Token Payments & Reservations"
                  subtitle="Transaction records for instant property bookings"
                />

                {transactionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : transactions.length === 0 ? (
                  <EmptyState title="No Token Payments Yet" message="No reservation transactions recorded." />
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx._id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">₹{tx.amount?.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Paid</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1">Property: {tx.listingId?.title || 'Land Booking'}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">TX ID: {tx.razorpayPaymentId || tx._id}</p>
                        </div>

                        <button
                          onClick={() => setSelectedTransaction(tx)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
                        >
                          <Receipt size={13} /> View Receipt
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab Section 5: Payout Accounts ── */}
            {activeSection === "payouts" && systemSettings?.isInstantBookingEnabled !== false && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-6">
                <SectionHeader
                  icon={Wallet}
                  title="Bank & Payout Accounts"
                  subtitle="Manage bank accounts and UPI IDs to receive buyer token payments"
                  action={
                    <button
                      onClick={() => { setEditingAccountId(null); setShowAddAccountModal(true); }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
                    >
                      <Plus size={14} /> Add Payout Account
                    </button>
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {user.paymentAccounts?.map((acc) => (
                    <div key={acc._id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group hover:border-blue-500 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                          {acc.accountType}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditAccount(acc)} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteAccount(acc._id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{acc.holderName}</h4>
                        <p className="text-xs text-slate-500 font-medium">{acc.bankName || acc.upiId}</p>
                        {acc.accountNumber && <p className="text-xs font-mono text-slate-400 mt-1">Acc: ****{acc.accountNumber.slice(-4)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tab Section 6: Full Production Settings ── */}
            {activeSection === "settings" && (
              <div className="space-y-6">
                {/* 1. Profile Info Form */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-6">
                  <SectionHeader icon={UserCheck} title="Profile Information" subtitle="Update your personal account details" />
                  <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Phone Number (Read-only)</label>
                      <input type="text" value={profileForm.phone} disabled className={inputCls + ' opacity-60 cursor-not-allowed bg-slate-100'} />
                    </div>
                    <div>
                      <label className={labelCls}>Email Address (Read-only)</label>
                      <input type="email" value={profileForm.email} disabled className={inputCls + ' opacity-60 cursor-not-allowed bg-slate-100'} />
                    </div>
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-xs">
                      Save Profile Details
                    </button>
                  </form>
                </div>

                {/* 2. Password & Security */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-6">
                  <SectionHeader icon={Lock} title="Password & Security" subtitle="Update your account password" />
                  <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
                    <div>
                      <label className={labelCls}>Current Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className={inputCls}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
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
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className={inputCls}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
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
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className={inputCls}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="px-6 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-xs">
                      Update Password
                    </button>
                  </form>
                </div>

                {/* 3. Active Sessions */}
                {sessions.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
                    <SectionHeader icon={Laptop} title="Active Login Sessions" subtitle="Manage active devices logged into your account" />
                    <div className="space-y-2">
                      {sessions.map((s) => (
                        <div key={s._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600">
                              {s.deviceType === 'Mobile' ? <Smartphone size={16} /> : <Laptop size={16} />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{s.userAgent || 'Web Browser'}</p>
                              <p className="text-[10px] text-slate-400 font-mono">IP: {s.ipAddress || 'Unknown'}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRevokeSession(s._id)}
                            className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Danger Zone / Delete Account */}
                <div className="bg-rose-50/40 rounded-2xl border border-rose-200 p-4 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-rose-900 tracking-tight">Danger Zone</h3>
                      <p className="text-xs font-medium text-rose-700/80 mt-0.5">
                        Permanently delete your user account and erase all posted listings, inquiries, and saved data.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-xs"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Account Permanently?</h3>
                <p className="text-xs text-slate-500 font-medium">This will permanently remove your account & all properties.</p>
              </div>
            </div>

            <form onSubmit={handleDeleteAccountConfirm} className="space-y-4">
              <div>
                <label className={labelCls}>Enter Your Password to Confirm</label>
                <input
                  type="password"
                  required
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  className={inputCls}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase transition-all disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payout Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">{editingAccountId ? 'Edit Payout Account' : 'Add Payout Account'}</h3>
              <button onClick={() => setShowAddAccountModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className={labelCls}>Account Type</label>
                <select value={newAccount.accountType} onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value })} className={inputCls}>
                  <option value="Bank">Bank Account</option>
                  <option value="UPI">UPI ID</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Account Holder Name</label>
                <input type="text" required value={newAccount.holderName} onChange={(e) => setNewAccount({ ...newAccount, holderName: e.target.value })} className={inputCls} />
              </div>
              {newAccount.accountType === 'Bank' ? (
                <>
                  <div>
                    <label className={labelCls}>Bank Name</label>
                    <input type="text" required value={newAccount.bankName} onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })} className={inputCls} placeholder="e.g. HDFC Bank, SBI" />
                  </div>
                  <div>
                    <label className={labelCls}>Account Number</label>
                    <input type="text" required value={newAccount.accountNumber} onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>IFSC Code</label>
                    <input type="text" required value={newAccount.ifscCode} onChange={(e) => setNewAccount({ ...newAccount, ifscCode: e.target.value })} className={inputCls} placeholder="e.g. SBIN0001234" />
                  </div>
                </>
              ) : (
                <div>
                  <label className={labelCls}>UPI ID</label>
                  <input type="text" required value={newAccount.upiId} onChange={(e) => setNewAccount({ ...newAccount, upiId: e.target.value })} className={inputCls} placeholder="e.g. 9876543210@paytm" />
                </div>
              )}
              <div className="flex gap-2 justify-end pt-3">
                <button type="button" onClick={() => setShowAddAccountModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-extrabold uppercase">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {selectedTransaction && (
        <ReceiptModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
      )}

      {/* REUSABLE CONFIRMATION MODAL */}
      {confirmModal && <ConfirmModal {...confirmModal} />}
    </div>
  );
};

export default Dashboard;