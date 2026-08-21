import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import {
  Users,
  Phone,
  CheckCircle2,
  Filter,
  MessageSquare,
  Building2,
  Search,
  ExternalLink
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../components/EmptyState";

const BuyerLeads = () => {
  const { user, loading } = useContext(AuthContext);
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: inquiriesData, isLoading: isInquiriesLoading } = useQuery({
    queryKey: ["buyerLeads", user?.id || user?._id],
    enabled: !!user,
    queryFn: async () => {
      const res = await axios.get("/api/inquiries");
      return res.data.data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const { data: directLeadsData, isLoading: isLeadsLoading } = useQuery({
    queryKey: ["directLeads", user?.id || user?._id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const res = await axios.get("/api/inquiries/seller-leads");
        return res.data.data;
      } catch {
        return [];
      }
    },
    refetchOnWindowFocus: true,
  });

  const isLoading = isInquiriesLoading || isLeadsLoading;
  const inquiries = inquiriesData || [];
  const directLeads = (directLeadsData || []).map(lead => ({
    _id: lead._id,
    userId: { name: lead.buyerName, phone: lead.buyerPhone },
    listingId: lead.listingId,
    status: lead.leadType === 'WhatsApp' ? 'WhatsApp Click' : 'Phone Call',
    createdAt: lead.createdAt,
    isDirectLead: true,
    leadType: lead.leadType
  }));

  const receivedInquiries = inquiries.filter(
    (inq) =>
      (inq.listingId?.createdBy?._id || inq.listingId?.createdBy) ===
      (user?.id || user?._id)
  );

  const allLeads = [...receivedInquiries, ...directLeads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


  const updateInquiryStatus = async (id, newStatus) => {
    try {
      await axios.patch(`/api/inquiries/${id}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["buyerLeads"] });
      toast.success(`Lead status updated to ${newStatus === 'Contacted' ? 'Connected' : 'Pending'}`);
    } catch {
      toast.error("Failed to update lead status");
    }
  };

  const filteredLeads = allLeads.filter((inq) => {
    const buyerName = inq.userId?.name || "";
    const buyerPhone = inq.userId?.phone || "";
    const propertyTitle = inq.listingId?.title || "";
    const matchesSearch =
      buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyerPhone.includes(searchTerm) ||
      propertyTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Pending" && inq.status === "Pending") ||
      (statusFilter === "Connected" && (inq.status === "Contacted" || inq.isDirectLead));

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
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600 text-white font-extrabold text-lg sm:text-xl rounded-2xl flex items-center justify-center shadow-lg shrink-0 border-2 border-slate-700">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">{t('buyer_leads.title')}</h1>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {receivedInquiries.length} {t('buyer_leads.inquiry_status')}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-medium mt-0.5">
                {t('buyer_leads.subtitle')}
              </p>
            </div>
          </div>
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
              placeholder="Search buyer name, phone, plot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Filter size={14} className="text-slate-400 shrink-0 hidden sm:inline" />
            {["All", "Pending", "Connected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st} ({st === "All" ? receivedInquiries.length : st === "Pending" ? receivedInquiries.filter((inq) => inq.status === "Pending").length : receivedInquiries.filter((inq) => inq.status === "Contacted").length})
              </button>
            ))}
          </div>
        </div>

        {/* Leads List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <EmptyState
            title={searchTerm ? "No Matching Leads" : "No Buyer Leads Received"}
            message={searchTerm ? "Try searching with a different buyer name or phone number." : "When buyers inquire about your properties, their details will appear here."}
          />
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((inq) => (
              <div key={inq._id} className="p-5 bg-white border border-slate-200 hover:border-blue-500 rounded-2xl shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 text-white font-extrabold text-lg rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
                    {inq.userId?.name?.[0]?.toUpperCase() || "B"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-slate-900 text-base">{inq.userId?.name}</h4>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        inq.status === 'Contacted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {inq.status === 'Contacted' ? 'Connected' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">📞 Phone: +91 {inq.userId?.phone || 'N/A'}</p>
                    {inq.listingId && (
                      <Link to={`/listings/${inq.listingId._id}`} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1">
                        <span>Property: {inq.listingId.title}</span>
                        <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                  <button
                    onClick={() => updateInquiryStatus(inq._id, inq.status === "Pending" ? "Contacted" : "Pending")}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={14} className={inq.status === 'Contacted' ? "text-emerald-600" : "text-slate-400"} />
                    <span>{inq.status === "Contacted" ? "Mark Pending" : "Mark Connected"}</span>
                  </button>

                  {inq.userId?.phone && (
                    <a
                      href={`https://wa.me/91${inq.userId.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                      title="WhatsApp Buyer"
                    >
                      <MessageSquare size={16} />
                    </a>
                  )}

                  {inq.userId?.phone && (
                    <a
                      href={`tel:${inq.userId.phone}`}
                      className="p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all shadow-xs"
                      title="Call Buyer"
                    >
                      <Phone size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default BuyerLeads;
