import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Shield, Home, Users as UsersIcon, FileText, CheckCircle, MapPin, Activity, LayoutDashboard, PhoneCall, Settings, Zap, ZapOff, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const Admin = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview'); // 'Overview', 'Users', 'Listings', 'Inquiries', 'Analytics', 'Settings'
    const [settings, setSettings] = useState([]);
    const [updatingSetting, setUpdatingSetting] = useState(null);
    const [selectedUserRole, setSelectedUserRole] = useState('All');
    
    // Pagination states
    const [usersPage, setUsersPage] = useState(1);
    const [listingsPage, setListingsPage] = useState(1);
    const [inquiriesPage, setInquiriesPage] = useState(1);
    const [analyticsPage, setAnalyticsPage] = useState(1);
    const ITEMS_PER_PAGE = 8;
    const [searchQuery, setSearchQuery] = useState('');
    



    // Pagination Component
    const Pagination = ({ totalItems, currentPage, onPageChange }) => {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        if (totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} results
                </div>
                <div className="flex gap-2">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            currentPage === 1 ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                    >
                        Previous
                    </button>
                    
                    {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        
                        if (totalPages <= 7) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                            pages.push(1);
                            
                            if (currentPage > 3) pages.push('...');
                            
                            const start = Math.max(2, currentPage - 1);
                            const end = Math.min(totalPages - 1, currentPage + 1);
                            
                            for (let i = start; i <= end; i++) {
                                if (!pages.includes(i)) pages.push(i);
                            }
                            
                            if (currentPage < totalPages - 2) pages.push('...');
                            
                            if (!pages.includes(totalPages)) pages.push(totalPages);
                        }

                        return pages.map((p, i) => (
                            p === '...' ? (
                                <span key={`sep-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold">...</span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => onPageChange(p)}
                                    className={`w-9 h-9 rounded-xl text-xs font-bold border transition-all ${
                                        currentPage === p ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                                    }`}
                                >
                                    {p}
                                </button>
                            )
                        ));
                    })()}

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            currentPage === totalPages ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

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

                const setRes = await axios.get('/api/admin/settings');
                setSettings(setRes.data.data || []);
            } catch (err) {
                console.error('Error fetching admin data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [user]);



    const handleUpdateSetting = async (key, value) => {
        setUpdatingSetting(key);
        try {
            const res = await axios.patch(`/api/admin/settings/${key}`, { value });
            if (res.data.success) {
                setSettings(settings.map(s => s.key === key ? res.data.data : s));
                toast.success('Setting updated successfully');
            }
        } catch (err) {
            toast.error('Failed to update setting');
        } finally {
            setUpdatingSetting(null);
        }
    };

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
        { id: 'Analytics', icon: <Activity size={18} /> },
        { id: 'Settings', icon: <Settings size={18} /> }
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
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSearchQuery(''); // Reset search when changing tabs
                            }}
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
                                <button 
                                    onClick={() => setSelectedUserRole('All')}
                                    className={`px-4 py-2 rounded-xl border shadow-sm text-sm font-bold transition-all ${
                                        selectedUserRole === 'All' 
                                        ? 'bg-slate-900 text-white border-slate-900' 
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                                    }`}
                                >
                                    All: <span className="ml-1">{data.users.length}</span>
                                </button>
                                {data.usersBreakdown.map(role => (
                                    <button 
                                        key={role._id} 
                                        onClick={() => setSelectedUserRole(role._id)}
                                        className={`px-4 py-2 rounded-xl border shadow-sm text-sm font-bold transition-all ${
                                            selectedUserRole === role._id 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                                        }`}
                                    >
                                        {role._id}s: <span className={selectedUserRole === role._id ? 'text-white/90' : 'text-blue-600'}>{role.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-6">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search size={18} />
                            </div>
                            <input 
                                type="text"
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setUsersPage(1);
                                }}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-semibold text-slate-700"
                            />
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
                                        {data.users
                                            .filter(u => selectedUserRole === 'All' || u.role === selectedUserRole)
                                            .filter(u => 
                                                u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                u.email.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE)
                                            .map(u => (
                                            <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-bold text-slate-900 whitespace-nowrap">{u.name}</p>
                                                    <p className="text-sm text-slate-500">{u.email}</p>
                                                </td>
                                                <td className="p-4 text-slate-600 text-sm font-semibold whitespace-nowrap">{u.phone}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black whitespace-nowrap ${
                                                        u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                                        u.role === 'Seller' ? 'bg-blue-100 text-blue-800' :
                                                        u.role === 'Broker' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-slate-100 text-slate-800'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center font-black text-slate-700">
                                                    {u.listingCount > 0 ? (
                                                        <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">{u.listingCount} Properties</span>
                                                    ) : (
                                                        <span className="text-slate-300 font-normal italic">No Listings</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination 
                                totalItems={data.users.filter(u => (selectedUserRole === 'All' || u.role === selectedUserRole) && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))).length} 
                                currentPage={usersPage} 
                                onPageChange={setUsersPage} 
                            />
                        </div>
                    </div>
                )}

                {/* LISTINGS TAB */}
                {activeTab === 'Listings' && data && (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h1 className="text-3xl font-bold text-slate-900">Registered Property Listings</h1>
                            <div className="relative w-full sm:w-80">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Search size={16} />
                                </div>
                                <input 
                                    type="text"
                                    placeholder="Search by title or location..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setListingsPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:border-blue-400 transition-all text-sm font-semibold"
                                />
                            </div>
                        </div>
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
                                        {data.allListings
                                            .filter(l => 
                                                l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                l.location.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .slice((listingsPage - 1) * ITEMS_PER_PAGE, listingsPage * ITEMS_PER_PAGE)
                                            .map(l => (
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
                            <Pagination totalItems={data.allListings.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.location.toLowerCase().includes(searchQuery.toLowerCase())).length} currentPage={listingsPage} onPageChange={setListingsPage} />
                        </div>
                    </div>
                )}

                {/* INQUIRIES TAB */}
                {activeTab === 'Inquiries' && inquiries && (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h1 className="text-3xl font-bold text-slate-900">Global Site Requests & Leads</h1>
                            <div className="relative w-full sm:w-80">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Search size={16} />
                                </div>
                                <input 
                                    type="text"
                                    placeholder="Search buyer or listing..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setInquiriesPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:border-blue-400 transition-all text-sm font-semibold"
                                />
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                            {inquiries.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 font-medium">No site requests logged globally.</div>
                            ) : (
                                <>
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
                                                {inquiries
                                                    .filter(inq => 
                                                        inq.userId?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                        inq.listingId?.title.toLowerCase().includes(searchQuery.toLowerCase())
                                                    )
                                                    .slice((inquiriesPage - 1) * ITEMS_PER_PAGE, inquiriesPage * ITEMS_PER_PAGE)
                                                    .map(inq => (
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
                                    <Pagination totalItems={inquiries.filter(inq => inq.userId?.name.toLowerCase().includes(searchQuery.toLowerCase()) || inq.listingId?.title.toLowerCase().includes(searchQuery.toLowerCase())).length} currentPage={inquiriesPage} onPageChange={setInquiriesPage} />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === 'Analytics' && data && (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h1 className="text-3xl font-bold text-slate-900">Traffic & Page Hits Log</h1>
                            <div className="relative w-full sm:w-80">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Search size={16} />
                                </div>
                                <input 
                                    type="text"
                                    placeholder="Search by page path..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setAnalyticsPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:border-blue-400 transition-all text-sm font-semibold"
                                />
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            {data.pageHits.length === 0 ? (
                                <p className="text-slate-500 text-center py-10 font-medium">No hit logic recorded yet.</p>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 border-b border-slate-100">
                                                <tr>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Page Path</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Sync Date</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total Activity</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Trend Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {data.pageHits
                                                    .filter(hit => hit.path.toLowerCase().includes(searchQuery.toLowerCase()))
                                                    .slice((analyticsPage - 1) * ITEMS_PER_PAGE, analyticsPage * ITEMS_PER_PAGE)
                                                    .map(hit => (
                                                    <tr key={hit._id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                                    <Activity size={16} />
                                                                </div>
                                                                <p className="font-bold text-slate-900">{hit.path}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm font-semibold text-slate-500">{hit.date}</td>
                                                        <td className="p-4 text-center">
                                                            <span className="text-lg font-black text-slate-900">{hit.hits}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-tighter">Hits recorded</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                                hit.hits > 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                                            }`}>
                                                                {hit.hits > 50 ? 'High Traffic' : 'Stable'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination totalItems={data.pageHits.filter(hit => hit.path.toLowerCase().includes(searchQuery.toLowerCase())).length} currentPage={analyticsPage} onPageChange={setAnalyticsPage} />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'Settings' && (
                    <div className="animate-fade-in max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-slate-900 mb-6 font-['Outfit']">System Settings</h1>
                        
                        <div className="grid grid-cols-1 gap-6">
                            {settings.map(setting => (
                                <div key={setting._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between gap-6 hover:border-blue-200 transition-all group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                                                {setting.key.replace(/([A-Z])/g, ' $1').trim()}
                                            </h3>
                                            {setting.value === true ? (
                                                <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-100">Enabled</span>
                                            ) : setting.value === false ? (
                                                <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-slate-100">Disabled</span>
                                            ) : null}
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg">
                                            {setting.description}
                                        </p>
                                    </div>
                                    
                                    <div className="shrink-0">
                                        {typeof setting.value === 'boolean' ? (
                                            <button
                                                disabled={updatingSetting === setting.key}
                                                onClick={() => handleUpdateSetting(setting.key, !setting.value)}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all focus:outline-none ${
                                                    setting.value 
                                                        ? 'bg-blue-600 shadow-md shadow-blue-200' 
                                                        : 'bg-slate-200'
                                                } ${updatingSetting === setting.key ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                                            >
                                                <span className="sr-only">Toggle {setting.key}</span>
                                                <span
                                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all shadow-sm ${
                                                        setting.value ? 'translate-x-7' : 'translate-x-1'
                                                    } flex items-center justify-center`}
                                                >
                                                    {setting.value ? <Zap size={12} className="text-blue-600" /> : <ZapOff size={12} className="text-slate-400" />}
                                                </span>
                                            </button>
                                        ) : (
                                            <input 
                                                type="text" 
                                                defaultValue={setting.value}
                                                onBlur={(e) => handleUpdateSetting(setting.key, e.target.value)}
                                                className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-semibold"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            {settings.length === 0 && (
                                <div className="bg-slate-100 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                                    <p className="text-slate-500 font-bold">No system settings found in database.</p>
                                </div>
                            )}

                            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-3xl p-6 text-blue-800">
                                <div className="flex gap-4">
                                    <Shield className="shrink-0 mt-1" size={24} />
                                    <div>
                                        <h4 className="font-extrabold text-lg mb-1">Production Readiness Notice</h4>
                                        <p className="text-sm font-medium leading-relaxed opacity-80">
                                            Turning off <strong>Instant Token Booking</strong> will immediately hide the payment options across the platform. Use this when maintenance is required or when transitioning between test and production merchant accounts.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>


        </div>
    );
};

export default Admin;
