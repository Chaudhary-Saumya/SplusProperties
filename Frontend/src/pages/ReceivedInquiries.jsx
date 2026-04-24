import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Phone, Calendar, ArrowLeft, MapPin, CheckCircle, Clock, User } from 'lucide-react';
import socket from '../utils/socket';
import { getImageUrl } from '../utils/imageUrl';

const ReceivedInquiries = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
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
        } catch (err) {
            console.error(err);
            toast.error('Failed to update inquiry status');
        }
    };

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
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">Site Visit Requests</h1>
                        <p className="text-sm md:text-base text-slate-500 font-medium">Manage inquiries and visits for your properties</p>
                    </div>
                </div>
                {inquiries.length > 0 && (
                    <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-sm font-bold text-blue-700">{inquiries.length} Total Inquiries</span>
                    </div>
                )}
            </div>

            {inquiries.length === 0 ? (
                <div className="text-center py-20 bg-white/40 backdrop-blur-xl border border-dashed border-slate-300 rounded-[3rem] shadow-sm">
                    <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Mail size={40} className="text-slate-200" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">No Inquiries Yet</h2>
                    <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">When potential buyers request a site visit for your listings, they will appear here.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {inquiries.map(inq => (
                        <div key={inq._id} className="bg-white/70 backdrop-blur-md border border-white shadow-xl rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-6 flex-1 w-full sm:w-auto">
                                <div className="hidden sm:block w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden shadow-inner flex-shrink-0">
                                    {inq.listingId?.images && inq.listingId.images[0] ? (
                                        <img src={getImageUrl(inq.listingId.images[0])} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300"><MapPin size={32} /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-xl text-slate-900 truncate">{inq.listingId?.title || 'Unknown Property'}</h4>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                            inq.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                                            inq.status === 'Contacted' ? 'bg-blue-100 text-blue-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {inq.status}
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
                            
                            <div className="flex flex-col gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-right">Update Status</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => updateInquiryStatus(inq._id, 'Contacted')}
                                        className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                            inq.status === 'Contacted' 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        Contacted
                                    </button>
                                    <button 
                                        onClick={() => updateInquiryStatus(inq._id, 'Resolved')}
                                        className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                            inq.status === 'Resolved' 
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        Resolved
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReceivedInquiries;
