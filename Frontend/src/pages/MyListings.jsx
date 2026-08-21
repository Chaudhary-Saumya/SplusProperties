import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import {
  List,
  Plus,
  Edit,
  Trash2,
  Eye,
  MapPin,
  ShieldCheck,
  Search,
  Award,
  Filter
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../context/LanguageContext";
import ListingSkeleton from "../components/ListingSkeleton";
import EmptyState from "../components/EmptyState";
import { getImageUrl } from "../utils/imageUrl";

const MyListings = () => {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [confirmModal, setConfirmModal] = useState(null);
  const [pendingIds, setPendingIds] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);

  /* ── Fetch Listings ── */
  const { data: listingsData, isLoading } = useQuery({
    queryKey: ["myListings", user?.id || user?._id],
    enabled: !!user,
    queryFn: async () => {
      const res = await axios.get("/api/listings/mine");
      return res.data.data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const listings = listingsData || [];

  const formatRoleLabel = (role) => {
    if (role === "Broker") return "Real Estate Broker";
    if (role === "Admin") return "System Administrator";
    return "Property Owner";
  };

  /* ── Toggle Active / Inactive Status ── */
  const toggleStatus = async (id, newStatus) => {
    if (pendingIds.has(id)) return;
    setPendingIds((prev) => new Set(prev).add(id));
    queryClient.setQueryData(["myListings", user?.id || user?._id], (old) =>
      old ? old.map((l) => (l._id === id ? { ...l, status: newStatus } : l)) : old
    );
    try {
      await axios.put(`/api/listings/${id}`, { status: newStatus });
      toast.success(`Property status set to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
      queryClient.invalidateQueries({ queryKey: ["myListings"] });
    } finally {
      setPendingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  /* ── Delete Listing ── */
  const handleDelete = (id, title) => {
    setConfirmModal({ id, title });
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    const { id } = confirmModal;
    setDeletingId(id);
    setConfirmModal(null);
    queryClient.setQueryData(["myListings", user?.id || user?._id], (old) =>
      old ? old.filter((l) => l._id !== id) : old
    );
    try {
      await axios.delete(`/api/listings/${id}`);
      toast.success("Property deleted successfully");
    } catch {
      toast.error("Failed to delete property");
      queryClient.invalidateQueries({ queryKey: ["myListings"] });
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Filtered Listings ── */
  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && l.status === "Active") ||
      (statusFilter === "Hidden" && l.status !== "Active");
    return matchesSearch && matchesStatus;
  });

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', 'Nunito Sans', sans-serif" }} className="bg-[#f8fafc] min-h-screen text-slate-800 antialiased pb-20">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white font-extrabold text-lg sm:text-xl rounded-2xl flex items-center justify-center shadow-lg shrink-0 border-2 border-slate-700">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">{t('my_listings.title')}</h1>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {formatRoleLabel(user.role)}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-medium mt-0.5">
                {t('my_listings.subtitle')}
              </p>
            </div>
          </div>

          <Link
            to="/create-listing"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider shadow-md active:scale-95 whitespace-nowrap"
          >
            <Plus size={16} /> {t('my_listings.add_new')}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search my properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Filter size={14} className="text-slate-400 shrink-0 hidden sm:inline" />
            {["All", "Active", "Hidden"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st} ({st === "All" ? listings.length : st === "Active" ? listings.filter((l) => l.status === "Active").length : listings.filter((l) => l.status !== "Active").length})
              </button>
            ))}
          </div>
        </div>

        {/* Property Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <ListingSkeleton key={i} variant="card" />
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <EmptyState
            title={searchTerm ? "No Matching Properties" : "No Properties Posted Yet"}
            message={searchTerm ? "Try searching with a different term." : "Post your first plot or land listing to reach buyers."}
            actionText="Post Property for Sale"
            actionLink="/create-listing"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((l) => (
              <div key={l._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {l.images?.[0] ? (
                    <img src={getImageUrl(l.images[0])} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">NO PHOTO</div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs ${
                      l.status === 'Active' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {l.status === 'Active' ? 'Active' : 'Hidden'}
                    </span>
                    {l.listingType === 'Verified' && (
                      <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                        <ShieldCheck size={10} /> Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">{l.title}</h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1 truncate">
                      <MapPin size={13} className="text-blue-600 shrink-0" /> {l.location}
                    </p>
                    <div className="text-lg font-black text-slate-900 mt-3">₹{l.price?.toLocaleString('en-IN')}</div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => !pendingIds.has(l._id) && toggleStatus(l._id, l.status === "Active" ? "Inactive" : "Active")}
                        disabled={pendingIds.has(l._id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all cursor-pointer ${l.status === "Active" ? 'bg-emerald-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all ${l.status === "Active" ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </button>
                      <span className="text-[11px] font-bold text-slate-500">{l.status === 'Active' ? 'Visible' : 'Hidden'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/listings/${l._id}`)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => navigate(`/edit-listing/${l._id}`)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer" title="Edit Property">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(l._id, l.title)} disabled={deletingId === l._id} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer" title="Delete Property">
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

      {/* Delete Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-extrabold text-slate-900">Delete Property?</h3>
            <p className="text-xs text-slate-500">Are you sure you want to delete <strong>{confirmModal.title}</strong>? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setConfirmModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer">Delete Property</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;
