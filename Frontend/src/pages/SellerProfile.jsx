import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Phone, Mail, Calendar, CheckCircle2, ArrowLeft, Users, Eye, Image, Building2, Award, Heart } from 'lucide-react';
import ListingSkeleton from '../components/ListingSkeleton';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { getImageUrl } from '../utils/imageUrl';

/* ─── Listing Card ────────────────────────────────────────────────────────── */
const ListingCard = ({ listing }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(`/listings/${listing._id}`)}
            className="bg-white border border-[#e2d9c5] hover:border-[#c9a84c] rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg group"
            style={{ display: 'flex', minHeight: 200 }}
        >
            {/* Image */}
            <div className="relative flex-shrink-0 overflow-hidden bg-[#e5e7eb]" style={{ width: 260 }}>
                {listing.images?.length > 0 ? (
                    <img
                        src={getImageUrl(listing.images[0])}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#9ca3af] text-xs font-bold uppercase tracking-widest">
                        No Image
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                    {listing.isTokened && (
                        <span className="bg-[#dc2626] text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                            Reserved
                        </span>
                    )}
                    {listing.listingType === 'Verified' && (
                        <span className="bg-[#0f4c35] text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                            ✓ Verified
                        </span>
                    )}
                    <span className="bg-[#1a2340] text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        Zero Brokerage
                    </span>
                </div>

                {/* Bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                    <p className="text-white text-[10px] font-600">
                        Listed · <strong>{new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between p-5 relative">
                {/* New Listing ribbon */}
                {!listing.isTokened && (
                    <div
                        className="absolute top-0 right-0 bg-[#2563eb] text-white text-[9px] font-bold px-3 py-1 uppercase tracking-widest"
                        style={{ clipPath: 'polygon(10px 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                    >
                        Active Listing
                    </div>
                )}

                <div>
                    {/* Title */}
                    <h3
                        className="text-lg font-bold text-[#1a2340] group-hover:text-[#c9a84c] transition-colors leading-tight mb-1 pr-20"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        {listing.title}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-sm text-[#6b7280] font-600 mb-3">
                        <strong className="text-[#1a2340]">{listing.propertyType || 'Plot / Land'}</strong> in {listing.location}
                    </p>

                    {/* Price + Area boxes */}
                    <div className="flex mb-3" style={{ border: '1px solid #e2d9c5', borderRadius: 8, width: 'fit-content', overflow: 'hidden' }}>
                        <div className="px-4 py-2" style={{ borderRight: '1px solid #e2d9c5' }}>
                            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-0.5">Area</div>
                            <div className="text-sm font-black text-[#1a2340]">{listing.area || '—'}</div>
                        </div>
                        <div className="px-4 py-2">
                            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-0.5">Total Price</div>
                            <div className="text-lg font-black text-[#1a2340]">₹{listing.price?.toLocaleString('en-IN')}</div>
                        </div>
                    </div>

                    {/* Location */}
                    <p className="flex items-center gap-1.5 text-xs text-[#6b7280] font-600 mb-3">
                        <MapPin size={12} className="text-[#c9a84c]" /> {listing.location}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#dc2626] bg-[#fff0f0] border border-[#fecaca] px-2 py-1 rounded">
                            <Users size={9} /> {listing.contacts || 0}+ Showings
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#1d4ed8] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-1 rounded">
                            <Eye size={9} /> {listing.views || 0} Views
                        </span>
                        {listing.listingType === 'Verified' && (
                            <span className="text-[10px] font-bold text-[#15803d] bg-[#f0fdf4] border border-[#bbf7d0] px-2 py-1 rounded">
                                ✓ Document Verified
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#f0ebe0] mt-3">
                    <div className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider">
                        Listed {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <Link
                        to={`/listings/${listing._id}`}
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#c9a84c] hover:bg-[#b8933a] text-[#1a1200] rounded-lg text-xs font-bold transition-all uppercase tracking-wider"
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
            const res = await axios.get(`/api/listings/seller/${id}`);
            return res.data.data;
        }
    });

    /* ── Loading State ── */
    if (isLoading) return (
        <div className="min-h-screen bg-[#f8f5ee]">
            <div className="h-1 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <div className="bg-white border border-[#e2d9c5] rounded-xl p-8 mb-8 animate-pulse">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-20 h-20 bg-[#f0ebe0] rounded-xl flex-shrink-0" />
                        <div className="space-y-3 flex-1">
                            <div className="h-7 bg-[#f0ebe0] rounded w-1/2" />
                            <div className="h-4 bg-[#f0ebe0] rounded w-1/3" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[1,2,3,4].map(i => <div key={i} className="h-16 bg-[#f0ebe0] rounded-lg" />)}
                    </div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <ListingSkeleton key={i} variant="list" />)}
                </div>
            </div>
        </div>
    );

    if (isError) return <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />;

    if (!profile) return (
        <div className="py-20">
            <EmptyState
                actionText="Back to Listings"
                actionLink="/search"
                title="Seller Not Found"
                message="We couldn't find the seller profile you're looking for. It may have been removed or deactivated."
            />
        </div>
    );

    const { user, activeListings, reservedListings } = profile;

    return (
        <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            {/* Gold top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

            {/* Back nav */}
            <div className="bg-white border-b border-[#e2d9c5] sticky top-[68px] z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm font-bold text-[#1a2340] hover:text-[#c9a84c] transition-colors"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Profile Header Card ── */}
                <div className="bg-white border border-[#e2d9c5] rounded-xl shadow-sm mb-8 overflow-hidden">
                    {/* Gold accent top strip on card */}
                    <div className="h-1 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-xl bg-[#1a2340] flex items-center justify-center text-[#c9a84c] font-black text-3xl flex-shrink-0 shadow-md">
                                {user.name?.charAt(0)}
                            </div>

                            {/* Name + badges */}
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                                    <h1
                                        className="text-2xl sm:text-3xl font-bold text-[#1a2340]"
                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                    >
                                        {user.name}
                                    </h1>
                                    <span className="bg-[#1a2340] text-[#c9a84c] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                        {user.role}
                                    </span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[#15803d]">
                                    <CheckCircle2 size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Verified Partner</span>
                                </div>
                            </div>

                            {/* Stats pills */}
                            <div className="flex gap-4">
                                <div className="text-center bg-[#fdfaf5] border border-[#e2d9c5] rounded-lg px-5 py-3">
                                    <div className="text-2xl font-black text-[#1a2340]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {activeListings.length}
                                    </div>
                                    <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest">Active</div>
                                </div>
                                <div className="text-center bg-[#fdfaf5] border border-[#e2d9c5] rounded-lg px-5 py-3">
                                    <div className="text-2xl font-black text-[#dc2626]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {reservedListings.length}
                                    </div>
                                    <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest">Reserved</div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { icon: Mail,         label: 'Email',          value: user.email,                           color: 'text-[#2563eb]' },
                                { icon: Phone,        label: 'Phone',          value: user.phone || 'Contact Private',       color: 'text-[#15803d]' },
                                { icon: Calendar,     label: 'Member Since',   value: new Date(user.createdAt).getFullYear(), color: 'text-[#c9a84c]' },
                                { icon: Award,        label: 'Status',         value: 'Verified Partner',                    color: 'text-[#15803d]' },
                            ].map(({ icon: Icon, label, value, color }) => (
                                <div key={label} className="flex items-center gap-3 bg-[#fdfaf5] border border-[#e2d9c5] rounded-lg p-3">
                                    <div className="w-8 h-8 bg-[#1a2340] rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Icon size={14} className="text-[#c9a84c]" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest">{label}</div>
                                        <div className={`text-xs font-bold ${color} truncate`}>{value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Active Listings ── */}
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e2d9c5]">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#15803d] inline-block" />
                                <h2
                                    className="text-xl font-bold text-[#1a2340]"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    Available Inventory
                                </h2>
                            </div>
                            <p className="text-sm text-[#6b7280] font-600">Current non-reserved properties listed by this partner.</p>
                        </div>
                        <div className="text-right bg-[#fdfaf5] border border-[#e2d9c5] rounded-lg px-4 py-2">
                            <div className="text-xl font-black text-[#1a2340]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                {activeListings.length}
                            </div>
                            <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest">Active Plots</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {activeListings.length > 0 ? (
                            activeListings.map(listing => <ListingCard key={listing._id} listing={listing} />)
                        ) : (
                            <div className="py-14 text-center border-2 border-dashed border-[#e2d9c5] rounded-xl text-[#b0a898] font-bold uppercase tracking-widest text-sm bg-white">
                                No active inventory at the moment.
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Reserved Listings ── */}
                <section>
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e2d9c5]">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] inline-block" />
                                <h2
                                    className="text-xl font-bold text-[#1a2340]"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    Past Success & Reserved
                                </h2>
                            </div>
                            <p className="text-sm text-[#6b7280] font-600">Plots successfully reserved and tokened by other buyers.</p>
                        </div>
                        <div className="text-right bg-[#fdfaf5] border border-[#e2d9c5] rounded-lg px-4 py-2">
                            <div className="text-xl font-black text-[#dc2626]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                {reservedListings.length}
                            </div>
                            <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest">Tokened Plots</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {reservedListings.length > 0 ? (
                            reservedListings.map(listing => <ListingCard key={listing._id} listing={listing} />)
                        ) : (
                            <div className="py-14 text-center border-2 border-dashed border-[#e2d9c5] rounded-xl text-[#b0a898] font-bold uppercase tracking-widest text-sm bg-white">
                                No reserved properties to show.
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
};

export default SellerProfile;