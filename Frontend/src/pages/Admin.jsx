import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Shield, Home, Users as UsersIcon, FileText, CheckCircle, MapPin, Activity, LayoutDashboard, PhoneCall } from 'lucide-react';

const Admin = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview'); // 'Overview', 'Users', 'Listings', 'Inquiries', 'Analytics'
    



    useEffect(() => {
        if (!user) return;
        
        if (user.role !== 'Admin') {
            setLoading(false);
            return;
        }

        const fetchAdminData = async () => {
            try {
                const res = await axios.get('/api/admin/dashboard');
                setData(res.data.data);

                const inqRes = await axios.get('/api/inquiries');
                setInquiries(inqRes.data.data || []);
            } catch (err) {
                console.error('Error fetching admin data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [user]);



    if (authLoading || loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    );
    
    if (user?.role !== 'Admin') return (
        <div className="min-h-[60vh] flex justify-center items-center">
            <div className="bg-red-50 text-red-600 px-8 py-6 rounded-2xl font-bold shadow-sm border border-red-100 flex items-center gap-3">
                <Shield size={24} /> Access Denied
            </div>
        </div>
    );

    const tabs = [
        { id: 'Overview', icon: <LayoutDashboard size={18} /> },
        { id: 'Users', icon: <UsersIcon size={18} /> },
        { id: 'Listings', icon: <Home size={18} /> },
        { id: 'Inquiries', icon: <PhoneCall size={18} /> },
        { id: 'Analytics', icon: <Activity size={18} /> }
    ];

    return (
        <div className="animate-fade-in flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 shadow-sm z-10 hidden md:flex">
                <h2 className="text-xl font-['Outfit'] font-bold text-slate-800 mb-8 flex items-center gap-2 px-2 pt-4">
                    <Shield className="text-blue-600" /> Admin Station
                </h2>
                
                <div className="flex flex-col gap-2">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-left ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            {tab.icon} {tab.id}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                
                {!data && !loading && user?.role === 'Admin' && (
                    <div className="text-center p-12 bg-red-50 text-red-500 rounded-2xl mb-4 font-bold border border-red-100">
                        Error loading dashboard data. Please check backend models or API connection.
                    </div>
                )}

                {/* Mobile Tabs */}
                <div className="flex md:hidden bg-white rounded-2xl p-2 mb-6 shadow-sm border border-slate-200 gap-2 overflow-x-auto">
                     {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'text-slate-500'}`}
                        >
                            {tab.icon} {tab.id}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'Overview' && data && (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <h1 className="text-3xl font-bold text-slate-900 mb-6">Platform Overview</h1>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                                <div className="flex justify-between items-center text-slate-500 mb-4">
                                    <span className="font-bold text-sm uppercase tracking-wider">Total Users</span>
                                    <UsersIcon size={20} className="text-blue-500" />
                                </div>
                                <span className="text-3xl font-extrabold text-slate-900">{data.metrics.totalUsers}</span>
                            </div>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                                <div className="flex justify-between items-center text-slate-500 mb-4">
                                    <span className="font-bold text-sm uppercase tracking-wider">Verified Plots</span>
                                    <CheckCircle size={20} className="text-emerald-500" />
                                </div>
                                <span className="text-3xl font-extrabold text-slate-900">{data.metrics.verifiedListings} <span className="text-lg text-slate-400">/ {data.metrics.totalListings}</span></span>
                            </div>

                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                                <div className="flex justify-between items-center text-slate-500 mb-4">
                                    <span className="font-bold text-sm uppercase tracking-wider">Token Revenue</span>
                                    <FileText size={20} className="text-purple-500" />
                                </div>
                                <span className="text-3xl font-extrabold text-slate-900 truncate">₹{data.metrics.totalRevenue?.toLocaleString('en-IN') || 0}</span>
                            </div>
                        </div>


                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'Users' && data && (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                            <h1 className="text-3xl font-bold text-slate-900">Platform Users</h1>
                            <div className="flex flex-wrap gap-2">
                                {data.usersBreakdown.map(role => (
                                    <div key={role._id} className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-sm font-bold text-slate-700">
                                        {role._id}s: <span className="text-blue-600 ml-1">{role.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name & Email</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Properties Listed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.users.map(u => (
                                            <tr key={u._id} className="hover:bg-slate-50/50">
                                                <td className="p-4">
                                                    <p className="font-bold text-slate-900 whitespace-nowrap">{u.name}</p>
                                                    <p className="text-sm text-slate-500">{u.email}</p>
                                                </td>
                                                <td className="p-4 text-slate-600 text-sm whitespace-nowrap">{u.phone}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                                        u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                                        u.role === 'Seller' ? 'bg-blue-100 text-blue-800' :
                                                        u.role === 'Broker' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-slate-100 text-slate-800'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center font-bold text-slate-700">
                                                    {u.listingCount > 0 ? (
                                                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">{u.listingCount} Properties</span>
                                                    ) : (
                                                        <span className="text-slate-400 font-normal">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* LISTINGS TAB */}
                {activeTab === 'Listings' && data && (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <h1 className="text-3xl font-bold text-slate-900 mb-6">Registered Property Listings</h1>
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Title & Location</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price (INR)</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.allListings.map(l => (
                                            <tr key={l._id} className="hover:bg-slate-50/50">
                                                <td className="p-4 min-w-[200px]">
                                                    <p className="font-bold text-slate-900 truncate max-w-xs">{l.title}</p>
                                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1 truncate max-w-xs">
                                                        <MapPin size={12} className="text-blue-400 flex-shrink-0" /> {l.location}
                                                    </p>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-700 whitespace-nowrap">{l.createdBy?.name || 'Unknown'}</td>
                                                <td className="p-4 font-extrabold text-slate-900 whitespace-nowrap">₹{l.price.toLocaleString('en-IN')}</td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                                                        l.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                        'bg-slate-100 text-slate-700 border border-slate-200'
                                                    }`}>
                                                        {l.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* INQUIRIES TAB */}
                {activeTab === 'Inquiries' && inquiries && (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <h1 className="text-3xl font-bold text-slate-900 mb-6">Global Site Requests & Leads</h1>
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                            {inquiries.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 font-medium">No site requests logged globally.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Property Owner</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Buyer Detail</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Requested Listing</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status Tracker</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {inquiries.map(inq => (
                                                <tr key={inq._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4">
                                                        {inq.listingId?.createdBy?.name ? (
                                                            <>
                                                                <p className="font-bold text-slate-900 truncate max-w-xs">{inq.listingId.createdBy.name}</p>
                                                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded mt-1 inline-block border border-slate-200 shadow-sm">{inq.listingId.createdBy.role}</span>
                                                            </>
                                                        ) : (
                                                            <p className="text-slate-400 italic">Unknown</p>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-bold text-blue-700 whitespace-nowrap">{inq.userId?.name}</p>
                                                        <p className="text-sm font-semibold text-slate-500 mt-0.5">{inq.userId?.phone}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-semibold text-slate-800 truncate max-w-[200px]" title={inq.listingId?.title}>{inq.listingId?.title}</p>
                                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(inq.createdAt).toLocaleDateString()}</p>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm inline-block border ${
                                                            inq.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                                            inq.status === 'Contacted' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                            'bg-amber-100 text-amber-800 border-amber-200'
                                                        }`}>
                                                            {inq.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === 'Analytics' && data && (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <h1 className="text-3xl font-bold text-slate-900 mb-6">Traffic & Page Hits Log</h1>
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 max-w-4xl">
                            {data.pageHits.length === 0 ? (
                                <p className="text-slate-500 text-center py-10 font-medium">No hit logic recorded yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.pageHits.map(hit => (
                                        <div key={hit._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-5 bg-slate-50 rounded-2xl border border-slate-200 gap-4 hover:shadow-sm transition-shadow">
                                            <div>
                                                <p className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-1">
                                                    <Activity size={18} className="text-blue-500" /> {hit.path}
                                                </p>
                                                <p className="text-sm text-slate-500 font-medium">Date Logged: <span className="text-slate-700">{hit.date}</span></p>
                                            </div>
                                            <div className="bg-blue-100/50 border border-blue-200 text-blue-800 px-6 py-3 rounded-2xl font-extrabold text-2xl flex items-center gap-2">
                                                {hit.hits} <span className="text-xs font-bold opacity-60 bg-blue-200/50 px-2 py-1 rounded">URL HITS</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>


        </div>
    );
};

export default Admin;
