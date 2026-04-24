import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, MapPin, Phone, CheckCircle2, ArrowRight, Building2, Award } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';
import ListingSkeleton from '../components/ListingSkeleton';
import { useQuery } from '@tanstack/react-query';

/* ─── Broker Card ─────────────────────────────────────────────────────────── */
const BrokerCard = ({ broker, onClick }) => (
    <div
        onClick={onClick}
        className="group cursor-pointer bg-white border border-[#e2d9c5] hover:border-[#c9a84c] rounded-xl p-6 transition-all duration-300 hover:shadow-xl shadow-sm flex flex-col"
    >
        {/* Top Row: Avatar + Verified badge */}
        <div className="flex items-start gap-4 mb-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-[#1a2340] flex items-center justify-center text-[#c9a84c] font-black text-2xl flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
                {broker.name?.charAt(0)?.toUpperCase() || 'B'}
            </div>

            {/* Name + Badge */}
            <div className="flex-1 min-w-0">
                <h3
                    className="text-lg font-bold text-[#1a2340] group-hover:text-[#c9a84c] transition-colors mb-1.5 truncate"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    {broker.name}
                </h3>
                <div className="inline-flex items-center gap-1.5 bg-[#0f4c35] text-white text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest">
                    <CheckCircle2 size={10} /> Verified Broker
                </div>
            </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Active Listings */}
            <div className="bg-[#fdfaf5] border border-[#e2d9c5] rounded-lg p-3 text-center">
                <div
                    className="text-2xl font-black text-[#1a2340] mb-0.5"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    {broker.listingsCount ?? 0}
                </div>
                <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest">Active Listings</div>
            </div>

            {/* Contact */}
            <div className="bg-[#fdfaf5] border border-[#e2d9c5] rounded-lg p-3 text-center flex flex-col items-center justify-center">
                {broker.phone ? (
                    <>
                        <Phone size={18} className="text-[#c9a84c] mb-1" />
                        <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest">Contact Ready</div>
                    </>
                ) : (
                    <>
                        <Building2 size={18} className="text-[#d1c9b8] mb-1" />
                        <div className="text-[9px] font-bold text-[#d1c9b8] uppercase tracking-widest">No Contact</div>
                    </>
                )}
            </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA Button */}
        <button className="w-full py-3 bg-[#1a2340] group-hover:bg-[#c9a84c] group-hover:text-[#1a1200] text-white font-bold text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2">
            View Profile & Inventory <ArrowRight size={14} />
        </button>
    </div>
);

/* ─── Loading Skeleton ────────────────────────────────────────────────────── */
const BrokerSkeleton = () => (
    <div className="animate-pulse bg-white border border-[#e2d9c5] rounded-xl p-6 h-[280px]">
        <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 bg-[#f0ebe0] rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
                <div className="h-5 bg-[#f0ebe0] rounded w-3/4" />
                <div className="h-4 bg-[#f0ebe0] rounded w-1/2" />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="h-16 bg-[#f0ebe0] rounded-lg" />
            <div className="h-16 bg-[#f0ebe0] rounded-lg" />
        </div>
        <div className="h-10 bg-[#f0ebe0] rounded-lg" />
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const Brokers = () => {
    const navigate = useNavigate();

    const {
        data: brokersData,
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ['brokers'],
        queryFn: async () => {
            const res = await axios.get('/api/users/brokers');
            return res.data.data;
        }
    });

    const brokers = brokersData || [];

    return (
        <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            {/* Gold top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

                {/* ── Page Header ── */}
                <div className="text-center mb-12">
                    <span className="inline-block bg-[#c9a84c]/15 border border-[#c9a84c]/40 text-[#b8933a] text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                        Our Network
                    </span>
                    <h1
                        className="text-4xl sm:text-5xl font-bold text-[#1a2340] mb-4"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Verified Brokers
                    </h1>
                    <p className="text-[#6b7280] text-base sm:text-lg font-500 max-w-xl mx-auto leading-relaxed">
                        Connect directly with top verified brokers. View their active inventory and track record.
                    </p>
                </div>

                {/* ── Stats Strip ── */}
                {!isLoading && brokers.length > 0 && (
                    <div className="bg-[#1a2340] rounded-xl px-6 py-5 mb-10 flex flex-wrap items-center justify-around gap-6">
                        {[
                            { icon: Award,    label: 'Verified Brokers',   value: brokers.length },
                            { icon: Building2, label: 'Total Listings',    value: brokers.reduce((s, b) => s + (b.listingsCount ?? 0), 0) },
                            { icon: Phone,    label: 'Contactable',         value: brokers.filter(b => b.phone).length },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#c9a84c]/20 border border-[#c9a84c]/30 flex items-center justify-center">
                                    <Icon size={16} className="text-[#c9a84c]" />
                                </div>
                                <div>
                                    <div className="text-xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</div>
                                    <div className="text-[10px] font-bold text-[#c9a84c]/70 uppercase tracking-widest">{label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Content ── */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {[1, 2, 3, 4].map(i => <BrokerSkeleton key={i} />)}
                    </div>
                ) : isError ? (
                    <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />
                ) : brokers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {brokers.map(broker => (
                            <BrokerCard
                                key={broker._id}
                                broker={broker}
                                onClick={() => navigate(`/seller/${broker._id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="No Brokers Found"
                        message="We're building our network of verified brokers. Check back soon or explore properties directly."
                        actionText="Browse Properties"
                        actionLink="/search"
                    />
                )}
            </div>
        </div>
    );
};

export default Brokers;