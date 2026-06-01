import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, MapPin, Phone, CheckCircle2, ArrowRight, Building2, Award, Search, Filter, ShieldCheck, Mail, ChevronRight } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

/* ─── Broker Card ─────────────────────────────────────────────────────────── */
const BrokerCard = ({ broker, onClick }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onClick}
        className="group relative bg-white border border-[#e2d9c5] hover:border-[#c9a84c] rounded-2xl p-6 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(201,168,76,0.12)] shadow-sm flex flex-col overflow-hidden cursor-pointer"
    >
        {/* Subtle background pattern */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a84c]/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
        
        {/* Header: Avatar & Status */}
        <div className="flex items-start justify-between mb-6 relative z-10">
            <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[#1a2340] flex items-center justify-center text-[#c9a84c] font-black text-2xl shadow-lg ring-4 ring-[#f8f5ee] group-hover:scale-110 transition-transform duration-500">
                    {broker.name?.charAt(0)?.toUpperCase() || 'B'}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-md border border-[#f8f5ee]">
                    <ShieldCheck size={14} className="text-[#15803d]" />
                </div>
            </div>
            
            <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-[#15803d] bg-[#15803d]/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-[#15803d]/20">
                    Verified
                </span>
                <span className="mt-2 text-[9px] font-bold text-[#1a2340]/40 uppercase tracking-tighter">ID: #{broker._id.slice(-6)}</span>
            </div>
        </div>

        {/* Content */}
        <div className="relative z-10 mb-6">
            <h3 className="text-xl font-extrabold text-[#1a2340] group-hover:text-[#c9a84c] transition-colors mb-1 truncate leading-tight">
                {broker.name}
            </h3>
            <p className="text-xs font-bold text-[#1a2340]/40 uppercase tracking-widest flex items-center gap-1.5">
                <Building2 size={12} className="text-[#c9a84c]" /> {broker.role || 'Partner'}
            </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
            <div className="bg-[#fdfaf5] border border-[#e2d9c5] rounded-xl p-4 transition-colors group-hover:bg-[#fcf8ed]">
                <div className="text-2xl font-black text-[#1a2340] leading-none mb-1">
                    {broker.listingsCount ?? 0}
                </div>
                <div className="text-[8px] font-black text-[#1a2340]/40 uppercase tracking-widest">Active Plots</div>
            </div>
            <div className="bg-[#fdfaf5] border border-[#e2d9c5] rounded-xl p-4 flex flex-col items-center justify-center">
                {broker.phone ? (
                    <div className="flex flex-col items-center">
                        <Phone size={16} className="text-[#c9a84c] mb-1.5" />
                        <span className="text-[8px] font-black text-[#1a2340]/40 uppercase tracking-widest">Contact On</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Mail size={16} className="text-[#d1c9b8] mb-1.5" />
                        <span className="text-[8px] font-black text-[#d1c9b8] uppercase tracking-widest">Email Only</span>
                    </div>
                )}
            </div>
        </div>

        {/* Footer Action */}
        <div className="mt-auto pt-4 border-t border-[#f8f5ee] flex items-center justify-between group-hover:border-[#c9a84c]/20 transition-colors">
            <span className="text-[10px] font-black text-[#1a2340] uppercase tracking-widest">Full Inventory</span>
            <div className="w-8 h-8 rounded-lg bg-[#1a2340] flex items-center justify-center text-[#c9a84c] group-hover:translate-x-1 transition-transform shadow-lg">
                <ArrowRight size={14} />
            </div>
        </div>
    </motion.div>
);

/* ─── Loading Skeleton ────────────────────────────────────────────────────── */
const BrokerSkeleton = () => (
    <div className="animate-pulse bg-white border border-[#e2d9c5] rounded-2xl p-6 h-[320px]">
        <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 bg-[#f0ebe0] rounded-2xl" />
            <div className="w-16 h-6 bg-[#f0ebe0] rounded-full" />
        </div>
        <div className="space-y-3 mb-6">
            <div className="h-6 bg-[#f0ebe0] rounded w-3/4" />
            <div className="h-4 bg-[#f0ebe0] rounded w-1/2" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="h-20 bg-[#f0ebe0] rounded-xl" />
            <div className="h-20 bg-[#f0ebe0] rounded-xl" />
        </div>
        <div className="h-8 bg-[#f0ebe0] rounded-xl" />
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const Brokers = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

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
    const filteredBrokers = brokers.filter(b => 
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#fcfaf5]" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
            <SEO 
                title="Verified Real Estate Brokers & Agents" 
                description="Connect with authorized real estate agents and land brokers who can assist with physical site visits and registry verification." 
            />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito+Sans:wght@400;600;700;800;900&display=swap');
                .premium-text { font-family: 'Playfair Display', serif; }
            `}</style>

            {/* Premium Navigation Strip */}
            <div className="bg-[#1a2340] border-b border-[#c9a84c]/20 py-3 sticky top-[80px] z-30 shadow-sm px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#c9a84c] text-[10px] font-black uppercase tracking-[0.3em]">
                        <Users size={12} /> Our Network <ChevronRight size={10} /> Verified Partners
                    </div>
                    <div className="hidden md:block text-white/40 text-[10px] font-bold uppercase tracking-widest italic">
                        "Curated Real Estate Professionals"
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">

                {/* ── Page Header ── */}
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <motion.span 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-block bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#b8933a] text-[11px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 shadow-sm"
                    >
                        Verified Ecosystem
                    </motion.span>
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-6xl font-black text-[#1a2340] mb-6 premium-text tracking-tight"
                    >
                        Connect with <span className="text-[#c9a84c]">Elite Brokers</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-[#1a2340]/60 text-base sm:text-xl font-medium leading-relaxed"
                    >
                        Access our hand-picked network of real estate consultants. Transparent inventory, verified track records, and direct professional access.
                    </motion.p>
                </div>

                {/* ── Search & Stats Control ── */}
                <div className="flex flex-col lg:flex-row items-stretch gap-6 mb-12">
                    {/* Search Field */}
                    <div className="flex-1 relative group h-full">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#c9a84c] group-focus-within:scale-110 transition-transform duration-300">
                            <Search size={20} />
                        </div>
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by broker name or location..."
                            className="w-full h-full min-h-[80px] pl-16 pr-6 bg-white border border-[#e2d9c5] rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-[#c9a84c]/10 focus:border-[#c9a84c] transition-all text-[#1a2340] font-bold text-lg placeholder:text-[#1a2340]/20"
                        />
                    </div>

                    {/* Stats Dashboard */}
                    {!isLoading && (
                        <div className="bg-[#1a2340] rounded-2xl px-10 py-4 flex items-center justify-around gap-10 shadow-xl border border-[#c9a84c]/20 min-h-[80px]">
                            <div className="text-center">
                                <div className="text-2xl font-black text-[#c9a84c] leading-none mb-1">{brokers.length}</div>
                                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Partners</div>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="text-center">
                                <div className="text-2xl font-black text-[#c9a84c] leading-none mb-1">
                                    {brokers.reduce((s, b) => s + (b.listingsCount ?? 0), 0)}
                                </div>
                                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Total Plots</div>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="text-center">
                                <div className="text-2xl font-black text-[#c9a84c] leading-none mb-1">100%</div>
                                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Verified</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Content ── */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <BrokerSkeleton key={i} />)}
                    </div>
                ) : isError ? (
                    <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />
                ) : filteredBrokers.length > 0 ? (
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.1 }
                            }
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredBrokers.map(broker => (
                            <BrokerCard
                                key={broker._id}
                                broker={broker}
                                onClick={() => navigate(`/seller/${broker._id}`)}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <EmptyState
                        title={searchQuery ? "No Matches Found" : "Building Our Network"}
                        message={searchQuery ? "We couldn't find any brokers matching your search criteria. Try a different name." : "Our verified partner network is currently expanding. Please check back shortly."}
                        actionText="Clear Search"
                        onAction={() => setSearchQuery('')}
                    />
                )}
            </div>

            {/* Bottom Accent */}
            <div className="h-2 w-full bg-gradient-to-r from-[#1a2340] via-[#c9a84c] to-[#1a2340]" />
        </div>
    );
};

export default Brokers;