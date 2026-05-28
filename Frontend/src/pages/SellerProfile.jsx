import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Phone, Mail, Calendar, CheckCircle2, ArrowLeft, Users, Eye, Image, Building2, Award, Heart, Share2, Copy, Layers, LandPlot, UserCheck, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import ListingSkeleton from '../components/ListingSkeleton';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { getImageUrl } from '../utils/imageUrl';

// Define axios inside the component context or import
const axiosObj = axios;

/* ─── Listing Card ────────────────────────────────────────────────────────── */
const ListingCard = ({ listing }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(`/listings/${listing._id}`)}
            className="bg-white border border-slate-100 hover:border-[#c9a84c] rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md group flex flex-col sm:flex-row min-h-fit sm:min-h-[200px]"
        >
            {/* Image */}
            <div className="relative flex-shrink-0 overflow-hidden bg-slate-100 w-full sm:w-[240px] md:w-[260px] aspect-video sm:aspect-auto">
                {listing.images?.length > 0 ? (
                    <img
                        src={getImageUrl(listing.images[0])}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full min-h-[140px] flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-50">
                        No Image
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    {listing.isTokened && (
                        <span className="bg-rose-600 text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs">
                            Reserved
                        </span>
                    )}
                    {listing.listingType === 'Verified' && (
                        <span className="bg-emerald-700 text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs">
                            ✓ Verified
                        </span>
                    )}
                    <span className="bg-slate-950 text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs">
                        Zero Brokerage
                    </span>
                </div>

                {/* Bottom overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent px-4 py-3 flex items-end">
                    <p className="text-white/90 text-[10px] font-bold tracking-wide">
                        Listed · <strong>{new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong>
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between p-5 sm:p-6 relative">
                {/* Active Listing ribbon */}
                {!listing.isTokened && (
                    <div
                        className="absolute top-0 right-0 bg-[#2563eb] text-white text-[9px] font-black px-3.5 py-1.5 uppercase tracking-widest rounded-bl-xl shadow-xs"
                    >
                        Active Plot
                    </div>
                )}

                <div className="space-y-2 mt-2 sm:mt-0">
                    {/* Title */}
                    <h3
                        className="text-lg font-extrabold text-slate-900 group-hover:text-[#c9a84c] transition-colors leading-tight pr-16"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        {listing.title}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        <span className="text-[#c9a84c] font-black">{listing.propertyType || 'Plot / Land'}</span> in {listing.location}
                    </p>

                    {/* Price + Area boxes */}
                    <div className="flex bg-slate-50 border border-slate-100 rounded-xl overflow-hidden w-fit mt-3 shadow-2xs">
                        <div className="px-4 py-2 border-r border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Plot Size</span>
                            <span className="text-xs font-black text-slate-950 block">{listing.area || '—'}</span>
                        </div>
                        <div className="px-5 py-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Total Valuation</span>
                            <span className="text-sm font-black text-slate-950 block">₹{listing.price?.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-2 flex-wrap pt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-100/50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            <Users size={10} /> {listing.contacts || 0}+ Showings
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100/50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            <Eye size={10} /> {listing.views || 0} Views
                        </span>
                        {listing.listingType === 'Verified' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                ✓ Verified Docs
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                    <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                        Ref ID: {listing._id?.substring(18)}
                    </div>
                    <Link
                        to={`/listings/${listing._id}`}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-slate-950 hover:bg-[#c9a84c] text-white hover:text-slate-950 rounded-xl text-xs font-black transition-all uppercase tracking-widest shadow-xs"
                    >
                        View Details →
                    </Link>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
const SellerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const {
        data: profile,
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ['sellerProfile', id],
        queryFn: async () => {
            // Clean ID in case text was appended to the URL (e.g. from shared links)
            const cleanId = id.split(/[\s%]/)[0];
            const res = await axiosObj.get(`/api/listings/seller/${cleanId}`);
            return res.data.data;
        }
    });

    /* ── Loading State ── */
    if (isLoading) return (
        <div className="min-h-screen bg-[#FAF9F6]">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c] shadow-xs" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-8 animate-pulse shadow-xs">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex-shrink-0" />
                        <div className="space-y-3 flex-1">
                            <div className="h-6 bg-slate-100 rounded w-1/2" />
                            <div className="h-4 bg-slate-100 rounded w-1/3" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
                    </div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="bg-white border border-slate-100 h-48 rounded-3xl animate-pulse" />)}
                </div>
            </div>
        </div>
    );

    if (isError) return <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />;

    if (!profile) return (
        <div className="py-20 bg-[#FAF9F6] min-h-screen flex items-center justify-center">
            <EmptyState
                actionText="Back to Listings"
                actionLink="/search"
                title="Profile Unrecognized"
                message="This partner account or broker profile could not be retrieved. It may have been relocated or deactivated."
            />
        </div>
    );

    const { user, activeListings, reservedListings } = profile;

    const handleShare = async () => {
        const profileUrl = `${window.location.origin}/seller/${user._id || user.id}`;
        const shareData = {
            title: `${user.name} - Chaudhary Saumya Properties Partner`,
            url: profileUrl
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(profileUrl);
                toast.success('Partner Profile URL copied to clipboard');
            }
        } catch (err) {
            console.error('Error sharing profile:', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-slate-800" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Nunito+Sans:wght@300;400;500;600;700;800;900&display=swap');`}</style>

            {/* Elegant Luxury Top Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c] shadow-xs" />

            {/* Back Nav */}
            <div className="bg-white border-b border-slate-100 sticky top-[80px] z-20 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-[#c9a84c] transition-all py-1 px-2.5 rounded-lg hover:bg-slate-50"
                    >
                        <ArrowLeft size={16} /> Back to Directory
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── Profile Header Card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm mb-8 overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-2xl bg-slate-950 flex items-center justify-center text-[#c9a84c] font-black text-3xl shrink-0 shadow-md">
                                {user.name?.charAt(0)}
                            </div>

                            {/* Name + badges */}
                            <div className="flex-1 text-center md:text-left space-y-2.5">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <h1
                                        className="text-2xl sm:text-3xl font-extrabold text-slate-950 leading-tight"
                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                    >
                                        {user.name}
                                    </h1>
                                    <span className="bg-slate-950 text-[#c9a84c] text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-2xs">
                                        {user.role || 'Partner'}
                                    </span>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                                    <div className="flex items-center gap-1.5 text-emerald-700">
                                        <CheckCircle2 size={14} className="stroke-[2.5px]" />
                                        <span className="text-xs font-black uppercase tracking-wider">Verified Business Partner</span>
                                    </div>
                                    <span className="text-slate-300 hidden sm:inline">|</span>
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200"
                                    >
                                        <Share2 size={12} className="text-[#c9a84c]" /> Share Partner Card
                                    </button>
                                </div>
                            </div>

                            {/* Inventory Metrics display */}
                            <div className="flex gap-4 self-center md:self-start">
                                <div className="text-center bg-[#FAF9F6] border border-slate-100 rounded-2xl px-6 py-4 shadow-2xs">
                                    <div className="text-3xl font-black text-slate-950" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {activeListings.length}
                                    </div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Active Plots</div>
                                </div>
                                <div className="text-center bg-[#FAF9F6] border border-slate-100 rounded-2xl px-6 py-4 shadow-2xs">
                                    <div className="text-3xl font-black text-rose-600" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {reservedListings.length}
                                    </div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Reserved Plots</div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info row (Clickable tel / mail actions) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { icon: Mail, label: 'Email', value: user.email, sub: 'Direct Inbox', link: `mailto:${user.email}`, color: 'text-blue-600 hover:underline' },
                                { icon: Phone, label: 'Phone Call', value: user.phone || 'Contact Private', sub: 'Mobile Terminal', link: user.phone ? `tel:${user.phone}` : null, color: 'text-emerald-700 hover:underline' },
                                { icon: Calendar, label: 'Partnership Since', value: new Date(user.createdAt).getFullYear(), sub: 'Verified Partner Log', link: null, color: 'text-[#c9a84c]' },
                                { icon: Award, label: 'Trust Status', value: 'Highly Rated', sub: 'Verified Partner Profile', link: null, color: 'text-emerald-750' },
                            ].map(({ icon: Icon, label, value, sub, link, color }) => {
                                const CardContent = () => (
                                    <>
                                        <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                                            <Icon size={16} className="text-[#c9a84c]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                                            <span className={`block text-xs font-black ${color} truncate mt-0.5`}>{value}</span>
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{sub}</span>
                                        </div>
                                    </>
                                );

                                return link ? (
                                    <a key={label} href={link} className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl p-4 transition-all shadow-2xs">
                                        <CardContent />
                                    </a>
                                ) : (
                                    <div key={label} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-2xs">
                                        <CardContent />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Active Listings ── */}
                <section className="mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-sm" />
                                <h2
                                    className="text-xl font-bold text-slate-950"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    Available Land Inventory
                                </h2>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current active plots cataloged by this partner.</p>
                        </div>
                        <div className="text-right bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 shrink-0 self-start sm:self-center shadow-2xs">
                            <span className="text-2xl font-black text-slate-950 block leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                {activeListings.length}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Plots Available</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {activeListings.length > 0 ? (
                            activeListings.map(listing => <ListingCard key={listing._id} listing={listing} />)
                        ) : (
                            <div className="py-14 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-xs bg-white shadow-2xs">
                                No active listings currently matching available inventories.
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Reserved Listings ── */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shadow-sm" />
                                <h2
                                    className="text-xl font-bold text-slate-950"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    Successful Sales & Reservations
                                </h2>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plots booked or reserved via token reservation gateways.</p>
                        </div>
                        <div className="text-right bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 shrink-0 self-start sm:self-center shadow-2xs">
                            <span className="text-2xl font-black text-rose-600 block leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                {reservedListings.length}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Plots Tokened</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {reservedListings.length > 0 ? (
                            reservedListings.map(listing => <ListingCard key={listing._id} listing={listing} />)
                        ) : (
                            <div className="py-14 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-xs bg-white shadow-2xs">
                                No reserved properties currently archived.
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
};

export default SellerProfile;