import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Phone, ArrowRight, Building2, Search, Mail, MessageCircle, Sparkles } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { getImageUrl } from '../utils/imageUrl';

/* ─── Production Ready Clean Broker Card (Real Data Only) ─────────────────── */
const BrokerCard = ({ broker, onClick }) => {
    const { t } = useLanguage();
    const listingsCount = broker.listingsCount ?? 0;
    const phone = broker.phone || '';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25 }}
            onClick={onClick}
            className="group bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer font-['Nunito_Sans',sans-serif]"
        >
            <div>
                {/* Header: Avatar + Full Name */}
                <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#1a2340] text-[#c9a84c] flex items-center justify-center font-black text-xl shadow-md uppercase shrink-0 overflow-hidden">
                        {broker.profileImage ? (
                            <img src={getImageUrl(broker.profileImage)} alt={broker.name} className="w-full h-full object-cover" />
                        ) : (
                            broker.name?.charAt(0) || 'B'
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                            {broker.name || 'Authorized Broker'}
                        </h3>
                        <p className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-0.5">
                            <Building2 size={13} className="shrink-0" />
                            <span>{broker.role || 'Real Estate Broker'}</span>
                        </p>
                    </div>
                </div>

                {/* Real Stats Box */}
                <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{t('brokers.active_plots')}</span>
                    <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                        {listingsCount} {listingsCount === 1 ? 'Plot' : 'Plots'}
                    </span>
                </div>
            </div>

            {/* Aligned Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
                {phone ? (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(`tel:${phone}`);
                            }}
                            className="w-full px-3 py-2 border border-slate-200 hover:border-blue-600 text-slate-700 hover:text-blue-600 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                        >
                            <Phone size={13} />
                            <span>{t('brokers.call')}</span>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://wa.me/${phone}`, '_blank');
                            }}
                            className="w-full px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <MessageCircle size={13} className="fill-emerald-600 text-emerald-600" />
                            <span>{t('brokers.whatsapp')}</span>
                        </button>
                    </div>
                ) : (
                    <div className="text-[11px] font-semibold text-slate-400 text-center py-1">
                        Direct inquiry on profile
                    </div>
                )}

                <button
                    onClick={onClick}
                    className="w-full px-4 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                    <span>{t('brokers.view_listings')} ({listingsCount})</span>
                    <ArrowRight size={14} />
                </button>
            </div>
        </motion.div>
    );
};

/* ─── Loading Skeleton ────────────────────────────────────────────────────── */
const BrokerSkeleton = () => (
    <div className="animate-pulse bg-white border border-slate-200 rounded-2xl p-5 h-[240px] flex flex-col justify-between">
        <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
        </div>
        <div className="h-10 bg-slate-100 rounded-xl" />
        <div className="h-10 bg-slate-100 rounded-xl" />
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const Brokers = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
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
    
    // Filter brokers cleanly
    const filteredBrokers = brokers.filter(b => (
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.role?.toLowerCase().includes(searchQuery.toLowerCase())
    ));

    return (
        <div className="min-h-screen bg-slate-100/70 font-['Nunito_Sans',sans-serif] pb-16">
            <SEO
                title={`${t('brokers.title')} | Kharsan Properties`}
                description={t('brokers.desc')}
            />

            {/* Dark Header Banner for Strong Color Contrast */}
            <div className="bg-[#1a2340] text-white pt-10 pb-16 border-b border-slate-800 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-black uppercase tracking-wider mb-3 border border-blue-400/20">
                        <Sparkles size={13} className="text-amber-400" />
                        <span>{t('brokers.directory')}</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                        {t('brokers.title')}
                    </h1>

                    <p className="text-xs sm:text-base font-semibold text-slate-300 mt-2 max-w-2xl mx-auto leading-relaxed">
                        {t('brokers.desc')}
                    </p>
                </div>
            </div>

            {/* Floating Search Bar */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-7 relative z-10 mb-8">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2.5 flex items-center gap-3">
                    <Search size={18} className="text-slate-400 ml-3 shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('brokers.search_placeholder')}
                        className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-extrabold text-slate-800 placeholder:text-slate-400 py-1"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors mr-1 cursor-pointer"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Result Count Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
                        {isLoading ? 'Loading Brokers...' : `${filteredBrokers.length} Brokers Available`}
                    </h2>
                </div>

                {/* Broker Cards Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <BrokerSkeleton key={i} />)}
                    </div>
                ) : isError ? (
                    <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />
                ) : filteredBrokers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredBrokers.map(broker => (
                            <BrokerCard
                                key={broker._id}
                                broker={broker}
                                onClick={() => navigate(`/seller/${broker._id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        onAction={() => setSearchQuery('')}
                        actionText="Clear Search"
                        title="No Brokers Found"
                        message="Try clearing your search query to see all registered brokers."
                    />
                )}
            </div>
        </div>
    );
};

export default Brokers;