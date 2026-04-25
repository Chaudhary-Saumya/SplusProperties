import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Calendar, ArrowLeft, MapPin, Phone, Building2, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

const MyVisits = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                const res = await axios.get('/api/inquiries');
                const data = res.data.data || [];
                const sent = data.filter(inq => (inq.userId?._id || inq.userId) === (user?.id || user?._id));
                setInquiries(sent);
            } catch (err) {
                console.error('Error fetching inquiries', err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchInquiries();
    }, [user]);

    // ── Status style helper ──────────────────────────────────────
    const statusStyle = (status) => {
        if (status === 'Resolved')  return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
        if (status === 'Contacted') return { dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-100' };
        return                             { dot: 'bg-[#c9a84c]',   badge: 'bg-[#c9a84c]/10 text-[#1a2340] border-[#c9a84c]/30' };
    };

    // ── Loading state ────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-[#f8f5ee]">
            <div className="bg-[#1a2340] px-6 py-10 md:px-16">
                <div className="max-w-7xl mx-auto animate-pulse">
                    <div className="h-3 w-36 bg-white/10 rounded-full mb-4"></div>
                    <div className="h-9 w-64 bg-white/10 rounded-xl mb-2"></div>
                    <div className="h-3 w-48 bg-white/10 rounded-full"></div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-5">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-[#1a2340]/10 p-6 flex gap-5 animate-pulse">
                        <div className="w-20 h-20 bg-[#f8f5ee] rounded-xl shrink-0"></div>
                        <div className="flex-1 space-y-3">
                            <div className="h-5 bg-[#f8f5ee] rounded-lg w-1/3"></div>
                            <div className="h-3 bg-[#f8f5ee] rounded-lg w-1/4"></div>
                            <div className="h-3 bg-[#f8f5ee] rounded-lg w-1/2"></div>
                        </div>
                        <div className="w-28 h-9 bg-[#f8f5ee] rounded-xl shrink-0"></div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f5ee]">

            {/* ── Hero bar ── */}
            <div className="bg-[#1a2340] text-white px-6 py-10 md:px-16">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-[#c9a84c] text-xs font-bold uppercase tracking-[0.2em] mb-3">
                        <Building2 size={14} />
                        <span>Splus Properties</span>
                        <ChevronRight size={12} />
                        <span>Visit Requests</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all shrink-0"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                                    Visit <span className="text-[#c9a84c]">Requests</span>
                                </h1>
                                <p className="text-white/50 font-medium mt-1 text-sm">Monitor your property tour schedule and status</p>
                            </div>
                        </div>

                        {inquiries.length > 0 && (
                            <div className="flex items-center gap-2 bg-[#c9a84c]/15 border border-[#c9a84c]/30 px-4 py-2 rounded-xl w-fit">
                                <div className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse"></div>
                                <span className="text-sm font-black text-[#c9a84c] uppercase tracking-widest">
                                    {inquiries.length} Active {inquiries.length === 1 ? 'Request' : 'Requests'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {inquiries.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#1a2340]/10 shadow-sm text-center">
                        <div className="w-24 h-24 rounded-2xl bg-[#1a2340] flex items-center justify-center mb-6 shadow-lg">
                            <Calendar size={40} className="text-[#c9a84c]" />
                        </div>
                        <h2 className="text-2xl font-black text-[#1a2340] mb-2">No Requests Yet</h2>
                        <p className="text-[#1a2340]/50 max-w-md mx-auto mb-8 text-sm font-medium leading-relaxed">
                            Once you request a site visit for a property, it will appear here so you can track its status.
                        </p>
                        <button
                            onClick={() => navigate('/search')}
                            className="bg-[#1a2340] hover:bg-[#243060] text-[#c9a84c] px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg hover:-translate-y-0.5"
                        >
                            Explore Properties
                        </button>
                    </div>
                ) : (
                    /* Inquiry list */
                    <div className="space-y-4">
                        {inquiries.map(inq => {
                            const { dot, badge } = statusStyle(inq.status);
                            return (
                                <div
                                    key={inq._id}
                                    onClick={() => navigate(`/listings/${inq.listingId?._id}`)}
                                    className="bg-white rounded-2xl border border-[#1a2340]/10 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
                                >
                                    {/* Left — image + info */}
                                    <div className="flex items-center gap-5 flex-1 min-w-0">

                                        {/* Thumbnail */}
                                        <div className="hidden sm:block w-20 h-20 rounded-xl bg-[#f8f5ee] overflow-hidden border border-[#1a2340]/10 shrink-0">
                                            {inq.listingId?.images?.[0] ? (
                                                <img
                                                    src={getImageUrl(inq.listingId.images[0])}
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <MapPin size={24} className="text-[#c9a84c]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Text */}
                                        <div className="min-w-0">
                                            <h4 className="font-black text-[#1a2340] text-base mb-1.5 truncate group-hover:text-[#c9a84c] transition-colors">
                                                {inq.listingId?.title || 'Unknown Property'}
                                            </h4>
                                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-[#1a2340]/50">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-[#c9a84c]" />
                                                    Requested {new Date(inq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                {inq.listingId?.location && (
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin size={12} className="text-[#c9a84c]" />
                                                        {inq.listingId.location}
                                                    </span>
                                                )}
                                            </div>
                                            {inq.listingId?.createdBy && (
                                                <p className="text-[9px] font-black text-[#1a2340]/30 uppercase tracking-[0.15em] mt-2">
                                                    Owner: {inq.listingId.createdBy.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right — status + call */}
                                    <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-[#f8f5ee]">
                                        {/* Status badge */}
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs border uppercase tracking-widest ${badge}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${dot}`}></div>
                                            {inq.status}
                                        </div>

                                        {/* Call button (only when Contacted) */}
                                        {inq.status === 'Contacted' && inq.listingId?.createdBy?.phone && (
                                            <a
                                                href={`tel:${inq.listingId.createdBy.phone}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center gap-2 bg-[#1a2340] hover:bg-[#243060] text-[#c9a84c] px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md uppercase tracking-wider"
                                            >
                                                <Phone size={12} /> {inq.listingId.createdBy.phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyVisits;