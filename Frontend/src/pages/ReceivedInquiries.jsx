import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Phone, Calendar, ArrowLeft, MapPin, CheckCircle, Clock, User, UserCheck } from 'lucide-react';
import socket from '../utils/socket';
import { getImageUrl } from '../utils/imageUrl';
import { useLanguage } from '../context/LanguageContext';

const ReceivedInquiries = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const { user } = useContext(AuthContext);
    const { t } = useLanguage();
    const navigate = useNavigate();

    const fetchInquiries = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const res = await axios.get('/api/inquiries');
            const data = res.data.data || [];
            if (user) {
                const received = data.filter(inq => (inq.listingId?.createdBy?._id || inq.listingId?.createdBy) === (user?.id || user?._id));
                setInquiries(received);
            }
        } catch (err) {
            console.error('Error fetching inquiries', err);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        
        fetchInquiries();

        // 1. Listen for new inquiries via WebSocket
        socket.on('new_inquiry', (data) => {
            console.log('New inquiry received via socket:', data);
            fetchInquiries(true); // Silent refresh
        });

        // 2. Listen for status updates if needed
        socket.on('inquiry_status_updated', (data) => {
            fetchInquiries(true);
        });

        return () => {
            socket.off('new_inquiry');
            socket.off('inquiry_status_updated');
        };
    }, [user]);

    const updateInquiryStatus = async (id, newStatus) => {
        try {
            await axios.patch(`/api/inquiries/${id}/status`, { status: newStatus });
            setInquiries(inquiries.map(inq => inq._id === id ? { ...inq, status: newStatus } : inq));
            
            // Show premium success toast feedback
            if (newStatus === 'Contacted') {
                toast.success('Inquiry successfully connected!');
            } else if (newStatus === 'Pending') {
                toast.success('Inquiry status reverted to Pending');
            } else {
                toast.success(`Inquiry status updated to ${newStatus}`);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update inquiry status');
        }
    };

    // Calculate status counts for badges (only Pending and Connected)
    const counts = {
        All: inquiries.length,
        Pending: inquiries.filter(inq => inq.status === 'Pending').length,
        Connected: inquiries.filter(inq => inq.status === 'Contacted').length
    };

    // Filter inquiries by selected tab
    const filteredInquiries = inquiries.filter(inq => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Pending') return inq.status === 'Pending';
        if (activeTab === 'Connected') return inq.status === 'Contacted';
        return true;
    });

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-fade-in min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm text-slate-600 hover:scale-110 active:scale-95"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">{t('received_inquiries.title')}</h1>
                        <p className="text-sm md:text-base text-slate-500 font-medium">{t('received_inquiries.subtitle')}</p>
                    </div>
                </div>
                {inquiries.length > 0 && (
                    <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 flex items-center gap-2 w-fit">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-sm font-bold text-blue-700">{inquiries.length} {t('received_inquiries.title')}</span>
                    </div>
                )}
            </div>

            {/* Filter Tabs (only All, Pending, Connected) */}
            {inquiries.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-slate-100 scrollbar-none">
                    {[
                        { id: 'All', label: t('received_inquiries.title'), count: counts.All, color: 'bg-slate-100 text-slate-700' },
                        { id: 'Pending', label: t('received_inquiries.pending'), count: counts.Pending, color: 'bg-amber-100 text-amber-700' },
                        { id: 'Connected', label: t('received_inquiries.contacted'), count: counts.Connected, color: 'bg-blue-100 text-blue-700' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border-2 ${
                                activeTab === tab.id
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10 hover:bg-slate-800'
                                    : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-lg font-extrabold transition-colors ${
                                activeTab === tab.id ? 'bg-white/20 text-white' : tab.color
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {filteredInquiries.length === 0 ? (
                <div className="text-center py-20 bg-white/40 backdrop-blur-xl border border-dashed border-slate-300 rounded-[3rem] shadow-sm">
                    <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Mail size={40} className="text-slate-200" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        {activeTab === 'All' ? 'No Inquiries Yet' : `No ${activeTab} Inquiries`}
                    </h2>
                    <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
                        {activeTab === 'All' 
                            ? 'When potential buyers request a site visit for your listings, they will appear here.'
                            : `You do not have any inquiries in the "${activeTab}" category at the moment.`}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredInquiries.map(inq => {
                        // Determine card styling based on inquiry status
                        let borderStyle = '';
                        let bgStyle = 'bg-white/70 hover:border-slate-200';
                        let badgeStyle = '';
                        let StatusIcon = Clock;
                        let displayStatus = inq.status;

                        if (inq.status === 'Pending') {
                            borderStyle = 'border-l-4 border-l-amber-500';
                            bgStyle = 'bg-white border border-slate-100 shadow-md hover:border-amber-200';
                            badgeStyle = 'bg-amber-50 text-amber-700 border border-amber-200/50';
                            StatusIcon = Clock;
                        } else {
                            // Defaults to Connected (Contacted) or any other status
                            borderStyle = 'border-l-4 border-l-blue-600';
                            bgStyle = 'bg-blue-50/5 border border-blue-50/50 shadow-md hover:border-blue-200';
                            badgeStyle = 'bg-blue-50 text-blue-700 border border-blue-200/50';
                            StatusIcon = UserCheck;
                            displayStatus = 'Connected';
                        }

                        return (
                            <div 
                                key={inq._id} 
                                className={`backdrop-blur-md rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group transition-all duration-300 ${bgStyle} ${borderStyle}`}
                            >
                                <div className="flex items-center gap-6 flex-1 w-full sm:w-auto">
                                    <div className="hidden sm:block w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden shadow-inner flex-shrink-0">
                                        {inq.listingId?.images && inq.listingId.images[0] ? (
                                            <img src={getImageUrl(inq.listingId.images[0])} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><MapPin size={32} /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h4 className="font-bold text-xl text-slate-900 truncate">{inq.listingId?.title || 'Unknown Property'}</h4>
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${badgeStyle}`}>
                                                <StatusIcon size={12} className={inq.status === 'Pending' ? 'animate-pulse' : ''} />
                                                {displayStatus}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User size={16} />
                                                </div>
                                                <span className="truncate">{inq.userId?.name || 'Anonymous User'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <Calendar size={16} />
                                                </div>
                                                <span>{new Date(inq.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                                            {inq.userId?.email && (
                                                <a href={`mailto:${inq.userId.email}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
                                                    <Mail size={14} /> {inq.userId.email}
                                                </a>
                                            )}
                                            {inq.userId?.phone && (
                                                <a href={`tel:${inq.userId.phone}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">
                                                    <Phone size={14} /> {inq.userId.phone}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-right">{t('received_inquiries.actions')}</p>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => updateInquiryStatus(inq._id, inq.status === 'Contacted' ? 'Pending' : 'Contacted')}
                                            className={`flex-grow md:flex-grow-0 px-6 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 ${
                                                inq.status === 'Contacted' 
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-blue-600'
                                            }`}
                                            title={inq.status === 'Contacted' ? 'Click to revert to Pending' : 'Mark as Connected'}
                                        >
                                            <UserCheck size={14} />
                                            {inq.status === 'Contacted' ? t('received_inquiries.contacted') : t('received_inquiries.mark_contacted')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReceivedInquiries;
