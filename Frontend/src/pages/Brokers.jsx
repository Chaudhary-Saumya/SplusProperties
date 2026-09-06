import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Search, Phone, MessageCircle, ArrowRight, ArrowLeft, Building2,
    MapPin, LandPlot, Sparkles, Grid, List, Users, User
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { getImageUrl } from '../utils/imageUrl';

/* ─── Production Avatar Component ───────────────────────────────────────── */
const BrokerAvatar = ({ profileImage, name, size = "large" }) => {
    const hasImage = Boolean(profileImage);
    const containerClasses = size === "large"
        ? "w-16 h-16 rounded-2xl"
        : "w-14 h-14 rounded-2xl";

    const iconSize = size === "large" ? 28 : 24;

    return (
        <div className={`${containerClasses} bg-slate-100 overflow-hidden shadow-xs shrink-0 border-2 border-white ring-4 ring-slate-100/80`}>
            {hasImage ? (
                <img
                    src={getImageUrl(profileImage)}
                    alt={name}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full bg-blue-50/90 flex items-center justify-center text-[#0078d4]">
                    <User size={iconSize} className="text-[#0078d4]" />
                </div>
            )}
        </div>
    );
};

/* ─── Premium Grid Card ─────────────────────────────────────────────────── */
const BrokerGridCard = ({ broker, onClick }) => {
    const { t, language } = useLanguage();
    const listingsCount = broker.listingsCount ?? 0;
    const phone = broker.phone || broker.mobileNumber || '';
    const name = broker.name || 'Authorized Broker';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className="group bg-white border border-slate-200/80 hover:border-[#0078d4]/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer font-['Nunito_Sans',sans-serif] relative overflow-hidden"
        >
            {/* Top Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#0078d4] via-indigo-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div>
                {/* Header Row: Left Avatar Icon, Right Name & Role */}
                <div className="flex items-center gap-4 mb-4">
                    <BrokerAvatar profileImage={broker.profileImage} name={name} size="large" />

                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-[#0078d4] transition-colors line-clamp-1">
                            {name}
                        </h3>

                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 line-clamp-1 mt-0.5">
                            <Building2 size={13} className="text-[#0078d4] shrink-0" />
                            <span>{broker.role || (language === 'en' ? 'Real Estate Agent' : 'રિયલ એસ્ટેટ બ્રોકર')}</span>
                        </p>

                        {broker.city && (
                            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 pt-0.5 line-clamp-1">
                                <MapPin size={13} className="text-slate-400 shrink-0" />
                                <span>{broker.city}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Active Plots Pill */}
                <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <LandPlot size={14} className="text-[#0078d4]" />
                        <span>Active Plots</span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${listingsCount > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        {listingsCount} {listingsCount === 1 ? 'Plot' : 'Plots'}
                    </span>
                </div>
            </div>

            {/* Bottom Contact & Action Buttons */}
            <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                {phone && (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(`tel:${phone}`);
                            }}
                            className="w-full py-2 px-3 border border-slate-200 hover:border-[#0078d4] text-slate-700 hover:text-[#0078d4] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                        >
                            <Phone size={13} className="text-[#0078d4]" />
                            <span>Call</span>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
                            }}
                            className="w-full py-2 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                            <MessageCircle size={13} className="fill-white" />
                            <span>WhatsApp</span>
                        </button>
                    </div>
                )}

                <button
                    type="button"
                    onClick={onClick}
                    className="w-full py-2.5 px-4 bg-[#0078d4] hover:bg-[#0066b8] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                    <span>View Listings ({listingsCount})</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
};

/* ─── List View Row ────────────────────────────────────────────────────────── */
const BrokerListRow = ({ broker, onClick }) => {
    const { language } = useLanguage();
    const listingsCount = broker.listingsCount ?? 0;
    const phone = broker.phone || broker.mobileNumber || '';
    const name = broker.name || 'Authorized Broker';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.005 }}
            onClick={onClick}
            className="group bg-white border border-slate-200/90 hover:border-[#0078d4]/60 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer font-['Nunito_Sans',sans-serif]"
        >
            <div className="flex items-center gap-4 min-w-0">
                <BrokerAvatar profileImage={broker.profileImage} name={name} size="small" />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#0078d4] transition-colors truncate">
                            {name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-700">
                            <Building2 size={13} className="text-[#0078d4]" />
                            {broker.role || (language === 'en' ? 'Real Estate Agent' : 'રિયલ એસ્ટેટ બ્રોકર')}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-[#0078d4] font-bold">
                            <LandPlot size={13} className="text-[#0078d4]" />
                            {listingsCount} {listingsCount === 1 ? 'Plot' : 'Plots'} Available
                        </span>
                        {broker.city && (
                            <>
                                <span>·</span>
                                <span className="flex items-center gap-1 text-slate-400">
                                    <MapPin size={12} />
                                    {broker.city}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 sm:self-center">
                {phone && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(`tel:${phone}`);
                            }}
                            className="p-2.5 border border-slate-200 hover:border-[#0078d4] text-slate-700 hover:text-[#0078d4] font-bold text-xs rounded-xl transition-all cursor-pointer bg-white"
                            title="Call Broker"
                        >
                            <Phone size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
                            }}
                            className="p-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl transition-all cursor-pointer shadow-xs"
                            title="WhatsApp Chat"
                        >
                            <MessageCircle size={15} className="fill-white" />
                        </button>
                    </>
                )}
                <button
                    type="button"
                    onClick={onClick}
                    className="px-4 py-2.5 bg-[#0078d4] hover:bg-[#0066b8] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                    <span>View Listings ({listingsCount})</span>
                    <ArrowRight size={14} />
                </button>
            </div>
        </motion.div>
    );
};

/* ─── Loading Skeleton ────────────────────────────────────────────────────── */
const BrokerSkeleton = () => (
    <div className="animate-pulse bg-white border border-slate-200 rounded-3xl p-6 h-64 flex flex-col justify-between">
        <div className="flex items-start justify-between">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl" />
            <div className="w-16 h-6 bg-slate-100 rounded-xl" />
        </div>
        <div className="space-y-2">
            <div className="h-5 bg-slate-100 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="h-10 bg-slate-100 rounded-xl" />
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const Brokers = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState('all');
    const [viewMode, setViewMode] = useState('grid');

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

    const filteredBrokers = brokers.filter(b => {
        const matchesSearch = (
            b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.city?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (!matchesSearch) return false;

        if (filterOption === 'active') {
            return (b.listingsCount || 0) > 0;
        }
        return true;
    });

    return (
        <div className="min-h-screen bg-slate-50/80 font-['Nunito_Sans',sans-serif] pb-28 sm:pb-16">
            <SEO
                title={`${t('brokers.title')} | Kharsan Properties`}
                description={t('brokers.desc')}
            />

            {/* Seamless Hero Header with Search Integrated */}
            <div className="bg-slate-900 text-white pt-6 pb-10 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    
                    {/* Top Zepto/Zomato style Back Button */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
                            className="inline-flex items-center gap-2 text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-sm active:scale-95"
                        >
                            <ArrowLeft size={16} />
                            <span>Back</span>
                        </button>

                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-400/20">
                            <Sparkles size={14} className="text-blue-400" />
                            <span>Partner Network</span>
                        </div>
                    </div>

                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            Real Estate Brokers & Agents in Gujarat
                        </h1>

                        <p className="text-xs sm:text-base font-semibold text-slate-300 mt-2.5 max-w-2xl mx-auto leading-relaxed">
                            Connect directly with property consultants and land partners across Gujarat.
                        </p>
                    </div>
                </div>
            </div>

            {/* Floating Clean Control Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="bg-white rounded-3xl shadow-md border border-slate-200/80 p-3 mb-8 flex flex-col md:flex-row items-center gap-3">
                    {/* Search Input */}
                    <div className="w-full flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5">
                        <Search size={18} className="text-slate-400 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by broker name, role, or city..."
                            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Filter Option Buttons */}
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setFilterOption('all')}
                                className={`px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${filterOption === 'all'
                                        ? 'bg-[#0078d4] text-white border-[#0078d4] shadow-xs'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                All Brokers ({brokers.length})
                            </button>
                            <button
                                onClick={() => setFilterOption('active')}
                                className={`px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${filterOption === 'active'
                                        ? 'bg-[#0078d4] text-white border-[#0078d4] shadow-xs'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                Has Active Plots
                            </button>
                        </div>

                        {/* View Switcher */}
                        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                                    }`}
                                title="Grid View"
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                                    }`}
                                title="List View"
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Directory Result Counter */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Users size={14} className="text-[#0078d4]" />
                        <span>{isLoading ? 'Loading Brokers Directory...' : `${filteredBrokers.length} Brokers Directory`}</span>
                    </h2>
                </div>

                {/* Directory Cards Grid / List */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <BrokerSkeleton key={i} />)}
                    </div>
                ) : isError ? (
                    <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />
                ) : filteredBrokers.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredBrokers.map((broker) => (
                                <BrokerGridCard
                                    key={broker._id}
                                    broker={broker}
                                    onClick={() => navigate(`/seller/${broker._id}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {filteredBrokers.map((broker) => (
                                <BrokerListRow
                                    key={broker._id}
                                    broker={broker}
                                    onClick={() => navigate(`/seller/${broker._id}`)}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <EmptyState
                        onAction={() => { setSearchQuery(''); setFilterOption('all'); }}
                        actionText="Clear Filters"
                        title="No Brokers Found"
                        message="Try adjusting your search query or filters to explore registered brokers."
                    />
                )}
            </div>
        </div>
    );
};

export default Brokers;